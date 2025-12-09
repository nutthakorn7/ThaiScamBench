"""CSRF Protection middleware"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import secrets
import hmac
import hashlib
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class CSRFProtection(BaseHTTPMiddleware):
    """CSRF protection middleware for web forms"""
    
    # Methods that require CSRF validation
    PROTECTED_METHODS = {"POST", "PUT", "DELETE", "PATCH"}
    
    # Endpoints exempt from CSRF (API endpoints use Bearer tokens)
    EXEMPT_PATHS = {
        "/v1/public/detect/text",
        "/v1/public/feedback", 
        "/v1/partner/detect/text",
        "/v1/partner/rotate-key",
        "/v1/auth/login",  # NextAuth login
        "/admin/auth/login",
        "/admin/auth/refresh",
        "/docs",
        "/openapi.json",
        "/health"
    }
    
    async def dispatch(self, request: Request, call_next):
        """
        Validate CSRF token for state-changing requests
        
        Args:
            request: FastAPI Request
            call_next: Next middleware/endpoint
            
        Returns:
            Response from endpoint
            
        Raises:
            HTTPException: 403 if CSRF validation fails
        """
        # Skip CSRF check for:
        # - Safe methods (GET, HEAD, OPTIONS)
        # - Health check endpoint
        # - API documentation
        # - Public API endpoints (no auth required, CORS-enabled)
        # - Feedback endpoint (public submission)
        exempt_paths = [
            "/health",
            "/docs", 
            "/openapi.json",
            "/redoc",
        ]
        
        # Exempt all public API endpoints (no CSRF needed for stateless API)
        if (
            "/public/" in request.url.path
            or "/feedback" in request.url.path
            or request.url.path in exempt_paths
            or request.method in ["GET", "HEAD", "OPTIONS"]
        ):
            return await call_next(request)
        
        # Skip CSRF for exempt paths
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)
        
        # Skip CSRF for API requests with Bearer token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return await call_next(request)
        
        # Validate CSRF token
        try:
            await self._validate_csrf_token(request)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"CSRF validation error: {e}")
            raise HTTPException(
                status_code=403,
                detail="CSRF validation failed"
            )
        
        return await call_next(request)
    
    async def _validate_csrf_token(self, request: Request):
        """
        Validate CSRF token from request
        
        Args:
            request: FastAPI Request
            
        Raises:
            HTTPException: 403 if validation fails
        """
        # Get token from cookie
        cookie_token = request.cookies.get("csrf_token")
        
        # Get token from form or header
        if request.headers.get("content-type", "").startswith("application/x-www-form-urlencoded"):
            # From form data
            form = await request.form()
            form_token = form.get("csrf_token")
        else:
            # From header
            form_token = request.headers.get("X-CSRF-Token")
        
        # Both tokens must exist
        if not cookie_token or not form_token:
            logger.warning("CSRF token missing")
            raise HTTPException(
                status_code=403,
                detail="CSRF token missing"
            )
        
        # Tokens must match
        if not secrets.compare_digest(cookie_token, form_token):
            logger.warning("CSRF token mismatch")
            raise HTTPException(
                status_code=403,
                detail="CSRF token invalid"
            )
        
        logger.debug("CSRF token validated successfully")


def generate_csrf_token() -> str:
    """
    Generate a new CSRF token
    
    Returns:
        Random CSRF token
    """
    return secrets.token_urlsafe(32)


def create_token_cookie(response: Response, token: str):
    """
    Add CSRF token to response cookies
    
    Args:
        response: Starlette Response
        token: CSRF token
    """
    response.set_cookie(
        key="csrf_token",
        value=token,
        httponly=False,  # JavaScript needs to read it
        samesite="strict",
        secure=not settings.is_development,  # HTTPS in production
        max_age=3600  # 1 hour
    )
