"""
API dependency injection

Provides FastAPI dependencies for endpoints.
"""
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_classifier, get_explainer
from app.core.exceptions import AuthenticationError, ValidationError
from app.services.detection_service import DetectionService
from app.repositories.partner import PartnerRepository
from app.config import settings


async def get_detection_service(
    db: Session = Depends(get_db)
) -> DetectionService:
    """
    Get detection service with injected dependencies
    
    Usage:
        @router.post("/detect")
        async def detect(service: DetectionService = Depends(get_detection_service)):
            ...
    """
    classifier = get_classifier()
    explainer = get_explainer()
    return DetectionService(db, classifier, explainer)


async def verify_admin_token(
    authorization: Optional[str] = Header(None)
) -> bool:
    """
    Verify admin token from Authorization header
    
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    # Extract Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Use: Bearer <token>"
        )
    
    token = parts[1]
    
    # Verify against configured admin token
    if token != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin token"
        )
    
    return True


async def verify_partner_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> str:
    """
    Verify partner API token and return partner ID
    
    Returns:
        Partner ID if valid
        
    Raises:
        HTTPException: If token is invalid or partner not found
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    # Extract Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Use: Bearer <token>"
        )
    
    api_key = parts[1]
    
    # Verify partner
    partner_repo = PartnerRepository(db)
    try:
        partner = partner_repo.validate_partner(api_key)
        return partner.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or inactive API key"
        )
