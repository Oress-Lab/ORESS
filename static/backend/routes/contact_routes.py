"""

"""

from flask import Blueprint, flash, redirect, render_template, request, url_for
from ..mongodb.mongo import get_database

contact = Blueprint('contact', __name__)

@contact.route('/contact', methods=['GET', 'POST'])
def show_contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')
        
        db = get_database()
        contacts = db['contacts']
        contacts.insert_one({
            'name': name,
            'email': email,
            'message': message
        })
        
        flash('Thank you for reaching out! We will get back to you soon.', 'success')
        return redirect(url_for('contact.show_contact'))
    
    return render_template('contact.html')