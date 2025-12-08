import logging
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.audit import AuditLog
from app.middleware.auth import verify_admin_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/admin", tags=["Admin Audit"])

# --- Response Models ---
class AuditLogResponse(BaseModel):
    id: str
    actor_id: str
    action: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int

# --- Endpoints ---

@router.get(
    "/logs",
    response_model=AuditLogListResponse,
    summary="View Audit Logs",
    description="Retrieve system activity logs (Admin only)"
)
async def get_audit_logs(
    page: int = 1,
    page_size: int = 50,
    action: Optional[str] = None,
    actor_id: Optional[str] = None,
    admin_id: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """
    List audit logs with filtering and pagination.
    """
    query = db.query(AuditLog)

    # Filtering
    if action:
        query = query.filter(AuditLog.action == action)
    
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)

    # Sorting (Newest first)
    query = query.order_by(AuditLog.created_at.desc())

    # Pagination
    total = query.count()
    logs = query.offset((page - 1) * page_size).limit(page_size).all()

    return AuditLogListResponse(
        items=[
            AuditLogResponse(
                id=log.id,
                actor_id=log.actor_id,
                action=log.action,
                target_id=log.target_id,
                details=log.details,
                ip_address=log.ip_address,
                created_at=log.created_at
            )
            for log in logs
        ],
        total=total,
        page=page,
        page_size=page_size
    )
