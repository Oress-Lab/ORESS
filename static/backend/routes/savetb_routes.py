
"""

"""


from flask import Blueprint, request, jsonify
from ..mongodb.mongo import save_timetable, get_timetable, save_favorites, get_favorites, update_user_attributes, get_user_attributes

# Define the Blueprint
savetb_routes = Blueprint('savetb_routes', __name__)

@savetb_routes.route('/save_timetable', methods=['POST'])
def save_timetable_route():
    data = request.json
    email = data.get('email')
    timetable = data.get('timetable')

    if not email or not timetable:
        return jsonify({'success': False, 'message': 'Email and timetable are required'}), 400

    success = save_timetable(email, timetable)
    if success:
        return jsonify({'success': True, 'message': 'Timetable saved successfully'})
    else:
        return jsonify({'success': False, 'message': 'Failed to save timetable'}), 500

@savetb_routes.route('/get_timetable', methods=['GET'])
def get_timetable_route():
    email = request.args.get('email')

    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400

    timetable = get_timetable(email)
    return jsonify({'success': True, 'timetable': timetable})

@savetb_routes.route('/save_favorites', methods=['POST'])
def save_favorites_route():
    data = request.json
    email = data.get('email')
    favorites = data.get('favorites')

    if not email or not favorites:
        return jsonify({'success': False, 'message': 'Email and favorites are required'}), 400

    success = save_favorites(email, favorites)
    if success:
        return jsonify({'success': True, 'message': 'Favorites saved successfully'})
    else:
        return jsonify({'success': False, 'message': 'Failed to save favorites'}), 500

@savetb_routes.route('/get_favorites', methods=['GET'])
def get_favorites_route():
    email = request.args.get('email')

    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400

    favorites = get_favorites(email)
    return jsonify({'success': True, 'favorites': favorites})

@savetb_routes.route('/get_user_attributes', methods=['GET'])
def get_user_attributes_route():
    email = request.args.get('email')

    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400

    user_data = get_user_attributes(email)
    if user_data:
        return jsonify({'success': True, 'user_data': user_data})
    return jsonify({'success': False, 'message': 'User not found'}), 404

@savetb_routes.route('/update_user_attributes', methods=['POST'])
def update_user_attributes_route():
    data = request.json
    email = data.get('email')
    attributes = data.get('attributes')

    if not email or not attributes:
        return jsonify({'success': False, 'message': 'Email and attributes are required'}), 400

    success = update_user_attributes(email, attributes)
    if success:
        return jsonify({'success': True, 'message': 'User attributes updated successfully'})
    return jsonify({'success': False, 'message': 'Failed to update user attributes'}), 500
