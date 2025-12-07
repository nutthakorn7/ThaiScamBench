"""Partner API endpoints for authenticated partners"""
from fastapi import APIRouter, HTTPException, Depends, Request
from app.models.schemas import PartnerDetectRequest, PartnerDetectResponse
from app.models.database import Partner
from app.services.detection_service import DetectionService, DetectionRequest
from app.dependencies import get_detection_service
from app.middleware.auth import verify_partner_token
from app.middleware.rate_limit import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/partner", tags=["Partner"])


@router.post(
    "/detect/text",
    response_model=PartnerDetectResponse,
    summary="ตรวจสอบข้อความหลอกลวง (Partner API)",
    description="Partner API สำหรับธนาคารและองค์กรคู่ค้า ต้องใช้ API Key"
)
@limiter.limit("200/60 seconds")  # Default partner rate limit
async def detect_scam_partner(
    request: Request,  # Required for slowapi (must be named 'request')
    body: PartnerDetectRequest,
    partner: Partner = Depends(verify_partner_token),
    service: DetectionService = Depends(get_detection_service)
) -> PartnerDetectResponse:
    """
    Partner endpoint for scam detection with authentication and logging
    
    Args:
        request: FastAPI Request object (for slowapi)
        body: PartnerDetectRequest with message, channel, user_ref
        partner: Authenticated partner from Bearer token
        service: Injected DetectionService
        
    Returns:
        PartnerDetectResponse with detection results, request_id, and versions
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        # Create service request
        detect_request = DetectionRequest(
            message=body.message,
            channel=body.channel,
            user_ref=body.user_ref
        )
        
        # Call service
        result = await service.detect_scam(
            request=detect_request,
            source="partner",
            partner_id=partner.id
        )
        
        # Map to response model
        return PartnerDetectResponse(
            request_id=result.request_id,
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            advice=result.advice,
            model_version=result.model_version,
            llm_version=result.llm_version
        )
        
    except Exception as e:
        logger.error(f"Error in partner detection: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการตรวจสอบ: {str(e)}"
        )
