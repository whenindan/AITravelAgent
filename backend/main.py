from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import date
import logging
import sys
from airbnb.scraper import scrape_airbnb_with_got_it
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the server...")

@app.get("/health-check")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok", "message": "Server is running"}

class ScraperRequest(BaseModel):
    destination: str
    startDate: str
    endDate: str
    travelers: int
    min_budget: str
    max_budget: str

@app.post("/api/scrape-airbnb")
async def scrape_airbnb(request: ScraperRequest):
    try:
        logger.info(f"Received scraping request for destination: {request.destination}")
        
        # Convert budget strings to numbers (remove currency symbol if present)
        min_budget = request.min_budget.replace("$", "").replace(",", "")
        max_budget = request.max_budget.replace("$", "").replace(",", "")
        
        # Log the processed request details
        logger.info(f"Processing request with parameters: dates={request.startDate} to {request.endDate}, "
                   f"travelers={request.travelers}, budget range=${min_budget}-${max_budget}")
        
        # Call the scraper function
        listings = scrape_airbnb_with_got_it(
            destination=request.destination,
            checkin=request.startDate,
            checkout=request.endDate,
            guests=request.travelers,
            min_budget=float(min_budget),
            max_budget=float(max_budget)
        )
        
        # Save results to a JSON file
        filename = f"airbnb_listings_{request.destination.replace(' ', '_')}_{date.today()}.json"
        with open(filename, "w") as f:
            json.dump(listings, f, indent=2)
        
        logger.info(f"Successfully scraped listings and saved to {filename}")
        
        return JSONResponse(
            content={
                "success": True,
                "message": f"Listings saved to {filename}",
                "listings": listings
            },
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error during scraping: {str(e)}", exc_info=True)
        return JSONResponse(
            content={
                "success": False,
                "error": str(e)
            },
            status_code=500
        ) 