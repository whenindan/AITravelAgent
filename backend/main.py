from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
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
    travelingFrom: str
    startDate: str
    endDate: str
    travelers: int
    totalBudget: str  # Required field

@app.post("/api/scrape-airbnb")
async def scrape_airbnb(request: ScraperRequest):
    try:
        logger.info(f"Received scraping request for destination: {request.destination}")
        logger.info(f"Traveling from: {request.travelingFrom}")
        
        # Calculate trip duration
        start_date = datetime.strptime(request.startDate, "%Y-%m-%d")
        end_date = datetime.strptime(request.endDate, "%Y-%m-%d")
        trip_days = (end_date - start_date).days
        if trip_days <= 0:
            return JSONResponse(
                content={
                    "success": False,
                    "error": "End date must be after start date"
                },
                status_code=400
            )
        
        # Convert budget string to number (remove currency symbol if present)
        total_budget = float(request.totalBudget.replace("$", "").replace(",", ""))
        
        # Calculate budget per night
        budget_per_night = total_budget / trip_days
        
        # Set min and max budget per night (±20% of the calculated budget per night)
        min_budget = budget_per_night * 0.8
        max_budget = budget_per_night * 1.2
        
        logger.info(f"Total budget: ${total_budget}, budget per night: ${budget_per_night:.2f} "
                  f"(range: ${min_budget:.2f}-${max_budget:.2f})")
        
        # Log the processed request details
        logger.info(f"Processing request with parameters: dates={request.startDate} to {request.endDate}, "
                   f"travelers={request.travelers}, trip duration={trip_days} days")
        
        # Call the scraper function - we're storing the budget but not using it for filtering
        # The scraper has been updated to not use the budget for filtering
        listings = scrape_airbnb_with_got_it(
            destination=request.destination,
            checkin=request.startDate,
            checkout=request.endDate,
            guests=request.travelers,
            min_budget=min_budget,  # These values are stored in metadata but not used for filtering
            max_budget=max_budget   # These values are stored in metadata but not used for filtering
        )
        
        # Remove description field from each listing if it exists
        for listing in listings["listings"]:
            if "description" in listing:
                del listing["description"]
        
        # Add trip information to metadata
        listings["metadata"]["trip_days"] = trip_days
        
        # Add budget information to metadata
        listings["metadata"]["total_budget"] = total_budget
        listings["metadata"]["budget_per_night"] = budget_per_night
        
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