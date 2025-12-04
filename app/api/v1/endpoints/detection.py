"""
Detection API endpoints (refactored)

Clean API layer using DetectionService with proper error handling.
"""
from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
import logging

from app.api.deps import get_detection_service
from app.services.detection_service import DetectionService, DetectionRequest
from app.core.exceptions import ValidationError, ServiceError
from app.config import settings
from app.middleware.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class DetectTextRequest(BaseModel):
    """Request model for text detection"""
    message: str = Field(..., min_length=1, max_length=10000, description="Message to analyze")
    channel: Optional[str] = Field("SMS", description="Message channel (SMS, LINE, Email, etc.)")


class DetectTextResponse(BaseModel):
    """Response model for detection results"""
    is_scam: bool = Field(..., description="Whether message is classified as scam")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk score (0.0-1.0)")
    category: str = Field(..., description="Detected scam category")
    reason: str = Field(..., description="Explanation in Thai")
    advice: str = Field(..., description="Safety advice in Thai")
    model_version: str = Field(..., description="Model version used")
    llm_version: str = Field(..., description="LLM version used")
    request_id: str = Field(..., description="Unique request identifier")


# Public endpoint
@router.post(
    "/v1/public/detect/text",
    response_model=DetectTextResponse,
    summary="ตรวจสอบข้อความหลอกลวง (Public)",
    description="ตรวจสอบข้อความว่ามีลักษณะการหลอกลวงหรือไม่ สำหรับผู้ใช้ทั่วไป",
    tags=["Public Detection"]
)
@limiter.limit(f"{settings.rate_limit_requests}/{settings.rate_limit_window} seconds")
async def detect_scam_public(
    request: Request,
    body: DetectTextRequest,
    service: DetectionService = Depends(get_detection_service)
) -> DetectTextResponse:
    """
    Public scam detection endpoint
    
    **Rate Limit:** {rate_limit_requests} requests per {rate_limit_window} seconds
    
    **Features:**
    - Input validation and sanitization
    - PDPA compliant (no storage of original message)
    - Real-time classification
    - Thai language explanations
    
    **Example:**
    ```json
    {
        "message": "คุณมีพัสดุค้างชำระ 50 บาท",
        "channel": "SMS"
    }
    ```
    """
    try:
        logger.info(
            f"Public detection request - "
            f"message_length: {len(body.message)}, "
            f"channel: {body.channel}"
        )
        
        # Create service request
        det_request = DetectionRequest(
            message=body.message,
            channel=body.channel or "SMS"
        )
        
        # Call detection service (handles all business logic)
        result = await service.detect_scam(
            request=det_request,
            source="public"
        )
        
        # Map to response model
        response = DetectTextResponse(
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            advice=result.advice,
            model_version=result.model_version,
            llm_version=result.llm_version,
            request_id=result.request_id
        )
        
        logger.info(
            f"Detection completed - "
            f"is_scam: {result.is_scam}, "
            f"category: {result.category}, "
            f"request_id: {result.request_id}"
        )
        
        return response
        
    except ValidationError as e:
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ServiceError as e:
        logger.error(f"Service error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="เกิดข้อผิดพลาดภายในระบบ"
        )
