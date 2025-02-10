from flask import Flask
from flask_mail import Mail
from itsdangerous import URLSafeTimedSerializer
import os

'''
from dotenv import load_dotenv
load_dotenv() 
'''

# Import blueprints
from static.backend.routes.auth_routes import auth
from static.backend.routes.timetable_routes import timetable
from static.backend.routes.contact_routes import contact
from static.backend.routes.error_routes import errors
from static.backend.routes.static_routes import static_pages
from static.backend.routes.savetb_routes import savetb_routes


app = Flask(__name__)
app.secret_key = 'McKowcen'

# Flask-Mail configuration for MailerSend
app.config.update(
    MAIL_SERVER='smtp.mailersend.net',
    MAIL_PORT=587,
    MAIL_USE_SSL=False,
    MAIL_USE_TLS=True,
    MAIL_USERNAME='MS_tIQz9x@trial-3yxj6ljrjo04do2r.mlsender.net',
    MAIL_PASSWORD='aH5WqyQRp0ayTkJR',
    MAIL_DEFAULT_SENDER=('ORESS System', 'MS_tIQz9x@trial-3yxj6ljrjo04do2r.mlsender.net')
)

mail = Mail(app)
serializer = URLSafeTimedSerializer(app.secret_key)

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

if __name__ == '__main__':
    app.run(debug=True)
