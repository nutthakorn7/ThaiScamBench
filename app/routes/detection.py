"""Scam detection endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import ScamCheckRequest, ScamCheckResponse
from app.services.detection_service import DetectionService, DetectionRequest
from app.dependencies import get_detection_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Detection"])


@router.post(
    "/detect",
    response_model=ScamCheckResponse,
    summary="Detect Scam",
    description="ตรวจสอบข้อความว่ามีลักษณะการหลอกลวงหรือไม่ (Check if a message is a scam)"
)
async def detect_scam(
    request: ScamCheckRequest,
    service: DetectionService = Depends(get_detection_service)
) -> ScamCheckResponse:
    """
    Analyze a message for scam indicators
    
    Args:
        request: ScamCheckRequest containing the message to analyze
        service: Injected DetectionService
        
    Returns:
        ScamCheckResponse with detection results, risk score, and advice
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        logger.info(f"Received scam detection request (message length: {len(request.message)})")
        
        # Create service request
        detect_request = DetectionRequest(
            message=request.message,
            channel="legacy_api"
        )
        
        # Call service (source as public-legacy)
        result = await service.detect_scam(
            request=detect_request,
            source="public"
        )
        
        # Map to response model (ScamCheckResponse)
        return ScamCheckResponse(
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            advice=result.advice
        )
        
    except Exception as e:
        logger.error(f"Error during scam detection: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการตรวจสอบ: {str(e)}"
        )
