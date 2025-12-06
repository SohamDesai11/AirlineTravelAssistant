from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.service import Service
from webdriver_manager.firefox import GeckoDriverManager
import time
import datetime

# Setup Firefox with options
options = webdriver.FirefoxOptions()
options.add_argument("--start-maximized")
# Optional: run headless
# options.add_argument("--headless")

driver = webdriver.Firefox(service=Service(GeckoDriverManager().install()), options=options)

# Wait up to 20 seconds for elements
wait = WebDriverWait(driver, 20)

try:
    # 1. Open your React app
    driver.get("http://localhost:5173")  # change port if different
    time.sleep(2)

    # 2. Fill "From" field
    from_input = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'From')]/following-sibling::input"))
    )
    from_input.clear()
    from_input.send_keys("JFK")
    time.sleep(1)

    # Select first suggestion for From (if suggestions appear)
    try:
        first_from_suggestion = wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".suggestions li"))
        )
        first_from_suggestion.click()
        time.sleep(1)
    except Exception:
        pass  # no suggestions, field already has code

    # 3. Fill "To" field
    to_input = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'To')]/following-sibling::input"))
    )
    to_input.clear()
    to_input.send_keys("LAX")
    time.sleep(1)

    # Select first suggestion for To
    try:
        first_to_suggestion = wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".suggestions li"))
        )
        first_to_suggestion.click()
        time.sleep(1)
    except Exception:
        pass

    # 4. Set Departure date (YYYY-MM-DD that your backend accepts)
    departure_input = driver.find_element(
        By.XPATH, "//label[contains(., 'Departure')]/following-sibling::input"
    )
    departure_input.clear()
    departure_input.send_keys("2025-12-20")
    time.sleep(1)

    # 5. (Optional) Set Return date for round trip
    return_input = driver.find_element(
        By.XPATH, "//label[contains(., 'Return')]/following-sibling::input"
    )
    return_input.clear()
    return_input.send_keys("2025-12-27")
    time.sleep(1)

    # 6. Open passenger popup and set adults/children
    # FIXED XPATH HERE: uses contains() correctly on the label
    passenger_div = driver.find_element(
        By.XPATH, "//label[contains(., 'Passengers')]/following-sibling::div"
    )
    passenger_div.click()
    time.sleep(1)

    # Increase adults by 1 (so 2 adults total)
    adult_plus_btn = wait.until(
        EC.element_to_be_clickable(
            (By.XPATH, "//span[text()='Adults']/ancestor::div[contains(@class,'passenger-type')]//button[last()]")
        )
    )
    adult_plus_btn.click()
    time.sleep(1)

    # Increase children by 1
    child_plus_btn = driver.find_element(
        By.XPATH, "//span[text()='Children']/ancestor::div[contains(@class,'passenger-type')]//button[last()]"
    )
    child_plus_btn.click()
    time.sleep(1)

    # Close passenger popup
    done_btn = driver.find_element(By.XPATH, "//button[contains(@class,'done-btn')]")
    done_btn.click()
    time.sleep(1)

    # 7. Click "Search Flights"
    search_btn = driver.find_element(By.XPATH, "//button[contains(., 'Search Flights')]")
    search_btn.click()
    time.sleep(2)

    # 8. Wait for at least one flight card
    first_flight = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, ".flight-card"))
    )
    time.sleep(1)

    # 9. Click "Select Flight" on first card
    select_btn = first_flight.find_element(
        By.XPATH, ".//button[contains(@class,'select-btn') and contains(., 'Select Flight')]"
    )
    select_btn.click()
    time.sleep(1)

    # 10. Open Cart via navbar button
    cart_btn = wait.until(
        EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(@class,'cart-container') and contains(., 'Cart')]")
        )
    )
    cart_btn.click()
    time.sleep(2)

    # 11. Verify cart page and that at least one item is present
    wait.until(EC.visibility_of_element_located(
        (By.XPATH, "//h2[contains(., 'Your Selected Flights')]")
    ))
    cart_items = driver.find_elements(By.CSS_SELECTOR, ".detailed-cart-flight")
    assert len(cart_items) > 0, "No items in cart after selecting a flight"

    # Nice success message
    print("\n========================================")
    print("✅ Selenium test successful!")
    print("A flight was added to the cart and verified.")
    print("========================================\n")

    # Give you a moment to see the final state
    time.sleep(3)

finally:
    driver.quit()
