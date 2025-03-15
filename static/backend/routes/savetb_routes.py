"""
Routes for saving and loading timetable state
"""

from flask import Blueprint, request, jsonify, session, current_app
import logging
from ..mysql.timetable_db import save_timetable, get_saved_timetables, delete_timetable

savetb_routes = Blueprint('savetb', __name__, url_prefix='/savetb')

# Authentication decorator
def login_required(f):
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Log the current session for debugging
        logging.info(f"Session in login_required: {session}")
        
        if 'user' not in session:
            logging.warning("User not in session")
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
            
        return f(*args, **kwargs)
    return decorated_function

@savetb_routes.route('/save', methods=['POST'])
@login_required
def save():
    try:
        # Get user from session
        user_email = session.get('user')
        logging.info(f"Saving timetable for user: {user_email}")
        
        if not user_email:
            return jsonify({'success': False, 'message': 'User not authenticated'}), 401
            
        # Get timetable data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        # Extract timetable data
        timetable_name = data.get('name', 'Untitled Timetable')
        courses = data.get('courses', [])
        
        # Save timetable to database
        success = save_timetable(user_email, timetable_name, courses)
        
        if success:
            return jsonify({'success': True, 'message': 'Timetable saved successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to save timetable'}), 500
            
    except Exception as e:
        logging.error(f"Error saving timetable: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@savetb_routes.route('/get', methods=['GET'])
@login_required
def get():
    try:
        # Get user from session
        user_email = session.get('user')
        logging.info(f"Getting timetables for user: {user_email}")
        
        if not user_email:
            return jsonify({'success': False, 'message': 'User not authenticated'}), 401
            
        # Get saved timetables from database
        timetables = get_saved_timetables(user_email)
        
        return jsonify({'success': True, 'timetables': timetables})
        
    except Exception as e:
        logging.error(f"Error getting timetables: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@savetb_routes.route('/delete/<int:timetable_id>', methods=['DELETE'])
@login_required
def delete(timetable_id):
    try:
        # Get user from session
        user_email = session.get('user')
        
        if not user_email:
            return jsonify({'success': False, 'message': 'User not authenticated'}), 401
            
        # Delete timetable from database
        success = delete_timetable(user_email, timetable_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Timetable deleted successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to delete timetable'}), 500
            
    except Exception as e:
        logging.error(f"Error deleting timetable: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500