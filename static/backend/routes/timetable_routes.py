"""
Timetable routes for handling course search and display
"""

import os
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

@timetable.route('/get_session')
def get_session():
    """Get current session information for the frontend"""
    campus = session.get('campus', 'main')
    semester_year = session.get('semester_year', None)
    
    if not semester_year:
        current_semester, current_year = get_current_semester()
        semester_year = f"{current_semester.lower()}_{current_year}"
        session['semester_year'] = semester_year
    
    semester, year = semester_year.split('_')
    return jsonify({
        'campus': campus,
        'semester': semester,
        'year': year
    })

@timetable.route('/timetable')
def show_timetable():
    campus = session.get('campus', 'main')
    semester_year = session.get('semester_year', None)

    if not semester_year:
        current_semester, current_year = get_current_semester()
        semester_year = f"{current_semester.lower()}_{current_year}"
        session['semester_year'] = semester_year

    semester, year = semester_year.split('_')
    
    try:
        # Connect to MongoDB
        client, db = get_db_connection(campus, semester, year)
        courses_collection = get_courses_collection(db)
        
        # Get all courses
        courses = list(courses_collection.find({}))
        
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
        
        # Get available semesters from MongoDB
        available_semesters_years = []
        dbs = client.list_database_names()
        for db_name in dbs:
            # Parse database names in format: campus_semester_year
            parts = db_name.split('_')
            if len(parts) == 3 and parts[0] in ['main', 'north_lebanon', 'shouf']:
                campus_name, semester_name, year = parts
                available_semesters_years.append((semester_name.capitalize(), int(year)))
        
        # Sort semesters/years in descending order
        available_semesters_years = sorted(
            available_semesters_years,
            key=lambda x: (x[1], ['Spring', 'Summer', 'Fall'].index(x[0])),
            reverse=True
        )
        
        return render_template(
            'timetable.html',
            course_positions=course_positions,
            selected_campus=campus,
            selected_semester_year=semester_year,
            available_semesters_years=available_semesters_years,
            semester=semester.capitalize(),
            year=year
        )
    
    except Exception as e:
        print(f"Error in show_timetable: {str(e)}")
        return render_template(
            'timetable.html',
            course_positions=[],
            selected_campus=campus,
            selected_semester_year=semester_year,
            available_semesters_years=[],
            semester=semester.capitalize(),
            year=year,
            error="Failed to load timetable"
        )
    finally:
        if 'client' in locals():
            close_connection(client)

@timetable.route('/get_course/<crn>')
def get_course(crn):
    try:
        # Validate CRN
        if not crn or crn == 'null' or not str(crn).strip():
            return jsonify({'error': 'Invalid CRN provided'}), 400

        # Get session info from query parameters or session
        campus = request.args.get('campus') or session.get('campus', 'main')
        semester = request.args.get('semester') or session.get('semester')
        year = request.args.get('year') or session.get('year')

        # Clean and validate parameters
        campus = str(campus).lower().strip()
        semester = str(semester).lower().strip()
        year = str(year).strip()
        crn = str(crn).strip()

        print(f"Searching for course: CRN={crn}, Campus={campus}, Semester={semester}, Year={year}")

        # Connect to the database
        try:
            client, db = get_db_connection(campus, semester, year)
            print(f"Connected to database: {db.name}")
        except Exception as e:
            print(f"Database connection error: {str(e)}")
            return jsonify({'error': 'Database connection failed'}), 500

        courses_collection = get_courses_collection(db)
        
        # Find course by CRN
        try:
            # Try exact match first
            course = courses_collection.find_one(
                {'crn': crn},
                {
                    '_id': 0,
                    'crn': 1,
                    'course_code': 1,
                    'course_name': 1,
                    'time': 1,
                    'room': 1,
                    'instructor': 1,
                    'prerequisite': 1,
                    'section': 1
                }
            )
            
            if not course:
                # Try case-insensitive match
                course = courses_collection.find_one(
                    {'crn': {'$regex': f'^{crn}$', '$options': 'i'}},
                    {
                        '_id': 0,
                        'crn': 1,
                        'course_code': 1,
                        'course_name': 1,
                        'time': 1,
                        'room': 1,
                        'instructor': 1,
                        'prerequisite': 1,
                        'section': 1
                    }
                )
            
            print(f"Course found: {course}")
            
        except Exception as e:
            print(f"Database query error: {str(e)}")
            return jsonify({'error': 'Database query failed'}), 500
        
        if not course:
            # Try searching in other semesters
            try:
                dbs = client.list_database_names()
                for db_name in dbs:
                    if db_name.startswith(f'{campus}_'):
                        print(f"Searching in database: {db_name}")
                        db = client[db_name]
                        courses_collection = get_courses_collection(db)
                        course = courses_collection.find_one(
                            {'crn': {'$regex': f'^{crn}$', '$options': 'i'}},
                            {
                                '_id': 0,
                                'crn': 1,
                                'course_code': 1,
                                'course_name': 1,
                                'time': 1,
                                'room': 1,
                                'instructor': 1,
                                'prerequisite': 1,
                                'section': 1
                            }
                        )
                        if course:
                            # Extract semester info from db_name
                            parts = db_name.split('_')
                            if len(parts) >= 3:
                                course.update({
                                    'campus': parts[0],
                                    'semester': parts[1],
                                    'year': parts[2]
                                })
                            print(f"Course found in {db_name}: {course}")
                            break
            except Exception as e:
                print(f"Error searching other databases: {str(e)}")
                return jsonify({'error': 'Error searching course in other semesters'}), 500
        
        if course:
            if 'campus' not in course:
                course.update({
                    'campus': campus,
                    'semester': semester,
                    'year': year
                })
            return jsonify(course)
        
        print(f"Course not found: CRN={crn}")
        return jsonify({'error': f'Course with CRN {crn} not found'}), 404
        
    except Exception as e:
        print(f"Error in get_course: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@timetable.route('/search')
def search():
    query = request.args.get('query', '').strip()
    campus = request.args.get('campus', 'main')
    semester = request.args.get('semester', 'Fall').lower()
    current_semester, current_year = get_current_semester()
    year = request.args.get('year', str(current_year))

    if not query:
        return jsonify({'courses': []})

    try:
        # Connect to MongoDB
        client, db = get_db_connection(campus, semester, year)
        courses_collection = get_courses_collection(db)
        
        # Check if query is numeric (CRN)
        search_conditions = [
            {'course_code': {'$regex': query, '$options': 'i'}},
            {'course_name': {'$regex': query, '$options': 'i'}},
            {'instructor': {'$regex': query, '$options': 'i'}}
        ]
        
        # Add CRN search if query is numeric
        if query.isdigit():
            search_conditions.append({'crn': int(query)})
        
        # Search using MongoDB's query
        search_query = {'$or': search_conditions}
        
        # Include CRN in the returned fields
        courses = list(courses_collection.find(
            search_query,
            {
                '_id': 0,
                'crn': 1,
                'course_code': 1,
                'course_name': 1,
                'time': 1,
                'room': 1,
                'instructor': 1,
                'prerequisite': 1,
                'section': 1
            }
        ).limit(50))
        
        # Add session info to each course
        for course in courses:
            course.update({
                'campus': campus,
                'semester': semester,
                'year': year
            })
        
        return jsonify({'courses': courses})
        
    except Exception as e:
        print(f"Error in search: {str(e)}")
        return jsonify({'error': 'An error occurred while searching courses'}), 500
    
    finally:
        if 'client' in locals():
            close_connection(client)