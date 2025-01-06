from flask import Flask
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = '010902'

def get_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

with get_db_connection() as conn:
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            otp_secret TEXT NOT NULL
        )
    ''')
    conn.execute("""
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)
    conn.execute("""
        INSERT OR IGNORE INTO roles (name) VALUES ('admin'), ('user')
    """)
    try:
        conn.execute("""
            ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 2 REFERENCES roles(id)
        """)
    except sqlite3.OperationalError:
        pass

from app import routes
