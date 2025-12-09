"""
Partner API endpoints (refactored)

Endpoints for partner integrations with API key authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from app.core.dependencies import get_db
from app.repositories.partner import PartnerRepository
from app.core.exceptions import ValidationError, ServiceError
from app.config import settings
from app.middleware.rate_limit import limiter
from app.cache import redis_client
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.orm import Session
import logging

from app.api.deps import get_detection_service, verify_partner_token
from app.services.detection_service import DetectionService, DetectionRequest


logger = logging.getLogger(__name__)

router = APIRouter()


# Response model
class PartnerDetectResponse(BaseModel):
    """Universal partner detection response"""
    is_scam: bool
    risk_score: float
    category: str
    reason: str
    advice: str
    model_version: str
    request_id: str
    
    # Detection metadata
    detection_mode: str = Field(..., description="Detection type: 'text', 'image', or 'hybrid'")
    extracted_text: Optional[str] = Field(None, description="OCR extracted text (if image)")
    visual_analysis: Optional[dict] = Field(None, description="Visual forensics (if image)")
    slip_verification: Optional[dict] = Field(None, description="Bank slip verification (if applicable)")
    forensics: Optional[dict] = Field(None, description="Image manipulation detection (partners only)")
    
    # Usage tracking
    usage: dict = Field(..., description="Quota usage information")


@router.post(
    "/v1/partner/detect",
    response_model=PartnerDetectResponse,
    summary="ตรวจสอบข้อความ (Partner API)",
    description="Partner API สำหรับตรวจสอบข้อความ (Text Only)",
    tags=["Partner"]
)
@limiter.limit("500/minute")  # Higher limit for partners
async def detect_partner_universal(
    request: Request,
    # Text input
    message: str = Form(..., description="ข้อความที่ต้องการตรวจสอบ"),
    channel: Optional[str] = Form("API"),
    user_ref: Optional[str] = Form(None),
    # Auth
    partner_id: str = Depends(verify_partner_token),
    service: DetectionService = Depends(get_detection_service),
    db: Session = Depends(get_db)
) -> PartnerDetectResponse:
    """
    Partner Text Detection Endpoint
    """
    try:
        # Check quota (Text only)
        partner_repo = PartnerRepository(db)
        partner = partner_repo.get_by_id(partner_id)
        
        if not partner:
            raise HTTPException(404, "Partner not found")
        
        # Check quota
        _check_quota(partner, "text")
        
        # Process text
        result = await _process_text_detection(
            message=message,
            channel=channel,
            user_ref=user_ref,
            partner_id=partner_id,
            service=service
        )
        
        # Track usage
        _track_usage(partner_repo, partner_id, "text")
        
        # Get remaining quota
        partner = partner_repo.get_by_id(partner_id)  # Refresh
        usage_info = _get_usage_info(partner, "text")
        
        return PartnerDetectResponse(
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            advice=result.advice,
            model_version=result.model_version,
            request_id=result.request_id,
            detection_mode="text",
            extracted_text=None,
            visual_analysis=None,
            slip_verification=None,
            forensics=None,
            usage=usage_info
        )
        
    except HTTPException:
        raise
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


# Helper functions

def _check_quota(partner, detection_mode: str):
    """Check if partner has remaining quota."""
    # Text quota
    text_limit = getattr(partner, 'text_quota_per_day', 1000)
    text_used = getattr(partner, 'text_used_today', 0)
    
    if text_used >= text_limit:
        raise HTTPException(
            status_code=429,
            detail=f"Text quota exceeded ({text_limit}/day). Please upgrade your plan."
        )


async def _process_text_detection(message: str, channel: str, user_ref: Optional[str], 
                                  partner_id: str, service: DetectionService):
    """Process text-only detection."""
    det_request = DetectionRequest(
        message=message,
        channel=channel or "API",
        user_ref=user_ref
    )
    
    return await service.detect_scam(
        request=det_request,
        source="partner",
        partner_id=partner_id
    )


def _track_usage(partner_repo: PartnerRepository, partner_id: str, detection_mode: str):
    """Track usage based on detection mode."""
    # Increment general usage counter
    partner_repo.increment_usage(partner_id)
    # TODO: Implement mode-specific tracking in database
    # For now, we're tracking in general usage
    # Future: Add text_used_today and image_used_today columns


def _get_usage_info(partner, detection_mode: str) -> dict:
    """Get usage information for response."""
    # Placeholder values
    # Text only
    quota_type = "text"
    total_quota = getattr(partner, 'text_quota_per_day', 1000)
    used_today = getattr(partner, 'text_used_today', 0)

    
    remaining = max(0, total_quota - used_today)
    
    return {
        "quota_type": quota_type,
        "total_quota": total_quota,
        "used_today": used_today,
        "remaining_today": remaining
    }

