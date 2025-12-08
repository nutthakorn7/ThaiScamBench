"""
Authentication Routes

Handles user login and management for unified auth system.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.utils.audit import log_action

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
    last_login: Optional[datetime] = None
    # Optional extended fields for creation response
    generated_password: Optional[str] = None


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(admin|partner)$")
    is_active: Optional[bool] = None


# Password helpers
def verify_password(plain_password, hashed_password):
    return bcrypt.verify(plain_password, hashed_password)

def hash_password(password):
    return bcrypt.hash(password)


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is banned/inactive"
        )
    
    # Update last login
    user.last_login = datetime.now()
    db.commit()

    # Generate Access Token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    logger.info(f"✅ User logged in: {user.email} (role: {user.role})")
    
    return LoginResponse(
        success=True,
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        partner_id=user.partner_id,
        access_token=access_token,
        token_type="bearer",
        message="Login successful"
    )


@router.post(
    "/users",
    response_model=UserResponse,
    summary="Create User (Admin)",
    description="Create a new user account (admin only). If password is not provided, one will be generated and emailed.",
)
async def create_user(
    body: CreateUserRequest,
    req: Request,
    admin_id: str = Depends(verify_admin_token),
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
            email=body.email,
            password_hash=password_hash,
            name=body.name,
            role=body.role,
            partner_id=body.partner_id,
            is_active=True
        )
        
        db.add(user)
        # Flush to get ID for logging
        db.flush() 

        # Audit Log
        log_action(
            db, 
            actor_id=admin_id, 
            action="CREATE_USER", 
            target_id=user.id, 
            details={"email": user.email, "role": user.role},
            ip_address=req.client.host
        )

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
            last_login=user.last_login,
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
    response_model=UserListResponse,
    summary="List Users (Admin)",
    description="List all users with pagination, search, and filtering (admin only)",
)
async def list_users(
    page: int = 1,
    page_size: int = 50,
    q: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,  # 'active', 'banned'
    admin_id: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """
    List all users with advanced filtering.
    """
    query = db.query(User)
    
    # 1. Search (Email or Name)
    if q:
        search = f"%{q}%"
        query = query.filter(
            (User.email.ilike(search)) | 
            (User.name.ilike(search))
        )
    
    # 2. Filter by Role
    if role and role != "all":
        query = query.filter(User.role == role)
        
    # 3. Filter by Status (Derived)
    if status and status != "all":
        if status == "active":
            query = query.filter(User.is_active == True)
        elif status == "banned":
            query = query.filter(User.is_active == False)
            
    # Calculate total before pagination
    total = query.count()
    
    # 4. Pagination
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    
    items = [
        UserResponse(
            id=u.id,
            email=u.email,
            name=u.name,
            role=u.role,
            partner_id=u.partner_id,
            is_active=u.is_active,
            created_at=u.created_at,
            last_login=u.last_login
        )
        for u in users
    ]
    
    return UserListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.patch(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Update User (Admin)",
    description="Update user details, role, or ban status (admin only)",
)
async def update_user(
    user_id: str,
    body: UpdateUserRequest,
    req: Request,
    admin_id: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Update user details (Role, Ban/Unban)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
        
    changes = {}
    if body.name is not None:
        user.name = body.name
        changes['name'] = body.name
    if body.role is not None:
        user.role = body.role
        changes['role'] = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
        changes['is_active'] = body.is_active
        
    # Audit Log
    if changes:
        action_type = "BAN_USER" if body.is_active is False else "UPDATE_USER"
        if body.is_active is True and not user.is_active: action_type = "UNBAN_USER"
            
        log_action(
            db,
            actor_id=admin_id,
            action=action_type,
            target_id=user.id,
            details=changes,
            ip_address=req.client.host
        )

    db.commit()
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        partner_id=user.partner_id,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login
    )


@router.delete(
    "/users/{user_id}",
    summary="Delete User (Admin)",
    status_code=204,
    description="Permanently delete a user account (admin only)"
)
async def delete_user(
    user_id: str,
    req: Request,
    admin_id: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Delete a user permanently"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
        
    log_action(
        db,
        actor_id=admin_id,
        action="DELETE_USER",
        target_id=user.id,
        details={"email": user.email},
        ip_address=req.client.host
    )

    db.delete(user)
    db.commit()
    return None


@router.post(
    "/users/{user_id}/reset-password",
    response_model=UserResponse,
    summary="Reset User Password (Admin)",
    description="Reset a user's password and email them the new one (admin only)",
)
async def reset_password(
    user_id: str,
    req: Request,
    admin_id: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Reset user password to a new auto-generated one and email it."""
    from app.utils.email import send_new_user_email
    import secrets
    import string
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
        
    # Generate new password
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    plain_password = ''.join(secrets.choice(alphabet) for i in range(12))
    
    user.password_hash = hash_password(plain_password)
    
    log_action(
        db,
        actor_id=admin_id,
        action="RESET_PASSWORD",
        target_id=user.id,
        details="Admin requested password reset",
        ip_address=req.client.host
    )

    db.commit()
    
    logger.info(f"♻️ Password reset for {user.email}")
    
    # Send Email
    await send_new_user_email(user.email, plain_password, user.name)
    
    # Return user with new password (failsafe)
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        partner_id=user.partner_id,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
        generated_password=plain_password
    )
