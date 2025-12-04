"""Authentication middleware for partner API"""
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.partner_service import get_partner_by_api_key
from app.models.database import Partner
import logging

logger = logging.getLogger(__name__)


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
    
    logger.info(f"Authenticated partner: {partner.name} (ID: {partner.id})")
    return partner
