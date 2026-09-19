import sqlite3
import os

# Resolve path to data/co_resolve.db relative to backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BACKEND_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "co_resolve.db")


def get_db_connection():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS crisis_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT NOT NULL,
            urgency TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS aid_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            capability TEXT NOT NULL,
            location TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            contact TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS volunteers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            skills TEXT NOT NULL,
            location TEXT NOT NULL,
            availability TEXT,
            contact TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def save_crisis_report(title, description, location, urgency):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO crisis_reports (title, description, location, urgency)
        VALUES (?, ?, ?, ?)
        """,
        (title, description, location, urgency)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {
        "id": new_id,
        "title": title,
        "description": description,
        "location": location,
        "urgency": urgency
    }


def fetch_crisis_reports():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, description, location, urgency FROM crisis_reports ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "location": row["location"],
            "urgency": row["urgency"]
        }
        for row in rows
    ]


def save_aid_resource(name, capability, location, resource_type, contact=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO aid_resources (name, capability, location, resource_type, contact)
        VALUES (?, ?, ?, ?, ?)
        """,
        (name, capability, location, resource_type, contact or "")
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {
        "id": new_id,
        "name": name,
        "capability": capability,
        "location": location,
        "resource_type": resource_type,
        "contact": contact or ""
    }


def fetch_aid_resources():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, capability, location, resource_type, contact FROM aid_resources ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "capability": row["capability"],
            "location": row["location"],
            "resource_type": row["resource_type"],
            "contact": row["contact"]
        }
        for row in rows
    ]


def save_volunteer(name, skills, location, availability=None, contact=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO volunteers (name, skills, location, availability, contact)
        VALUES (?, ?, ?, ?, ?)
        """,
        (name, skills, location, availability or "Available", contact or "")
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {
        "id": new_id,
        "name": name,
        "skills": skills,
        "location": location,
        "availability": availability or "Available",
        "contact": contact or ""
    }


def fetch_volunteers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, skills, location, availability, contact FROM volunteers ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "skills": row["skills"],
            "location": row["location"],
            "availability": row["availability"],
            "contact": row["contact"]
        }
        for row in rows
    ]
