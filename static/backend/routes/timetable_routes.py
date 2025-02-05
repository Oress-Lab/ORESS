"""


"""

import os
import re

from flask import Blueprint, jsonify, redirect, render_template, request, session, url_for
from ..utils.db import get_db_connection
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
    campus = session.get('campus', 'main')
    semester_year = session.get('semester_year', None)

    # Get all available database files
    db_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'db')
    db_files = [f for f in os.listdir(db_dir) if f.endswith('.db')]

    # Extract campus, semester, and year from filenames
    available_semesters_years = set()
    for db_file in db_files:
        match = re.match(r'^(main|north|shouf)_(spring|summer|fall)_(\d{4})\.db$', db_file.lower())
        if match:
            campus_name, semester, year = match.groups()
            available_semesters_years.add((semester.capitalize(), int(year)))

    # Sort semesters/years in descending order
    available_semesters_years = sorted(available_semesters_years, key=lambda x: (x[1], ['Spring', 'Summer', 'Fall'].index(x[0])), reverse=True)

    # If no semester/year is selected, use the latest one
    if not semester_year and available_semesters_years:
        semester, year = available_semesters_years[0]
        semester_year = f"{semester.lower()}_{year}"
        session['semester_year'] = semester_year

    # Fetch courses for the selected semester and year
    conn = get_db_connection(campus, *semester_year.split('_')) if semester_year else None
    courses = conn.execute("SELECT * FROM courses").fetchall() if conn else []
    if conn:
        conn.close()

    # Parse course times and prepare data for the template
    course_positions = []
    for course in courses:
        days, (start_time, end_time) = parse_time_field(course['time'])
        if start_time:
            start_hour = start_time.split(':')[0]
            for day in days:
                slot_id = f"{day}-{start_hour}"
                course_positions.append({
                    'slot_id': slot_id,
                    'course_code': course['course_code'],
                    'start_hour': start_time,
                    'end_hour': end_time,
                })

    return render_template(
        'timetable.html',
        course_positions=course_positions,
        selected_campus=campus,
        selected_semester_year=semester_year,
        available_semesters_years=available_semesters_years,
        semester=semester_year.split('_')[0].capitalize() if semester_year else "N/A",
        year=semester_year.split('_')[1] if semester_year else "N/A"
    )

@timetable.route('/search')
def search():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({'courses': []})

    try:
        # Get current campus and semester from session
        campus = session.get('campus', 'main')
        semester_year = session.get('semester_year', None)
        
        if not semester_year:
            # Get the latest semester if none selected
            db_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'db')
            db_files = [f for f in os.listdir(db_dir) if f.endswith('.db')]
            available_semesters_years = []
            
            for db_file in db_files:
                match = re.match(r'^(main|north|shouf)_(spring|summer|fall)_(\d{4})\.db$', db_file.lower())
                if match:
                    campus_name, semester, year = match.groups()
                    available_semesters_years.append((semester, year))
            
            if available_semesters_years:
                semester, year = sorted(available_semesters_years, key=lambda x: (x[1], ['spring', 'summer', 'fall'].index(x[0])), reverse=True)[0]
                semester_year = f"{semester}_{year}"

        if semester_year:
            semester, year = semester_year.split('_')
            conn = get_db_connection(campus, semester, year)
            
            try:
                cursor = conn.cursor()
                
                # Search in multiple fields with LIKE
                search_query = f"%{query}%"
                cursor.execute("""
                    SELECT course_code, course_name, time, room, instructor, prerequisite
                    FROM courses 
                    WHERE course_code LIKE ? 
                    OR course_name LIKE ? 
                    OR instructor LIKE ?
                    LIMIT 50
                """, (search_query, search_query, search_query))
                
                courses = []
                for row in cursor.fetchall():
                    courses.append({
                        'course_code': row['course_code'],
                        'course_name': row['course_name'],
                        'time': row['time'],
                        'room': row['room'],
                        'instructor': row['instructor'],
                        'prerequisite': row['prerequisite']
                    })
                
                return jsonify({'courses': courses})
            
            finally:
                conn.close()
        
        return jsonify({'courses': []})
        
    except Exception as e:
        print(f"Error in search: {str(e)}")
        return jsonify({'error': 'An error occurred while searching courses'}), 500