from flask import Flask
from flask_mail import Mail
from itsdangerous import URLSafeTimedSerializer
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import blueprints
from static.backend.routes.auth_routes import auth
from static.backend.routes.timetable_routes import timetable
from static.backend.routes.contact_routes import contact
from static.backend.routes.error_routes import errors
from static.backend.routes.static_routes import static_pages
from static.backend.routes.savetb_routes import savetb_routes

# Set a fixed secret key for development (in production, use environment variable)
FIXED_SECRET_KEY = "ORESS-super-secret-key-123456789"

app = Flask(__name__)
app.config['SECRET_KEY'] = FIXED_SECRET_KEY
app.secret_key = FIXED_SECRET_KEY

# Configure session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'oress_'

# Flask-Mail configuration for Mailtrap
mail_config = {
    'MAIL_SERVER': os.getenv('SMTP_SERVER', 'sandbox.smtp.mailtrap.io'),
    'MAIL_PORT': int(os.getenv('SMTP_PORT', 2525)),
    'MAIL_USE_SSL': False,
    'MAIL_USE_TLS': True,
    'MAIL_USERNAME': os.getenv('SMTP_USERNAME'),
    'MAIL_PASSWORD': os.getenv('EMAIL_PASSWORD'),
    'MAIL_DEFAULT_SENDER': (
        'ORESS System', 
        os.getenv('EMAIL_ADDRESS', 'noreply@oress.com')
    ),
    'MAIL_DEBUG': True,
    'MAIL_SUPPRESS_SEND': False
}

# Log mail configuration (without sensitive data)
import logging
logging.info(f"Mail configuration: SERVER={mail_config['MAIL_SERVER']}, PORT={mail_config['MAIL_PORT']}")

app.config.update(mail_config)

mail = Mail(app)

# Create serializer with the fixed secret key
serializer = URLSafeTimedSerializer(FIXED_SECRET_KEY)

# Register blueprints
app.register_blueprint(auth)
app.register_blueprint(timetable)
app.register_blueprint(contact)
app.register_blueprint(errors)
app.register_blueprint(static_pages)
app.register_blueprint(savetb_routes)

# Make mail and serializer available globally
app.extensions['mail'] = mail
app.extensions['serializer'] = serializer

# Add session debugging
@app.before_request
def log_request_info():
    import logging
    from flask import request, session
    logging.info(f"Request path: {request.path}, Session: {session}")

if __name__ == '__main__':
    app.run(debug=True)
