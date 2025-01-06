from flask import request, jsonify
from app import app, get_db_connection
import pyotp
import smtplib
import sqlite3
from email.mime.text import MIMEText
from functools import wraps

EMAIL_ADDRESS = "spistolova1@gmail.com"
EMAIL_PASSWORD = "shrn iscg hjas olsd"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def send_email(recipient, subject, body):
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = EMAIL_ADDRESS
            msg['To'] = recipient
            server.sendmail(EMAIL_ADDRESS, recipient, msg.as_string())
        return True
    except Exception as e:
        print("Error sending email:", e)
        return False

def role_required(allowed_roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            email = request.headers.get('email')
            if not email:
                return jsonify({'message': 'Missing email in headers!'}), 403

            with get_db_connection() as conn:
                user = conn.execute('SELECT role_id FROM users WHERE email = ?', (email,)).fetchone()
                if not user:
                    return jsonify({'message': 'User not found!'}), 404

                role_id = user['role_id']
                role = conn.execute('SELECT name FROM roles WHERE id = ?', (role_id,)).fetchone()['name']
                if role not in allowed_roles:
                    return jsonify({'message': 'Access denied!'}), 403

            return func(*args, **kwargs)
        return wrapper
    return decorator

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    role = data.get('role', 'user')

    if not email or not password or not confirm_password:
        return jsonify({'message': 'All fields are required!'}), 400
    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match!'}), 400

    otp_secret = pyotp.random_base32()
    try:
        with get_db_connection() as conn:
            role_id = conn.execute('SELECT id FROM roles WHERE name = ?', (role,)).fetchone()
            if not role_id:
                return jsonify({'message': 'Invalid role specified!'}), 400

            conn.execute(
                'INSERT INTO users (email, password, otp_secret, role_id) VALUES (?, ?, ?, ?)',
                (email, password, otp_secret, role_id['id'])
            )
        return jsonify({'message': 'Registration successful!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'User already exists!'}), 400

@app.route('/generate-otp', methods=['POST'])
def generate_otp():
    data = request.get_json()
    email = data.get('email')

    with get_db_connection() as conn:
        user = conn.execute('SELECT otp_secret FROM users WHERE email = ?', (email,)).fetchone()

    if not user:
        return jsonify({'message': 'User not found!'}), 404

    totp = pyotp.TOTP(user['otp_secret'], interval=30*60)
    otp = totp.now()

    # Send OTP via email
    email_sent = send_email(
        recipient=email,
        subject="Your Login OTP",
        body=f"Your OTP for login is: {otp}. It is valid for 30 minutes."
    )

    if email_sent:
        return jsonify({'message': 'OTP sent to your email!'}), 200
    else:
        return jsonify({'message': 'Failed to send OTP. Please try again.'}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    otp = data.get('otp')

    with get_db_connection() as conn:
        user = conn.execute(
            'SELECT * FROM users WHERE email = ? AND password = ?', (email, password)
        ).fetchone()

    if not user:
        return jsonify({'message': 'Invalid credentials!'}), 404

    totp = pyotp.TOTP(user['otp_secret'], interval=30*60)
    if not totp.verify(otp):  # Validate the OTP
        return jsonify({'message': 'Invalid OTP!'}), 400

    role_id = user['role_id']
    role = conn.execute('SELECT name FROM roles WHERE id = ?', (role_id,)).fetchone()['name']

    return jsonify({'message': 'Login successful!', 'role': role}), 200

@app.route('/assign-role', methods=['POST'])
@role_required(['admin', 'developer'])
def assign_role():
    data = request.get_json()
    email = data.get('email')
    new_role = data.get('role')

    if not email or not new_role:
        return jsonify({'message': 'Email and role are required!'}), 400

    with get_db_connection() as conn:
        role_id = conn.execute('SELECT id FROM roles WHERE name = ?', (new_role,)).fetchone()
        if not role_id:
            return jsonify({'message': 'Invalid role!'}), 400

        conn.execute('UPDATE users SET role_id = ? WHERE email = ?', (role_id['id'], email))
    return jsonify({'message': f'Role {new_role} assigned to {email} successfully!'}), 200

@app.route('/')
def home():
    return "Welcome to the User Authentication API!"
