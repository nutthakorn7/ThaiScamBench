"""Public API endpoints"""
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.models.schemas import PublicDetectRequest, PublicDetectResponse
from app.services.scam_classifier import classify_scam
from app.services.llm_explainer import explain_with_llm
from app.services.detection_logger import log_detection
from app.models.database import DetectionSource
from app.database import get_db
from app.config import settings
from app.middleware.rate_limit import limiter
from app.middleware.security import validate_message_content
from app.cache import redis_client, generate_cache_key
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
    db: Session = Depends(get_db)
) -> PublicDetectResponse:
    """
    Public endpoint for scam detection with rate limiting
    
    Args:
        request: Starlette Request (for rate limiting)
        body: PublicDetectRequest with message and optional channel
        
    Returns:
        PublicDetectResponse with detection results and model version
        
    Raises:
        HTTPException: If analysis fails
        RateLimitExceeded: If rate limit is exceeded (handled by middleware)
    """
    try:
        logger.info(
            f"Public detection request - "
            f"message_length: {len(body.message)}, "
            f"channel: {body.channel or 'not specified'}"
        )
        
        # Step 0: Validate message content (security)
        validate_message_content(body.message)
        
        # CACHE CHECK: Try to get from cache first
        cache_key = generate_cache_key(body.message, prefix="public")
        cached_result = redis_client.get(cache_key)
        
        if cached_result:
            logger.info(f"✅ Cache HIT for public detection")
            return PublicDetectResponse(**cached_result)
        
        logger.info(f"⚠️  Cache MISS for public detection - processing...")
        
        # Step 1: Classify the message with public threshold (conservative)
        is_scam, risk_score, category = classify_scam(body.message, settings.public_threshold)
        
        # Step 2: Generate explanation with LLM
        reason, advice = explain_with_llm(body.message, category)
        
        # Step 3: Log detection to database
        detection = log_detection(
            db=db,
            source=DetectionSource.public,
            message=body.message,
            is_scam=is_scam,
            category=category,
            risk_score=risk_score,
            model_version=settings.model_version,
            llm_version=settings.llm_version,
            channel=body.channel
        )
        
        # Step 4: Build response
        response = PublicDetectResponse(
            is_scam=is_scam,
            risk_score=risk_score,
            category=category,
            reason=reason,
            advice=advice,
            model_version=settings.model_version
        )
        
        # CACHE SET: Store result for future requests
        redis_client.set(cache_key, response.model_dump(), ttl=settings.cache_ttl_seconds)
        
        logger.info(
            f"Detection completed - is_scam: {is_scam}, "
            f"category: {category}, channel: {body.channel}"
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการตรวจสอบ: {str(e)}"
        )
