import json
import re
from datetime import datetime

def extract_rating_and_reviews(rating_text):
    """Extract rating and review count from the rating text."""
    if rating_text == "No rating":
        return 0, 0
    
    print(f"Processing rating text: {rating_text}")
    
    # Try different patterns for rating formats
    patterns = [
        r"(\d+\.\d+)(?:\s+out of \d+)?\s*\((\d+)[^\d]*\)",  # "4.95 (124 reviews)" or "4.8 out of 5 (124)"
        r"(\d+\.\d+)\s+\((\d+)\)",  # "4.95 (124)"
        r"(\d+\.\d+)\s+out of \d+\s+\((\d+)\s+reviews\)",  # "4.95 out of 5 (124 reviews)"
        r"(\d+\.\d+).*?(\d+)\s+reviews"  # "4.95 · 124 reviews"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, rating_text)
        if match:
            try:
                rating = float(match.group(1))
                reviews = int(match.group(2))
                print(f"Extracted: rating = {rating}, reviews = {reviews}")
                return rating, reviews
            except (ValueError, IndexError) as e:
                print(f"Error parsing match: {e}")
                continue
    
    print(f"No pattern matched for: {rating_text}")
    return 0, 0

def filter_listings(input_file, min_rating=4.8, min_reviews=50):
    """Filter listings based on minimum rating and review count."""
    try:
        # Read the input JSON file
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        original_count = len(data['listings'])
        filtered_listings = []
        
        print(f"\nProcessing {original_count} listings...")
        print(f"Filtering criteria: rating >= {min_rating}, reviews >= {min_reviews}\n")
        
        for listing in data['listings']:
            rating_text = listing.get('rating', 'No rating')
            title = listing.get('title', 'No title')
            print(f"\nChecking listing: {title}")
            rating, reviews = extract_rating_and_reviews(rating_text)
            
            if rating >= min_rating and reviews >= min_reviews:
                print(f"✓ Accepted: rating={rating}, reviews={reviews}")
                filtered_listings.append(listing)
            else:
                print(f"✗ Rejected: rating={rating}, reviews={reviews}")
        
        # Update the data with filtered listings
        data['metadata']['filtered_count'] = len(filtered_listings)
        data['metadata']['filter_criteria'] = {
            'min_rating': min_rating,
            'min_reviews': min_reviews
        }
        data['listings'] = filtered_listings
        
        # Create output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"filtered_listings_{timestamp}.json"
        
        # Save filtered results
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\nFiltering results:")
        print(f"Original listings: {original_count}")
        print(f"Filtered listings: {len(filtered_listings)}")
        print(f"Filtered results saved to: {output_file}")
        
        return output_file
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return None

if __name__ == "__main__":
    # Get the most recent airbnb_listings file in the current directory
    import glob
    import os
    
    listing_files = glob.glob("airbnb_listings_*.json")
    if not listing_files:
        print("No listing files found!")
        exit(1)
    
    # Get the most recent file
    latest_file = max(listing_files, key=os.path.getctime)
    print(f"Processing most recent file: {latest_file}")
    
    # Filter the listings with updated criteria
    filter_listings(latest_file, min_rating=4.5, min_reviews=30)  # Updated to more lenient criteria 