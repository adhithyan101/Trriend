#!/usr/bin/env python3
"""
CO-RESOLVE Python Authentication Service
Provides secure role-based authentication (VOLUNTEER / ORGANIZATION)
using standard Python libraries (http.server, sqlite3, hashlib, secrets).
"""

import http.server
import socketserver
import json
import sqlite3
import hashlib
import secrets
import os
import sys
import time
from urllib.parse import parse_qs, urlparse

# Path to shared SQLite database file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "co_resolve.db")
PORT = 5002

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_auth_db():
    conn = get_db()
    cursor = conn.cursor()

    # Ensure volunteers table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS volunteers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            availability TEXT,
            location TEXT,
            experience TEXT,
            latitude REAL,
            longitude REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Ensure volunteer capabilities table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS volunteer_capabilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            volunteer_id INTEGER NOT NULL,
            capability TEXT NOT NULL,
            experience TEXT,
            FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
        )
    """)

    # Ensure organizations table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            location TEXT,
            availability TEXT,
            contact TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 1. Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('VOLUNTEER', 'ORGANIZATION')) NOT NULL,
            volunteer_id INTEGER,
            organization_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL,
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")

    # 2. Sessions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)")
    
    conn.commit()
    conn.close()

# Password Hashing Utilities (PBKDF2-HMAC-SHA256)
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}${key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        parts = stored_hash.split('$')
        if len(parts) != 2:
            return False
        salt = bytes.fromhex(parts[0])
        expected_key = parts[1]
        computed_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000).hex()
        return secrets.compare_digest(computed_key, expected_key)
    except Exception:
        return False

# Session Utilities
def create_session(user_id: int) -> str:
    token = secrets.token_hex(32)
    expires_at = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(time.time() + 7 * 86400)) # 7 days
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user_id, expires_at))
    conn.commit()
    conn.close()
    return token

def get_user_by_token(token: str):
    if not token:
        return None
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.email, u.role, u.volunteer_id, u.organization_id, s.expires_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
    """, (token,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    # Check session expiration
    now_str = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
    if row['expires_at'] < now_str:
        cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
        return None

    user_data = {
        "id": row['id'],
        "email": row['email'],
        "role": row['role'],
        "profile": None
    }

    if row['role'] == 'VOLUNTEER' and row['volunteer_id']:
        cursor.execute("SELECT id, name, location, availability, experience, latitude, longitude FROM volunteers WHERE id = ?", (row['volunteer_id'],))
        vol = cursor.fetchone()
        if vol:
            user_data['profile'] = dict(vol)
    elif row['role'] == 'ORGANIZATION' and row['organization_id']:
        cursor.execute("SELECT id, name, location, availability, contact, description FROM organizations WHERE id = ?", (row['organization_id'],))
        org = cursor.fetchone()
        if org:
            user_data['profile'] = dict(org)

    conn.close()
    return user_data

def delete_session(token: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# HTTP Request Handler
class AuthRequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, status_code: int, data: dict):
        response_bytes = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_bytes)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(response_bytes)

    def _get_auth_token(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:].strip()
        return None

    def _parse_post_json(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length)
        return json.loads(body.decode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/auth/me' or path == '/api/auth/verify':
            token = self._get_auth_token()
            user = get_user_by_token(token)
            if not user:
                return self._send_json(401, {"authenticated": False, "error": "Invalid or expired session token"})
            return self._send_json(200, {"authenticated": True, "user": user})

        elif path == '/api/auth/health':
            return self._send_json(200, {"status": "ok", "service": "co-resolve-python-auth"})

        else:
            return self._send_json(404, {"error": "Endpoint not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            body = self._parse_post_json()
        except Exception:
            return self._send_json(400, {"error": "Invalid JSON request payload"})

        if path == '/api/auth/register/volunteer':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            name = (body.get('name') or '').strip()
            skills = body.get('skills') or 'Volunteer'
            other_skill = (body.get('otherSkill') or body.get('other_skill') or '').strip()
            location = (body.get('location') or 'Kollam').strip()
            latitude = body.get('latitude')
            longitude = body.get('longitude')
            availability = body.get('availability') or 'AVAILABLE'

            if not email or '@' not in email:
                return self._send_json(400, {"error": "Valid email address is required"})
            if len(password) < 6:
                return self._send_json(400, {"error": "Password must be at least 6 characters"})
            if not name:
                return self._send_json(400, {"error": "Volunteer name is required"})

            conn = get_db()
            cursor = conn.cursor()

            # Check if email exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                conn.close()
                return self._send_json(400, {"error": "An account with this email already exists"})

            # Handle skills normalization & custom other skill
            parsed_skills = []
            if isinstance(skills, list):
                for s in skills:
                    if s == 'Other' and other_skill:
                        parsed_skills.append(f"Other: {other_skill}")
                    elif s != 'Other':
                        parsed_skills.append(s)
                if 'Other' in skills and other_skill and not any(s.startswith("Other:") for s in parsed_skills):
                    parsed_skills.append(f"Other: {other_skill}")
            elif isinstance(skills, str):
                parsed_skills = [s.strip() for s in skills.split(',') if s.strip()]
                if 'Other' in parsed_skills and other_skill:
                    parsed_skills = [f"Other: {other_skill}" if s == 'Other' else s for s in parsed_skills]

            if other_skill and not any(s.startswith("Other:") for s in parsed_skills):
                parsed_skills.append(f"Other: {other_skill}")

            # Create volunteer record
            skills_str = ', '.join(parsed_skills) if parsed_skills else 'Volunteer'
            cursor.execute("""
                INSERT INTO volunteers (name, description, availability, location, experience, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (name, f"Skills: {skills_str}", availability, location, skills_str, latitude, longitude))
            vol_id = cursor.lastrowid

            # Create capability rows if skills list provided
            for skill in parsed_skills:
                cursor.execute("INSERT INTO volunteer_capabilities (volunteer_id, capability) VALUES (?, ?)", (vol_id, skill))

            # Create user account
            pw_hash = hash_password(password)
            cursor.execute("""
                INSERT INTO users (email, password_hash, role, volunteer_id)
                VALUES (?, ?, 'VOLUNTEER', ?)
            """, (email, pw_hash, vol_id))
            user_id = cursor.lastrowid

            conn.commit()
            conn.close()

            token = create_session(user_id)
            user_data = get_user_by_token(token)
            return self._send_json(201, {"token": token, "user": user_data})

        elif path == '/api/auth/register/organization':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            name = (body.get('name') or '').strip()
            org_type = body.get('type') or 'NGO'
            capability = (body.get('capability') or 'Disaster Response').strip()
            location = (body.get('location') or 'Kollam').strip()
            contact = body.get('contact') or email

            if not email or '@' not in email:
                return self._send_json(400, {"error": "Valid email address is required"})
            if len(password) < 6:
                return self._send_json(400, {"error": "Password must be at least 6 characters"})
            if not name:
                return self._send_json(400, {"error": "Organization name is required"})

            conn = get_db()
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                conn.close()
                return self._send_json(400, {"error": "An account with this email already exists"})

            cursor.execute("""
                INSERT INTO organizations (name, description, location, availability, contact)
                VALUES (?, ?, ?, 'AVAILABLE', ?)
            """, (name, f"Type: {org_type}, Capabilities: {capability}", location, contact))
            org_id = cursor.lastrowid

            pw_hash = hash_password(password)
            cursor.execute("""
                INSERT INTO users (email, password_hash, role, organization_id)
                VALUES (?, ?, 'ORGANIZATION', ?)
            """, (email, pw_hash, org_id))
            user_id = cursor.lastrowid

            conn.commit()
            conn.close()

            token = create_session(user_id)
            user_data = get_user_by_token(token)
            return self._send_json(201, {"token": token, "user": user_data})

        elif path == '/api/auth/login':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''

            if not email or not password:
                return self._send_json(400, {"error": "Email and password are required"})

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT id, password_hash, role FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            conn.close()

            if not user or not verify_password(password, user['password_hash']):
                return self._send_json(401, {"error": "Invalid email or password"})

            token = create_session(user['id'])
            user_data = get_user_by_token(token)
            return self._send_json(200, {"token": token, "user": user_data})

        elif path == '/api/auth/logout':
            token = self._get_auth_token() or body.get('token')
            if token:
                delete_session(token)
            return self._send_json(200, {"message": "Logged out successfully"})

        elif path == '/api/auth/verify-role':
            token = self._get_auth_token() or body.get('token')
            required_role = body.get('required_role')
            user = get_user_by_token(token)
            if not user:
                return self._send_json(401, {"authorized": False, "error": "Unauthenticated"})
            if required_role and user['role'] != required_role:
                return self._send_json(403, {"authorized": False, "error": f"Requires {required_role} role"})
            return self._send_json(200, {"authorized": True, "user": user})

        else:
            return self._send_json(404, {"error": "Endpoint not found"})

def run_auth_server():
    init_auth_db()
    socketserver.TCPServer.allow_reuse_address = True
    server_address = ('', PORT)
    httpd = socketserver.TCPServer(server_address, AuthRequestHandler)
    print(f"CO-RESOLVE Python Auth Service running on port {PORT}")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run_auth_server()
