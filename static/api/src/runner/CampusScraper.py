import logging

from campus.main_campus import MainScraper
from campus.north_campus import NorthScraper
from campus.shouf_campus import ShoufScraper


class CampusScraper:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        
        self.main_scraper = MainScraper()
        self.north_scraper = NorthScraper()
        self.shouf_scraper = ShoufScraper()
        
    
    def scraper(self, semester, year, campuses):
        
        def mark_scraper_completed(campus):
            completed_scrapers[campus] = True
            logging.info(f"Scraping completed for {campus}.")

        logging.info(f"Starting {semester}-{year} scraping for campuses: {campuses}.")
        
        # Track the completion of each scraper
        completed_scrapers = {"Main": False, "North Lebanon": False, "Shouf": False}
        
        # Run each scraper sequentially based on the input list
        if "Main" in campuses:
            try:
                self.main_scraper.run_main_scraper()
                mark_scraper_completed("Main")
            except Exception as e:
                logging.error(f"Error during scraping for Main: {e}")

        if "North Lebanon" in campuses:
            try:
                self.north_scraper.run_north_scraper()
                mark_scraper_completed("North Lebanon")
            except Exception as e:
                logging.error(f"Error during scraping for North Lebanon: {e}")

        if "Shouf" in campuses:
            try:
                self.shouf_scraper.run_shouf_scraper()
                mark_scraper_completed("Shouf")
            except Exception as e:
                logging.error(f"Error during scraping for Shouf: {e}")

        # Check if all scrapers have completed
        if all(completed_scrapers.values()):
            logging.info("All scrapers have completed successfully.")
        else:
            logging.warning("Some scrapers did not complete successfully.")



