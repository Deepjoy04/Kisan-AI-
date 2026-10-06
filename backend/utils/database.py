import os
import sqlite3
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

DB_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DB_DIR / "kisanai.db"

def init_db():
    """Initialize SQLite database schema for users and history."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)
        conn.commit()

# Ensure tables exist on module load
init_db()

def _get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, password, created_at FROM users WHERE lower(email) = ?", (email.lower(),))
        row = cursor.fetchone()
        if not row:
            return None
        return {"id": str(row["id"]), "email": row["email"], "name": row["name"], "password": row["password"], "created_at": row["created_at"]}

def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        return None
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, password, created_at FROM users WHERE id = ?", (uid,))
        row = cursor.fetchone()
        if not row:
            return None
        return {"id": str(row["id"]), "email": row["email"], "name": row["name"], "password": row["password"], "created_at": row["created_at"]}

def create_user(email: str, password_hash: str, name: str) -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, name, password, created_at) VALUES (?, ?, ?, ?)",
            (email.lower(), name, password_hash, now_iso)
        )
        conn.commit()
        user_id = str(cursor.lastrowid)
        return {"id": user_id, "email": email.lower(), "name": name, "created_at": now_iso}

def log_user_history(user_id: str, action: str, details: dict):
    if not user_id:
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    details_json = json.dumps(details)
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO history (user_id, action, details, timestamp) VALUES (?, ?, ?, ?)",
            (str(user_id), action, details_json, now_iso)
        )
        conn.commit()

def fetch_user_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, user_id, action, details, timestamp FROM history WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (str(user_id), limit)
        )
        rows = cursor.fetchall()
        result = []
        for r in rows:
            try:
                parsed_details = json.loads(r["details"])
            except Exception:
                parsed_details = {}
            result.append({
                "_id": str(r["id"]),
                "user_id": str(r["user_id"]),
                "action": r["action"],
                "details": parsed_details,
                "timestamp": r["timestamp"]
            })
        return result

