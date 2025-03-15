"""
Routes for contact form
"""

from flask import Blueprint, flash, redirect, render_template, request, url_for
from ..mysql.auth_db import get_auth_db_connection, execute_query
from datetime import datetime

contact = Blueprint('contact', __name__)

@contact.route('/contact', methods=['GET', 'POST'])
def show_contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')
        
        try:
            connection = get_auth_db_connection()
            
            query = """
            INSERT INTO contacts (name, email, message, created_at) 
            VALUES (%s, %s, %s, %s)
            """
            
            execute_query(
                connection, 
                query, 
                (name, email, message, datetime.utcnow())
            )
            
            flash('Thank you for reaching out! We will get back to you soon.', 'success')
            
        except Exception as e:
            print(f"Error saving contact form: {str(e)}")
            flash('An error occurred. Please try again later.', 'error')
        finally:
            if 'connection' in locals() and connection.is_connected():
                connection.close()
                
        return redirect(url_for('contact.show_contact'))
    
    return render_template('contact.html')