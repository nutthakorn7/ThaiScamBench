"""Database models for partners and detections"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid
import enum


# Generate UUID for SQLite compatibility
def generate_uuid():
    return str(uuid.uuid4())


class PartnerStatus(str, enum.Enum):
    """Partner account status"""
    active = "active"
    inactive = "inactive"


class DetectionSource(str, enum.Enum):
    """Source of detection request"""
    public = "public"
    partner = "partner"


class Partner(Base):
    """Partner account for API access"""
    __tablename__ = "partners"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True, index=True)
    api_key_hash = Column(String(255), nullable=False)
    api_key_expires_at = Column(DateTime, nullable=True)  # None = never expires (backward compat)
    last_rotated_at = Column(DateTime, nullable=True)  # Track key rotation
    status = Column(String(20), nullable=False, default=PartnerStatus.active.value)
    rate_limit_per_min = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship to detections
    detections = relationship("Detection", back_populates="partner")
    
    def __repr__(self):
        return f"<Partner(name='{self.name}', status='{self.status}')>"


class Detection(Base):
    """Detection request log"""
    __tablename__ = "detections"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    source = Column(String(20), nullable=False, index=True)
    partner_id = Column(String(36), ForeignKey("partners.id"), nullable=True, index=True)
    channel = Column(String(50), nullable=True)
    message_hash = Column(String(64), nullable=False)  # SHA256
    is_scam = Column(Boolean, nullable=False)
    category = Column(String(50), nullable=False)
    risk_score = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False)
    llm_version = Column(String(50), nullable=False)
    request_id = Column(String(36), nullable=False, unique=True, index=True)
    user_ref = Column(String(255), nullable=True)  # Partner's reference
    
    # Explanation fields (added for refactoring)
    reason = Column(String(2000), nullable=True)  # Detection reason
    advice = Column(String(2000), nullable=True)  # Safety advice
    extra_data = Column(String(1000), nullable=True)  # JSON extra data (not 'metadata' - reserved!)
    
    # Relationship to partner
    partner = relationship("Partner", back_populates="detections")
    
    def __repr__(self):
        return f"<Detection(id='{self.id}', source='{self.source}', is_scam={self.is_scam})>"


class Feedback(Base):
    """User feedback on detection results"""
    __tablename__ = "feedback"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), ForeignKey("detections.request_id"), nullable=False, index=True)
    feedback_type = Column(String(20), nullable=False)  # 'correct' or 'incorrect'
    comment = Column(String(1000), nullable=True)  # Optional user comment
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    def __repr__(self):
        return f"<Feedback(request_id='{self.request_id}', type='{self.feedback_type}')>"
