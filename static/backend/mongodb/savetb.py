from datetime import datetime
import traceback

from .mongo import get_database

# Get database instance
db = get_database()

# Ensure timetables collection exists with proper indexes
def init_timetables_collection():
    try:
        # Create timetables collection if it doesn't exist
        if 'timetables' not in db.list_collection_names():
            db.create_collection('timetables')
        
        # Get timetables collection
        timetables = db['timetables']
        
        # Create indexes
        timetables.create_index('email', unique=True)
        timetables.create_index([('email', 1), ('last_updated', -1)])
        
        return timetables
    except Exception as e:
        print(f"Error initializing timetables collection: {str(e)}")
        raise

# Initialize timetables collection
timetables = init_timetables_collection()

def save_course_to_timetable(email, course_data):
    """Save a course to user's timetable."""
    try:
        crn = course_data.get('crn')
        if not crn:
            return False

        # Find existing timetable for the user
        user_timetable = timetables.find_one({'email': email})
        
        if not user_timetable:
            # Create new timetable document if it doesn't exist
            user_timetable = {
                'email': email,
                'courses': [],
                'favorites': [],
                'last_updated': datetime.utcnow()
            }
        
        # Prepare course entry
        course_entry = {
            'crn': crn,
            'position': course_data.get('position', {}),  # x, y coordinates on timetable
            'time': course_data.get('time', ''),
            'is_favorite': course_data.get('is_favorite', False)
        }
        
        # Update courses list
        courses = user_timetable.get('courses', [])
        # Remove existing course with same CRN if it exists
        courses = [c for c in courses if c['crn'] != crn]
        courses.append(course_entry)
        
        # Update favorites list
        favorites = user_timetable.get('favorites', [])
        if course_entry['is_favorite']:
            if crn not in favorites:
                favorites.append(crn)
        else:
            if crn in favorites:
                favorites.remove(crn)
        
        # Update or insert the document
        update_data = {
            'email': email,
            'courses': courses,
            'favorites': favorites,
            'last_updated': datetime.utcnow()
        }
        
        timetables.update_one(
            {'email': email},
            {'$set': update_data},
            upsert=True
        )
        
        return True
    except Exception as e:
        print(f"Error saving course to timetable: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

def get_user_timetable(email):
    """Get user's timetable data including courses and favorites."""
    try:
        timetable = timetables.find_one({'email': email})
        if timetable:
            # Remove MongoDB _id for JSON serialization
            timetable.pop('_id', None)
            return timetable
        return {'courses': [], 'favorites': []}
    except Exception as e:
        print(f"Error retrieving timetable: {str(e)}")
        return None

def remove_course_from_timetable(email, crn):
    """Remove a course from user's timetable."""
    try:
        # Find user's timetable
        user_timetable = timetables.find_one({'email': email})
        if not user_timetable:
            return False
            
        # Remove course from courses list
        courses = user_timetable.get('courses', [])
        courses = [c for c in courses if c['crn'] != crn]
        
        # Remove from favorites if present
        favorites = user_timetable.get('favorites', [])
        if crn in favorites:
            favorites.remove(crn)
            
        # Update the document
        timetables.update_one(
            {'email': email},
            {
                '$set': {
                    'courses': courses,
                    'favorites': favorites,
                    'last_updated': datetime.utcnow()
                }
            }
        )
        
        return True
    except Exception as e:
        print(f"Error removing course from timetable: {str(e)}")
        return False

def toggle_favorite(email, crn):
    """Toggle favorite status for a course."""
    try:
        user_timetable = timetables.find_one({'email': email})
        if not user_timetable:
            return False
            
        favorites = user_timetable.get('favorites', [])
        courses = user_timetable.get('courses', [])
        
        # Toggle favorite status
        if crn in favorites:
            favorites.remove(crn)
            # Update course entry
            courses = [
                {**c, 'is_favorite': False} if c['crn'] == crn else c
                for c in courses
            ]
        else:
            favorites.append(crn)
            # Update course entry
            courses = [
                {**c, 'is_favorite': True} if c['crn'] == crn else c
                for c in courses
            ]
            
        # Update the document
        timetables.update_one(
            {'email': email},
            {
                '$set': {
                    'courses': courses,
                    'favorites': favorites,
                    'last_updated': datetime.utcnow()
                }
            }
        )
        
        return True
    except Exception as e:
        print(f"Error toggling favorite status: {str(e)}")
        return False