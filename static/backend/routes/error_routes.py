"""


"""

from flask import Blueprint, render_template

errors = Blueprint('errors', __name__)

@errors.route('/404')
def page_not_found():
    return render_template('404.html')

@errors.errorhandler(404)
def handle_404(e):
    return render_template('404.html'), 404