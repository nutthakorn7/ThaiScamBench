"""Admin authentication middleware"""
from fastapi import Header, HTTPException, Request
from app.config import settings
from app.utils.jwt_utils import verify_access_token
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def verify_admin_token(
    authorization: Optional[str] = Header(None),
    x_admin_token: Optional[str] = Header(None),
    request: Request = None
) -> bool:
    """
    Verify admin authentication - supports both JWT and static token
    
    Supports:
    1. JWT: Authorization: Bearer <jwt_token>
    2. Static token: X-Admin-Token: <static_token>
    3. Static token: Authorization: Bearer <static_token> (legacy)
    
    Args:
        authorization: Bearer token from Authorization header
        x_admin_token: Admin token from X-Admin-Token header
        request: FastAPI Request object for IP checking
        
    Returns:
        True if authenticated
        
    Raises:
        HTTPException: 403 if authentication fails
    """
    # Extract token from headers
    token = None
    
    if authorization and authorization.startswith("Bearer "):
        potential_token = authorization.replace("Bearer ", "").strip()
        
        # Try JWT first
        jwt_payload = verify_access_token(potential_token)
        if jwt_payload:
            # Valid JWT token
            username = jwt_payload.get("sub")
            role = jwt_payload.get("role")
            
            if role != "admin":
                logger.warning(f"Non-admin role in JWT: {role} for user {username}")
                raise HTTPException(
                    status_code=403,
                    detail="Forbidden: Insufficient permissions"
                )
            
            client_host = request.client.host if request and request.client else 'unknown'
            logger.info(f"Admin authenticated via JWT: {username} from {client_host}")
            
            # Check IP allowlist (if configured)
            if settings.admin_allowed_ips:
                allowed_ips = [ip.strip() for ip in settings.admin_allowed_ips.split(',')]
                client_ip = request.client.host if request and request.client else None
                
                if client_ip and client_ip not in allowed_ips:
                    logger.warning(f"Admin access denied for IP: {client_ip} (JWT authenticated)")
                    raise HTTPException(
                        status_code=403,
                        detail="Forbidden: IP not allowed"
                    )
            
            return True
        
        # If JWT verification failed, this potential_token might be a static token
        token = potential_token
        
    elif x_admin_token:
        token = x_admin_token
    
    # Verify static token (backward compatibility)
    if not token or token != settings.admin_token:
        client_host = request.client.host if request and request.client else 'unknown'
        logger.warning(f"Invalid admin token attempt from {client_host}")
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid admin token"
        )
    
    # Check IP allowlist for static token (if configured)
    if settings.admin_allowed_ips:
        allowed_ips = [ip.strip() for ip in settings.admin_allowed_ips.split(',')]
        client_ip = request.client.host if request and request.client else None
        
        if client_ip and client_ip not in allowed_ips:
            logger.warning(f"Admin access denied for IP: {client_ip} (static token authenticated)")
            raise HTTPException(
                status_code=403,
                detail="Forbidden: IP not allowed"
            )
    
    client_host = request.client.host if request and request.client else 'unknown'
    logger.info(f"Admin authenticated via static token from {client_host}")
    return True
