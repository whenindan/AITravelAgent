from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import time
import json
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def scroll_page(driver, pause_time=1):
    """Scroll the page to load all listings."""
    last_height = driver.execute_script("return document.body.scrollHeight")
    
    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(pause_time)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height

def click_got_it(driver):
    """Attempt to click the 'Got it'/'Accept' button if it appears."""
    try:
        selectors = [
            '//button[contains(text(), "Got it")]',
            '//button[contains(text(), "Accept")]',
            '//button[contains(@aria-label, "Got it")]'
        ]
        for selector in selectors:
            try:
                got_it_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, selector))
                )
                got_it_button.click()
                logger.info("Clicked 'Got it' button.")
                return
            except:
                continue
    except Exception as e:
        logger.info(f"No 'Got it' button found or couldn't click: {e}")

def clear_and_set_value(input_element, value):
    """
    Clear an input field completely and set the given value.
    This uses Ctrl + A (or Command + A on Mac) followed by Backspace,
    then types the desired value.
    """
    input_element.click()
    time.sleep(0.5)
    
    # Try CTRL + A first:
    input_element.send_keys(Keys.CONTROL + "a")
    time.sleep(0.2)
    input_element.send_keys(Keys.BACKSPACE)
    time.sleep(0.2)
    
    # Type new value
    input_element.send_keys(str(value))
    time.sleep(0.5)

def click_filter_and_set_budget(driver, budget):
    """Click filter button and set price range based on budget."""
    try:
        # Find and click filter button (keeping existing filter button logic)
        filter_selectors = [
            'button[data-testid="searchbar-filter-button"]',
            'button[aria-label*="filter"]',
            'button[aria-label*="Filter"]',
            '//button[.//span[contains(text(), "Filters")]]',
            '//button[contains(., "Filters")]',
            'button[data-testid="filter-bar-filter-button"]',
            'button[role="button"][tabindex="0"]'
        ]
        
        logger.info("Looking for filter button...")
        filter_button = None
        
        time.sleep(5)
        
        for selector in filter_selectors:
            try:
                logger.info(f"Trying selector: {selector}")
                if selector.startswith('//'):
                    filter_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, selector))
                    )
                else:
                    filter_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                logger.info(f"Found filter button with selector: {selector}")
                break
            except Exception as e:
                logger.info(f"Selector {selector} failed: {str(e)}")
                continue
        
        if not filter_button:
            raise Exception("Could not find filter button")
            
        driver.execute_script("arguments[0].scrollIntoView(true);", filter_button)
        time.sleep(2)
        
        filter_button.click()
        logger.info("Clicked filter button")
        
        # Wait for filter modal to appear
        time.sleep(3)
        
        # Updated price input selectors
        price_selectors = [
            'input[id="price_filter_min"]',
            'input[data-testid="price-filter-min"]',
            'input[placeholder="min price"]',
            'input[placeholder="Minimum"]',
            'input[aria-label="Minimum price"]'
        ]
        
        logger.info("Looking for price input fields...")
        min_price = None
        max_price = None
        
        for selector in price_selectors:
            try:
                logger.info(f"Trying price selector: {selector}")
                min_price = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                # Try corresponding max price input
                max_selectors = [
                    selector.replace("min", "max"),
                    selector.replace("Minimum", "Maximum"),
                    selector.replace("minimum", "maximum")
                ]
                for max_selector in max_selectors:
                    try:
                        max_price = driver.find_element(By.CSS_SELECTOR, max_selector)
                        break
                    except:
                        continue
                if min_price and max_price:
                    logger.info("Found both price input fields")
                    break
            except Exception as e:
                logger.info(f"Price selector {selector} failed: {str(e)}")
                continue
                
        if not min_price or not max_price:
            raise Exception("Could not find price input fields")
        
        # Calculate price range
        budget = int(budget)
        min_budget = max(0, budget - 100)
        max_budget = budget + 100
        
        logger.info(f"Setting price range: ${min_budget} - ${max_budget}")
        
        # Clear and set minimum price
        min_price.click()
        time.sleep(1)
        min_price.send_keys(Keys.COMMAND + "a")  # For Mac
        min_price.send_keys(Keys.CONTROL + "a")  # For Windows
        min_price.send_keys(Keys.DELETE)
        min_price.send_keys(Keys.BACKSPACE)
        time.sleep(1)
        min_price.send_keys(str(min_budget))
        min_price.send_keys(Keys.TAB)  # Tab out to trigger value update
        time.sleep(1)
        
        # Clear and set maximum price
        max_price.click()
        time.sleep(1)
        max_price.send_keys(Keys.COMMAND + "a")  # For Mac
        max_price.send_keys(Keys.CONTROL + "a")  # For Windows
        max_price.send_keys(Keys.DELETE)
        max_price.send_keys(Keys.BACKSPACE)
        time.sleep(1)
        max_price.send_keys(str(max_budget))
        max_price.send_keys(Keys.TAB)  # Tab out to trigger value update
        time.sleep(2)
        
        # Verify the values were set correctly
        min_value = min_price.get_attribute('value')
        max_value = max_price.get_attribute('value')
        logger.info(f"Verified values - Min: {min_value}, Max: {max_value}")
        
        # --- UPDATED: Clicking the "Show 1,000+ places" element ---
        # Try multiple selectors (for both <button> and <a>) similar to the 'Got it' logic.
        show_selectors = [
            '//button[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "show") and contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "places")]',
            '//a[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "show") and contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "places")]'
        ]
        show_button = None
        for selector in show_selectors:
            try:
                show_button = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, selector))
                )
                logger.info(f"Found show element using selector: {selector} with text: '{show_button.text}'")
                break
            except Exception as e:
                logger.info(f"Selector {selector} failed: {e}")
                continue
        
        if not show_button:
            raise Exception("Could not find 'Show 1,000+ places' element")
        
        driver.execute_script("arguments[0].scrollIntoView(true);", show_button)
        time.sleep(1)
        show_button.click()
        logger.info("Clicked show places element")
        # --- END UPDATED ---
        
        # Wait for results to update
        time.sleep(5)
        
    except Exception as e:
        logger.error(f"Error setting budget filter: {e}")
        raise  # Re-raise the exception to handle it in the calling function

# Dictionary of Airbnb property features with their image URLs
AIRBNB_FEATURES = {
    "Your search": "https://a0.muscache.com/pictures/b887040f-0968-4174-9a4f-2d41f8728248.jpg",
    "Rooms": "https://a0.muscache.com/pictures/7630c83f-96a8-4232-9a10-0398661e2e6f.jpg",
    "Amazing views": "https://a0.muscache.com/pictures/3b1eb541-46d9-4bef-abc4-c37d77e3c21b.jpg",
    "National parks": "https://a0.muscache.com/pictures/c0a24c04-ce1f-490c-833f-987613930eca.jpg",
    "Amazing pools": "https://a0.muscache.com/pictures/3fb523a0-b622-4368-8142-b5e03df7549b.jpg",
    "Lake": "https://a0.muscache.com/pictures/a4634ca6-1407-4864-ab97-6e141967d782.jpg",
    "Countryside": "https://a0.muscache.com/pictures/6ad4bd95-f086-437d-97e3-14d12155ddfe.jpg",
    "Trending": "https://a0.muscache.com/pictures/3726d94b-534a-42b8-bca0-a0304d912260.jpg",
    "Chef's kitchens": "https://a0.muscache.com/pictures/ddd13204-a5ae-4532-898c-2e595b1bb15f.jpg",
    "Play": "https://a0.muscache.com/pictures/f0c5ca0f-5aa0-4fe5-b38d-654264bacddf.jpg",
    "Skiing": "https://a0.muscache.com/pictures/c8bba3ed-34c0-464a-8e6e-27574d20e4d2.jpg",
    "Lakefront": "https://a0.muscache.com/pictures/677a041d-7264-4c45-bb72-52bff21eb6e8.jpg",
    "Design": "https://a0.muscache.com/pictures/50861fca-582c-4bcc-89d3-857fb7ca6528.jpg",
    "Vineyards": "https://a0.muscache.com/pictures/60ff02ae-d4a2-4d18-a120-0dd274a95925.jpg",
    "Bed & breakfasts": "https://a0.muscache.com/pictures/5ed8f7c7-2e1f-43a8-9a39-4edfc81a3325.jpg",
    "Grand pianos": "https://a0.muscache.com/pictures/8eccb972-4bd6-43c5-ac83-27822c0d3dcd.jpg",
    "Cabins": "https://a0.muscache.com/pictures/732edad8-3ae0-49a8-a451-29a8010dcc0c.jpg",
    "Farms": "https://a0.muscache.com/pictures/aaa02c2d-9f0d-4c41-878a-68c12ec6c6bd.jpg",
    "Camping": "https://a0.muscache.com/pictures/ca25c7f3-0d1f-432b-9efa-b9f5dc6d8770.jpg",
    "Tiny homes": "https://a0.muscache.com/pictures/3271df99-f071-4ecf-9128-eb2d2b1f50f0.jpg",
    "Golfing": "https://a0.muscache.com/pictures/6b639c8d-cf9b-41fb-91a0-91af9d7677cc.jpg"
}

# Default feature to select
DEFAULT_FEATURE = "Amazing views"

def select_feature(driver, feature_name=DEFAULT_FEATURE):
    """
    Select a specific feature/category in the Airbnb search.
    
    Args:
        driver: Selenium WebDriver instance
        feature_name: Name of the feature to select (default is "Amazing views")
    
    Returns:
        bool: True if selection was successful, False otherwise
    """
    try:
        logger.info(f"Attempting to select feature: {feature_name}")
        
        # Wait for the category scroller to be visible
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "categoryScroller"))
        )
        
        # Try to find the feature by its data-testid
        feature_selector = f"//div[@data-testid='category-item--{feature_name}--unchecked']"
        
        # Wait for the elements to be loaded
        time.sleep(3)
        
        # Try to find the feature element
        try:
            feature_element = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, feature_selector))
            )
            logger.info(f"Found feature element: {feature_name}")
        except:
            # If not found, we might need to scroll through the categories
            logger.info("Feature not visible in current view, attempting to scroll categories")
            
            # Find and click the next button to scroll through categories
            next_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='Next categories page']"))
            )
            
            # Try clicking next button up to 5 times to find our feature
            for _ in range(5):
                next_button.click()
                time.sleep(1)
                try:
                    feature_element = WebDriverWait(driver, 3).until(
                        EC.element_to_be_clickable((By.XPATH, feature_selector))
                    )
                    logger.info(f"Found feature element after scrolling: {feature_name}")
                    break
                except:
                    continue
            else:
                # If we still can't find it, try one more approach - look for the label containing the feature name
                try:
                    feature_element = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{feature_name}')]/ancestor::label"))
                    )
                    logger.info(f"Found feature element by text: {feature_name}")
                except:
                    logger.error(f"Could not find feature: {feature_name}")
                    return False
        
        # Click the feature to select it
        driver.execute_script("arguments[0].scrollIntoView(true);", feature_element)
        time.sleep(1)
        feature_element.click()
        logger.info(f"Successfully selected feature: {feature_name}")
        
        # Wait for the page to update
        time.sleep(3)
        return True
        
    except Exception as e:
        logger.error(f"Error selecting feature {feature_name}: {str(e)}")
        return False

def scrape_airbnb_with_got_it(destination, checkin, checkout, guests, min_budget=None, max_budget=None, feature=DEFAULT_FEATURE):
    """
    Scrape Airbnb listings using Selenium with handling for the "Got it" popup.
    
    Args:
        destination (str): The destination to search for
        checkin (str): Check-in date in YYYY-MM-DD format
        checkout (str): Check-out date in YYYY-MM-DD format
        guests (int): Number of guests
        min_budget (float, optional): Minimum budget per night (not used currently)
        max_budget (float, optional): Maximum budget per night (not used currently)
        feature (str, optional): Property feature to filter by (default is "Amazing views")
        
    Returns:
        dict: Dictionary containing listings and metadata
    """
    logger.info(f"Starting scraper for {destination}")
    
    base_url = "https://www.airbnb.com/s/"
    search_url = (
        f"{base_url}{destination.replace(' ', '%20')}/homes"
        f"?checkin={checkin}&checkout={checkout}"
        f"&adults={guests}"
    )

    # Set up Chrome options for headless mode
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")  # Use new headless mode
    chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
    chrome_options.add_argument("--window-size=1920,1080")  # Set window size
    chrome_options.add_argument("--no-sandbox")  # Bypass OS security model
    chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems
    chrome_options.add_argument("--disable-extensions")  # Disable extensions
    chrome_options.add_argument("--disable-notifications")  # Disable notifications
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")  # Set user agent
    
    logger.info("Starting Chrome in headless mode")
    driver = webdriver.Chrome(options=chrome_options)
    driver.get(search_url)
    
    # Wait for initial page load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, 'body'))
    )
    
    # Try clicking 'Got it'
    click_got_it(driver)
    
    # Select the specified feature (default is "Amazing views")
    if feature and feature in AIRBNB_FEATURES:
        logger.info(f"Selecting feature: {feature}")
        select_feature(driver, feature)
    
    # Scroll to load all listings
    scroll_page(driver)
    
    # Wait for listings to appear or time out
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="card-container"]'))
        )
    except:
        logger.warning("Listing cards did not appear. Possibly blocked or wrong URL/selectors.")
        driver.quit()
        return {"metadata": {}, "listings": []}
    
    # Grab all listing cards
    listings = driver.find_elements(By.CSS_SELECTOR, '[data-testid="card-container"]')
    logger.info(f"Found {len(listings)} listings with [data-testid='card-container'].")
    
    scraped_data = []
    
    for listing in listings:
        try:
            # Title
            title = "No title"
            try:
                title_elem = listing.find_element(By.CSS_SELECTOR, '[data-testid="listing-card-title"]')
                title = title_elem.text.strip()
            except:
                try:
                    title_elem = listing.find_element(By.CSS_SELECTOR, 'div[style*="--title"]')
                    title = title_elem.text.strip()
                except:
                    pass
            
            # Price
            price_text = "No price"
            try:
                price_elem = listing.find_element(By.CSS_SELECTOR, '[data-testid="price-availability-row"]')
                price_text = price_elem.text.strip()
            except:
                try:
                    price_elem = listing.find_element(By.CSS_SELECTOR, 'span[style*="--pricing"]')
                    price_text = price_elem.text.strip()
                except:
                    pass
            
            # Rating
            rating = "No rating"
            try:
                rating_elem = listing.find_element(By.XPATH, ".//span[contains(text(),'out of 5')]")
                rating = rating_elem.text.strip()
            except:
                pass
            
            # URL
            listing_url = "No URL"
            try:
                link_elem = listing.find_element(By.CSS_SELECTOR, 'a[href*="/rooms/"]')
                listing_url = link_elem.get_attribute('href')
            except:
                pass
            
            # Only add listings that have some data
            if any(x != "No " + y for x, y in zip([title, price_text, listing_url], ["title", "price", "URL"])):
                data = {
                    "title": title,
                    "price_text": price_text,
                    "rating": rating,
                    "url": listing_url
                }
                scraped_data.append(data)
        
        except Exception as e:
            logger.error(f"Error parsing a listing: {e}")
            continue
    
    driver.quit()
    
    # Add metadata to the results
    output_data = {
        "metadata": {
            "destination": destination,
            "checkin": checkin,
            "checkout": checkout,
            "guests": guests,
            "feature": feature,
            "scrape_time": datetime.now().isoformat(),
            "total_listings": len(scraped_data)
        },
        "listings": scraped_data
    }
    
    # Store budget information in metadata if provided
    if min_budget is not None and max_budget is not None:
        output_data["metadata"]["min_budget"] = min_budget
        output_data["metadata"]["max_budget"] = max_budget
    
    return output_data

if __name__ == "__main__":
    budget = input("What's your budget per night (USD)? : ")
    destination_input = input("What's the destination? : ")
    checkin_input = input("What's the check-in date (YYYY-MM-DD)? : ")
    checkout_input = input("What's the checkout date (YYYY-MM-DD)? : ")
    guests_input = input("How many guests? : ")
    
    # Add feature selection option
    print("\nAvailable features:")
    for i, feature in enumerate(AIRBNB_FEATURES.keys(), 1):
        print(f"{i}. {feature}")
    
    feature_input = input(f"\nSelect a feature (press Enter for default '{DEFAULT_FEATURE}'): ")
    selected_feature = DEFAULT_FEATURE
    
    if feature_input:
        try:
            feature_idx = int(feature_input) - 1
            if 0 <= feature_idx < len(AIRBNB_FEATURES):
                selected_feature = list(AIRBNB_FEATURES.keys())[feature_idx]
        except ValueError:
            # If input is not a number, check if it's a feature name
            if feature_input in AIRBNB_FEATURES:
                selected_feature = feature_input
    
    logger.info(f"Starting scraper in headless mode with feature: {selected_feature}...")
    # For testing purposes, we're not using the budget for filtering
    results = scrape_airbnb_with_got_it(
        destination=destination_input, 
        checkin=checkin_input, 
        checkout=checkout_input, 
        guests=guests_input,
        feature=selected_feature
    )
    
    # Create filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"airbnb_listings_{destination_input.lower().replace(' ', '_')}_{timestamp}.json"
    
    # Save to JSON
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Data saved to {filename}")