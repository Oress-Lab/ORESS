from pymongo import MongoClient
from datetime import datetime
import logging
import traceback

from .mongo import get_database

db = get_database()
timetables = db.timetables

def save_timetable(email, timetable_data):
    """Save timetable data for a user, including favorites and their states."""
    try:
        # Prepare the data to save
        update_data = {
            'email': email,
            'elements': timetable_data.get('elements', []),
            'favorites': timetable_data.get('favorites', []),
            'checkbox_states': timetable_data.get('checkboxes', {}),
            'star_states': timetable_data.get('stars', {}),
            'last_updated': datetime.utcnow()
        }
        
        # Update or insert the document
        result = timetables.update_one(
            {'email': email},
            {'$set': update_data},
            upsert=True
        )

        
        # Verify the save by reading back the data
        saved_data = get_timetable(email)
        if saved_data:
            return True
        return False
    except Exception as e:
        print(f"Error saving timetable: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

def get_timetable(email):
    """Get timetable data for a user, including favorites and their states."""
    try:
        timetable = timetables.find_one({'email': email})
        if timetable:
            # Convert ObjectId to string for JSON serialization
            timetable['_id'] = str(timetable['_id'])
            
            # Prepare the response data
            response_data = {
                'elements': timetable.get('elements', []),
                'favorites': timetable.get('favorites', []),
                'checkboxes': timetable.get('checkbox_states', {}),
                'stars': timetable.get('star_states', {}),
                'last_updated': timetable.get('last_updated', datetime.utcnow())
            }
            return response_data
        return None
    except Exception as e:
        print(f"Error retrieving timetable: {str(e)}")
        return None