"""
Feedback API endpoints (refactored)

Clean API for user feedback on detection results.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session
import logging

from app.core.dependencies import get_db
from app.repositories.feedback import FeedbackRepository
from app.repositories.detection import DetectionRepository
from app.core.exceptions import ValidationError, ResourceNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class FeedbackRequest(BaseModel):
    """Feedback on detection result"""
    request_id: str = Field(..., description="Detection request ID")
    is_correct: bool = Field(..., description="Whether detection was correct")
    user_category: Optional[str] = Field(None, description="User's suggested category")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional comment")


class FeedbackResponse(BaseModel):
    """Feedback submission response"""
    success: bool = Field(..., description="Whether feedback was saved")
    message: str = Field(..., description="Response message")
    feedback_id: str = Field(..., description="Feedback ID")


@router.post(
    "/v1/public/feedback",
    response_model=FeedbackResponse,
    summary="ส่งความคิดเห็นเกี่ยวกับผลการตรวจสอบ",
    description="ช่วยปรับปรุงระบบโดยแจ้งว่าผลการตรวจสอบถูกต้องหรือไม่",
    tags=["Feedback"]
)
async def submit_feedback(
    body: FeedbackRequest,
    db: Session = Depends(get_db)
) -> FeedbackResponse:
    """
    Submit feedback on detection result
    
    **Example:**
    ```json
    {
        "request_id": "uuid-here",
        "is_correct": false,
        "user_category": "normal",
        "comment": "ข้อความนี้ไม่ใช่การหลอกลวง"
    }
    ```
    """
    try:
        logger.info(f"Feedback submission for request_id: {body.request_id}")
        
        # Verify detection exists
        detection_repo = DetectionRepository(db)
        detection = detection_repo.get(body.request_id)
        
        if not detection:
            raise ResourceNotFoundError(f"Detection {body.request_id} not found")
        
        # Create feedback
        feedback_repo = FeedbackRepository(db)
        
        # Check if feedback already exists
        existing = feedback_repo.get_by_detection(body.request_id)
        if existing:
            logger.warning(f"Feedback already exists for {body.request_id}")
            return FeedbackResponse(
                success=False,
                message="คุณได้ส่งความคิดเห็นสำหรับผลนี้แล้ว",
                feedback_id=str(existing.id)
            )
        
        # Save feedback
        feedback = feedback_repo.create_feedback(
            detection_id=body.request_id,
            is_correct=body.is_correct,
            user_category=body.user_category,
            comment=body.comment
        )
        
        logger.info(
            f"Feedback saved: id={feedback.id}, "
            f"is_correct={body.is_correct}"
        )
        
        return FeedbackResponse(
            success=True,
            message="ขอบคุณสำหรับความคิดเห็น! จะนำไปปรับปรุงระบบต่อไป",
            feedback_id=str(feedback.id)
        )
        
    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Feedback error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ไม่สามารถบันทึกความคิดเห็นได้"
        )
