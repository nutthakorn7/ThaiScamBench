"""Detection logging service"""
from sqlalchemy.orm import Session
from app.models.database import Detection, DetectionSource
from typing import Optional
import hashlib
import uuid
import logging

logger = logging.getLogger(__name__)


def hash_message(message: str) -> str:
    """
    Hash a message using SHA256 for privacy
    
    Args:
        message: Message text
        
    Returns:
        SHA256 hash (64 character hex string)
    """
    return hashlib.sha256(message.encode('utf-8')).hexdigest()


def log_detection(
    db: Session,
    source: DetectionSource,
    message: str,
    is_scam: bool,
    category: str,
    risk_score: float,
    model_version: str,
    llm_version: str,
    channel: Optional[str] = None,
    partner_id: Optional[str] = None,
    user_ref: Optional[str] = None
) -> Detection:
    """
    Log a detection request to the database
    
    Args:
        db: Database session
        source: Detection source (public/partner)
        message: Original message (will be hashed)
        is_scam: Detection result
        category: Scam category
        risk_score: Risk score (0-1)
        model_version: Model version used
        llm_version: LLM version used
        channel: Optional channel (SMS, LINE, etc.)
        partner_id: Optional partner ID (for partner requests)
        user_ref: Optional user reference from partner
        
    Returns:
        Created Detection object
    """
    # Generate request ID
    request_id = str(uuid.uuid4())
    
    # Hash the message for privacy
    message_hash = hash_message(message)
    
    # Create detection record
    detection = Detection(
        request_id=request_id,
        source=source.value,
        partner_id=partner_id,
        channel=channel,
        message_hash=message_hash,
        is_scam=is_scam,
        category=category,
        risk_score=risk_score,
        model_version=model_version,
        llm_version=llm_version,
        user_ref=user_ref
    )
    
    db.add(detection)
    db.commit()
    db.refresh(detection)
    
    logger.info(
        f"Logged detection: request_id={request_id}, "
        f"source={source.value}, is_scam={is_scam}, category={category}"
    )
    
    return detection
