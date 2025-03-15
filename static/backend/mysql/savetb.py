import json
import logging
import traceback
from datetime import datetime
import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

# Load environment variables
load_dotenv()

# MySQL connection parameters
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
USER_PROGRESS_DB = os.getenv('USER_PROGRESS_DB', 'user_progress')

def get_user_progress_connection():
    """Get connection to the user_progress database"""
    try:
        connection = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            port=MYSQL_PORT,
            database=USER_PROGRESS_DB,
            auth_plugin='mysql_native_password',
            ssl_disabled=False,  # Enable SSL/TLS for Aiven
            ssl_verify_cert=False  # Disable SSL certificate verification
        )
        return connection
    except Error as e:
        logging.error(f"Error connecting to MySQL: {str(e)}")
        raise

def execute_query(connection, query, params=None):
    """Execute a query and return results"""
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if query.strip().upper().startswith(('SELECT', 'SHOW')):
            return cursor.fetchall()
        connection.commit()
        return cursor.rowcount
    except Error as e:
        logging.error(f"Error executing query: {e}")
        connection.rollback()
        raise
    finally:
        cursor.close()

def save_timetable(email, timetable_data):
    """Save timetable data for a user, including favorites and their states."""
    connection = None
    try:
        connection = get_user_progress_connection()
        
        # Check if a record already exists for this user, semester, and year
        check_query = """
        SELECT id FROM timetables 
        WHERE email = %s AND semester = %s AND year = %s
        """
        existing = execute_query(
            connection, 
            check_query, 
            (email, timetable_data.get('semester', ''), timetable_data.get('year', ''))
        )
        
        # Convert complex data structures to JSON strings
        elements_json = json.dumps(timetable_data.get('elements', []))
        favorites_json = json.dumps(timetable_data.get('favorites', []))
        checkbox_states_json = json.dumps(timetable_data.get('checkboxes', {}))
        star_states_json = json.dumps(timetable_data.get('stars', {}))
        
        if existing:
            # Update existing record
            update_query = """
            UPDATE timetables SET 
                elements = %s,
                favorites = %s,
                checkbox_states = %s,
                star_states = %s,
                last_updated = %s
            WHERE email = %s AND semester = %s AND year = %s
            """
            execute_query(
                connection,
                update_query,
                (
                    elements_json,
                    favorites_json,
                    checkbox_states_json,
                    star_states_json,
                    datetime.utcnow(),
                    email,
                    timetable_data.get('semester', ''),
                    timetable_data.get('year', '')
                )
            )
        else:
            # Insert new record
            insert_query = """
            INSERT INTO timetables (
                email, semester, year, elements, favorites, 
                checkbox_states, star_states, last_updated
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_query(
                connection,
                insert_query,
                (
                    email,
                    timetable_data.get('semester', ''),
                    timetable_data.get('year', ''),
                    elements_json,
                    favorites_json,
                    checkbox_states_json,
                    star_states_json,
                    datetime.utcnow()
                )
            )
        
        # Verify the save by reading back the data
        saved_data = get_timetable(email, timetable_data.get('semester', ''), timetable_data.get('year', ''))
        return saved_data is not None
        
    except Exception as e:
        logging.error(f"Error saving timetable: {str(e)}")
        return False
    finally:
        if connection and hasattr(connection, 'is_connected') and connection.is_connected():
            connection.close()

def get_timetable(email, semester=None, year=None):
    """Get timetable data for a user, including favorites and their states."""
    connection = None
    try:
        connection = get_user_progress_connection()
        
        query = "SELECT * FROM timetables WHERE email = %s"
        params = [email]
        
        if semester and year:
            query += " AND semester = %s AND year = %s"
            params.extend([semester, year])
            
        timetables = execute_query(connection, query, tuple(params))
        
        if timetables and len(timetables) > 0:
            timetable = timetables[0]
            
            # Parse JSON strings back to Python objects
            response_data = {
                'elements': json.loads(timetable.get('elements', '[]')),
                'favorites': json.loads(timetable.get('favorites', '[]')),
                'checkboxes': json.loads(timetable.get('checkbox_states', '{}')),
                'stars': json.loads(timetable.get('star_states', '{}')),
                'last_updated': timetable.get('last_updated', datetime.utcnow())
            }
            return response_data
        return None
    except Exception as e:
        print(f"Error retrieving timetable: {str(e)}")
        return None
    finally:
        if connection and hasattr(connection, 'is_connected') and connection.is_connected():
            connection.close()