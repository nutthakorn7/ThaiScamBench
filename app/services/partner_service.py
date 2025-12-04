"""Partner management service"""
from sqlalchemy.orm import Session
from app.models.database import Partner, PartnerStatus
from typing import Optional, Tuple
import secrets
import hashlib
import logging

logger = logging.getLogger(__name__)


def generate_api_key() -> str:
    """
    Generate a secure random API key
    
    Returns:
        43-character random token (URL-safe base64 encoded)
    """
    # Generate 32 bytes = 43 characters in base64 (fits in bcrypt 72 byte limit)
    return secrets.token_urlsafe(32)


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key using SHA256 with salt
    
    Args:
        api_key: Plain text API key
        
    Returns:
        Hashed API key in format: salt$hash
    """
    # Generate 32-byte salt
    salt = secrets.token_hex(32)
    # Hash: salt + api_key
    hash_value = hashlib.sha256((salt + api_key).encode()).hexdigest()
    # Store as: salt$hash
    return f"{salt}${hash_value}"


def verify_api_key(api_key: str, stored_hash: str) -> bool:
    """
    Verify an API key against its hash
    
    Args:
        api_key: Plain text API key
        stored_hash: Stored hash in format: salt$hash
        
    Returns:
        True if valid, False otherwise
    """
    try:
        # Split salt and hash
        salt, expected_hash = stored_hash.split('$')
        # Compute hash with same salt
        computed_hash = hashlib.sha256((salt + api_key).encode()).hexdigest()
        # Constant-time comparison
        return secrets.compare_digest(computed_hash, expected_hash)
    except Exception as e:
        logger.error(f"Error verifying API key: {e}")
        return False


def create_partner(
    db: Session,
    name: str,
    rate_limit_per_min: int = 100
) -> Tuple[Partner, str]:
    """
    Create a new partner with API key
    
    Args:
        db: Database session
        name: Partner name
        rate_limit_per_min: Rate limit for this partner
        
    Returns:
        Tuple of (Partner object, plain API key)
        
    Raises:
        ValueError: If partner name already exists
    """
    # Check if partner already exists
    existing = db.query(Partner).filter(Partner.name == name).first()
    if existing:
        raise ValueError(f"Partner with name '{name}' already exists")
    
    # Generate API key
    api_key = generate_api_key()
    api_key_hash = hash_api_key(api_key)
    
    # Create partner
    partner = Partner(
        name=name,
        api_key_hash=api_key_hash,
        status=PartnerStatus.active.value,
        rate_limit_per_min=rate_limit_per_min
    )
    
    db.add(partner)
    db.commit()
    db.refresh(partner)
    
    logger.info(f"Created partner: {name} (ID: {partner.id})")
    
    return partner, api_key


def get_partner_by_api_key(db: Session, api_key: str) -> Optional[Partner]:
    """
    Get partner by API key
    
    Args:
        db: Database session
        api_key: Plain text API key
        
    Returns:
        Partner if found and key is valid, None otherwise
    """
    # Get all active partners (in production, add caching)
    partners = db.query(Partner).filter(Partner.status == PartnerStatus.active.value).all()
    
    for partner in partners:
        if verify_api_key(api_key, partner.api_key_hash):
            return partner
    
    return None


def get_partner_by_id(db: Session, partner_id: str) -> Optional[Partner]:
    """
    Get partner by ID
    
    Args:
        db: Database session
        partner_id: Partner UUID
        
    Returns:
        Partner if found, None otherwise
    """
    return db.query(Partner).filter(Partner.id == partner_id).first()
