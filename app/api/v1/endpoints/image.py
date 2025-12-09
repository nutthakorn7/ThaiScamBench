from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Request
from pydantic import BaseModel, Field
import logging

from app.api.deps import get_detection_service
from app.services.detection_service import DetectionService, DetectionRequest
from app.services.ocr_service import OCRService, validate_image_extension
from app.core.exceptions import ValidationError, ServiceError
from app.config import settings
from app.middleware.rate_limit import limiter
from app.api.v1.endpoints.detection import DetectTextResponse
from app.cache import redis_client
from app.utils.image_utils import validate_image_content, generate_image_hash, get_image_info

logger = logging.getLogger(__name__)

# Cache Version Control - Increment when detection logic changes
CACHE_VERSION = "v2.0_3layer"

router = APIRouter()

# Response model extending DetectTextResponse to include extracted text
class DetectImageResponse(DetectTextResponse):
    extracted_text: str = Field(..., description="Text extracted from the image by OCR")
    visual_analysis: dict = Field(default=None, description="Visual forensics analysis (if enabled)")

@router.post(
    "/v1/public/detect/image",
    response_model=DetectImageResponse,
    summary="ตรวจสอบรูปภาพ/สลิป (Public)",
    description="ตรวจสอบรูปภาพ (สลิปโอนเงิน, Screenshot แชท) โดยใช้ OCR แปลงเป็นข้อความแล้ววิเคราะห์หาความเสี่ยง",
    tags=["Public Detection"]
)
@limiter.limit(f"{settings.rate_limit_requests}/{settings.rate_limit_window} seconds")
async def detect_image_public(
    request: Request,
    file: UploadFile = File(...),
    detection_service: DetectionService = Depends(get_detection_service)
) -> DetectImageResponse:
    """
    Public Image detection endpoint
    
    **Features:**
    - OCR (Optical Character Recognition) for Thai & English
    - Automatic text classification
    - Supports JPG, PNG, BMP, WEBP
    """
    # CRITICAL: First log to confirm we reached this endpoint!
    logger.info(f"🚀 ENTRY POINT: /v1/public/detect/image called with file: {file.filename}")
    
    try:
        # 1. Read Image Content
        image_content = await file.read()
        
        # 2. Generate cache key from image hash
        image_hash = generate_image_hash(image_content)
        cache_key = f"image:public:{image_hash}"
        
        # 3. Check cache
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info(f"✅ Image cache HIT: {image_hash[:16]}... (public)")
            return DetectImageResponse(**cached_result)
        
        logger.info(f"🔍 Image cache MISS: {image_hash[:16]}... Processing image...")
        
        # 4. Enhanced validation
        is_valid, error_msg = validate_image_content(image_content, file.filename)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        # Get image info for logging
        img_info = get_image_info(image_content)
        logger.info(f"📸 Processing image: {img_info.get('format')}, {img_info.get('width')}x{img_info.get('height')}")

        # 5. Perform OCR + Visual Analysis
        logger.info(f"Processing OCR + Vision for file: {file.filename}")
        ocr_service = OCRService() # Get Singleton
        
        # Try new visual analysis method (async), fallback to basic OCR
        try:
            result_data = await ocr_service.extract_text_and_analyze(image_content)
            extracted_text = result_data["text"]
            visual_analysis = result_data.get("visual_analysis")
        except AttributeError:
            # Fallback if extract_text_and_analyze not available
            extracted_text = ocr_service.extract_text(image_content)
            visual_analysis = None
        
        logger.info(f"OCR Result: {extracted_text[:100]}...") # Log first 100 chars

        if not extracted_text.strip():
             # If no text found, return a safe/neutral response or specific error
             # For now, let's treat it as low risk but warn user
             return DetectImageResponse(
                is_scam=False,
                risk_score=0.0,
                category="Unknown",
                reason="ไม่พบข้อความในรูปภาพ",
                advice="กรุณาลองใหม่อีกครั้งด้วยรูปภาพที่ชัดเจนขึ้น",
                model_version="OCR-v1",
                llm_version="N/A",
                request_id="img_req", # Should generate real ID
                extracted_text="",
                visual_analysis=None
             )

        # 4. Slip Verification (with QR Check 🆕)
        logger.info("📍 Route: /v1/public/detect/image (image.router - 3-Layer Detection)")
        logger.info(f"🔧 Image Processing: {img_info.get('format')}, {img_info.get('width')}x{img_info.get('height')}")
        from app.utils.slip_verification import verify_thai_bank_slip, get_slip_verification_advice
        
        # Read image bytes for QR scanning
        file.file.seek(0)
        img_bytes = file.file.read()
        file.file.seek(0) # Reset pointer
        
        slip_result = verify_thai_bank_slip(extracted_text, img_bytes)
        logger.info(f"🏦 Slip Verification: trust_score={slip_result.trust_score:.2f}, genuine={slip_result.is_likely_genuine}")
        if slip_result.qr_valid:
             logger.info(f"✅ QR Code Verified: Amount matched!")
        elif slip_result.qr_data:
             logger.info(f"⚠️ QR Finding: {slip_result.qr_data}")
        
        # 5. Analyze Extracted Text (Keyword + AI)
        det_request = DetectionRequest(
            message=extracted_text,
            channel="Image/OCR"
        )
        
        result = await detection_service.detect_scam(
            request=det_request,
            source="public"
        )
        
        # 6. 🎯 MULTI-LAYER FUSION (Text + Visual + Slip)
        text_risk = result.risk_score
        visual_risk = visual_analysis.visual_risk_score if visual_analysis else 0.0
        slip_risk = 1.0 - slip_result.trust_score  # Invert: High trust = Low risk
        
        # Smart Weighted Fusion
        if slip_result.is_likely_genuine and slip_result.trust_score > 0.7:
            # If Slip Verification says "Genuine", heavily trust it
            final_risk_score = (text_risk * 0.3) + (visual_risk * 0.2) + (slip_risk * 0.5)
            fusion_reason = f"✅ Slip Verification (Trust: {slip_result.trust_score:.0%}) | {result.reason}"
            logger.info(f"🎯 3-Layer Fusion: Final={final_risk_score:.2f} (Text={text_risk:.2f}, Visual={visual_risk:.2f}, Slip={slip_risk:.2f})")
            logger.info(f"🏦 High-confidence genuine slip detected, risk reduced")
        else:
            # Standard fusion for non-slip or suspicious slip
            final_risk_score = (text_risk * 0.4) + (visual_risk * 0.3) + (slip_risk * 0.3)
            fusion_reason = result.reason
        
        # Enhance reason with all layers
        if visual_analysis and visual_analysis.is_suspicious:
            patterns_str = ", ".join(visual_analysis.detected_patterns)
            fusion_reason += f" | Visual: {visual_analysis.reason} (Patterns: {patterns_str})"
        
        if slip_result.warnings:
            fusion_reason += f" | Slip Warnings: {', '.join(slip_result.warnings[:2])}"  # Max 2 warnings
        
        logger.info(f"📊 3-Layer Fusion: Text={text_risk:.2f}, Visual={visual_risk:.2f}, Slip={slip_risk:.2f} → Final={final_risk_score:.2f}")
        
        # Determine if scam based on fused score
        is_scam_final = final_risk_score >= settings.public_threshold
        
        # Smart Advice Selection
        if slip_result.is_likely_genuine and not is_scam_final:
            advice = get_slip_verification_advice(slip_result)
        else:
            advice = result.advice
        
        # 7. Return Enhanced Result
        return DetectImageResponse(
            is_scam=is_scam_final,
            risk_score=final_risk_score,
            category=result.category,
            reason=fusion_reason,
            advice=advice,
            model_version=result.model_version,
            llm_version=result.llm_version,
            request_id=result.request_id,
            extracted_text=extracted_text,
            visual_analysis={
                "enabled": visual_analysis is not None,
                "is_suspicious": visual_analysis.is_suspicious if visual_analysis else False,
                "risk_score": visual_analysis.visual_risk_score if visual_analysis else 0.0,
                "detected_patterns": visual_analysis.detected_patterns if visual_analysis else [],
                "slip_verification": {
                    "trust_score": slip_result.trust_score,
                    "is_genuine": slip_result.is_likely_genuine,
                    "detected_bank": slip_result.detected_bank,
                    "detected_amount": slip_result.detected_amount,
                    "checks_passed": sum(slip_result.checks_passed.values()),
                    "total_checks": len(slip_result.checks_passed)
                }
            } if visual_analysis else None
        )
        
        # 7. Cache the result (24 hours)
        response_dict = response.model_dump()
        cache_success = redis_client.set(cache_key, response_dict, ttl=86400)
        if cache_success:
            logger.info(f"💾 Cached image result: {image_hash[:16]}...")
        
        return response

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Image detection error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="เกิดข้อผิดพลาดในการประมวลผลรูปภาพ"
        )



# --- Public Batch Endpoint ---

from app.models.batch import BatchSummary, BatchImageResult
from app.utils.batch_processing import process_image_batch
from typing import List

class PublicBatchResponse(BaseModel):
    batch_id: str
    total_images: int
    results: List[BatchImageResult]
    summary: BatchSummary

# Adapter to reuse single image logic within batch processor
async def _process_public_image_adapter(
    file: UploadFile,
    channel: str,
    user_ref: str,
    partner_id: str, # Not used for public
    service: DetectionService
):
    # Reuse the logic but return dict structure expected by batch processor
    # We basically need what detect_image_public does but without the HTTP Response wrapper
    
    content = await file.read()
    
    # Validation
    is_valid, error_msg = validate_image_content(content, file.filename)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
        
    ocr_service = OCRService()
    
    # OCR + Vision
    try:
        result_data = await ocr_service.extract_text_and_analyze(content)
        extracted_text = result_data["text"]
        visual_analysis = result_data.get("visual_analysis")
    except AttributeError:
        extracted_text = ocr_service.extract_text(content)
        visual_analysis = None
        
    if not extracted_text.strip():
        # Handle empty text (create a dummy result)
        from app.services.detection_service import DetectionResponse as ServiceResponse
        result = ServiceResponse(
            is_scam=False, risk_score=0.0, category="Unknown", 
            reason="ไม่พบข้อความ", advice="ลองใหม่", model_version="OCR", 
            llm_version="N/A", request_id="batch_empty"
        )
    else:
        # Detect
        det_request = DetectionRequest(message=extracted_text, channel=channel)
        result = await service.detect_scam(request=det_request, source="public_batch")

    # Fusion
    final_risk = result.risk_score
    reason = result.reason
    if visual_analysis:
        final_risk = (result.risk_score * 0.6) + (visual_analysis.visual_risk_score * 0.4)
        if visual_analysis.is_suspicious:
            reason += f" | Visual: {visual_analysis.reason}"
    
    # Format for BatchImageResult
    # (The batch processor expects a dict with "result" object and extra fields)
    
    # We need to monkey-patch or clone result to update risk_score/reason if changed by fusion
    result.risk_score = final_risk
    result.reason = reason
    result.is_scam = final_risk >= settings.public_threshold

    return {
        "result": result,
        "extracted_text": extracted_text,
        "visual_analysis": {
            "is_suspicious": visual_analysis.is_suspicious,
            "visual_risk_score": visual_analysis.visual_risk_score,
            "detected_patterns": visual_analysis.detected_patterns,
            "reason": visual_analysis.reason
        } if visual_analysis else None,
        "forensics": None, # Public API might skip heavy forensics for batch speed? Or add it if needed.
        "slip_verification": None
    }

@router.post(
    "/v1/public/detect/image/batch",
    response_model=PublicBatchResponse,
    summary="ตรวจสอบรูปภาพแบบกลุ่ม (Public Batch)",
    description="ตรวจสอบรูปภาพพร้อมกันหลายรูป (สูงสุด 10 รูป)",
    tags=["Public Detection"]
)
@limiter.limit(f"5/minute")
async def detect_image_batch_public(
    request: Request,
    files: List[UploadFile] = File(...),
    detection_service: DetectionService = Depends(get_detection_service)
) -> PublicBatchResponse:
    """
    Public Batch Image Detection
    
    - Max 10 images per request
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"อนุญาตสูงสุด 10 รูป (ส่งมา {len(files)})"
        )
    
    if not files:
        raise HTTPException(status_code=400, detail="กรุณาแนบไฟล์")

    batch_result = await process_image_batch(
        files=files,
        partner_id="public",
        service=detection_service,
        channel="public_batch",
        user_ref="public_user",
        process_func=_process_public_image_adapter
    )
    
    return PublicBatchResponse(
        batch_id=batch_result["batch_id"],
        total_images=batch_result["total_images"],
        results=batch_result["results"],
        summary=batch_result["summary"]
    )
