"""Partner API endpoints for authenticated partners"""
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.models.schemas import PartnerDetectRequest, PartnerDetectResponse
from app.services.scam_classifier import classify_scam
from app.services.llm_explainer import explain_with_llm
from app.services.detection_logger import log_detection
from app.models.database import Partner, DetectionSource
from app.middleware.auth import verify_partner_token
from app.middleware.rate_limit import limiter
from app.database import get_db
from app.config import settings
from app.middleware.security import validate_message_content
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
    db: Session = Depends(get_db)
) -> PartnerDetectResponse:
    """
    Partner endpoint for scam detection with authentication and logging
    
    Args:
        request: FastAPI Request object (for slowapi)
        body: PartnerDetectRequest with message, channel, user_ref
        partner: Authenticated partner from Bearer token
        db: Database session
        
    Returns:
        PartnerDetectResponse with detection results, request_id, and versions
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        logger.info(
            f"Partner detection request - "
            f"partner: {partner.name}, "
            f"message_length: {len(body.message)}, "
            f"channel: {body.channel or 'not specified'}, "
            f"user_ref: {body.user_ref or 'not specified'}"
        )
        
        # Step 0: Validate message content (security)
        validate_message_content(body.message)
        
        # Step 1: Classify the message with partner threshold (strict)
        is_scam, risk_score, category = classify_scam(body.message, settings.partner_threshold)
        
        # Step 2: Generate explanation with LLM
        reason, advice = explain_with_llm(body.message, category)
        
        # Step 3: Log detection to database
        detection = log_detection(
            db=db,
            source=DetectionSource.partner,
            message=body.message,
            is_scam=is_scam,
            category=category,
            risk_score=risk_score,
            model_version=settings.model_version,
            llm_version=settings.llm_version,
            channel=body.channel,
            partner_id=partner.id,
            user_ref=body.user_ref
        )
        
        # Step 4: Build response
        response = PartnerDetectResponse(
            request_id=detection.request_id,
            is_scam=is_scam,
            risk_score=risk_score,
            category=category,
            reason=reason,
            advice=advice,
            model_version=settings.model_version,
            llm_version=settings.llm_version
        )
        
        logger.info(
            f"Partner detection completed - "
            f"request_id: {detection.request_id}, "
            f"is_scam: {is_scam}, category: {category}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in partner detection: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการตรวจสอบ: {str(e)}"
        )
