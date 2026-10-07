import os
import json
import time
import sqlite3
import logging
from pathlib import Path
from typing import Any, Optional, Dict

logger = logging.getLogger(__name__)

DB_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DB_DIR / "kisanai.db"

# Optional Redis connection
_redis_client = None
_redis_available = False

try:
    import redis
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        _redis_client = redis.from_url(redis_url, decode_responses=True)
        _redis_client.ping()
        _redis_available = True
        logger.info("✓ Connected to Redis persistent cache.")
except Exception as e:
    logger.info("Redis not configured or unreachable; using SQLite persistent cache fallback.")
    _redis_available = False


def _init_sqlite_cache():
    """Ensure cache table exists in SQLite database."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    expires_at REAL NOT NULL
                )
            """)
            # Index for fast expiration queries
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at)")
            conn.commit()
    except Exception as e:
        logger.warning(f"Error initializing SQLite cache table: {e}")

_init_sqlite_cache()


class CacheManager:
    """
    Production-ready Cache Manager:
    - Automatically uses Redis when available (e.g. in Docker Compose / production)
    - Seamlessly falls back to persistent SQLite cache across server restarts
    """

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        if _redis_available and _redis_client:
            try:
                raw = _redis_client.get(key)
                if raw is not None:
                    return json.loads(raw)
                return None
            except Exception as e:
                logger.warning(f"Redis get error for {key}: {e}")

        # SQLite fallback
        try:
            now = time.time()
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT value, expires_at FROM cache WHERE key = ?", (key,))
                row = cursor.fetchone()
                if not row:
                    return None
                val_json, expires_at = row
                if now >= expires_at:
                    cursor.execute("DELETE FROM cache WHERE key = ?", (key,))
                    conn.commit()
                    return None
                return json.loads(val_json)
        except Exception as e:
            logger.warning(f"SQLite cache get error for {key}: {e}")
            return None

    @classmethod
    def set(cls, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        now = time.time()
        expires_at = now + ttl_seconds
        serialized = json.dumps(value)

        if _redis_available and _redis_client:
            try:
                _redis_client.setex(key, ttl_seconds, serialized)
                return True
            except Exception as e:
                logger.warning(f"Redis set error for {key}: {e}")

        # SQLite fallback
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO cache (key, value, expires_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET
                        value = excluded.value,
                        expires_at = excluded.expires_at
                """, (key, serialized, expires_at))
                conn.commit()
                return True
        except Exception as e:
            logger.warning(f"SQLite cache set error for {key}: {e}")
            return False

    @classmethod
    def delete(cls, key: str) -> bool:
        if _redis_available and _redis_client:
            try:
                _redis_client.delete(key)
            except Exception:
                pass
        try:
            with sqlite3.connect(DB_PATH) as conn:
                conn.execute("DELETE FROM cache WHERE key = ?", (key,))
                conn.commit()
                return True
        except Exception:
            return False

    @classmethod
    def cleanup_expired(cls) -> int:
        """Purge all expired cache entries from SQLite."""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM cache WHERE expires_at <= ?", (time.time(),))
                conn.commit()
                return cursor.rowcount
        except Exception:
            return 0

    @classmethod
    def status(cls) -> Dict[str, Any]:
        """Diagnostic status for health-check endpoints."""
        backend_type = "Redis" if _redis_available else "SQLite Persistent Cache"
        item_count = 0
        try:
            if _redis_available and _redis_client:
                item_count = _redis_client.dbsize()
            else:
                with sqlite3.connect(DB_PATH) as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT COUNT(*) FROM cache WHERE expires_at > ?", (time.time(),))
                    item_count = cursor.fetchone()[0]
        except Exception:
            item_count = -1

        return {
            "backend": backend_type,
            "active_items": item_count,
            "redis_connected": _redis_available
        }
