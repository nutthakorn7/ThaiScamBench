"""Partner API key management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from app.database import get_db
from app.models.database import Partner
from app.middleware.auth import verify_partner_token
from app.services.partner_service import rotate_partner_api_key
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/partner", tags=["Partner Management"])


class RotateKeyRequest(BaseModel):
    """Request to rotate API key"""
    validity_days: int = 365  # Default 1 year
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "validity_days": 365
        }
    })


class RotateKeyResponse(BaseModel):
    """Response after key rotation"""
    new_api_key: str
    expires_at: str
    message: str
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "new_api_key": "sk_live_abc123...",
            "expires_at": "2025-12-05T00:00:00",
            "message": "API key rotated successfully. Please update your integration."
        }
    })


@router.post(
    "/rotate-key",
    response_model=RotateKeyResponse,
    summary="Rotate API Key",
    description="Generate a new API key. Old key will be invalidated immediately."
)
async def rotate_api_key(
    request: RotateKeyRequest,
    partner: Partner = Depends(verify_partner_token),
    db: Session = Depends(get_db)
) -> RotateKeyResponse:
    """
    Rotate partner API key
    
    Requires valid current API key for authentication.
    The old key is immediately invalidated.
    
    Args:
        request: Rotation request with validity period
        partner: Authenticated partner
        db: Database session
        
    Returns:
        New API key and expiration date
    """
    logger.info(f"API key rotation requested for partner: {partner.name}")
    
    # Validate validity period (max 5 years)
    if request.validity_days < 1 or request.validity_days > 1825:
        raise HTTPException(
            status_code=400,
            detail="Validity period must be between 1 and 1825 days (5 years)"
        )
    
    # Calculate expiration
    expires_at = datetime.utcnow() + timedelta(days=request.validity_days)
    
    # Rotate key
    new_api_key = rotate_partner_api_key(db, partner.id, expires_at)
    
    logger.info(
        f"API key rotated successfully for partner: {partner.name}, "
        f"expires at: {expires_at.isoformat()}"
    )
    
    return RotateKeyResponse(
        new_api_key=new_api_key,
        expires_at=expires_at.isoformat(),
        message="API key rotated successfully. Please update your integration with the new key."
    )
