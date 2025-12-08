from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.database import generate_uuid

class AuditLog(Base):
    """
    Audit Log for tracking administrative actions.
    Records who did what, when, and to whom.
    """
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # e.g., 'CREATE_USER', 'BAN_USER'
    target_id = Column(String(255), nullable=True) # ID of affected resource
    details = Column(Text, nullable=True) # JSON or text description
    ip_address = Column(String(45), nullable=True) # IPv4 or IPv6
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationship to Actor
    actor = relationship("app.models.database.User", backref="actions")

    def __repr__(self):
        return f"<AuditLog(action='{self.action}', actor='{self.actor_id}', target='{self.target_id}')>"
