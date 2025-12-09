"""Feedback endpoints for user feedback collection"""
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from app.database import get_db
from app.models.database import Feedback, Detection
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/public", tags=["Feedback"])


class FeedbackRequest(BaseModel):
    """Feedback submission request"""
    request_id: str = Field(..., description="Request ID from detection response")
    feedback_type: str = Field(..., description="Feedback type: 'correct' or 'incorrect'")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional comment")
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "request_id": "550e8400-e29b-41d4-a716-446655440000",
            "feedback_type": "incorrect",
            "comment": "ข้อความนี้เป็นข้อความปกติจากเพื่อน"
        }
    })


class FeedbackResponse(BaseModel):
    """Feedback submission response"""
    success: bool
    message: str
    feedback_id: str
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "success": True,
            "message": "ขอบคุณสำหรับ feedback ของคุณ",
            "feedback_id": "abc123..."
        }
    })


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    summary="Submit feedback on detection result",
    description="ส่ง feedback ว่าผลการตรวจสอบถูกต้องหรือไม่"
)
async def submit_feedback(
    feedback_req: FeedbackRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> FeedbackResponse:
    """
    Submit user feedback on detection result
    
    Args:
        feedback_req: Feedback request with request_id and feedback_type
        request: FastAPI Request object for metadata
        db: Database session
        
    Returns:
        FeedbackResponse with success status
        
    Raises:
        HTTPException: If request_id not found or invalid feedback_type
    """
    # Validate feedback type
    if feedback_req.feedback_type not in ['correct', 'incorrect']:
        raise HTTPException(
            status_code=400,
            detail="Invalid feedback_type. Must be 'correct' or 'incorrect'"
        )
    
    # Verify request_id exists
    detection = db.query(Detection).filter(
        Detection.request_id == feedback_req.request_id
    ).first()
    
    if not detection:
        raise HTTPException(
            status_code=404,
            detail="Request ID not found"
        )
    
    # Create feedback record
    feedback = Feedback(
        request_id=feedback_req.request_id,
        feedback_type=feedback_req.feedback_type,
        comment=feedback_req.comment,
        user_agent=request.headers.get('user-agent'),
        ip_address=request.client.host if request.client else None
    )
    
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    logger.info(
        f"Feedback received: request_id={feedback_req.request_id}, "
        f"type={feedback_req.feedback_type}, feedback_id={feedback.id}"
    )
    
    return FeedbackResponse(
        success=True,
        message="ขอบคุณสำหรับ feedback ของคุณ จะนำไปปรับปรุงระบบต่อไป",
        feedback_id=feedback.id
    )
