"""Audit log database model"""
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database import Base
from datetime import datetime
import uuid


def generate_uuid():
    """Generate UUID for audit log ID"""
    return str(uuid.uuid4())


class AuditLog(Base):
    """Audit log for tracking API usage without PII"""
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    endpoint = Column(String(255), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    ip_hash = Column(String(64), nullable=True)  # SHA256 hash of IP
    user_agent = Column(String(255), nullable=True)
    partner_id = Column(String(36), nullable=True, index=True)
    request_id = Column(String(36), nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)  # Error details (no PII)
    
    def __repr__(self):
        return f"<AuditLog({self.method} {self.endpoint} - {self.status_code})>"
