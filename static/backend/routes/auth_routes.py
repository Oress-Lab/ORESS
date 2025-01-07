"""


"""

from flask import Blueprint, flash, redirect, render_template, request, url_for, current_app, session, jsonify
from ..utils.email import send_verification_email, send_forgotten_password_verification_email, generate_verification_token
from ..mongodb.mongo import add_user, verify_email, generate_reset_code, verify_reset_code, update_password, get_database
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash
import logging

auth = Blueprint('auth', __name__)

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
            return redirect(url_for('auth.index'))

        email = email.strip()
        
        if not (email.lower().endswith('@ndu.edu.lb') or email.lower().endswith('@ndu.edu')):
            flash('Only @ndu.edu.lb or @ndu.edu email addresses are allowed.', 'error')
            return redirect(url_for('auth.index'))

        if action == 'signup':
            try:
                # Hash password before storing
                hashed_password = generate_password_hash(password)
                
                # Add user to database with hashed password
                if add_user(email.lower(), hashed_password):
                    # Generate verification token
                    token = generate_verification_token(email.lower())

                    # Get mail instance from current app
                    mail = current_app.extensions['mail']
                    
                    # Send verification email
                    if send_verification_email(mail, email.lower(), token, url_for):
                        flash('Account created! Please check your email to verify.', 'signup_success')
                    else:
                        flash('Account created but verification email failed to send. Please contact support.', 'signup_error')
                else:
                    flash('Account already exists. Please log in.', 'signup_error')
                    
            except Exception as e:
                logging.error(f"Signup failed for {email}: {str(e)}")
                flash('An error occurred during signup. Please try again.', 'signup_error')
                
        elif action == 'login':
            try:
                # Get user from database
                user = get_database()['users'].find_one({'email': email.lower()})
                
                if not user:
                    flash('Invalid email or password.', 'login_error')
                    return redirect(url_for('auth.index'))
                
                # Check if password exists and matches
                if not user.get('password') or not check_password_hash(user['password'], password):
                    flash('Invalid email or password.', 'login_error')
                    return redirect(url_for('auth.index'))
                
                # Check if email is verified
                if not user.get('verified', False):
                    flash('Please verify your email before logging in.', 'login_error')
                    return redirect(url_for('auth.index'))
                
                # Create session
                session.clear()
                session['user_id'] = str(user['_id'])
                session['email'] = user['email']
                
                flash('Successfully logged in!', 'login_success')
                return redirect(url_for('timetable.show_timetable'))
                
            except Exception as e:
                logging.error(f"Login error: {str(e)}")
                flash('An error occurred during login.', 'error')
                return redirect(url_for('auth.index'))
            
        return redirect(url_for('auth.index'))

    return render_template('index.html')

@auth.route('/confirm/<token>')
def confirm_email(token):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        # Verify token and get email
        email = serializer.loads(token, salt='email-confirm-salt', max_age=3600)
        
        # Update user's verified status
        if verify_email(email):
            flash('Email confirmed! You can now log in.', 'success')
        else:
            flash('An error occurred while confirming your email. Please try again.', 'error')
            
    except Exception as e:
        logging.error(f"Email confirmation failed: {str(e)}")
        flash('The confirmation link is invalid or has expired.', 'error')
        
    return redirect(url_for('auth.index'))

@auth.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    
    if request.method == 'POST':
        email = request.form.get('email').strip().lower()

        mail = current_app.extensions['mail']
        
        if get_database()['users'].find_one({'email': email}):
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
    if 'user_email' in session:
        return jsonify({'success': True, 'email': session['user_email']})
    return jsonify({'success': False, 'message': 'No user logged in'}), 401
