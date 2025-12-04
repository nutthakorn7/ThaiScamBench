"""Rate limiting middleware for IP-based request throttling"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Initialize limiter with IP-based key function
limiter = Limiter(key_func=get_remote_address)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Custom handler for rate limit exceeded errors
    
    Returns HTTP 429 with Retry-After header
    """
    logger.warning(
        f"Rate limit exceeded for IP: {get_remote_address(request)}, "
        f"Path: {request.url.path}"
    )
    
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
            "message_en": "Too many requests. Please wait a moment and try again.",
        },
        headers={
            "Retry-After": str(exc.detail.split("Retry in ")[1] if "Retry in" in exc.detail else "60")
        }
    )
