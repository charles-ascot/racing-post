import os
import sys
from datetime import date
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
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

app = FastAPI(title="RPScrape API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    settings = Settings()
    if settings.toml is None:
        raise HTTPException(status_code=500, detail="Settings not loaded")

    gzip_output = settings.toml.get('gzip_output', False)
    file_writer = writer_gzip if gzip_output else writer_csv

    # Prepare arguments for build_paths
    # We need to construct a "request" object that build_paths expects
    # In rpscrape.py, it's args.request which is a string or similar
    # Actually, build_paths takes a RequestKey or similar? 
    # Let's check paths.py again.
    
    # Simulate the ArgParser logic to get tracks and dates
    from scripts.utils.argparser import ArgParser
    parser = ArgParser()
    
    # We'll manually construct what ArgParser.parse would return
    # This is a bit hacky, but let's try to make it work with existing logic
    
    client = NetworkClient(
        email=os.getenv('EMAIL'),
        auth_state=os.getenv('AUTH_STATE'),
        access_token=os.getenv('ACCESS_TOKEN'),
    )

    # Resolve tracks (courses and regions)
    tracks = []
    if request.courses:
        for course in request.courses:
            # Find course ID
            for c_id, c_name in get_courses():
                if c_name.lower() == course.lower():
                    tracks.append((c_id, c_name))
                    break
    elif request.regions:
        for region in request.regions:
            for c_id, c_name in get_courses():
                if get_region(c_id) == region.upper():
                    tracks.append((c_id, c_name))
    else:
        # Default to all GB/IRE if nothing specified? 
        # Or just use what's in the request
        pass

    if not tracks:
        # If no tracks specified, maybe use all?
        for c_id, c_name in get_courses():
            tracks.append((c_id, c_name))

    parsed_dates = []
    if request.dates:
        for d_str in request.dates:
            parsed_dates.extend(get_dates(d_str))
    
    # Construct a request key for build_paths
    # In rpscrape, it uses the first date/year and course/region as a key
    req_key = "api_request" # Placeholder
    paths = build_paths(req_key, gzip_output)

    if request.dates:
        race_urls = get_race_urls_date(parsed_dates, tracks, client)
    else:
        years = request.years or [str(date.today().year)]
        race_urls = get_race_urls(years, tracks, request.race_type, client)

    if not race_urls:
        return {"message": "No races found for the given criteria"}

    # Run the scraper
    # Note: This is synchronous and might take a long time. 
    # In a real app, you'd use BackgroundTasks or Celery.
    scrape_races(race_urls, paths, request.race_type, client, file_writer)

    return {
        "message": "Scraping completed",
        "output_file": str(paths.output.resolve())
    }

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
