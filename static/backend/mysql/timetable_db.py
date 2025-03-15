import mysql.connector
from mysql.connector import Error, pooling
import os
from dotenv import load_dotenv
import logging
import json
from datetime import datetime

load_dotenv()

# MySQL connection parameters - standardized naming
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
COURSES_DB = os.getenv('COURSES_DB', 'courses')
USER_PROGRESS_DB = os.getenv('USER_PROGRESS_DB', 'user_progress')
TIMETABLE_DB = os.getenv('TIMETABLE_DB', 'timetables')

# Create connection pools for better performance
try:
    courses_pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="courses_pool",
        pool_size=5,
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=COURSES_DB,
        port=MYSQL_PORT,
        auth_plugin='mysql_native_password',
        ssl_disabled=False,
        ssl_verify_cert=False
    )
    
    user_progress_pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="user_progress_pool",
        pool_size=5,
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=USER_PROGRESS_DB,
        port=MYSQL_PORT,
        auth_plugin='mysql_native_password',
        ssl_disabled=False,
        ssl_verify_cert=False
    )
    logging.info("Database connection pools created successfully")
except Exception as e:
    logging.error(f"Error creating connection pools: {str(e)}")
    # Fall back to regular connections if pooling fails
    courses_pool = None
    user_progress_pool = None

def get_db_connection(for_courses=False):
    """
    Get connection to the database
    Args:
        for_courses: If True, connect to courses database, otherwise connect to user_progress
    """
    try:
        # Try to get connection from pool first
        if for_courses and courses_pool:
            return courses_pool.get_connection()
        elif not for_courses and user_progress_pool:
            return user_progress_pool.get_connection()
            
        # Fall back to regular connection if pools aren't available
        connection = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=COURSES_DB if for_courses else USER_PROGRESS_DB,
            port=MYSQL_PORT,
            auth_plugin='mysql_native_password',
            ssl_disabled=False,  # Enable SSL/TLS for Aiven
            ssl_verify_cert=False  # Disable SSL certificate verification
        )
        return connection
    except Exception as e:
        logging.error(f"Database connection error: {str(e)}")
        raise

def execute_query(connection, query, params=None):
    """Execute a query and return results"""
    cursor = connection.cursor(dictionary=True)
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
            connection.commit()
            return cursor.lastrowid
        else:
            results = cursor.fetchall()
            return results
    except Exception as e:
        logging.error(f"Error executing query: {str(e)}")
        raise
    finally:
        cursor.close()

def close_connection(connection):
    """Close database connection"""
    if connection and hasattr(connection, 'is_connected') and connection.is_connected():
        connection.close()

def save_timetable(user_email, timetable_name, courses):
    """Save a timetable to the database"""
    connection = None
    try:
        connection = get_db_connection()
        
        # Extract semester and year from timetable_name (format: name_semester_year)
        name_parts = timetable_name.split('_')
        if len(name_parts) >= 3:
            semester = name_parts[-2]
            year = name_parts[-1]
        else:
            # Default values if the format is unexpected
            semester = 'fall'
            year = '2024'
            
        # Check if this is an update or a new timetable
        check_query = """
        SELECT id FROM timetables 
        WHERE email = %s AND semester = %s AND year = %s
        """
        existing = execute_query(connection, check_query, (user_email, semester, year))
        
        # Convert courses to JSON
        courses_json = json.dumps(courses)
        
        if existing and len(existing) > 0:
            # Update existing timetable
            timetable_id = existing[0]['id']
            update_query = """
            UPDATE timetables 
            SET elements = %s, last_updated = %s 
            WHERE id = %s
            """
            execute_query(
                connection, 
                update_query, 
                (courses_json, datetime.utcnow(), timetable_id)
            )
            logging.info(f"Updated timetable for user {user_email}, semester {semester}, year {year}")
        else:
            # Create new timetable
            insert_query = """
            INSERT INTO timetables (email, semester, year, elements, favorites, checkbox_states, star_states, last_updated)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            now = datetime.utcnow()
            execute_query(
                connection, 
                insert_query, 
                (user_email, semester, year, courses_json, '[]', '{}', '{}', now)
            )
            logging.info(f"Created new timetable for user {user_email}, semester {semester}, year {year}")
            
        return True
        
    except Exception as e:
        logging.error(f"Error saving timetable: {str(e)}")
        return False
    finally:
        if connection:
            close_connection(connection)

def get_saved_timetables(user_email):
    """Get all saved timetables for a user"""
    connection = None
    try:
        connection = get_db_connection()
        
        query = """
        SELECT id, email, semester, year, elements, favorites, 
               checkbox_states, star_states, last_updated
        FROM timetables 
        WHERE email = %s 
        ORDER BY last_updated DESC
        """
        
        results = execute_query(connection, query, (user_email,))
        
        # Parse JSON courses
        timetables = []
        for row in results:
            try:
                elements = json.loads(row['elements'])
            except:
                elements = []
                
            timetables.append({
                'id': row['id'],
                'name': f"Timetable_{row['semester']}_{row['year']}",
                'courses': elements,
                'semester': row['semester'],
                'year': row['year'],
                'created_at': None,  # This field doesn't exist in the new schema
                'updated_at': row['last_updated'].isoformat() if row['last_updated'] else None
            })
            
        return timetables
        
    except Exception as e:
        logging.error(f"Error getting timetables: {str(e)}")
        return []
    finally:
        if connection:
            close_connection(connection)

def delete_timetable(user_email, timetable_id):
    """Delete a timetable"""
    connection = None
    try:
        connection = get_db_connection()
        
        # Verify ownership before deleting
        check_query = """
        SELECT id FROM timetables 
        WHERE id = %s AND email = %s
        """
        existing = execute_query(connection, check_query, (timetable_id, user_email))
        
        if not existing or len(existing) == 0:
            logging.warning(f"Attempted to delete timetable {timetable_id} not owned by {user_email}")
            return False
            
        # Delete the timetable
        delete_query = "DELETE FROM timetables WHERE id = %s"
        execute_query(connection, delete_query, (timetable_id,))
        
        logging.info(f"Deleted timetable {timetable_id} for user {user_email}")
        return True
        
    except Exception as e:
        logging.error(f"Error deleting timetable: {str(e)}")
        return False
    finally:
        if connection:
            close_connection(connection)