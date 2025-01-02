
import time
import logging
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException



# Web scraper for course offerings
class NDUScraper:
    def __init__(self):
        logging.basicConfig(level=logging.INFO)

    def human_delay(self, min_time=3, max_time=6):
        delay = random.uniform(min_time, max_time)
        time.sleep(delay)

    def scrape_courses(self, faculty, campus, semester, year):
        options = Options()
        options.add_argument('user-agent=Mozilla/5.0')

        service = Service(r"C:\Users\Kristen\Desktop\kristen\projects\UniTime\App\static\api\driver\chromedriver.exe")
        driver = webdriver.Chrome(service=service, options=options)

        try:
            # Step 1: Open the target URL
            driver.get("https://www.ndu.edu.lb/about-ndu/administration/offices/registrars-office/registration/course-offering")
            self.human_delay()

            # Step 2: Wait for dropdowns to be present
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, 'cphAllEmptyBody_cphBodyWithDIVtags_cphBody_ddlFaculty'))
            )

            # Step 3: Select dropdown values for faculty, campus, semester, and year
            select_faculty = Select(driver.find_element(By.ID, 'cphAllEmptyBody_cphBodyWithDIVtags_cphBody_ddlFaculty')) 
            select_campus = Select(driver.find_element(By.ID, 'cphAllEmptyBody_cphBodyWithDIVtags_cphBody_ddlCampus'))
            select_semester = Select(driver.find_element(By.ID, 'cphAllEmptyBody_cphBodyWithDIVtags_cphBody_ddlSemester'))
            select_year = Select(driver.find_element(By.ID, 'cphAllEmptyBody_cphBodyWithDIVtags_cphBody_ddlYear'))

            # Log the available options to ensure you're getting the correct ones
            logging.info("Available faculty options:")
            for option in select_faculty.options:
                logging.info(option.text)

            # Step 4: Select the desired options (make sure the text matches exactly)
            try:
                select_faculty.select_by_visible_text(faculty)
            except NoSuchElementException:
                logging.error(f"Faculty option '{faculty}' not found.")
                return []

            select_campus.select_by_visible_text(campus)
            select_semester.select_by_visible_text(semester)
            select_year.select_by_visible_text(year)
            self.human_delay()

            # Step 5: Submit the form
            submit_button = driver.find_element(By.ID, "cphAllEmptyBody_cphBodyWithDIVtags_cphBody_lbtnSubmit")
            submit_button.click()

            # Step 6: Wait for the table to load
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_cphAllEmptyBody_cphBodyWithDIVtags_cphBody_rapDirectory"]/div[2]/div/div/div/div[1]/div/table'))
            )

            # Step 7: Scrape the course data from the table
            courses = []
            table_rows = driver.find_elements(By.XPATH, '//*[@id="ctl00_cphAllEmptyBody_cphBodyWithDIVtags_cphBody_rapDirectory"]/div[2]/div/div/div/div[1]/div/table/tbody/tr')

            for row in table_rows:
                cols = row.find_elements(By.TAG_NAME, 'td')
                if len(cols) >= 8:
                    course_code = cols[0].text.strip()
                    section = cols[1].text.strip()
                    course_name = cols[2].text.strip()
                    credits = int(cols[3].text.strip())
                    time = cols[4].text.strip()
                    instructor = cols[5].text.strip()
                    room = cols[6].text.strip()
                    prereq = cols[7].text.strip()

                    courses.append({
                        "course_code": course_code,
                        "section": section,
                        "course_name": course_name,
                        "credits": str(credits),
                        "time": time,
                        "instructor": instructor,
                        "room": room,
                        "prerequisite": prereq
                    })

            return courses

        finally:
            driver.quit()