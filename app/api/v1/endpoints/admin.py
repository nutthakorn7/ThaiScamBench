"""
Admin API endpoints (refactored)

Administrative endpoints for system monitoring and management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.core.dependencies import get_db
from app.api.deps import verify_admin_token
from app.repositories.detection import DetectionRepository
from app.core.exceptions import DatabaseError

logger = logging.getLogger(__name__)

router = APIRouter()


# Response models
class StatsSummary(BaseModel):
    """Statistics summary"""
    total_requests: int
    requests_period: int
    scam_detected: int
    safe_messages: int


class CategoryStat(BaseModel):
    """Category statistics"""
    category: str
    count: int


class StatsResponse(BaseModel):
    """Complete stats response"""
    summary: StatsSummary
    category_breakdown: List[CategoryStat]
    period_days: int


@router.get(
    "/admin/stats/summary",
    response_model=StatsResponse,
    summary="ดูสถิติการตรวจสอบ",
    description="ดูภาพรวมการใช้งานระบบ (Admin only)",
    tags=["Admin"]
)
async def get_stats_summary(
    days: int = 7,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_token)
) -> StatsResponse:
    """
    Get system statistics
    
    **Requires:** Admin token
    
    **Parameters:**
    - days: Period in days (default: 7)
    """
    try:
        logger.info(f"Admin stats request for {days} days")
        
        detection_repo = DetectionRepository(db)
        
        # Get summary
        summary = detection_repo.get_stats_summary(days=days)
        
        # Get category breakdown
        categories = detection_repo.get_category_stats()
        
        return StatsResponse(
            summary=StatsSummary(**summary),
            category_breakdown=[
                CategoryStat(**cat) for cat in categories
            ],
            period_days=days
        )
        
    except DatabaseError as e:
        logger.error(f"Database error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch statistics"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete(
    "/admin/data/cleanup",
    summary="ลบข้อมูลเก่า",
    description="ลบ detection records เก่ากว่าที่กำหนด (Admin only)",
    tags=["Admin"]
)
async def cleanup_old_data(
    days: int = 30,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """
    Delete old detection records (data retention)
    
    **Requires:** Admin token
    
    **Parameters:**
    - days: Delete records older than this (default: 30)
    """
    try:
        logger.info(f"Admin cleanup request: delete records older than {days} days")
        
        detection_repo = DetectionRepository(db)
        deleted_count = detection_repo.delete_old_records(days=days)
        
        logger.info(f"Cleanup complete: {deleted_count} records deleted")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"ลบข้อมูลเก่ากว่า {days} วัน จำนวน {deleted_count} records"
        }
        
    except DatabaseError as e:
        logger.error(f"Database error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup data"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
