"""


"""

from flask_mail import Message
from flask import current_app
import logging
from itsdangerous import URLSafeTimedSerializer


def send_verification_email(mail, email, token, url_for):
    """
    Send a verification email to the user.
    
    Args:
        mail: Flask-Mail instance
        email (str): Recipient's email address
        token (str): Verification token
        url_for: Flask's url_for function
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Generate confirmation URL
        confirm_url = url_for('auth.confirm_email', token=token, _external=True)
        
        # Create message
        msg = Message(
            subject='Confirm Your Email',
            recipients=[email],
            body=f'''
            Thank you for signing up! Please click the following link to verify your email:
            
            {confirm_url}
            
            If you did not sign up for this account, please ignore this email.
            ''',
            html=f'''
            <h3>Thank you for signing up!</h3>
            <p>Please click the following link to verify your email:</p>
            <p><a href="{confirm_url}">Click here to verify your email</a></p>
            <p>If you did not sign up for this account, please ignore this email.</p>
            '''
        )
        
        # Send email
        mail.send(msg)
        return True
        
    except Exception as e:
        logging.error(f"Failed to send verification email to {email}: {str(e)}")
        return False

def generate_verification_token(email):
    """
    Generate a timed token for email verification.
    
    Args:
        email (str): User's email address
    
    Returns:
        str: Generated token
    """
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='email-confirm-salt')
    
def send_forgotten_password_verification_email(mail, email, code):
    msg = Message(
        "Password Reset Verification Code", 
        sender="noreply@yourdomain.com", 
        recipients=[email]
    )
    msg.body = f"Your password reset verification code is: {code}"
    mail.send(msg)