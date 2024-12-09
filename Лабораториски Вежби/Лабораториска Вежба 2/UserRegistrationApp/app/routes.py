from flask import request, jsonify
from app import app, get_db_connection
import pyotp
import smtplib
import sqlite3
from email.mime.text import MIMEText

# Configure email settings
EMAIL_ADDRESS = "spistolova1@gmail.com"
EMAIL_PASSWORD = "shrn iscg hjas olsd"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def send_email(recipient, subject, body):
    """Function to send an email."""
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Upgrade the connection to secure
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

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    if not email or not password or not confirm_password:
        return jsonify({'message': 'All fields are required!'}), 400
    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match!'}), 400

    otp_secret = pyotp.random_base32()  # Generate a unique OTP secret for the user
    try:
        with get_db_connection() as conn:
            conn.execute(
                'INSERT INTO users (email, password, otp_secret) VALUES (?, ?, ?)',
                (email, password, otp_secret)
            )
        return jsonify({'message': 'Registration successful!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'User already exists!'}), 400

@app.route('/generate-otp', methods=['POST'])
def generate_otp():
    data = request.get_json()
    email = data.get('email')

    with get_db_connection() as conn:
        user = conn.execute(
            'SELECT otp_secret FROM users WHERE email = ?', (email,)
        ).fetchone()

    if not user:
        return jsonify({'message': 'User not found!'}), 404

    # Generate the OTP using the user's secret (valid for 30 minutes)
    totp = pyotp.TOTP(user['otp_secret'], interval=30*60)  # Set OTP validity to 30 minutes (1800 seconds)
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

    totp = pyotp.TOTP(user['otp_secret'], interval=30*60)  # Set OTP validity to 30 minutes (1800 seconds)
    if not totp.verify(otp):  # Validate the OTP
        return jsonify({'message': 'Invalid OTP!'}), 400

    return jsonify({'message': 'Login successful!'}), 200

@app.route('/')
def home():
    return "Welcome to the User Authentication API!"
