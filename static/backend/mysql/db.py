"""
Database utility functions for MySQL connection and operations
"""

import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# MySQL connection parameters
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
COURSES_DB = os.getenv('COURSES_DB', 'courses')

def get_db_connection(campus, semester, year):
    """Get MySQL database connection for courses"""
    try:
        # Connect to MySQL
        connection = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            port=MYSQL_PORT,
            database=COURSES_DB,
            auth_plugin='mysql_native_password'
        )
        
        # Format table name based on campus
        if campus == 'north_lebanon':
            table_name = f"north_lebanon_{semester}_{year}"
        else:
            table_name = f"{campus}_{semester}_{year}"
        
        # Verify the table exists
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(f"SHOW TABLES LIKE %s", (table_name,))
            if cursor.fetchone() is None:
                logging.warning(f"Table {table_name} does not exist in {COURSES_DB} database")
        except Error as e:
            logging.warning(f"Error checking table existence: {e}")
        finally:
            cursor.close()
            
        return connection, table_name
    except Error as e:
        logging.error(f"Error connecting to MySQL: {e}")
        if connection and connection.is_connected():
            connection.close()
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
        print(f"Error executing query: {e}")
        connection.rollback()
        raise
    finally:
        cursor.close()

def close_connection(connection):
    """Close the MySQL connection"""
    if connection and connection.is_connected():
        connection.close()