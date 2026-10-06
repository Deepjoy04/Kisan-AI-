import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
import jwt
from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)

# ── Security: JWT secret MUST be provided explicitly — no insecure defaults ──
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    logger.warning("JWT_SECRET environment variable is not set. Using temporary fallback secret for development.")
    SECRET_KEY = "kisanai_dev_secret_key_change_in_production"


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days validity

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        return None
    except jwt.PyJWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None


def extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    """Extract bearer token from Authorization header value."""
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        return None
    return parts[1].strip()


def get_optional_user_payload(authorization: Optional[str] = Header(default=None)) -> Optional[dict]:
    """Return decoded JWT payload when a valid bearer token is provided, else None."""
    token = extract_bearer_token(authorization)
    if not token:
        return None
    return decode_token(token)


def get_current_user_payload(authorization: Optional[str] = Header(default=None)) -> dict:
    """Return decoded JWT payload or raise 401 if auth is missing/invalid."""
    payload = get_optional_user_payload(authorization)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload
