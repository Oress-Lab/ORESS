"""


"""

from flask import Blueprint, jsonify, request
import logging
import os
import sys
import traceback


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), './src')))
from .src.runner.ScheduleScraper import ScheduleScrape 

api = Blueprint('api', __name__)  # Convert to Blueprint

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Endpoint to start the scraping process
@api.route('/scrape', methods=['POST'])
def scrape():
    logging.info("Starting scraping process...")
    
    # Initialize the scraper
    schedule_scraper = ScheduleScrape()
    
    try:
        # Run the scraper and retrieve data
        data = schedule_scraper.run_schedule()
        
        # Respond with success message and sample data
        return jsonify({"message": "Scraping completed successfully", "data": data}), 200
    except Exception as e:
        # Log the error with traceback for detailed debugging
        logging.error(f"Error during scraping: {e}")
        logging.error(traceback.format_exc())
        return jsonify({"error": "Scraping failed"}), 500

# Health check endpoint (optional)
@api.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "API is running"}), 200

