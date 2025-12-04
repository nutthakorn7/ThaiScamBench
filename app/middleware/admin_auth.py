"""Admin authentication middleware"""
from fastapi import Header, HTTPException, Request
from app.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def verify_admin_token(
    authorization: Optional[str] = Header(None),
    x_admin_token: Optional[str] = Header(None),
    request: Request = None
) -> bool:
    """
    Verify admin token from header and optionally check IP allowlist
    
    Supports both:
    - Authorization: Bearer <token>
    - X-Admin-Token: <token>
    
    Args:
        authorization: Bearer token from Authorization header
        x_admin_token: Admin token from X-Admin-Token header
        request: FastAPI Request object for IP checking
        
    Returns:
        True if authenticated
        
    Raises:
        HTTPException: 403 if authentication fails
    """
    # Extract token from Authorization header if present
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
    elif x_admin_token:
        token = x_admin_token
    
    # Check token
    if not token or token != settings.admin_token:
        logger.warning(f"Invalid admin token attempt from {request.client.host if request else 'unknown'}")
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid admin token"
        )
    
    # Check IP allowlist (if configured)
    if settings.admin_allowed_ips:
        allowed_ips = [ip.strip() for ip in settings.admin_allowed_ips.split(',')]
        client_ip = request.client.host if request else None
        
        if client_ip not in allowed_ips:
            logger.warning(f"Admin access denied for IP: {client_ip}")
            raise HTTPException(
                status_code=403,
                detail="Forbidden: IP not allowed"
            )
    
    logger.info(f"Admin authenticated from {request.client.host if request else 'unknown'}")
    return True
