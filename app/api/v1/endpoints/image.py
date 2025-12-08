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

        # 4. Analyze Extracted Text
        det_request = DetectionRequest(
            message=extracted_text,
            channel="Image/OCR"
        )
        
        result = await detection_service.detect_scam(
            request=det_request,
            source="public"
        )
        
        # 5. Fuse Text Risk + Visual Risk (if available)
        final_risk_score = result.risk_score
        fusion_reason = result.reason
        
        if visual_analysis:
            # Weighted fusion: 60% text, 40% visual
            text_risk = result.risk_score
            visual_risk = visual_analysis.visual_risk_score
            final_risk_score = (text_risk * 0.6) + (visual_risk * 0.4)
            
            # Enhance reason with visual findings
            if visual_analysis.is_suspicious:
                patterns_str = ", ".join(visual_analysis.detected_patterns)
                fusion_reason += f" | Visual: {visual_analysis.reason} (Patterns: {patterns_str})"
            
            logger.info(f"📊 Fused Risk: Text={text_risk:.2f}, Visual={visual_risk:.2f}, Final={final_risk_score:.2f}")
        
        # Determine if scam based on fused score
        is_scam_final = final_risk_score >= settings.public_threshold
        
        # 6. Return Enhanced Result
        return DetectImageResponse(
            is_scam=is_scam_final,
            risk_score=final_risk_score,
            category=result.category,
            reason=fusion_reason,
            advice=result.advice,
            model_version=result.model_version,
            llm_version=result.llm_version,
            request_id=result.request_id,
            extracted_text=extracted_text,
            visual_analysis={
                "enabled": visual_analysis is not None,
                "is_suspicious": visual_analysis.is_suspicious if visual_analysis else False,
                "risk_score": visual_analysis.visual_risk_score if visual_analysis else 0.0,
                "detected_patterns": visual_analysis.detected_patterns if visual_analysis else []
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

from app.models.batch import BatchSummary, BatchImageResponse
from app.utils.batch_processing import process_batch_images
from typing import List

class PublicBatchResponse(BaseModel):
    batch_id: str
    total_images: int
    results: List[BatchImageResponse]
    summary: BatchSummary

@router.post(
    "/v1/public/detect/image/batch",
    response_model=PublicBatchResponse,
    summary="ตรวจสอบรูปภาพแบบกลุ่ม (Public Batch)",
    description="ตรวจสอบรูปภาพพร้อมกันหลายรูป (สูงสุด 10 รูป)",
    tags=["Public Detection"]
)
@limiter.limit(f"5/minute") # Stricter rate limit for batch
async def detect_image_batch_public(
    request: Request,
    files: List[UploadFile] = File(...),
    detection_service: DetectionService = Depends(get_detection_service)
) -> PublicBatchResponse:
    """
    Public Batch Image Detection
    
    - Max 10 images per request
    - Returns analysis for each image + summary
    """
    # 1. Validation
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"อนุญาตให้ตรวจสอบสูงสุด 10 รูปภาพต่อครั้ง (ส่งมา {len(files)} รูป)"
        )
    
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="กรุณาแนบไฟล์รูปภาพ"
        )

    # 2. Process Batch (Reuse shared utility)
    # Note: Public API doesn't use quota, so quota_check_fn is None
    batch_result = await process_batch_images(
        files=files,
        detection_service=detection_service,
        partner_id="public_user", # Marker for logging
        quota_check_fn=None,
        deduct_quota_fn=None
    )
    
    return PublicBatchResponse(
        batch_id=batch_result["batch_id"],
        total_images=batch_result["total_images"],
        results=batch_result["results"],
        summary=batch_result["summary"]
    )
