from datetime import datetime
import logging
import sqlite3

from sc.scraper import NDUScraper


# Database setup (SQLite example)
def setup_database():
    conn = sqlite3.connect('../db/shouf_courses.db')
    cursor = conn.cursor()
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS courses (
            course_code TEXT, 
            section TEXT, 
            course_name TEXT, 
            credits INTEGER, 
            time TEXT, 
            instructor TEXT, 
            room TEXT,
            prerequisite TEXT,
            semester TEXT,
            year TEXT
            )
        '''
    )  # Added semester and year columns to distinguish data by semester and year
    conn.commit()
    return conn

# Insert course data into the database
def insert_course_data(conn, courses, semester, year):
    cursor = conn.cursor()
    for course in courses:
        cursor.execute(
            '''
            INSERT INTO courses (course_code, section, course_name, credits, time, instructor, room, prerequisite, semester, year)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                course['course_code'], 
                course['section'], 
                course['course_name'], 
                course['credits'], 
                course['time'], 
                course['instructor'], 
                course['room'], 
                course['prerequisite'], 
                semester, 
                year
            )  # Insert semester and year into each row
        )
    conn.commit()
    
# Clear old course data for the current semester and year
def clear_old_courses(conn, semester, year):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM courses WHERE semester = ? AND year = ?", (semester, year))
    conn.commit()
    logging.info(f"Cleared old course data for {semester}-{year}.")
    
    
def update_year_and_semester():
    now = datetime.now()
    month = now.month
    year = now.year
    
    if month >= 1 and month < 6:  # January to May is Spring
        return "Spring", year
    elif month >= 6 and month < 9:  # June to August is Summer
        return "Summer", year
    else:  # September to December is Fall
        return "Fall", year
    
    

class ShoufScraper:
    def __init__(self):
        logging.basicConfig(level=logging.INFO)
        
        self.scraper = NDUScraper()
        
        self.faculty = "All"
        self.campus = "Shouf"
        
        
    def run_shouf_scraper(self):    
            
        # Step 1: Set up the database
        conn = setup_database()
        if conn is None:
            logging.error("Failed to connect to the database.")
            return []
        
        try:
            semester, year = update_year_and_semester()
            str_year = str(year)

            # Clear old data for the new semester and year
            clear_old_courses(conn, semester, year)
            logging.info(f"Cleared old data for {self.campus} campus, {semester}-{year}.")
            
            # Step 3: Scrape courses
            logging.info(f"Starting course scraping for {self.campus} campus, {semester}-{year}.")
            scraped_courses = self.scraper.scrape_courses(self.faculty, self.campus, semester, str_year)

            # Step 4: Insert scraped data into the database
            if scraped_courses:
                insert_course_data(conn, scraped_courses, semester, year)
                logging.info(f"Successfully inserted {len(scraped_courses)} courses into the database.")
            else:
                logging.info("No courses were scraped.")

            return scraped_courses  # Return data for potential use elsewhere
        
        except Exception as e:
            logging.error(f"An error occurred during scraping: {e}")
            return []

        finally:
            # Step 5: Ensure the database connection is closed
            conn.close()
            logging.info("Database connection closed.")
