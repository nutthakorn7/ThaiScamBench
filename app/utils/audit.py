import json
import logging
from typing import Union, Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

logger = logging.getLogger(__name__)

def log_action(
    db: Session,
    actor_id: str,
    action: str,
    target_id: str = None,
    details: Union[dict, str] = None,
    ip_address: str = None
):
    """
    Log an administrative action to the database.
    
    Args:
        db: Database session
        actor_id: UUID of the admin performing value
        action: String identifying action (e.g. 'CREATE_USER')
        target_id: UUID/String of the object being acted on
        details: Dict or String describing changs
        ip_address: String of request IP
    """
    try:
        # Serialize details if dict
        detail_str = None
        if details:
            if isinstance(details, dict):
                detail_str = json.dumps(details, ensure_ascii=False)
            else:
                detail_str = str(details)

        log_entry = AuditLog(
            actor_id=actor_id,
            action=action,
            target_id=target_id,
            details=detail_str,
            ip_address=ip_address
        )
        
        db.add(log_entry)
        # Note: We do NOT commit here to allow the caller to commit as part of their atomic transaction
        # Or caller can commit explicitly.
        # But generally logging should be part of the transaction.
        
        logger.info(f"📝 AUDIT: [{action}] by {actor_id} on {target_id}")
        
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        # Don't raise error to prevent blocking main action
