from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, EmailStr, field_validator
from utils.database import (
    find_user_by_email,
    find_user_by_id,
    create_user,
    fetch_user_history,
)
from utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_payload,
)
from utils.limiter import limiter
from typing import Optional
import logging
import re

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Input Models ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr                    # Pydantic validates email format
    password: str
    name: Optional[str] = "Farmer"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password cannot be empty")
        if len(v) > 128:
            raise ValueError("Password must be 128 characters or fewer")
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("name")
    @classmethod
    def sanitise_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) > 50:
            raise ValueError("Name must be 50 characters or fewer")
        return v or "Farmer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password cannot be empty")
        if len(v) > 128:
            raise ValueError("Password must be 128 characters or fewer")
        return v


# ── Routes ──────────────────────────────────────────────────────────────────

@router.post("/register")
@limiter.limit("5/minute")           # Max 5 registration attempts per IP per minute
def register(request: Request, user: UserCreate):
    # Case-insensitive duplicate check
    if find_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = create_user(
        email=user.email,
        password_hash=hashed_password,
        name=user.name or "Farmer"
    )
    logger.info(f"New user registered: {user.email.lower()}")

    token = create_access_token({"sub": str(new_user["id"]), "email": user.email.lower()})
    return {"message": "Account created successfully", "token": token, "name": new_user["name"]}


@router.post("/login")
@limiter.limit("10/minute")          # Max 10 login attempts per IP per minute
def login(request: Request, user: UserLogin):
    db_user = find_user_by_email(user.email)

    # Use constant-time comparison; same error message for both bad email AND bad password
    if not db_user or not verify_password(user.password, db_user["password"]):
        logger.warning(f"Failed login attempt for email: {user.email.lower()}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(db_user["id"]), "email": user.email.lower()})
    logger.info(f"User logged in: {user.email.lower()}")
    return {"message": "Login successful", "token": token, "name": db_user.get("name", "Farmer")}


@router.get("/me")
def get_me(payload: dict = Depends(get_current_user_payload)):
    user = find_user_by_id(payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"email": user["email"], "name": user.get("name", "Farmer"), "id": str(user["id"])}


@router.get("/history")
def get_user_history(payload: dict = Depends(get_current_user_payload)):
    user_id = payload.get("sub", "")
    history = fetch_user_history(user_id=user_id, limit=50)
    return {"history": history}


