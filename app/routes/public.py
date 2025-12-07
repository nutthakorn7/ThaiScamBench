"""Public API endpoints"""
from fastapi import APIRouter, Depends, Request, HTTPException
from app.models.schemas import PublicDetectRequest, PublicDetectResponse
from app.services.detection_service import DetectionService, DetectionRequest
from app.dependencies import get_detection_service
from app.config import settings
from app.middleware.rate_limit import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/public", tags=["Public"])


@router.post(
    "/detect/text",
    response_model=PublicDetectResponse,
    summary="ตรวจสอบข้อความหลอกลวง (Public)",
    description="ตรวจสอบข้อความว่ามีลักษณะการหลอกลวงหรือไม่ สำหรับผู้ใช้ทั่วไป"
)
@limiter.limit(f"{settings.rate_limit_requests}/{settings.rate_limit_window} seconds")
async def detect_scam_public(
    request: Request,
    body: PublicDetectRequest,
    service: DetectionService = Depends(get_detection_service)
) -> PublicDetectResponse:
    """
    Public endpoint for scam detection with rate limiting
    
    Args:
        request: Starlette Request (for rate limiting)
        body: PublicDetectRequest with message and optional channel
        service: Injected DetectionService
        
    Returns:
        PublicDetectResponse with detection results and model version
        
    Raises:
        HTTPException: If analysis fails
        RateLimitExceeded: If rate limit is exceeded (handled by middleware)
    """
    try:
        # Create service request
        detect_request = DetectionRequest(
            message=body.message,
            channel=body.channel,
            user_ref=None
        )
        
        # Call service
        result = await service.detect_scam(
            request=detect_request,
            source="public"
        )
        
        # Map to response model
        # (DetectionResponse fields match PublicDetectResponse mostly)
        return PublicDetectResponse(
            request_id=result.request_id,
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            advice=result.advice,
            model_version=result.model_version
        )
        
    except Exception as e:
        logger.error(f"Public detection error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการตรวจสอบ: {str(e)}"
        )
