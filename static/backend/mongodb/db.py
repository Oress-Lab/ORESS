"""
Database utility functions for MongoDB connection and operations
"""

from pymongo import MongoClient

# MongoDB connection string - replace with your actual MongoDB URI
MONGO_URI = "mongodb+srv://nduCourses:nduCoursesPassword@cluster0.nlbge.mongodb.net/"

def get_db_connection(campus, semester, year):
    """Get MongoDB database connection"""
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    
    # Get the database name based on campus
    if campus == 'main':
        db_name = f"main_{semester}_{year}"
    elif campus == 'north_lebanon':
        db_name = f"north_lebanon_{semester}_{year}"
    elif campus == 'shouf':
        db_name = f"shouf_{semester}_{year}"
    else:
        db_name = f"main_{semester}_{year}"
    
    # Get database
    return client, client[db_name]

def get_courses_collection(db):
    """Get the courses collection from the database"""
    return db.courses

def close_connection(client):
    """Close the MongoDB client connection"""
    if client is not None:
        client.close()