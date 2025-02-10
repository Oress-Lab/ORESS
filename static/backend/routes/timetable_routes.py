"""
Timetable routes for course management and search functionality
"""

from flask import Blueprint, jsonify, redirect, render_template, request, session, url_for
from ..mongodb.db import get_db_connection, get_courses_collection, close_connection
from ..utils.time_parser import parse_time_field, get_current_semester

timetable = Blueprint('timetable', __name__)

@timetable.route('/change_campus', methods=['POST'])
def change_campus():
    selected_campus = request.form.get('campus')
    session['campus'] = selected_campus
    return redirect(url_for('timetable.show_timetable'))

@timetable.route('/change_semester', methods=['POST'])
def change_semester():
    selected_semester_year = request.form.get('semester_year')
    session['semester_year'] = selected_semester_year
    return redirect(url_for('timetable.show_timetable'))

@timetable.route('/timetable')
def show_timetable():
    client = None
    try:
        campus = session.get('campus', 'main')
        semester_year = session.get('semester_year', None)

        # Get the current semester and year if not set
        if not semester_year:
            current_semester, current_year = get_current_semester()
            semester_year = f"{current_semester.lower()}_{current_year}"
            session['semester_year'] = semester_year

        # Parse semester and year
        semester, year = semester_year.split('_')
        
        # Connect to MongoDB
        client, db = get_db_connection(campus, semester, year)
        courses_collection = get_courses_collection(db)

        # Get unique semesters and years from the database
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "semester": "$semester",
                        "year": "$year"
                    }
                }
            },
            {
                "$sort": {
                    "_id.year": -1,
                    "_id.semester": -1
                }
            }
        ]
        available_semesters_years = [(
            doc["_id"]["semester"], doc["_id"]["year"]
            ) 
            for doc in courses_collection.aggregate(pipeline)
        ]

        # Fetch courses for the selected semester and year
        courses = list(courses_collection.find(
            {
                "semester": semester, "year": int(year)
            },
            {
                "_id": 0,
                "crn": 1,
                "course_code": 1,
                "course_name": 1,
                "instructor": 1,
                "time": 1,
                "room": 1,
                "section": 1,
                "semester": 1,
                "year": 1,
                "credits": 1,
                "prerequisite": 1
            }
        ))

        # Parse course times and prepare data for the template
        course_positions = []
        for course in courses:
            if course.get('time'):
                parsed_times = parse_time_field(course['time'])
                for time_slot in parsed_times:
                    course_positions.append({
                        'course': course,
                        'position': time_slot
                    })

        return render_template(
            'timetable.html',
            course_positions=course_positions,
            campus=campus,
            current_semester_year=semester_year,
            available_semesters_years=available_semesters_years,
            semester=semester_year.split('_')[0].capitalize() if semester_year else "N/A",
            year=semester_year.split('_')[1] if semester_year else "N/A"
        )
    finally:
        if client is not None:
            close_connection(client)

@timetable.route('/api/timetable/get', methods=['GET'])
def get_timetable():
    client = None
    try:
        # Get session data
        campus = session.get('campus', 'main')
        semester_year = session.get('semester_year')
        
        if not semester_year:
            current_semester, current_year = get_current_semester()
            semester_year = f"{current_semester.lower()}_{current_year}"
        
        semester, year = semester_year.split('_')
        
        # Connect to MongoDB
        client, db = get_db_connection(campus, semester, year)
        courses_collection = get_courses_collection(db)
        
        # Get all courses for the current semester
        projection = {
            "_id": 0,
            "course_code": 1,
            "course_name": 1,
            "instructor": 1,
            "time": 1,
            "room": 1,
            "section": 1,
            "crn": 1,
            "credits": 1
        }
        
        courses = list(courses_collection.find({}, projection))
        return jsonify({"courses": courses, "semester": semester, "year": year, "campus": campus})
            
    except Exception as e:
        print(f"Error retrieving timetable: {str(e)}")
        return jsonify({"error": "An error occurred while retrieving the timetable"}), 500
    finally:
        if client:
            close_connection(client)

@timetable.route('/search', methods=['POST'])
def search():
    client = None
    try:
        # Get search parameters
        data = request.get_json()
        query = data.get('query', '').strip()
        
        # Get session data
        campus = session.get('campus', 'main')
        semester_year = session.get('semester_year')
        if not semester_year:
            current_semester, current_year = get_current_semester()
            semester_year = f"{current_semester.lower()}_{current_year}"
        
        semester, year = semester_year.split('_')
        
        # Connect to MongoDB
        client, db = get_db_connection(campus, semester, year)
        courses_collection = get_courses_collection(db)
        
        # Build MongoDB search query
        search_query = {
            "$or": [
                {"course_code": {"$regex": query, "$options": "i"}},
                {"course_name": {"$regex": query, "$options": "i"}},
                {"instructor": {"$regex": query, "$options": "i"}},
                {"crn": {"$regex": query, "$options": "i"}}
            ]
        }
        
        # Project only the fields we need
        projection = {
            "_id": 0,
            "course_code": 1,
            "course_name": 1,
            "instructor": 1,
            "time": 1,
            "room": 1,
            "section": 1,
            "crn": 1,
            "credits": 1,
            "prerequisite": 1
        }
        
        # Execute the query
        courses = list(courses_collection.find(search_query, projection))
        
        return jsonify({"courses": courses})
            
    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({"error": "An error occurred during search"}), 500
    finally:
        if client:
            close_connection(client)