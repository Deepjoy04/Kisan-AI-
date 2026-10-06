"""
Shared rate-limiter instance (slowapi).

Import `limiter` in any route module and decorate endpoints with:
    @limiter.limit("N/minute")

The limiter must be registered on the FastAPI app in main.py via:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Key function: use client's real IP address as the rate-limit key
limiter = Limiter(key_func=get_remote_address)
