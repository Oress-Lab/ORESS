from datetime import datetime, timedelta
import logging
import time
import schedule
import traceback

from runner.CampusScraper import CampusScraper

def update_year_and_semester():
    """Dynamically update the year and semester based on the current month."""
    now = datetime.now()
    month = now.month
    year = now.year

    if month >= 10 or month < 3:
        return "Spring", year + 1  # Spring targets next year after November
    elif month >= 3 and month < 6:
        return "Summer", year  # Summer starts in March, same as Fall
    else:
        return "Fall", year  # Fall starts in March, same as Summer

def calculate_registration_period(semester, year):
    """Dynamically calculate registration period for Spring, Summer, and Fall."""
    if semester == "Spring":
        # Spring registration starts November 5, lasts 12 days
        reg_start = datetime(year - 1, 11, 5)  # Spring starts in Nov of the previous year
        reg_end = reg_start + timedelta(days=12)
    else:
        # Summer and Fall registration start March 5, last 14 days
        reg_start = datetime(year, 3, 5)
        reg_end = reg_start + timedelta(days=14)

    return reg_start, reg_end


class ScheduleScrape:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.campus_scraper = CampusScraper()

    def start_scrape(self, semester_name):
        """Start scraping based on the semester."""
        semester, year = update_year_and_semester()
        campuses = ["Main", "North Lebanon", "Shouf"]
        logging.info(f"Starting {semester}-{year} scraping for all campuses.")
        self.campus_scraper.scraper(semester, year, campuses)

    def start_scrape_with_date_check(self, semester, reg_start, reg_end):
        """Run scrape only if within the registration period."""
        today = datetime.now().date()
        if reg_start <= today <= reg_end:
            logging.info(f"Running scrape for {semester} as the date is within the registration period.")
            self.start_scrape(semester)
        else:
            logging.info(f"Skipping scrape for {semester} as today is outside the registration period.")
            
            
    def setup_registration_schedule(self, semester, year):
        """Set up scraping schedule for registration period."""
        reg_start, reg_end = calculate_registration_period(semester, year)
        
        # Schedule daily scraping, but with a date check
        schedule.every().day.at("00:00").do(self.start_scrape_with_date_check, semester, reg_start, reg_end)

        logging.info(f"Scheduled daily scraping for {semester}-{year} from {reg_start} to {reg_end}")

    def setup_post_registration_schedule(self):
        """Switch to weekly scraping (every Wednesday) after the registration period."""
        schedule.every().wednesday.at("00:00").do(self.start_scrape, "Spring")
        schedule.every().wednesday.at("00:00").do(self.start_scrape, "Summer")
        schedule.every().wednesday.at("00:00").do(self.start_scrape, "Fall")
        logging.info("Scheduled weekly scraping every Wednesday.")

    def setup_schedule(self):
        """Set up dynamic scraping schedules based on the current semester."""
        semester, year = update_year_and_semester()
        
        # Set up daily scraping for registration periods
        self.setup_registration_schedule(semester, year)
        # Set up weekly scraping post-registration
        self.setup_post_registration_schedule()

    def run_schedule(self):
        """Run the scheduler continuously."""
        self.setup_schedule()
        while True:
            try:
                schedule.run_pending()
            except Exception as e:
                logging.error(f"Error in running scheduled tasks: {e}")
                logging.debug(traceback.format_exc())
            time.sleep(60)  # Check every minute
