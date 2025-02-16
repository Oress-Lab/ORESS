# mongodb.py
import logging
import random
import certifi

from datetime import datetime
from pymongo import MongoClient
from werkzeug.security import generate_password_hash

def get_database():
    try:
        client = MongoClient(
            'mongodb+srv://users:users123@cluster0.bejx6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=5000,
            socketTimeoutMS=5000
        )
        db = client['users']
        return db
    except Exception as e:
        logging.error(f"Error connecting to MongoDB: {str(e)}")
        raise

def add_user(email, password):
    try:
        db = get_database()
        users = db['users']
        
        if users.find_one({'email': email}):
            print(f"User {email} already exists")
            return False
            
        result = users.insert_one({
            'email': email, 
            'password': password, 
            'verified': False,
            'created_at': datetime.utcnow()
        })
        print(f"User {email} added successfully with ID: {result.inserted_id}")
        return True
        
    except Exception as e:
        print(f"Database error while adding user {email}: {str(e)}")
        return False

def validate_user(email, password):
    db = get_database()
    users = db['users']
    user = users.find_one({'email': email, 'password': password, 'verified': True})
    return user is not None

def verify_email(email):
    try:
        db = get_database()
        result = db['users'].update_one(
            {'email': email},
            {'$set': {'verified': True}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"Error verifying email: {str(e)}")
        return False

def generate_reset_code(email):
    db = get_database()
    users = db['users']
    user = users.find_one({'email': email})
    if not user:
        return None  # User not found

    reset_code = random.randint(100000, 999999)
    users.update_one({'email': email}, {'$set': {'reset_code': reset_code}})
    return reset_code

def verify_reset_code(email, code):
    db = get_database()
    users = db['users']
    user = users.find_one({'email': email, 'reset_code': int(code)})
    return user is not None

def update_password(email, new_password):
    try:
        db = get_database()
        users = db['users']
        # Hash the password before storing
        hashed_password = generate_password_hash(new_password)
        
        # Log the update attempt
        logging.info(f"Attempting to update password for email: {email}")
        
        result = users.update_one(
            {'email': email}, 
            {'$set': {'password': hashed_password, 'reset_code': None}}
        )
        
        # Log the result
        logging.info(f"Password update result - modified count: {result.modified_count}")
        
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"Error updating password: {str(e)}")
        return False

