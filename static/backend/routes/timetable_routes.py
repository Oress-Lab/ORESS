"""


"""


from flask import Blueprint, jsonify, redirect, render_template, request, session, url_for
from ..utils.db import get_db_connection
from ..utils.time_parser import parse_time_field

timetable = Blueprint('timetable', __name__)

@timetable.route('/change_campus', methods=['POST'])
def change_campus():
    selected_campus = request.form.get('campus')
    session['campus'] = selected_campus
    return redirect(url_for('timetable.show_timetable'))

@timetable.route('/timetable')
def show_timetable():
    campus = session.get('campus', 'main')
    conn = get_db_connection(campus)
    courses = conn.execute("SELECT * FROM courses").fetchall()
    semester_year = conn.execute("SELECT semester, year FROM courses LIMIT 1").fetchone()
    semester, year = semester_year if semester_year else ("N/A", "N/A")

    conn.close()

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
        semester=semester, 
        year=year
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

    # Execute query
    conn = get_db_connection(campus)
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