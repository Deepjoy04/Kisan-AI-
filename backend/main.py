import os
import logging
from dotenv import load_dotenv
from pathlib import Path

# Load .env BEFORE importing routes (services read env vars at import time)
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from utils.limiter import limiter
from routes import disease, soil, chat, weather, auth, market

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="KisanAI API",
    description="AI-powered crop and soil assistant for farmers",
    version="1.0.0"
)

# Register rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: configurable via CORS_ORIGINS env var (comma-separated), with sensible defaults
_default_origins = "http://localhost:5173,http://localhost:5174,http://localhost:5175"
_cors_origins = os.getenv("CORS_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        # Log the full traceback server-side for debugging
        logger.error(f"Unhandled error on {request.method} {request.url.path}: {e}", exc_info=True)
        # Return a safe, generic message to the client — never expose stack traces
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. Please try again later."}
        )

app.include_router(disease.router, prefix="/api/disease", tags=["Disease Detection"])
app.include_router(soil.router,    prefix="/api/soil",    tags=["Soil Advisor"])
app.include_router(chat.router,    prefix="/api/chat",    tags=["Chatbot"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(auth.router,    prefix="/api/auth",    tags=["Authentication"])
app.include_router(market.router,  prefix="/api/market",  tags=["Market Prices"])

@app.get("/")
def root():
    return {"message": "KisanAI API is running", "status": "healthy"}
