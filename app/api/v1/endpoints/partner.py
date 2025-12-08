"""
Partner API endpoints (refactored)

Endpoints for partner integrations with API key authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session
import logging

from app.api.deps import get_detection_service, verify_partner_token
from app.services.detection_service import DetectionService, DetectionRequest
from app.services.ocr_service import OCRService, validate_image_extension
from app.core.dependencies import get_db
from app.repositories.partner import PartnerRepository
from app.core.exceptions import ValidationError, ServiceError
from app.config import settings
from app.middleware.rate_limit import limiter

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
    
    # Usage tracking
    usage: dict = Field(..., description="Quota usage information")


@router.post(
    "/v1/partner/detect",
    response_model=PartnerDetectResponse,
    summary="ตรวจสอบข้อความหรือรูปภาพ (Partner API - Universal)",
    description="""Partner API สำหรับตรวจสอบทั้งข้อความและรูปภาพ
    
    **Input Options:**
    - Text only: ส่ง `message` ใน JSON body
    - Image only: ส่ง `file` ใน multipart/form-data
    - Hybrid: ส่งทั้ง `file` และ `context` (ข้อความเพิ่มเติม)
    
    **Quota:** แยกนับ text และ image quota ต่างหาก
    """,
    tags=["Partner"]
)
@limiter.limit("500/minute")  # Higher limit for partners
async def detect_partner_universal(
    request: Request,
    # Text input (optional)
    message: Optional[str] = Form(None),
    # Image input (optional)
    file: Optional[UploadFile] = File(None),
    # Additional context for hybrid mode
    context: Optional[str] = Form(None),
    channel: Optional[str] = Form("API"),
    user_ref: Optional[str] = Form(None),
    # Auth
    partner_id: str = Depends(verify_partner_token),
    service: DetectionService = Depends(get_detection_service),
    db: Session = Depends(get_db)
) -> PartnerDetectResponse:
    """
    Universal Partner Detection Endpoint
    
    Accepts both text and image inputs with smart routing and separate quota tracking.
    
    **Examples:**
    
    1. Text detection:
    ```bash
    curl -X POST https://api.thaiscambench.com/v1/partner/detect \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -F "message=ข้อความตรวจสอบ"
    ```
    
    2. Image detection:
    ```bash
    curl -X POST https://api.thaiscambench.com/v1/partner/detect \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -F "file=@screenshot.jpg"
    ```
    
    3. Hybrid (image + context):
    ```bash
    curl -X POST https://api.thaiscambench.com/v1/partner/detect \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -F "file=@screenshot.jpg" \
      -F "context=คนนี้แอบอ้างเป็นเจ้าหน้าที่"
    ```
    """
    try:
        # 1. Determine detection mode
        detection_mode = _determine_detection_mode(message, file, context)
        
        logger.info(
            f"Partner universal detection - "
            f"partner_id: {partner_id}, "
            f"mode: {detection_mode}"
        )
        
        # 2. Check quota based on detection mode
        partner_repo = PartnerRepository(db)
        partner = partner_repo.get_by_id(partner_id)
        
        if not partner:
            raise HTTPException(404, "Partner not found")
        
        # Check quota
        _check_quota(partner, detection_mode)
        
        # 3. Process based on mode
        if detection_mode == "text":
            result = await _process_text_detection(
                message=message,
                channel=channel,
                user_ref=user_ref,
                partner_id=partner_id,
                service=service
            )
            extracted_text = None
            visual_analysis_data = None
            
        elif detection_mode == "image":
            result_data = await _process_image_detection(
                file=file,
                channel=channel,
                user_ref=user_ref,
                partner_id=partner_id,
                service=service
            )
            result = result_data["result"]
            extracted_text = result_data["extracted_text"]
            visual_analysis_data = result_data["visual_analysis"]
            
        else:  # hybrid
            result_data = await _process_hybrid_detection(
                file=file,
                message=message,
                context=context,
                channel=channel,
                user_ref=user_ref,
                partner_id=partner_id,
                service=service
            )
            result = result_data["result"]
            extracted_text = result_data["extracted_text"]
            visual_analysis_data = result_data["visual_analysis"]
        
        # 4. Track usage (increment based on mode)
        _track_usage(partner_repo, partner_id, detection_mode)
        
        # 5. Get remaining quota
        partner = partner_repo.get_by_id(partner_id)  # Refresh
        usage_info = _get_usage_info(partner, detection_mode)
        
        logger.info(
            f"Partner detection complete - "
            f"partner_id: {partner_id}, "
            f"mode: {detection_mode}, "
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
            request_id=result.request_id,
            detection_mode=detection_mode,
            extracted_text=extracted_text,
            visual_analysis=visual_analysis_data,
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

def _determine_detection_mode(message: Optional[str], file: Optional[UploadFile], context: Optional[str]) -> str:
    """Determine detection mode based on inputs."""
    has_file = file is not None
    has_message = message is not None and message.strip()
    has_context = context is not None and context.strip()
    
    if has_file and (has_message or has_context):
        return "hybrid"
    elif has_file:
        return "image"
    elif has_message:
        return "text"
    else:
        raise HTTPException(
            status_code=400,
            detail="Must provide either 'message' (text) or 'file' (image)"
        )


def _check_quota(partner, detection_mode: str):
    """Check if partner has remaining quota."""
    # For now, use simple request count
    # TODO: Implement separate text/image quota in Partner model
    
    if detection_mode in ["image", "hybrid"]:
        # Image costs more, check stricter limit
        # Placeholder: assume 100 image requests per day
        image_limit = getattr(partner, 'image_quota_per_day', 100)
        image_used = getattr(partner, 'image_used_today', 0)
        
        if image_used >= image_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Image quota exceeded ({image_limit}/day). Please upgrade your plan."
            )
    
    if detection_mode in ["text", "hybrid"]:
        # Text has higher quota
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


async def _process_image_detection(file: UploadFile, channel: str, user_ref: Optional[str],
                                   partner_id: str, service: DetectionService):
    """Process image-only detection."""
    # Validate image
    if not validate_image_extension(file.filename):
        raise HTTPException(400, "Invalid image format (support: .jpg, .png, .bmp, .webp)")
    
    image_content = await file.read()
    if len(image_content) == 0:
        raise HTTPException(400, "Empty image file")
    
    # Size limit: 10MB
    if len(image_content) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large (max 10MB)")
    
    # OCR + Visual Analysis
    ocr_service = OCRService()
    
    try:
        result_data = await ocr_service.extract_text_and_analyze(image_content)
        extracted_text = result_data["text"]
        visual_analysis = result_data.get("visual_analysis")
    except AttributeError:
        extracted_text = ocr_service.extract_text(image_content)
        visual_analysis = None
    
    if not extracted_text.strip():
        raise HTTPException(400, "No text found in image")
    
    # Detect scam in extracted text
    det_request = DetectionRequest(
        message=extracted_text,
        channel=channel or "Image/OCR",
        user_ref=user_ref
    )
    
    result = await service.detect_scam(
        request=det_request,
        source="partner",
        partner_id=partner_id
    )
    
    # Fuse with visual analysis
    if visual_analysis:
        text_risk = result.risk_score
        visual_risk = visual_analysis.visual_risk_score
        fused_risk = (text_risk * 0.6) + (visual_risk * 0.4)
        
        # Update result
        result.risk_score = fused_risk
        result.is_scam = fused_risk >= settings.partner_threshold
        
        if visual_analysis.is_suspicious:
            patterns_str = ", ".join(visual_analysis.detected_patterns)
            result.reason += f" | Visual: {visual_analysis.reason} (Patterns: {patterns_str})"
    
    return {
        "result": result,
        "extracted_text": extracted_text,
        "visual_analysis": {
            "enabled": visual_analysis is not None,
            "is_suspicious": visual_analysis.is_suspicious if visual_analysis else False,
            "risk_score": visual_analysis.visual_risk_score if visual_analysis else 0.0,
            "detected_patterns": visual_analysis.detected_patterns if visual_analysis else []
        } if visual_analysis else None
    }


async def _process_hybrid_detection(file: UploadFile, message: Optional[str], context: Optional[str],
                                    channel: str, user_ref: Optional[str], partner_id: str, 
                                    service: DetectionService):
    """Process hybrid (image + text context) detection."""
    # Get image analysis first (same as image-only)
    image_result = await _process_image_detection(file, channel, user_ref, partner_id, service)
    
    # Combine extracted text with context
    extracted_text = image_result["extracted_text"]
    additional_context = context or message or ""
    
    if additional_context:
        combined_text = f"{extracted_text}\n\n[Context]: {additional_context}"
        
        # Re-analyze with combined text
        det_request = DetectionRequest(
            message=combined_text,
            channel=channel or "Hybrid",
            user_ref=user_ref
        )
        
        result = await service.detect_scam(
            request=det_request,
            source="partner",
            partner_id=partner_id
        )
        
        # Apply visual analysis fusion
        visual_analysis = image_result["visual_analysis"]
        if visual_analysis and visual_analysis.get("enabled"):
            text_risk = result.risk_score
            visual_risk = visual_analysis["risk_score"]
            fused_risk = (text_risk * 0.6) + (visual_risk * 0.4)
            
            result.risk_score = fused_risk
            result.is_scam = fused_risk >= settings.partner_threshold
        
        image_result["result"] = result
    
    return image_result


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
    if detection_mode == "image":
        quota_type = "image"
        total_quota = getattr(partner, 'image_quota_per_day', 100)
        used_today = getattr(partner, 'image_used_today', 0)
    else:
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

