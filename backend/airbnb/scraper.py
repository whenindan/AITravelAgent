from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import time
import json
from datetime import datetime

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
                print("Clicked 'Got it' button.")
                return
            except:
                continue
    except Exception as e:
        print("No 'Got it' button found or couldn't click:", e)

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
        
        print("Looking for filter button...")
        filter_button = None
        
        time.sleep(5)
        
        for selector in filter_selectors:
            try:
                print(f"Trying selector: {selector}")
                if selector.startswith('//'):
                    filter_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, selector))
                    )
                else:
                    filter_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                print(f"Found filter button with selector: {selector}")
                break
            except Exception as e:
                print(f"Selector {selector} failed: {str(e)}")
                continue
        
        if not filter_button:
            raise Exception("Could not find filter button")
            
        driver.execute_script("arguments[0].scrollIntoView(true);", filter_button)
        time.sleep(2)
        
        filter_button.click()
        print("Clicked filter button")
        
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
        
        print("Looking for price input fields...")
        min_price = None
        max_price = None
        
        for selector in price_selectors:
            try:
                print(f"Trying price selector: {selector}")
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
                    print("Found both price input fields")
                    break
            except Exception as e:
                print(f"Price selector {selector} failed: {str(e)}")
                continue
                
        if not min_price or not max_price:
            raise Exception("Could not find price input fields")
        
        # Calculate price range
        budget = int(budget)
        min_budget = max(0, budget - 100)
        max_budget = budget + 100
        
        print(f"Setting price range: ${min_budget} - ${max_budget}")
        
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
        print(f"Verified values - Min: {min_value}, Max: {max_value}")
        
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
                print(f"Found show element using selector: {selector} with text: '{show_button.text}'")
                break
            except Exception as e:
                print(f"Selector {selector} failed: {e}")
                continue
        
        if not show_button:
            raise Exception("Could not find 'Show 1,000+ places' element")
        
        driver.execute_script("arguments[0].scrollIntoView(true);", show_button)
        time.sleep(1)
        show_button.click()
        print("Clicked show places element")
        # --- END UPDATED ---
        
        # Wait for results to update
        time.sleep(5)
        
    except Exception as e:
        print("Error setting budget filter:", e)
        raise  # Re-raise the exception to handle it in the calling function


def scrape_airbnb_with_got_it(destination, checkin, checkout, guests, budget):
    base_url = "https://www.airbnb.com/s/"
    search_url = (
        f"{base_url}{destination.replace(' ', '%20')}/homes"
        f"?checkin={checkin}&checkout={checkout}"
        f"&adults={guests}"
    )

    driver = webdriver.Chrome()
    driver.get(search_url)
    
    # Wait for initial page load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, 'body'))
    )
    
    # Try clicking 'Got it'
    click_got_it(driver)
    
    # Set budget filter
    click_filter_and_set_budget(driver, budget)
    
    # Scroll to load all listings
    scroll_page(driver)
    
    # Wait for listings to appear or time out
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="card-container"]'))
        )
    except:
        print("Listing cards did not appear. Possibly blocked or wrong URL/selectors.")
        driver.quit()
        return []
    
    # Grab all listing cards
    listings = driver.find_elements(By.CSS_SELECTOR, '[data-testid="card-container"]')
    print(f"Found {len(listings)} listings with [data-testid='card-container'].")
    
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
            print("Error parsing a listing:", e)
            continue
    
    driver.quit()
    
    # Add metadata to the results
    output_data = {
        "metadata": {
            "destination": destination,
            "checkin": checkin,
            "checkout": checkout,
            "guests": guests,
            "budget": budget,
            "min_price": max(0, int(budget) - 100),
            "max_price": int(budget) + 100,
            "scrape_time": datetime.now().isoformat(),
            "total_listings": len(scraped_data)
        },
        "listings": scraped_data
    }
    
    return output_data

if __name__ == "__main__":
    budget = input("What's your budget per night (USD)? : ")
    destination_input = input("What's the destination? : ")
    checkin_input = input("What's the check-in date (YYYY-MM-DD)? : ")
    checkout_input = input("What's the checkout date (YYYY-MM-DD)? : ")
    guests_input = input("How many guests? : ")

    results = scrape_airbnb_with_got_it(destination_input, checkin_input, checkout_input, guests_input, budget)
    
    # Create filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"airbnb_listings_{destination_input.lower().replace(' ', '_')}_{timestamp}.json"
    
    # Save to JSON
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Data saved to {filename}")
