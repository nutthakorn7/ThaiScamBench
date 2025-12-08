"""
Authentication Routes

Handles user login and management for unified auth system.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.hash import bcrypt

from app.database import get_db
from app.models.database import User, UserRole
from app.config import settings
from app.middleware.auth import verify_admin_token
from app.utils.jwt_utils import create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/auth", tags=["Authentication"])


# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=1, description="User password")


class LoginResponse(BaseModel):
    success: bool
    user_id: str
    email: str
    name: Optional[str]
    role: str
    partner_id: Optional[str]
    access_token: Optional[str] = None
    token_type: str = "bearer"
    message: str


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = Field(None, min_length=8, description="Password (optional, auto-generated if empty)")
    name: Optional[str] = None
    role: str = Field(default="partner", pattern="^(admin|partner)$")
    partner_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: str
    partner_id: Optional[str]
    is_active: bool
    created_at: datetime
    # Optional extended fields for creation response
    generated_password: Optional[str] = None


# Password helpers
# ...

@router.post(
    "/users",
    response_model=UserResponse,
    summary="Create User (Admin)",
    description="Create a new user account (admin only). If password is not provided, one will be generated and emailed.",
    dependencies=[Depends(verify_admin_token)]
)
async def create_user(
    request: CreateUserRequest,
    db: Session = Depends(get_db)
):
    """
    Create new user account.
    In production, this should require admin authentication.
    """
    from app.utils.email import send_new_user_email
    import secrets
    import string

    try:
        # Check if email already exists
        existing = db.query(User).filter(User.email == request.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Handle Password
        plain_password = request.password
        generated_password = None
        
        if not plain_password:
            # Generate secure random password
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            plain_password = ''.join(secrets.choice(alphabet) for i in range(12))
            generated_password = plain_password # Store to return to admin
            logger.info(f"Generated password for {request.email}")

        # Hash password
        password_hash = hash_password(plain_password)
        
        # Create user
        user = User(
            email=request.email,
            password_hash=password_hash,
            name=request.name,
            role=request.role,
            partner_id=request.partner_id,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"✅ User created: {user.email} (role: {user.role})")
        
        # Send Email Notification
        email_sent = await send_new_user_email(user.email, plain_password, user.name)
        
        # If email failed and we generated the password, it's CRITICAL to return it
        # Actually, even if email sent, displaying it once is good UX (AWS style)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            partner_id=user.partner_id,
            is_active=user.is_active,
            created_at=user.created_at,
            generated_password=generated_password if generated_password else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create user error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="List Users (Admin)",
    description="List all users (admin only)",
    dependencies=[Depends(verify_admin_token)]
)
async def list_users(
    db: Session = Depends(get_db)
):
    """List all users. Admin only."""
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            name=u.name,
            role=u.role,
            partner_id=u.partner_id,
            is_active=u.is_active,
            created_at=u.created_at
        )
        for u in users
    ]
