"""
Partner API endpoints (refactored)

Endpoints for partner integrations with API key authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session
import logging

from app.api.deps import get_detection_service, verify_partner_token
from app.services.detection_service import DetectionService, DetectionRequest
from app.core.dependencies import get_db
from app.repositories.partner import PartnerRepository
from app.core.exceptions import ValidationError, ServiceError
from app.config import settings
from app.middleware.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class PartnerDetectRequest(BaseModel):
    """Partner detection request"""
    message: str = Field(..., min_length=1, max_length=10000)
    channel: Optional[str] = Field("SMS", description="Message channel")
    user_ref: Optional[str] = Field(None, description="Partner's user reference")


class PartnerDetectResponse(BaseModel):
    """Partner detection response"""
    is_scam: bool
    risk_score: float
    category: str
    reason: str
    advice: str
    model_version: str
    request_id: str


@router.post(
    "/v1/partner/detect/text",
    response_model=PartnerDetectResponse,
    summary="ตรวจสอบข้อความ (Partner API)",
    description="Partner API สำหรับตรวจสอบข้อความ ต้องใช้ API key",
    tags=["Partner"]
)
@limiter.limit("500/minute")  # Higher limit for partners
async def detect_scam_partner(
    request: Request,
    body: PartnerDetectRequest,
    partner_id: str = Depends(verify_partner_token),
    service: DetectionService = Depends(get_detection_service),
    db: Session = Depends(get_db)
) -> PartnerDetectResponse:
    """
    Partner scam detection endpoint
    
    **Requires:** Partner API key in Authorization header
    
    **Rate Limit:** 500 requests per minute
    
    **Example:**
    ```bash
    curl -X POST https://api.thaiscambench.com/v1/partner/detect/text \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"message": "ข้อความตรวจสอบ", "channel": "SMS"}'
    ```
    """
    try:
        logger.info(
            f"Partner detection - "
            f"partner_id: {partner_id}, "
            f"message_length: {len(body.message)}"
        )
        
        # Increment partner usage count
        partner_repo = PartnerRepository(db)
        partner_repo.increment_usage(partner_id)
        
        # Create detection request
        det_request = DetectionRequest(
            message=body.message,
            channel=body.channel or "SMS",
            user_ref=body.user_ref
        )
        
        # Call detection service
        result = await service.detect_scam(
            request=det_request,
            source="partner",
            partner_id=partner_id
        )
        
        logger.info(
            f"Partner detection complete - "
            f"partner_id: {partner_id}, "
            f"is_scam: {result.is_scam}, "
            f"request_id: {result.request_id}"
        )
        
        return PartnerDetectResponse(
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            advice=result.advice,
            model_version=result.model_version,
            request_id=result.request_id
        )
        
    except ValidationError as e:
        logger.warning(f"Partner validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ServiceError as e:
        logger.error(f"Partner service error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Detection service error"
        )
    except Exception as e:
        logger.error(f"Partner unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
