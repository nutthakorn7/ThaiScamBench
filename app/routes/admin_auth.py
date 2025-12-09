"""Admin authentication endpoints with JWT"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict
from app.utils.jwt_utils import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    verify_password,
    hash_password
)
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/auth", tags=["Admin Authentication"])


class LoginRequest(BaseModel):
    """Admin login request"""
    username: str
    password: str
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "username": "admin",
            "password": "your-password"
        }
    })


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "expires_in": 1800
        }
    })


class RefreshRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Admin Login",
    description="Login with username/password to get JWT tokens"
)
async def admin_login(credentials: LoginRequest) -> TokenResponse:
    """
    Admin login endpoint
    
    Returns JWT access token and refresh token
    
    Args:
        credentials: Username and password
        
    Returns:
        TokenResponse with access and refresh tokens
        
    Raises:
        HTTPException: 401 if credentials are invalid
    """
    # Verify username
    if credentials.username != settings.admin_username:
        logger.warning(f"Invalid admin username attempt: {credentials.username}")
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    
    # Verify password
    # If admin_password_hash is not set, use the static token as password (backward compat)
    if settings.admin_password_hash:
        if not verify_password(credentials.password, settings.admin_password_hash):
            logger.warning(f"Invalid password for admin user: {credentials.username}")
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )
    else:
        # Fallback: check against admin_token
        if credentials.password != settings.admin_token:
            logger.warning(f"Invalid password for admin user (using token): {credentials.username}")
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )
    
    # Create tokens
    token_data = {
        "sub": credentials.username,
        "role": "admin"
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    logger.info(f"Admin user logged in: {credentials.username}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh Access Token",
    description="Use refresh token to get new access token"
)
async def refresh_access_token(request: RefreshRequest) -> TokenResponse:
    """
    Refresh access token using refresh token
    
    Args:
        request: Refresh token request
        
    Returns:
        New access token and refresh token
        
    Raises:
        HTTPException: 401 if refresh token is invalid
    """
    # Verify refresh token
    payload = verify_refresh_token(request.refresh_token)
    
    if not payload:
        logger.warning("Invalid refresh token attempt")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )
    
    # Extract user info
    username = payload.get("sub")
    role = payload.get("role")
    
    # Create new tokens
    token_data = {
        "sub": username,
        "role": role
    }
    
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    logger.info(f"Token refreshed for: {username}")
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60
    )
