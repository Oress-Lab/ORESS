"""


"""

from flask import Blueprint, flash, redirect, render_template, request, url_for, current_app, session, jsonify
from ..utils.email import send_verification_email, send_forgotten_password_verification_email, generate_verification_token
from ..mysql.auth_db import add_user, verify_email, generate_reset_code, verify_reset_code, update_password, get_auth_db_connection, execute_query
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import uuid
import hashlib
from dotenv import load_dotenv

auth = Blueprint('auth', __name__)

# Store verification codes in memory (in production, use a database)
verification_codes = {}

def generate_verification_code(email):
    """Generate a simple verification code for an email"""
    # Create a unique code
    code = str(uuid.uuid4())[:8]
    # Store it with the email
    verification_codes[code] = email
    return code

def send_verification_email(email, code):
    """Send verification email using direct SMTP connection"""
    # Load environment variables
    load_dotenv()
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = "ORESS System <no-reply@oress.com>"
        msg['To'] = email
        msg['Subject'] = 'Verify Your Email Address'
        
        # Create verification link using the code
        verify_url = url_for('auth.verify_code', code=code, _external=True)
        
        # Create HTML body
        html = f'''
        <html>
        <body>
            <h2>Email Verification</h2>
            <p>Thank you for registering! Please click the link below to verify your email address:</p>
            <p><a href="{verify_url}">Verify Email</a></p>
            <p>If you did not register for this account, please ignore this email.</p>
        </body>
        </html>
        '''
        
        # Attach HTML body
        msg.attach(MIMEText(html, 'html'))
        
        # Connect to SMTP server
        smtp_host = os.getenv('SMTP_HOST', 'sandbox.smtp.mailtrap.io')
        smtp_port = int(os.getenv('SMTP_PORT', '2525'))
        smtp_user = os.getenv('SMTP_USER')
        smtp_pass = os.getenv('SMTP_PASS')
        
        # Validate SMTP credentials exist
        if not smtp_user or not smtp_pass:
            logging.error("SMTP credentials not configured. Check environment variables.")
            return False
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        
        # Login with credentials from environment variables
        server.login(smtp_user, smtp_pass)
        
        # Send email
        server.send_message(msg)
        server.quit()
        
        logging.info(f"Verification email sent successfully to {email}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to send verification email to {email}: {str(e)}")
        return False

@auth.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        action = request.form.get('action')
        email = request.form.get('email')
        password = request.form.get('password')

        print(f"Received email: {email}")
        print(f"Received password: {password}")
        print(f"Received action: {action}")

        if not email or not password:
            flash('Email and password are required.', 'error')
            return redirect(url_for('auth.index', active_card='signup' if action == 'signup' else 'login'))

        email = email.strip()
        
        if not (email.lower().endswith('@ndu.edu.lb') or email.lower().endswith('@ndu.edu')):
            flash('Only @ndu.edu.lb or @ndu.edu email addresses are allowed.', 'error')
            return redirect(url_for('auth.index', active_card='signup' if action == 'signup' else 'login'))

        if action == 'signup':
            try:
                # Get confirm password
                confirm_password = request.form.get('confirm_password')
                
                # Check if passwords match
                if password != confirm_password:
                    flash('Passwords do not match.', 'error')
                    return redirect(url_for('auth.index', active_card='signup'))
                
                # Check password strength
                if (len(password) < 8 or 
                    not any(c.isdigit() for c in password) or 
                    not any(c.islower() for c in password) or 
                    not any(c.isupper() for c in password)):
                    flash('Password must be at least 8 characters long and contain at least one number, one lowercase and one uppercase letter.', 'error')
                    return redirect(url_for('auth.index', active_card='signup'))

                # Hash password before storing
                hashed_password = generate_password_hash(password)
                
                # Add user to database with hashed password
                if add_user(email.lower(), hashed_password):
                    # Generate verification code
                    code = generate_verification_code(email.lower())
                    
                    # Send verification email
                    if send_verification_email(email, code):
                        flash('Account created! Please check your email to verify.', 'success')
                    else:
                        flash('Account created but verification email failed to send. Please contact support.', 'error')
                    return redirect(url_for('auth.index', active_card='login'))
                else:
                    flash('Account already exists. Please log in.', 'error')
                    return redirect(url_for('auth.index', active_card='login'))
                    
            except Exception as e:
                logging.error(f"Signup failed for {email}: {str(e)}")
                flash('An error occurred during signup. Please try again.', 'error')
                return redirect(url_for('auth.index', active_card='signup'))
                
        elif action == 'login':
            try:
                # Get database connection
                connection = get_auth_db_connection()
                
                # Check if user exists and is verified
                query = """
                    SELECT * FROM users 
                    WHERE email = %s 
                    AND verified = TRUE
                """
                users = execute_query(connection, query, (email,))
                
                if users and len(users) > 0:
                    # Verify password
                    stored_password = users[0]['password']
                    if check_password_hash(stored_password, password):
                        # Set multiple session variables for better tracking
                        session['user'] = email
                        session['user_email'] = email
                        session['logged_in'] = True
                        session['user_id'] = users[0]['id']
                        
                        logging.info(f"User {email} logged in successfully. Session: {session}")
                        flash('Login successful!', 'success')
                        return redirect(url_for('timetable.show_timetable'))
                    else:
                        flash('Invalid email or password.', 'login_error')
                else:
                    # Check if user exists but isn't verified
                    verify_query = "SELECT verified FROM users WHERE email = %s"
                    result = execute_query(connection, verify_query, (email,))
                    
                    if result and len(result) > 0 and not result[0]['verified']:
                        flash('Please verify your email before logging in.', 'login_error')
                    else:
                        flash('Invalid email or password.', 'login_error')
                    
                return redirect('/')
                
            except Exception as e:
                logging.error(f"Login error: {str(e)}")
                flash('An error occurred during login. Please try again.', 'login_error')
                return redirect('/')
            finally:
                if 'connection' in locals() and connection.is_connected():
                    connection.close()
            
        return redirect(url_for('auth.index'))

    return render_template('index.html')

@auth.route('/verify_code/<code>')
def verify_code(code):
    try:
        # Check if code exists in our verification codes
        if code in verification_codes:
            email = verification_codes[code]
            logging.info(f"Found verification code for email: {email}")
            
            # Update user's verified status
            if verify_email(email):
                # Remove the code after successful verification
                verification_codes.pop(code, None)
                logging.info(f"Successfully verified email for {email}")
                return render_template('verification_success.html')
            else:
                logging.error(f"Database update failed for {email}")
                return render_template('verification_failed.html')
        else:
            logging.error(f"Invalid verification code: {code}")
            return render_template('verification_failed.html')
            
    except Exception as e:
        logging.error(f"Verification error: {str(e)}")
        return render_template('verification_failed.html')

@auth.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    
    if request.method == 'POST':
        email = request.form.get('email').strip().lower()

        mail = current_app.extensions['mail']
        
        if get_auth_db_connection().execute_query("SELECT * FROM users WHERE email = %s", (email,)):
            reset_code = generate_reset_code(email)
            send_forgotten_password_verification_email(mail, email, reset_code)
            flash('A verification code has been sent to your email.', 'forgot_password_info')
            
        else:
            flash('No account associated with this email.', 'forgot_password_error')
            
        return redirect(url_for('auth.forgot_password'))
    
    return render_template('forgot_password.html')

@auth.route('/reset_password', methods=['POST'])
def reset_password():
    email = request.form.get('email')
    code = request.form.get('security-code')  # Match the form field name
    new_password = request.form.get('password')
    
    # Log received data (excluding password)
    logging.info(f"Reset password attempt for email: {email}")
    
    # Input validation
    if not all([email, code, new_password]):
        flash('All fields are required.', 'reset_password_error')
        return redirect(url_for('auth.forgot_password'))
    
    # Clean the input
    email = email.strip().lower()
    
    if verify_reset_code(email, code):
        # Make sure password isn't empty
        if len(new_password) < 1:
            flash('Password cannot be empty.', 'reset_password_error')
            return redirect(url_for('auth.forgot_password'))
            
        if update_password(email, new_password):
            flash('Your password has been reset successfully. You can now log in.', 'reset_password_success')
            logging.info(f"Password successfully reset for email: {email}")
        else:
            flash('Error updating password. Please try again.', 'reset_password_error')
            logging.error(f"Failed to update password for email: {email}")
    else:
        flash('Invalid email or verification code.', 'reset_password_error')
        logging.warning(f"Invalid reset code attempt for email: {email}")
    
    return redirect(url_for('auth.forgot_password'))

@auth.route('/get_current_user', methods=['GET'])
def get_current_user():
    # Log the current session for debugging
    logging.info(f"Current session: {session}")
    
    if 'user' in session and session.get('logged_in'):
        return jsonify({
            'success': True, 
            'email': session['user'],
            'user_id': session.get('user_id')
        })
    return jsonify({'success': False, 'message': 'No user logged in'}), 401

@auth.route('/logout')
def logout():
    # Clear all session data
    session.clear()
    # Redirect to homepage
    return redirect(url_for('auth.index'))

@auth.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        try:
            # Use the serializer from app extensions
            serializer = current_app.extensions['serializer']
            
            # Generate verification token with a simple salt
            token = serializer.dumps(email, salt='verify')
            logging.info(f"Generated verification token for {email}")
            
            # Add user to database
            if add_user(email, password):
                # Send verification email
                if send_verification_email(email, token):
                    flash('Registration successful! Please check your email to verify your account.', 'success')
                else:
                    flash('Account created but verification email failed to send. Please contact support.', 'signup_error')
                    logging.error(f"Failed to send verification email to {email}")
                return redirect(url_for('auth.login'))
            else:
                flash('Registration failed. Email may already be registered.', 'signup_error')
        except Exception as e:
            logging.error(f"Signup failed for {email}: {str(e)}")
            flash('An error occurred during registration. Please try again.', 'signup_error')
    
    return render_template('register.html')

@auth.route('/verify/<token>')
def verify(token):
    try:
        # Use the serializer from app extensions
        serializer = current_app.extensions['serializer']
        
        # Verify token with the same simple salt
        email = serializer.loads(token, salt='verify', max_age=86400)
        logging.info(f"Successfully decoded token for email: {email}")
        
        # Update user's verified status
        if verify_email(email):
            logging.info(f"Successfully verified email for {email}")
            return render_template('verification_success.html')
        else:
            logging.error(f"Database update failed for {email}")
            return render_template('verification_failed.html')
            
    except Exception as e:
        logging.error(f"Verification error: {str(e)}")
        return render_template('verification_failed.html')
