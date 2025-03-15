"""
Timetable routes for handling course search and display
"""

import os
from flask import Blueprint, jsonify, redirect, render_template, request, session, url_for, send_file, flash, current_app
from ..mysql.timetable_db import close_connection, get_db_connection, execute_query
from ..utils.time_parser import parse_time_field, get_current_semester
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
import io
from ..utils.autorefresh import get_available_semesters_years, get_current_semester_year
import logging

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

@timetable.route('/get_session')
def get_session():
    """Return current session data for AJAX requests"""
    return jsonify({
        'semester_year': session.get('semester_year', ''),
        'campus': session.get('campus', 'main')
    })

@timetable.route('/timetable')
def show_timetable():
    """Show the timetable page"""
    # Redirect to login if not logged in
    if 'user' not in session:
        return redirect(url_for('auth.index'))
    
    # Get available semesters and years from database
    available_semesters_years = get_available_semesters_years()
    
    # If no semester/year is set in session, set default to current
    if 'semester_year' not in session:
        current_semester, current_year = get_current_semester_year()
        session['semester_year'] = f"{current_semester.lower()}_{current_year}"
    
    # If no campus is set, default to main
    if 'campus' not in session:
        session['campus'] = 'main'
    
    # Extract semester and year for display
    semester_year = session.get('semester_year', 'fall_2024')
    parts = semester_year.split('_')
    semester = parts[0] if len(parts) > 0 else 'fall'
    year = parts[1] if len(parts) > 1 else '2024'
    
    return render_template(
        'timetable.html', 
        available_semesters_years=available_semesters_years,
        current_semester=semester,
        current_year=year
    )

@timetable.route('/set_semester_campus', methods=['POST'])
def set_semester_campus():
    """Set the selected semester, year and campus in session"""
    if request.method == 'POST':
        semester_year = request.form.get('semester_year')
        campus = request.form.get('campus')
        
        if semester_year:
            session['semester_year'] = semester_year
            
        if campus:
            session['campus'] = campus
            
        return redirect(url_for('timetable.show_timetable'))
    
    return redirect(url_for('timetable.show_timetable'))

@timetable.route('/get_course/<crn>')
def get_course(crn):
    connection = None
    try:
        # Validate CRN
        if not crn or crn == 'null' or not str(crn).strip():
            return jsonify({'error': 'Invalid CRN provided'}), 400

        # Get campus from session
        campus = request.args.get('campus') or session.get('campus', 'main')
        
        # Extract semester and year from semester_year session variable
        semester_year = session.get('semester_year', 'fall_2024')
        parts = semester_year.split('_')
        semester = parts[0] if len(parts) > 0 else 'fall'
        year = parts[1] if len(parts) > 1 else '2024'

        # Clean and validate parameters
        campus = str(campus).lower().strip()
        semester = str(semester).lower().strip()
        year = str(year).strip()
        crn = str(crn).strip()

        print(f"Searching for course: CRN={crn}, Campus={campus}, Semester={semester}, Year={year}")

        # Connect to the database
        try:
            connection, table_name = get_db_connection(campus, semester, year)
            print(f"Connected to database, using table: {table_name}")
        except Exception as e:
            print(f"Database connection error: {str(e)}")
            return jsonify({'error': 'Database connection failed'}), 500

        # Find course by CRN
        try:
            # Validate table_name to prevent SQL injection
            if not all(c.isalnum() or c == '_' for c in table_name):
                return jsonify({'error': 'Invalid table name format'}), 400
                
            query = f"SELECT crn, course_code, course_name, time, room, instructor, prerequisite, section FROM {table_name} WHERE crn = %s"
            courses = execute_query(connection, query, (crn,))
            
            if not courses:
                # Try case-insensitive search
                query = f"SELECT crn, course_code, course_name, time, room, instructor, prerequisite, section FROM {table_name} WHERE crn LIKE %s"
                courses = execute_query(connection, query, (f"%{crn}%",))
            
            if courses and len(courses) > 0:
                course = courses[0]
                course.update({
                    'campus': campus,
                    'semester': semester,
                    'year': year
                })
                return jsonify(course)
            
            # If not found, try searching in other tables
            tables_query = "SHOW TABLES LIKE %s"
            tables = execute_query(connection, tables_query, (f"{campus}_%",))
            
            for table in tables:
                table_name = list(table.values())[0]  # Get the table name
                
                # Validate table_name to prevent SQL injection
                if not all(c.isalnum() or c == '_' for c in table_name):
                    continue
                    
                if table_name != f"{campus}_{semester}_{year}":
                    query = f"SELECT crn, course_code, course_name, time, room, instructor, prerequisite, section FROM {table_name} WHERE crn = %s"
                    courses = execute_query(connection, query, (crn,))
                    
                    if courses and len(courses) > 0:
                        course = courses[0]
                        # Extract semester and year from table name
                        parts = table_name.split('_')
                        if len(parts) >= 3:
                            course.update({
                                'campus': parts[0],
                                'semester': parts[1],
                                'year': parts[2]
                            })
                        return jsonify(course)
            
            print(f"Course not found: CRN={crn}")
            return jsonify({'error': f'Course with CRN {crn} not found'}), 404
            
        except Exception as e:
            print(f"Database query error: {str(e)}")
            return jsonify({'error': 'Database query failed'}), 500
        finally:
            if connection:
                close_connection(connection)
        
    except Exception as e:
        print(f"Error in get_course: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

def ensure_course_indexes(connection, table_name):
    """Ensure that necessary indexes exist on the course table"""
    try:
        # Check if indexes exist
        index_query = f"SHOW INDEX FROM {table_name} WHERE Key_name IN ('idx_course_code', 'idx_course_name')"
        indexes = execute_query(connection, index_query)
        
        # Create indexes if they don't exist
        if not any(idx['Key_name'] == 'idx_course_code' for idx in indexes):
            logging.info(f"Creating index on course_code for {table_name}")
            create_index_query = f"CREATE INDEX idx_course_code ON {table_name} (course_code)"
            execute_query(connection, create_index_query)
            
        if not any(idx['Key_name'] == 'idx_course_name' for idx in indexes):
            logging.info(f"Creating index on course_name for {table_name}")
            create_index_query = f"CREATE INDEX idx_course_name ON {table_name} (course_name)"
            execute_query(connection, create_index_query)
            
        return True
    except Exception as e:
        logging.error(f"Error creating indexes: {str(e)}")
        return False

@timetable.route('/search', methods=['GET', 'POST'])
def search():
    conn = None
    try:
        # Get parameters from either form data (POST) or query string (GET)
        if request.method == 'POST':
            search_query = request.form.get('query', '')
        else:  # GET
            search_query = request.args.get('query', '')
        
        # Get campus, semester, and year from session
        campus = session.get('campus', 'main')
        
        # Extract semester and year from semester_year session variable
        semester_year = session.get('semester_year', 'fall_2024')
        parts = semester_year.split('_')
        semester = parts[0] if len(parts) > 0 else 'fall'
        year = parts[1] if len(parts) > 1 else '2024'
        
        # Override with request parameters if provided
        if request.method == 'GET':
            campus_param = request.args.get('campus')
            semester_param = request.args.get('semester')
            year_param = request.args.get('year')
            
            if campus_param:
                campus = campus_param.lower()
            if semester_param:
                semester = semester_param.lower()
            if year_param:
                year = year_param
        
        # Connect to courses database
        conn = get_db_connection(for_courses=True)
        
        # Construct table name from parameters
        table_name = f"{campus.lower()}_{semester.lower()}_{year}"
        
        # Validate table_name to prevent SQL injection
        if not all(c.isalnum() or c == '_' for c in table_name):
            return jsonify({"success": False, "error": "Invalid table name format"}), 400
        
        # Check if the table exists
        check_query = f"SHOW TABLES LIKE '{table_name}'"
        tables = execute_query(conn, check_query)
        
        if not tables:
            return jsonify({"success": False, "error": f"No courses found for {campus} {semester} {year}"}), 404
        
        # Ensure indexes exist for faster searching
        ensure_course_indexes(conn, table_name)
        
        if not search_query:
            # Get all courses from the table
            query = f"SELECT * FROM {table_name}"
            params = ()
        else:
            # Search with query
            query = f"""
                SELECT * FROM {table_name} 
                WHERE (course_code LIKE %s OR course_name LIKE %s)
            """
            search_param = f"%{search_query}%"
            params = (search_param, search_param)

        results = execute_query(conn, query, params)
        
        # Return JSON response for AJAX requests
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.method == 'GET':
            return jsonify({
                "success": True,
                "courses": results
            })
        
        # Redirect for form submissions
        return redirect(url_for('timetable.show_timetable'))

    except Exception as e:
        logging.error(f"Error in search: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if conn and hasattr(conn, 'is_connected') and conn.is_connected():
            close_connection(conn)

@timetable.route('/download_timetable_pdf')
def download_timetable_pdf():
    """Endpoint for downloading timetable as PDF"""
    # This would typically generate a PDF file
    # For now, we'll just return a message
    return jsonify({'message': 'PDF download functionality will be implemented soon'})

@timetable.route('/download_timetable', methods=['POST'])
def download_timetable():
    """Generate and download timetable as PDF"""
    try:
        # Get timetable data from request
        timetable_data = request.json
        
        # Create a BytesIO buffer for the PDF
        buffer = io.BytesIO()
        
        # Create the PDF object using reportlab
        c = canvas.Canvas(buffer, pagesize=landscape(A4))
        width, height = landscape(A4)
        
        # Draw grid lines and headers
        c.setStrokeColor(colors.grey)
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 12)
        
        # Draw days header
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        day_width = width / 5
        for i, day in enumerate(days):
            x = i * day_width + 10
            c.drawString(x, height - 30, day)
        
        # Draw time slots
        times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
                '14:00', '15:00', '16:00', '17:00']
        time_height = (height - 50) / len(times)
        
        for i, time in enumerate(times):
            y = height - 50 - (i * time_height)
            c.drawString(10, y, time)
            # Draw horizontal lines
            c.line(50, y, width - 50, y)
        
        # Draw courses from timetable_data
        if 'courses' in timetable_data:
            for course in timetable_data['courses']:
                # Draw course blocks based on their time and day
                # Implementation depends on your data structure
                pass
        
        # Save PDF
        c.save()
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='timetable.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500