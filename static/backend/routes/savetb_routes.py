from flask import Blueprint, request, jsonify, session
import logging
from ..mongodb.savetb import (
    save_course_to_timetable,
    get_user_timetable,
    remove_course_from_timetable,
    toggle_favorite
)

# Configure logging
logger = logging.getLogger(__name__)

savetb_routes = Blueprint('savetb_routes', __name__)

@savetb_routes.before_request
def check_session():
    """Check if user is logged in before each request"""
    if request.endpoint and 'static' not in request.endpoint:
        if 'email' not in session:
            logger.warning("Unauthorized access attempt - no session")
            return jsonify({"error": "User not logged in"}), 401

@savetb_routes.route('/savetb/save', methods=['POST'])
def save_course():
    try:
        email = session['email']
        course_data = request.get_json()
        
        logger.info(f"Saving course for user {email}")
        logger.debug(f"Course data received: {course_data}")
        
        if not course_data or 'crn' not in course_data:
            logger.error("Invalid course data received")
            return jsonify({"error": "Invalid course data"}), 400
        
        success = save_course_to_timetable(email, course_data)
        
        if success:
            logger.info(f"Course {course_data['crn']} saved successfully for user {email}")
            return jsonify({"message": "Course saved successfully"}), 200
        else:
            logger.error(f"Failed to save course {course_data['crn']} for user {email}")
            return jsonify({"error": "Failed to save course"}), 500
            
    except Exception as e:
        logger.error(f"Error in save_course: {str(e)}")
        return jsonify({"error": str(e)}), 500

@savetb_routes.route('/savetb/get', methods=['GET'])
def get_saved_timetable():
    try:
        email = session['email']
        logger.info(f"Retrieving timetable for user {email}")
        
        timetable_data = get_user_timetable(email)
        
        if timetable_data is None:
            logger.error(f"Failed to retrieve timetable for user {email}")
            return jsonify({"error": "Failed to retrieve timetable"}), 500
            
        logger.info(f"Successfully retrieved timetable for user {email}")
        return jsonify(timetable_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_saved_timetable: {str(e)}")
        return jsonify({"error": str(e)}), 500

@savetb_routes.route('/savetb/remove', methods=['POST'])
def remove_course():
    try:
        email = session['email']
        data = request.get_json()
        
        if not data or 'crn' not in data:
            logger.error("No CRN provided in remove request")
            return jsonify({"error": "CRN not provided"}), 400
        
        logger.info(f"Removing course {data['crn']} for user {email}")
        success = remove_course_from_timetable(email, data['crn'])
        
        if success:
            logger.info(f"Course {data['crn']} removed successfully for user {email}")
            return jsonify({"message": "Course removed successfully"}), 200
        else:
            logger.error(f"Failed to remove course {data['crn']} for user {email}")
            return jsonify({"error": "Failed to remove course"}), 500
            
    except Exception as e:
        logger.error(f"Error in remove_course: {str(e)}")
        return jsonify({"error": str(e)}), 500

@savetb_routes.route('/savetb/favorite', methods=['POST'])
def toggle_course_favorite():
    try:
        email = session['email']
        data = request.get_json()
        
        if not data or 'crn' not in data:
            logger.error("No CRN provided in favorite toggle request")
            return jsonify({"error": "CRN not provided"}), 400
        
        logger.info(f"Toggling favorite for course {data['crn']} for user {email}")
        success = toggle_favorite(email, data['crn'])
        
        if success:
            logger.info(f"Favorite status toggled successfully for course {data['crn']}")
            return jsonify({"message": "Favorite status toggled successfully"}), 200
        else:
            logger.error(f"Failed to toggle favorite status for course {data['crn']}")
            return jsonify({"error": "Failed to toggle favorite status"}), 500
            
    except Exception as e:
        logger.error(f"Error in toggle_course_favorite: {str(e)}")
        return jsonify({"error": str(e)}), 500