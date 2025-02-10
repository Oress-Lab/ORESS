"""

"""

from flask import Blueprint, render_template

static_pages = Blueprint('static_pages', __name__)

@static_pages.route('/logout')
def logout():
    return render_template('logout.html')

@static_pages.route('/about')
def about():
    return render_template('about.html')

@static_pages.route('/help')
def help():
    return render_template('help.html')