"""
Routes for saving and loading timetable state
"""

from flask import Blueprint, jsonify, request, session, url_for
from ..mongodb.savetb import save_timetable, get_timetable

savetb_routes = Blueprint('savetb', __name__)

@savetb_routes.route('/savetb/save', methods=['POST'])
def save_timetable_route():
    """Save timetable data including favorites and their states."""
    if 'email' not in session:
        return jsonify({'error': 'Not logged in', 'redirect': url_for('auth.index')}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        success = save_timetable(session['email'], data)
        if success:
            return jsonify({'message': 'Timetable saved successfully'}), 200
        else:
            return jsonify({'error': 'Failed to save timetable'}), 500
    except Exception as e:
        print(f"Error in save_timetable_route: {str(e)}")
        return jsonify({'error': str(e)}), 500

@savetb_routes.route('/savetb/get', methods=['GET'])
def get_timetable_route():
    """Get timetable data including favorites and their states."""
    if 'email' not in session:
        return jsonify({'error': 'Not logged in', 'redirect': url_for('auth.index')}), 401

    try:
        timetable_data = get_timetable(session['email'])
        if timetable_data:

            return jsonify(timetable_data), 200
        return jsonify({'error': 'No timetable found'}), 404
    except Exception as e:
        print(f"Error in get_timetable_route: {str(e)}")
        return jsonify({'error': str(e)}), 500