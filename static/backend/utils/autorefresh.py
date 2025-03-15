import logging
from datetime import datetime
from ..mysql.timetable_db import get_db_connection, execute_query, close_connection

def get_available_semesters_years():
    """Get list of available semester/year combinations from courses database"""
    conn = None
    try:
        # Connect to courses database specifically
        conn = get_db_connection(for_courses=True)
        
        # Get all tables in the format campus_semester_year
        query = "SHOW TABLES"
        tables = execute_query(conn, query)
        
        # Extract semester and year from table names
        semester_years = []
        for table in tables:
            table_name = list(table.values())[0]
            parts = table_name.split('_')
            if len(parts) >= 3:
                # Format: campus_semester_year
                semester = parts[1].lower()
                year = parts[2]
                semester_year = f"{semester}_{year}"
                if semester_year not in semester_years:
                    semester_years.append(semester_year)
        
        # Define semester order: fall, spring, summer
        def semester_order(semester):
            if semester == 'fall':
                return 0
            elif semester == 'spring':
                return 1
            elif semester == 'summer':
                return 2
            else:
                return 3
        
        # Sort by year (descending) and then by semester in the specified order
        semester_years.sort(key=lambda x: (
            -int(x.split('_')[1]),  # Year descending
            semester_order(x.split('_')[0])  # Semester order: fall, spring, summer
        ))
        
        return semester_years
        
    except Exception as e:
        logging.error(f"Error fetching available semesters and years: {str(e)}")
        return []
    finally:
        if conn and hasattr(conn, 'is_connected') and conn.is_connected():
            close_connection(conn)

def get_current_semester_year():
    """Get current semester and year"""
    conn = None
    try:
        # Connect to courses database
        conn = get_db_connection(for_courses=True)
        
        # Get all tables in the format campus_semester_year
        query = "SHOW TABLES"
        tables = execute_query(conn, query)
        
        # Extract semester and year from table names and sort
        semester_years = []
        for table in tables:
            table_name = list(table.values())[0]
            parts = table_name.split('_')
            if len(parts) >= 3:
                # Format: campus_semester_year
                semester = parts[1].lower()
                year = parts[2]
                semester_years.append((semester, year))
        
        # Sort by year (descending) and then by semester
        semester_years.sort(key=lambda x: (
            -int(x[1]),  # Year descending
            0 if x[0] == 'fall' else 1 if x[0] == 'summer' else 2  # Semester order
        ))
        
        if semester_years:
            return semester_years[0]
        return 'fall', '2024'  # Default fallback
        
    except Exception as e:
        logging.error(f"Error getting current semester/year: {str(e)}")
        return 'fall', '2024'  # Default fallback
    finally:
        if conn and hasattr(conn, 'is_connected') and conn.is_connected():
            close_connection(conn)
