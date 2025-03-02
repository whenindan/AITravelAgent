from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

service = Service('/path/to/chromedriver')
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Run in headless mode
driver = webdriver.Chrome(service=service, options=options)

url = "https://www.expedia.com/Flights-Search?trip=oneway&leg1=from:NYC,to:LON,departure:2025-03-01TANYT"
driver.get(url)

# Wait for results to load (adjust as needed)
driver.implicitly_wait(5)

# Extract flight prices (XPath/CSS selectors needed)
flights = driver.find_elements(By.CLASS_NAME, "some-price-class")
for flight in flights:
    print(flight.text)

driver.quit()

