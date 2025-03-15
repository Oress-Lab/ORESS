import logging
import random
import os
from datetime import datetime
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv()

# MySQL connection parameters
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_PORT = os.getenv('MYSQL_PORT', 3306)
AUTH_DB = os.getenv('AUTH_DB', 'auth')

def get_auth_db_connection():
    """Get connection to the auth database"""
    try:
        connection = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            port=int(MYSQL_PORT),
            database=AUTH_DB,
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

def add_user(email, password):
    """Add a new user to the database"""
    try:
        connection = get_auth_db_connection()
        
        # Check if user already exists
        check_query = "SELECT * FROM users WHERE email = %s"
        users = execute_query(connection, check_query, (email,))
        
        if users:
            print(f"User {email} already exists")
            return False
            
        # Insert new user
        insert_query = """
        INSERT INTO users (email, password, verified, created_at) 
        VALUES (%s, %s, %s, %s)
        """
        hashed_password = generate_password_hash(password)
        execute_query(
            connection, 
            insert_query, 
            (email, hashed_password, False, datetime.utcnow())
        )
        
        print(f"User {email} added successfully")
        return True
        
    except Exception as e:
        print(f"Database error while adding user {email}: {str(e)}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def validate_user(email, password):
    """Validate user credentials"""
    try:
        connection = get_auth_db_connection()
        # Retrieve user with matching email, regardless of password
        query = "SELECT * FROM users WHERE email = %s AND verified = TRUE"
        users = execute_query(connection, query, (email,))
        
        if not users or len(users) == 0:
            return False
            
        # Get the stored hashed password
        stored_password = users[0]['password']
        
        # Use check_password_hash to compare the provided password with the stored hash
        return check_password_hash(stored_password, password)
    except Exception as e:
        logging.error(f"Error validating user: {str(e)}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def verify_email(email):
    """Update user's verification status"""
    connection = None
    cursor = None
    try:
        # Establish connection
        connection = get_auth_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # First check if user exists
        check_query = "SELECT verified FROM users WHERE email = %s"
        cursor.execute(check_query, (email,))
        user = cursor.fetchone()
        
        if not user:
            logging.error(f"No user found with email {email}")
            return False
            
        # Update verification status
        update_query = "UPDATE users SET verified = TRUE WHERE email = %s"
        cursor.execute(update_query, (email,))
        
        # Commit the transaction
        connection.commit()
        
        # Verify the update
        cursor.execute(check_query, (email,))
        updated_user = cursor.fetchone()
        
        success = updated_user and updated_user['verified'] == 1
        if success:
            logging.info(f"Successfully verified email for {email}")
        else:
            logging.error(f"Failed to verify email for {email}")
        
        return success
        
    except Exception as e:
        logging.error(f"Database error while verifying email {email}: {str(e)}")
        if connection:
            connection.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            logging.info("Database connection closed")

def generate_reset_code(email):
    """Generate a password reset code for a user"""
    try:
        connection = get_auth_db_connection()
        
        # Check if user exists
        check_query = "SELECT * FROM users WHERE email = %s"
        users = execute_query(connection, check_query, (email,))
        
        if not users:
            return None  # User not found

        reset_code = random.randint(100000, 999999)
        
        # Update user with reset code
        update_query = "UPDATE users SET reset_code = %s WHERE email = %s"
        execute_query(connection, update_query, (reset_code, email))
        
        return reset_code
    except Exception as e:
        logging.error(f"Error generating reset code: {str(e)}")
        return None
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def verify_reset_code(email, code):
    """Verify a password reset code"""
    try:
        connection = get_auth_db_connection()
        query = "SELECT * FROM users WHERE email = %s AND reset_code = %s"
        users = execute_query(connection, query, (email, int(code)))
        return len(users) > 0
    except Exception as e:
        logging.error(f"Error verifying reset code: {str(e)}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def update_password(email, new_password):
    """Update a user's password"""
    try:
        connection = get_auth_db_connection()
        
        # Hash the password before storing
        hashed_password = generate_password_hash(new_password)
        
        # Log the update attempt
        logging.info(f"Attempting to update password for email: {email}")
        
        query = "UPDATE users SET password = %s, reset_code = NULL WHERE email = %s"
        rows_affected = execute_query(connection, query, (hashed_password, email))
        
        # Log the result
        logging.info(f"Password update result - rows affected: {rows_affected}")
        
        return rows_affected > 0
    except Exception as e:
        logging.error(f"Error updating password: {str(e)}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close() 