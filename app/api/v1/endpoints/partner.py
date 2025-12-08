"""
Partner API endpoints (refactored)

Endpoints for partner integrations with API key authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List
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
from app.cache import redis_client
from app.utils.image_utils import validate_image_content, generate_image_hash, get_image_info
from app.utils.slip_verification import verify_thai_bank_slip, analyze_amount_anomalies, get_slip_verification_advice
from app.utils.visual_forensics import comprehensive_forensics
from app.utils.batch_processing import process_image_batch
from app.models.batch import BatchDetectionResponse

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
            forensics_data = None
            
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
            forensics_data = result_data.get("forensics")
            
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
            forensics_data = result_data.get("forensics")
        
        # 4. Bank slip verification (if image/hybrid mode)
        slip_verification_data = None
        if detection_mode in ["image", "hybrid"] and extracted_text:
            slip_result = verify_thai_bank_slip(extracted_text)
            slip_verification_data = {
                "is_likely_genuine": slip_result.is_likely_genuine,
                "trust_score": slip_result.trust_score,
                "confidence": slip_result.confidence,
                "detected_bank": slip_result.detected_bank,
                "detected_amount": slip_result.detected_amount,
                "warnings": slip_result.warnings,
                "checks": slip_result.checks_passed,
                "advice": get_slip_verification_advice(slip_result)
            }
            
            # If slip verification indicates fake, boost risk score
            if not slip_result.is_likely_genuine and slip_result.trust_score < 0.5:
                logger.warning(f"🚨 Suspicious bank slip detected: trust_score={slip_result.trust_score:.2f}")
                result.risk_score = max(result.risk_score, 0.8)  # Boost to high risk
                result.is_scam = True
                result.reason += f" | Slip Verification: {'; '.join(slip_result.warnings[:2])}"
        
        # 5. Track usage (increment based on mode)
        _track_usage(partner_repo, partner_id, detection_mode)
        
        # 6. Get remaining quota
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
            slip_verification=slip_verification_data,
            forensics=forensics_data,
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


@router.post("/detect/batch", response_model=BatchDetectionResponse)
@limiter.limit("10/minute")  # Lower limit for batch operations
async def detect_batch(
    request: Request,
    files: List[UploadFile] = File(..., description="1-100 images to process"),
    channel: Optional[str] = Form(None, description="Detection channel"),
    user_ref: Optional[str] = Form(None, description="User reference"),
    context: Optional[str] = Form(None, description="Additional context"),
    partner_id: str = Depends(verify_partner_token),
    service: DetectionService = Depends(get_detection_service),
    db: Session = Depends(get_db)
):
    """
    Batch image detection for partners.
    
    Upload 1-100 images for parallel processing. Each image processed with:
    - OCR text extraction
    - Visual analysis  
    - Forensics detection
    - Slip verification
    
    **Processing:**
    - Up to 5 images processed concurrently
    - Individual errors don't fail entire batch
    - Results returned for all images
    
    **Quota Usage:**
    - Each image counts as 1 request
    - Batch of 20 images = 20 quota usage
    
    **Rate Limits:**
    - 10 batch requests per minute
    - Up to 100 images per batch
    
    **Example:**
    ```bash
    curl -X POST https://api.thaiscam.zcr.ai/v1/partner/detect/batch \\
      -H "X-API-Key: your-key" \\
      -F "files=@slip1.jpg" \\
      -F "files=@slip2.jpg" \\
      -F "channel=Mobile App"
    ```
    
    Returns comprehensive results for all images with batch statistics.
    """
    try:
        logger.info(
            f"📦 Batch detection request - "
            f"partner: {partner_id}, images: {len(files)}, channel: {channel}"
        )
        
        # Check quota BEFORE processing
        partner_repo = PartnerRepository(db)
        partner = partner_repo.get_by_id(partner_id)
        
        if not partner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partner not found"
            )
        
        # Check if quota allows this batch
        images_count = len(files)
        remaining = partner.daily_quota - partner.requests_today
        
        if images_count > remaining:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Insufficient quota: need {images_count}, have {remaining}"
            )
        
        # Process batch
        batch_result = await process_image_batch(
            files=files,
            partner_id=partner_id,
            service=service,
            channel=channel or "Batch",
            user_ref=user_ref,
            process_func=_process_image_detection  # Reuse existing function
        )
        
        # Track usage (increment for each image)
        for _ in range(images_count):
            partner_repo.increment_usage(partner_id)
        
        # Get updated quota
        partner = partner_repo.get_by_id(partner_id)  # Refresh
        usage_info = {
            "requests_today": partner.requests_today,
            "requests_total": partner.requests_total,
            "remaining_today": max(0, partner.daily_quota - partner.requests_today),
            "images_processed": images_count
        }
        
        logger.info(
            f"✅ Batch complete - batch_id: {batch_result['batch_id']}, "
            f"successful: {batch_result['summary'].successful}, "
            f"failed: {batch_result['summary'].failed}"
        )
        
        return BatchDetectionResponse(
            batch_id=batch_result["batch_id"],
            total_images=batch_result["total_images"],
            successful=batch_result["summary"].successful,
            failed=batch_result["summary"].failed,
            total_processing_time_ms=batch_result["total_processing_time_ms"],
            results=batch_result["results"],
            summary=batch_result["summary"],
            usage=usage_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch processing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch processing failed: {str(e)}"
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
    """Process image-only detection with caching."""
    # Read image content first
    image_content = await file.read()
    
    # 1. Generate cache key from image hash
    image_hash = generate_image_hash(image_content)
    cache_key = f"image:partner:{image_hash}"
    
    # 2. Check cache
    cached_result = redis_client.get(cache_key)
    if cached_result:
        logger.info(f"✅ Image cache HIT: {image_hash[:16]}... (partner: {partner_id})")
        return cached_result
    
    logger.info(f"🔍 Image cache MISS: {image_hash[:16]}... Processing image...")
    
    # 3. Enhanced validation
    is_valid, error_msg = validate_image_content(image_content, file.filename)
    if not is_valid:
        raise HTTPException(400, error_msg)
    
    # Get image info for logging
    img_info = get_image_info(image_content)
    logger.info(f"📸 Processing image: {img_info.get('format')}, {img_info.get('width')}x{img_info.get('height')}")
    
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
    
    # 4. Forensics Analysis (Advanced Visual Forensics for Partners)
    logger.info("🔬 Running forensics analysis...")
    forensics_result = comprehensive_forensics(image_content)
    
    forensics_data = {
        "enabled": True,
        "is_manipulated": forensics_result.is_manipulated,
        "confidence": forensics_result.confidence,
        "manipulation_type": forensics_result.manipulation_type,
        "details": forensics_result.details,
        "techniques": {
            "ela": forensics_result.techniques["ela"],
            "metadata": forensics_result.techniques["metadata"],
            "compression": forensics_result.techniques["compression"],
            "cloning": forensics_result.techniques["cloning"]
        }
    }
    
    # Boost risk score if manipulation detected with high confidence
    if forensics_result.is_manipulated and forensics_result.confidence > 0.7:
        logger.warning(
            f"🚨 Image manipulation detected: {forensics_result.manipulation_type} "
            f"(confidence: {forensics_result.confidence:.2f})"
        )
        # Increase risk score by forensics confidence (capped at 0.95)
        boosted_risk = min(result.risk_score + (forensics_result.confidence * 0.3), 0.95)
        result.risk_score = boosted_risk
        result.is_scam = True
        
        # Add to reason
        if forensics_result.details:
            result.reason += f" | Forensics: {forensics_result.details}"
    
    # Build result
    result_data = {
        "result": result,
        "extracted_text": extracted_text,
        "visual_analysis": {
            "enabled": visual_analysis is not None,
            "is_suspicious": visual_analysis.is_suspicious if visual_analysis else False,
            "risk_score": visual_analysis.visual_risk_score if visual_analysis else 0.0,
            "detected_patterns": visual_analysis.detected_patterns if visual_analysis else []
        } if visual_analysis else None,
        "forensics": forensics_data
    }
    
    # 5. Cache the result (24 hours)
    cache_success = redis_client.set(cache_key, result_data, ttl=86400)
    if cache_success:
        logger.info(f"💾 Cached image result: {image_hash[:16]}...")
    
    return result_data


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

