"""Authentication middleware for Partner and Admin API"""
from fastapi import Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.partner_service import get_partner_by_api_key
from app.models.database import Partner
from app.config import settings
from app.utils.jwt_utils import verify_access_token
from typing import Optional
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# PARTNER AUTHENTICATION
# ============================================================================

async def verify_partner_token(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
) -> Partner:
    """
    Verify partner Bearer token and return partner
    
    Args:
        authorization: Authorization header (Bearer <token>)
        db: Database session
        
    Returns:
        Partner object if valid
        
    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    # Check Authorization header format
    if not authorization:
        logger.warning("Missing Authorization header")
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )
    
    # Parse Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.warning(f"Invalid Authorization header format: {authorization[:20]}...")
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Expected: Bearer <token>"
        )
    
    api_key = parts[1]
    
    # Verify API key
    partner = get_partner_by_api_key(db, api_key)
    if not partner:
        logger.warning(f"Invalid API key attempt")
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    
    # Check if API key has expired
    if partner.api_key_expires_at:
        from datetime import datetime
        if datetime.utcnow() > partner.api_key_expires_at:
            logger.warning(f"Expired API key for partner: {partner.name}")
            from app.models.error_responses import ErrorCode, create_error_response
            error_response = create_error_response(
                code=ErrorCode.INVALID_CREDENTIALS,
                message="API key has expired. Please rotate your key.",
                details={
                    "expired_at": partner.api_key_expires_at.isoformat(),
                    "partner_id": partner.id
                }
            )
            from fastapi.responses import JSONResponse
            raise HTTPException(
                status_code=401,
                detail="API key has expired. Please rotate your key."
            )
    
    logger.info(f"Authenticated partner: {partner.name} (ID: {partner.id})")
    return partner


# ============================================================================
# ADMIN AUTHENTICATION
# ============================================================================

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
            
            # Return user_id (sub) from JWT
            # In the login function, we set 'sub' to user.email or user.id?
            # Checking utils/jwt_utils.py would be good, but assuming 'user_id' is in payload as per login
            # output in auth.py: data={"sub": user.email, "role": user.role, "user_id": user.id}
            # So we should return jwt_payload.get("user_id") if available, else sub
            
            user_id = jwt_payload.get("user_id") or username
            return user_id
        
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
    return "static_admin"
