from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.service import Service
from webdriver_manager.firefox import GeckoDriverManager
from selenium.common.exceptions import UnexpectedAlertPresentException, TimeoutException
import time

options = webdriver.FirefoxOptions()
options.add_argument("--start-maximized")
# options.add_argument("--headless")

driver = webdriver.Firefox(service=Service(GeckoDriverManager().install()), options=options)
wait = WebDriverWait(driver, 30)  # Increased wait time to 30 seconds

try:
    driver.get("http://localhost:5173")
    time.sleep(2)

    # From field
    from_input = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'From')]/following-sibling::input"))
    )
    from_input.clear()
    from_input.send_keys("YYZ")
    time.sleep(1)

    try:
        first_from_suggestion = wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".suggestions li"))
        )
        first_from_suggestion.click()
        time.sleep(1)
    except Exception:
        pass

    # To field
    to_input = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'To')]/following-sibling::input"))
    )
    to_input.clear()
    to_input.send_keys("DXB")
    time.sleep(1)

    try:
        first_to_suggestion = wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".suggestions li"))
        )
        first_to_suggestion.click()
        time.sleep(1)
    except Exception:
        pass

    # One way selection
    one_way_radio = wait.until(
        EC.element_to_be_clickable(
            (By.XPATH, "//label[contains(., 'One Way') or contains(., 'One-way')]/input | //button[contains(., 'One Way') or contains(., 'One-way')]")
        )
    )
    one_way_radio.click()
    time.sleep(1)

    # Departure date only (no return date for one way)
    departure_input = driver.find_element(
        By.XPATH, "//label[contains(., 'Departure') or contains(., 'Date')]/following-sibling::input"
    )
    departure_input.clear()
    departure_input.send_keys("2025-12-25")
    time.sleep(1)

    # Cabin class selection - simplified version assuming a <select> element
    cabin_dropdown = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "select"))
    )
    cabin_dropdown.click()
    time.sleep(1)

    first_class_option = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//option[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'first')]"))
    )
    first_class_option.click()
    time.sleep(1)

    # Passengers - assumed default is 1 so just open/close passenger popup
    passenger_div = driver.find_element(
        By.XPATH, "//label[contains(., 'Passengers')]/following-sibling::div"
    )
    passenger_div.click()
    time.sleep(1)

    done_btn = driver.find_element(By.XPATH, "//button[contains(@class,'done-btn') or contains(., 'Done')]")
    done_btn.click()
    time.sleep(1)

    # Click search flights
    search_btn = driver.find_element(By.XPATH, "//button[contains(., 'Search Flights') or contains(., 'Search')]")
    search_btn.click()
    time.sleep(2)

    # Handle possible alert ("No flights found")
    try:
        alert = driver.switch_to.alert
        print(f"Alert detected: {alert.text}")
        alert.dismiss()
        print("Alert dismissed. No flights found.")
        raise Exception("No flights found alert detected, stopping test.")
    except Exception as e:
        # No alert or handled
        pass

    # Wait for at least one flight card to appear (up to 30 seconds)
    try:
        first_flight = wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, ".flight-card"))
        )
        time.sleep(1)
    except TimeoutException:
        raise Exception("Timed out waiting for flight results to load.")

    print("\n========================================")
    print("✅ Test completed successfully: One-way YYZ to DXB, First Class, 1 passenger flight search.")
    print("========================================\n")

    time.sleep(5)

finally:
    driver.quit()
