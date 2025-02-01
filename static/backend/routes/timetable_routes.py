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

@timetable.route('/search', methods=['POST'])
def search():
    query = request.form.get('search_query', '').strip()
    campus = session.get('campus', 'main')
    
    if not query:
        return render_template('timetable.html', courses=[], selected_campus=campus)

    # Initialize base query parts
    course_filter = ""
    time_filter = ""
    params = []

    # Parse expert search query
    if '#' in query:
        # Split the query into parts
        parts = query.split()
        basic_terms = []
        days_constraint = None
        time_constraint = None

        for part in parts:
            if part.startswith('#'):
                # Handle days constraint (#MWF)
                days_constraint = part[1:]  # Remove # symbol
            elif ':' in part and part[0].isdigit():
                # Handle time constraint (8:00)
                time_constraint = part
            else:
                basic_terms.append(part)

        # Build the basic search part
        if basic_terms:
            course_terms = ' '.join(basic_terms)
            course_filter = "(course_code LIKE ? OR course_name LIKE ?)"
            params.extend(['%' + course_terms + '%', '%' + course_terms + '%'])

        # Add days constraint if present
        if days_constraint:
            if time_filter:
                time_filter += " AND "
            time_filter += "time LIKE ?"
            # Create pattern for days matching
            days_pattern = f"%{days_constraint} %"
            params.append(days_pattern)

        # Add time constraint if present
        if time_constraint:
            if time_filter:
                time_filter += " AND "
            time_filter += "time LIKE ?"
            params.append(f"%{time_constraint}%")
    else:
        # Regular search
        course_filter = "(course_code LIKE ? OR course_name LIKE ?)"
        params = ['%' + query + '%', '%' + query + '%']

    # Build the final SQL query
    sql_query = "SELECT * FROM courses"
    where_clauses = []
    if course_filter:
        where_clauses.append(course_filter)
    if time_filter:
        where_clauses.append(time_filter)
    if where_clauses:
        sql_query += " WHERE " + " AND ".join(where_clauses)

    semester, year = get_current_semester()
    # Execute query
    conn = get_db_connection(campus, semester, year)
    courses = conn.execute(sql_query, params).fetchall()
    conn.close()

    # Convert courses to list of dictionaries
    course_list = []
    for course in courses:
        course_list.append({
            'course_code': course['course_code'],
            'course_name': course['course_name'],
            'time': course['time'],
            'instructor': course['instructor'],
            'room': course['room'],
            'prerequisite': course['prerequisite'],
        })

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(course_list)
    else:
        return render_template('timetable.html', 
                             courses=course_list, 
                             selected_campus=campus)
