import csv
import io
import os
import sys
from datetime import date
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from openpyxl import Workbook
from pydantic import BaseModel

# Add scripts directory to sys.path to allow imports within scripts to work
sys.path.append(os.path.join(os.path.dirname(__file__), "scripts"))

from scripts.rpscrape import get_race_urls, get_race_urls_date, scrape_races, writer_csv, writer_gzip
from scripts.racecards import get_race_urls as get_racecard_urls, scrape_racecards, load_field_config
from scripts.utils.network import NetworkClient
from scripts.utils.paths import build_paths, RequestKey
from scripts.utils.settings import Settings
from scripts.utils.date import get_dates
from scripts.utils.course import courses as get_courses
from scripts.utils.region import get_region
from api import router as lay_engine_router

app = FastAPI(
    title="RPScrape / Lay Engine API",
    description="Racing Post racecard and results data. Lay Engine endpoints at /api/v1/.",
    version="1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lay_engine_router)

# Store the most recently scraped file path in memory
latest_output_path: Optional[str] = None


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )


class ScrapeRequest(BaseModel):
    dates: Optional[List[str]] = None
    years: Optional[List[str]] = None
    regions: Optional[List[str]] = None
    courses: Optional[List[str]] = None
    race_type: str = "all"
    clean: bool = False


@app.get("/")
async def root():
    return {"message": "Welcome to RPScrape API"}


@app.post("/scrape/races")
async def scrape_races_endpoint(request: ScrapeRequest):
    global latest_output_path

    settings = Settings()
    if settings.toml is None:
        raise HTTPException(status_code=500, detail="Settings not loaded")

    gzip_output = settings.toml.get('gzip_output', False)
    file_writer = writer_gzip if gzip_output else writer_csv

    from scripts.utils.argparser import ArgParser
    parser = ArgParser()

    client = NetworkClient(
        email=os.getenv('EMAIL'),
        auth_state=os.getenv('AUTH_STATE'),
        access_token=os.getenv('ACCESS_TOKEN'),
    )

    # Resolve tracks (courses and regions)
    tracks = []
    if request.courses:
        for course in request.courses:
            for c_id, c_name in get_courses():
                if c_name.lower() == course.lower():
                    tracks.append((c_id, c_name))
                    break
    elif request.regions:
        for region in request.regions:
            for c_id, c_name in get_courses():
                if get_region(c_id) == region.upper():
                    tracks.append((c_id, c_name))

    if not tracks:
        for c_id, c_name in get_courses():
            tracks.append((c_id, c_name))

    parsed_dates = []
    if request.dates:
        for d_str in request.dates:
            parsed_dates.extend(get_dates(d_str))

    # Build a filename from the request scope
    if request.dates:
        scope_kind = 'date'
        scope_value = request.dates[0].replace('-', '_')
        filename = request.dates[0].replace('-', '_')
    elif request.years:
        scope_kind = 'year'
        scope_value = request.years[0]
        filename = request.years[0]
    else:
        scope_kind = 'year'
        scope_value = str(date.today().year)
        filename = str(date.today().year)

    req_key = RequestKey(
        scope_kind=scope_kind,
        scope_value=scope_value,
        race_type=request.race_type,
        filename=filename,
    )
    paths = build_paths(req_key, gzip_output)

    if request.dates:
        race_urls = get_race_urls_date(parsed_dates, tracks, client)
    else:
        years = request.years or [str(date.today().year)]
        race_urls = get_race_urls(years, tracks, request.race_type, client)

    if not race_urls:
        return {"message": "No races found for the given criteria"}

    scrape_races(race_urls, paths, request.race_type, client, file_writer)

    latest_output_path = str(paths.output.resolve())

    return {
        "message": "Scraping completed",
        "output_file": latest_output_path,
    }


@app.get("/download")
async def download_file(path: str = Query(...)):
    # Resolve and validate the path is within the data directory
    data_root = Path(__file__).resolve().parent / "data"
    try:
        csv_path = Path(path).resolve()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid path")

    if not str(csv_path).startswith(str(data_root)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    wb = Workbook()
    ws = wb.active
    ws.title = "Races"

    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.reader(f):
            ws.append(row)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    xlsx_name = csv_path.stem + ".xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{xlsx_name}"',
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.get("/racecards/{date}")
async def get_racecards(date: str, region: Optional[str] = None):
    client = NetworkClient(
        email=os.getenv('EMAIL'),
        auth_state=os.getenv('AUTH_STATE'),
        access_token=os.getenv('ACCESS_TOKEN'),
    )

    config = load_field_config()
    dates = [date]

    race_urls = get_racecard_urls(client, dates, region)

    if not race_urls or date not in race_urls:
        return {"message": f"No racecards found for {date}"}

    racecards = scrape_racecards(race_urls, date, config, client)

    return racecards


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
