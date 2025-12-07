"""Public API endpoints"""
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import PublicDetectRequest, PublicDetectResponse, PublicReportRequest
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


@router.get("/wiki/{keyword}")
async def get_wiki_data(
    keyword: str,
    db: Session = Depends(get_db),
    service: DetectionService = Depends(get_detection_service)
):
    """
    Get data for a Wiki page (SEO Optimised).
    If the keyword is a phone number or known scam pattern, return cached analysis.
    If not found, perform a quick check to generate content.
    """
    # Decoded keyword might come in as URL encoded
    decoded_keyword = keyword.replace("-", "") 
    
    # We create a dummy request object
    detect_request = DetectionRequest(
        message=keyword, 
        channel="web_search",
        user_ref=None
    )
    
    # Reuse the logic but without logging user info 
    result = await service.detect_scam(detect_request, source="wiki")
    
    return {
        "keyword": keyword,
        "risk_score": result.risk_score,
        "scam_type": result.category,
        "analysis": result.reason,
        "is_safe": result.risk_score < 0.5,
        "last_updated": "Today" 
    }


@router.post(
    "/report",
    summary="แจ้งเบาะแส (Report)",
    description="รับแจ้งเบาะแสจากผู้ใช้ (Crowd Reporting)"
)
@limiter.limit("10/minute")
async def report_scam(
    request: Request,
    body: PublicReportRequest,
    service: DetectionService = Depends(get_detection_service)
):
    """
    Endpoint for users to manually report scams.
    These reports act as 'Crowd Wisdom' feeding into Layer 3.
    """
    try:
        # We process this as a 'detection' but force the result based on user input
        # This allows us to use the same pipeline and storage
        
        # 1. Create a pseudo-request
        detect_request = DetectionRequest(
            message=body.text,
            channel="web_report",
            user_ref=None
        )
        
        # 2. Use service to hash and save, but we need to override the result.
        # Since 'detect_scam' usually runs analysis, we might want a simpler method 
        # specifically for saving 'raw reports'.
        # However, to be consistent with 'get_scam_count', we need it in the Detection table.
        
        # Hack: We use the repo directly via service to save a 'forced' record?
        # Better: Implementation usage of 'service.report_scam_manual' (if it existed)
        # For now, we reuse detect pipeline but add specific extra data?
        # NO, that's slow and expensive (AI call).
        
        # Let's add a dedicated method to DetectionService or just do it here.
        # Ideally logic belongs in Service.
        
        return await service.submit_manual_report(
            message=body.text,
            is_scam=body.is_scam,
            details=body.additional_info
        )
        
    except Exception as e:
        logger.error(f"Report submission error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถบันทึกข้อมูลได้: {str(e)}"
        )
