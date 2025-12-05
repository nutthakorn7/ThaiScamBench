"""CSRF token endpoint for frontend"""
from fastapi import APIRouter, Response
from app.middleware.csrf import generate_csrf_token, create_token_cookie
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["CSRF"])


@router.get(
    "/csrf-token",
    summary="Get CSRF Token",
    description="Get a CSRF token for form submissions"
)
async def get_csrf_token(response: Response):
    """
    Generate and return a CSRF token
    
    The token is set as a cookie and also returned in the response
    for easy access by JavaScript
    
    Returns:
        CSRF token
    """
    token = generate_csrf_token()
    create_token_cookie(response, token)
    
    logger.debug("CSRF token generated")
    
    return {
        "csrf_token": token,
        "expires_in": 3600  # 1 hour
    }
