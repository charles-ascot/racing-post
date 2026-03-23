"""
Lay Engine API — v1
Exposes racecard and results data for programmatic consumption.
"""
import csv
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from scripts.racecards import get_race_urls as get_racecard_urls, scrape_racecards, load_field_config
from scripts.utils.network import NetworkClient

router = APIRouter(prefix="/api/v1", tags=["Lay Engine v1"])

RACE_TYPE_MAP: dict[str, set[str]] = {
    "flat": {"Flat"},
    "jumps": {"Chase", "Hurdle", "NH Flat"},
}


def _client() -> NetworkClient:
    return NetworkClient(
        email=os.getenv("EMAIL"),
        auth_state=os.getenv("AUTH_STATE"),
        access_token=os.getenv("ACCESS_TOKEN"),
    )


def _flatten(nested: dict) -> list[dict]:
    """region → course → off_time → race_dict  →  flat list."""
    return [
        race
        for courses in nested.values()
        for times in courses.values()
        for race in times.values()
    ]


def _load_racecards(date: str) -> list[dict]:
    client = _client()
    config = load_field_config()
    race_urls = get_racecard_urls(client, [date])
    if not race_urls or date not in race_urls:
        return []
    nested = scrape_racecards(race_urls, date, config, client)
    return _flatten(nested)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "version": "1.0", "engine": "RPScrape / FastAPI / Python 3.12"}


# ---------------------------------------------------------------------------
# Racecards
# ---------------------------------------------------------------------------

@router.get("/racecards/{date}", summary="All races for a date")
async def api_racecards(
    date: str,
    region: Optional[str] = Query(None, description="Region code: gb | ire | fr | usa | aus | hk …"),
    course: Optional[str] = Query(None, description="Partial course name match, e.g. 'Newmarket'"),
    race_type: Optional[str] = Query(None, description="flat | jumps"),
    handicap: Optional[bool] = Query(None, description="true = handicaps only, false = non-handicaps"),
    pattern: Optional[str] = Query(None, description="Partial pattern match: G1 | G2 | G3 | Listed"),
):
    """
    Returns a flat list of all races for the given date.
    All filter parameters are optional and combinable.
    """
    races = _load_racecards(date)

    if region:
        races = [r for r in races if (r.get("region") or "").lower() == region.lower()]
    if course:
        races = [r for r in races if course.lower() in (r.get("course") or "").lower()]
    if race_type:
        allowed = RACE_TYPE_MAP.get(race_type.lower())
        if allowed:
            races = [r for r in races if r.get("race_type") in allowed]
    if handicap is not None:
        races = [r for r in races if r.get("handicap") == handicap]
    if pattern:
        races = [r for r in races if pattern.lower() in (r.get("pattern") or "").lower()]

    races.sort(key=lambda r: (r.get("course") or "", r.get("off_time") or ""))

    return {"date": date, "count": len(races), "races": races}


@router.get("/racecards/{date}/race/{race_id}", summary="Single race by ID")
async def api_race(date: str, race_id: int):
    """Returns a single race with full runner data."""
    races = _load_racecards(date)
    match = next((r for r in races if r.get("race_id") == race_id), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Race {race_id} not found for {date}")
    return match


@router.get("/racecards/{date}/runners", summary="All runners for a date")
async def api_runners(
    date: str,
    region: Optional[str] = Query(None),
    course: Optional[str] = Query(None),
    race_id: Optional[int] = Query(None, description="Filter to a specific race"),
    horse_id: Optional[int] = Query(None, description="RP horse ID"),
    horse: Optional[str] = Query(None, description="Partial horse name match"),
    jockey: Optional[str] = Query(None, description="Partial jockey name match"),
    trainer: Optional[str] = Query(None, description="Partial trainer name match"),
    non_runner: Optional[bool] = Query(None, description="true = non-runners only"),
):
    """
    Returns a flat list of runners across all races for the given date.
    Each runner row includes race context (race_id, course, off_time, region).
    All filter parameters are optional and combinable.
    """
    races = _load_racecards(date)

    if region:
        races = [r for r in races if (r.get("region") or "").lower() == region.lower()]
    if course:
        races = [r for r in races if course.lower() in (r.get("course") or "").lower()]
    if race_id is not None:
        races = [r for r in races if r.get("race_id") == race_id]

    runners: list[dict] = []
    for race in races:
        race_ctx = {
            "race_id": race.get("race_id"),
            "race_name": race.get("race_name"),
            "race_type": race.get("race_type"),
            "course": race.get("course"),
            "course_id": race.get("course_id"),
            "region": race.get("region"),
            "off_time": race.get("off_time"),
            "date": race.get("date"),
            "going": race.get("going"),
            "surface": race.get("surface"),
            "distance": race.get("distance"),
            "distance_f": race.get("distance_f"),
            "pattern": race.get("pattern"),
            "race_class": race.get("race_class"),
            "prize": race.get("prize"),
            "handicap": race.get("handicap"),
        }
        for runner in race.get("runners", []):
            if horse_id is not None and runner.get("horse_id") != horse_id:
                continue
            if horse and horse.lower() not in (runner.get("name") or "").lower():
                continue
            if non_runner is not None and runner.get("non_runner") != non_runner:
                continue
            if jockey and jockey.lower() not in (runner.get("jockey") or "").lower():
                continue
            if trainer and trainer.lower() not in (runner.get("trainer") or "").lower():
                continue
            runners.append({**race_ctx, **runner})

    return {"date": date, "count": len(runners), "runners": runners}


# ---------------------------------------------------------------------------
# Results (historical — from scraped CSV)
# ---------------------------------------------------------------------------

@router.get("/results/{date}", summary="Historical results for a date")
async def api_results(
    date: str,
    course: Optional[str] = Query(None, description="Partial course name match"),
    race_type: Optional[str] = Query(None, description="flat | jumps"),
    horse: Optional[str] = Query(None, description="Partial horse name match"),
    jockey: Optional[str] = Query(None, description="Partial jockey name match"),
    trainer: Optional[str] = Query(None, description="Partial trainer name match"),
    position: Optional[str] = Query(None, description="Finishing position, e.g. '1'"),
):
    """
    Returns scraped race results for the given date as JSON.
    The CSV must already exist — run POST /api/v1/scrape first if it doesn't.
    """
    filename = date.replace("-", "_")
    csv_path = (
        Path(__file__).resolve().parent
        / "data" / "date" / filename / "all" / f"{filename}.csv"
    )

    if not csv_path.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                f"No results found for {date}. "
                "Trigger a scrape via POST /api/v1/scrape first."
            ),
        )

    rows: list[dict] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append(row)

    if course:
        rows = [r for r in rows if course.lower() in r.get("course", "").lower()]
    if race_type:
        allowed = RACE_TYPE_MAP.get(race_type.lower())
        if allowed:
            rows = [r for r in rows if r.get("type", "") in allowed]
    if horse:
        rows = [r for r in rows if horse.lower() in r.get("horse", "").lower()]
    if jockey:
        rows = [r for r in rows if jockey.lower() in r.get("jockey", "").lower()]
    if trainer:
        rows = [r for r in rows if trainer.lower() in r.get("trainer", "").lower()]
    if position:
        rows = [r for r in rows if r.get("pos", "") == position]

    return {"date": date, "count": len(rows), "results": rows}


# ---------------------------------------------------------------------------
# Scrape trigger
# ---------------------------------------------------------------------------

@router.post("/scrape", summary="Trigger a results scrape")
async def api_scrape(
    dates: list[str],
    regions: Optional[list[str]] = None,
    race_type: str = "all",
):
    """
    Triggers a scrape of race results for the given dates.
    Dates must be in ISO format: YYYY-MM-DD.
    Results are written to the server and accessible via GET /api/v1/results/{date}.
    """
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), "scripts"))

    from scripts.rpscrape import get_race_urls_date, scrape_races, writer_csv, writer_gzip
    from scripts.utils.paths import build_paths, RequestKey
    from scripts.utils.settings import Settings
    from scripts.utils.date import get_dates
    from scripts.utils.course import courses as get_courses
    from scripts.utils.region import get_region
    from datetime import date as date_type

    settings = Settings()
    if settings.toml is None:
        raise HTTPException(status_code=500, detail="Settings not loaded")

    gzip_output = settings.toml.get("gzip_output", False)
    file_writer = writer_gzip if gzip_output else writer_csv
    client = _client()

    # Resolve tracks
    tracks: list[tuple[str, str]] = []
    if regions:
        for region in regions:
            for c_id, c_name in get_courses():
                if get_region(c_id) == region.upper():
                    tracks.append((c_id, c_name))

    if not tracks:
        tracks = list(get_courses())

    parsed_dates: list[date_type] = []
    for d in dates:
        parsed_dates.extend(get_dates(d))

    scope_value = dates[0].replace("-", "_")
    req_key = RequestKey(
        scope_kind="date",
        scope_value=scope_value,
        race_type=race_type,
        filename=scope_value,
    )
    paths = build_paths(req_key, gzip_output)

    race_urls = get_race_urls_date(parsed_dates, tracks, client)
    if not race_urls:
        return {"message": "No races found for the given criteria", "output_file": None}

    scrape_races(race_urls, paths, race_type, client, file_writer)

    return {
        "message": "Scraping completed",
        "dates": dates,
        "output_file": str(paths.output.resolve()),
    }
