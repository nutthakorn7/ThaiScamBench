"""Public API endpoints"""
from typing import Optional
from fastapi import APIRouter, Depends, Request, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import PublicDetectRequest, PublicDetectResponse, PublicReportRequest
from app.services.detection_service import DetectionService, DetectionRequest
from app.dependencies import get_detection_service
from app.config import settings
from app.middleware.rate_limit import limiter
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
    service: DetectionService = Depends(get_detection_service)
) -> PublicDetectResponse:
    """
    Public endpoint for scam detection with rate limiting
    
    Args:
        request: Starlette Request (for rate limiting)
        body: PublicDetectRequest with message and optional channel
        service: Injected DetectionService
        
    Returns:
        PublicDetectResponse with detection results and model version
        
    Raises:
        HTTPException: If analysis fails
        RateLimitExceeded: If rate limit is exceeded (handled by middleware)
    """
    try:
        # Create service request
        detect_request = DetectionRequest(
            message=body.message,
            channel=body.channel,
            user_ref=None
        )
        
        # Call service
        result = await service.detect_scam(
            request=detect_request,
            source="public"
        )
        
        # Map to response model
        # (DetectionResponse fields match PublicDetectResponse mostly)
        return PublicDetectResponse(
            request_id=result.request_id,
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            advice=result.advice,
            model_version=result.model_version
        )
    except Exception as e:
        logger.error(f"Public detection error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการตรวจสอบ: {str(e)}"
        )


@router.post(
    "/detect/image",
    response_model=PublicDetectResponse,
    summary="ตรวจสอบรูปภาพสลิป/แชท (Public)",
    description="ตรวจสอบรูปภาพ (OCR + AI Analysis) สำหรับผู้ใช้ทั่วไป"
)
@limiter.limit(f"{settings.rate_limit_requests}/{settings.rate_limit_window} seconds")
async def detect_scam_image(
    request: Request,
    file: UploadFile = File(..., description="รูปภาพที่ต้องการตรวจสอบ"),
    service: DetectionService = Depends(get_detection_service)
) -> PublicDetectResponse:
    """
    Public endpoint for image scam detection (OCR -> Text Analysis)
    """
    try:
        # 1. Validate Image
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
        
        # 2. Perform OCR
        from app.services.ocr_service import OCRService
        contents = await file.read()
        ocr_service = OCRService()
        extracted_text = ocr_service.extract_text(contents)
        
        if not extracted_text or not extracted_text.strip():
            # If OCR fails to find text, return a soft error analysis
            return PublicDetectResponse(
                request_id="img_failed",
                is_scam=False,
                risk_score=0.0,
                category="unknown",
                reason="ไม่สามารถอ่านข้อความจากรูปภาพได้ หรือรูปภาพไม่ชัดเจน",
                advice="โปรดลองใหม่อีกครั้งด้วยรูปที่ชัดเจนขึ้น หรือพิมพ์ข้อความโดยตรง",
                model_version="ocr-v1"
            )

        # 3. Create Text Detection Request from OCR
        # We assume the user wants to check the CONTENT of the image
        detect_request = DetectionRequest(
            message=extracted_text,
            channel="image_ocr",
            user_ref=None,
        )
        # Pass hash in a slightly hacky way via user_ref or we need to update DetectionRequest
        # Better: Update DetectionRequest to support metadata? Or just pass it in user_ref as a JSON string?
        # Standard way: The service method signature doesn't take extra metadata easily without changing interface.
        # Quick hack for "Low Resource": Append it to user_ref with a prefix, or use a new argument.
        # Let's inspect DetectionRequest definition again. It has user_ref (Optional[str]).
        # 3. Calculate Image Hash (Adaptive Learning)
        from app.utils.image_processing import calculate_image_hash
        img_hash = calculate_image_hash(contents)
        
        # 3.5. 🏦 Slip Verification (NEW 3-Layer Detection)
        from app.utils.slip_verification import verify_thai_bank_slip
        slip_result = verify_thai_bank_slip(extracted_text)
        logger.info(f"🏦 Slip Verification: trust_score={slip_result.trust_score:.2f}, genuine={slip_result.is_likely_genuine}")
        
        # 4. Create Detection Request with IMAGE HASH PREFIX
        # Key Fix: Each image gets unique hash → No DB cache collision!
        unique_message = f"[IMG:{img_hash}] {extracted_text}" if img_hash else extracted_text
        
        detect_request = DetectionRequest(
            message=unique_message,  # Use Image Hash prefix
            channel="image_ocr",
            user_ref=f"img_hash:{img_hash}" if img_hash else None,
        )
        
        # 4.5. Call Detection Service (Text Analysis on OCR result)
        result = await service.detect_scam(
            request=detect_request,
            source="public"
        )
        
        # 4.5. Apply Slip Verification Adjustment
        final_risk = result.risk_score
        final_reason = result.reason
        
        if slip_result.is_likely_genuine and slip_result.trust_score > 0.7:
            # Reduce risk significantly for genuine slips
            slip_risk = 1.0 - slip_result.trust_score
            final_risk = (result.risk_score * 0.3) + (slip_risk * 0.7)
            final_reason = f"✅ Slip Verification (Trust: {slip_result.trust_score:.0%}) | {result.reason}"
            logger.info(f"🏦 High-confidence genuine slip detected, risk reduced from {result.risk_score:.2f} to {final_risk:.2f}")
        
        
        return PublicDetectResponse(
            request_id=result.request_id,
            is_scam=final_risk >= 0.5,  # Use final_risk for determination
            risk_score=final_risk,
            category=result.category,
            reason=final_reason,
            advice=result.advice,
            model_version=result.model_version
        )

    except Exception as e:
        logger.error(f"Image detection error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการตรวจสอบรูปภาพ: {str(e)}"
        )


@router.get("/wiki/{keyword}")
async def get_wiki_data(
    keyword: str,
    db: Session = Depends(get_db),
    service: DetectionService = Depends(get_detection_service)
):
    """
    Get data for a Wiki page (SEO Optimised).
    If the keyword is a phone number or known scam pattern, return cached analysis.
    If not found, perform a quick check to generate content.
    """
    # Decoded keyword might come in as URL encoded
    decoded_keyword = keyword.replace("-", "") 
    
    # We create a dummy request object
    detect_request = DetectionRequest(
        message=keyword, 
        channel="web_search",
        user_ref=None
    )
    
    # Reuse the logic but without logging user info 
    result = await service.detect_scam(detect_request, source="wiki")
    
    return {
        "keyword": keyword,
        "risk_score": result.risk_score,
        "scam_type": result.category,
        "analysis": result.reason,
        "is_safe": result.risk_score < 0.5,
        "last_updated": "Today" 
    }


@router.post(
    "/report",
    summary="แจ้งเบาะแส (Report)",
    description="รับแจ้งเบาะแสจากผู้ใช้ (Crowd Reporting) รองรับรูปภาพ"
)
@limiter.limit("10/minute")
async def report_scam(
    request: Request,
    text: str = Form(..., description="ข้อความที่ต้องการรายงาน"),
    is_scam: bool = Form(..., description="ใช่ Scam หรือไม่"),
    additional_info: str = Form(None, description="ข้อมูลเพิ่มเติม"),
    file: UploadFile = File(None, description="รูปภาพหลักฐาน (ถ้ามี)"),
    service: DetectionService = Depends(get_detection_service)
):
    """
    Endpoint for users to manually report scams.
    Supports both text and image evidence.
    """
    try:
        from app.services.ocr_service import OCRService
        
        extracted_text = ""
        ocr_result_info = ""

        # Process Image if provided
        if file:
            # Validate Image
            if not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Only images are allowed."
                )
            
            # Read and Scan
            contents = await file.read()
            ocr_service = OCRService()
            extracted_text = ocr_service.extract_text(contents)
            
            if extracted_text:
                # Truncate OCR text aggressively - Thai chars expand to ~6 chars each in JSON (\u0e2b)
                # 150 Thai chars * 6 = 900 chars JSON, which leaves room for other metadata
                truncated_ocr = extracted_text[:150] if len(extracted_text) > 150 else extracted_text
                ocr_result_info = f"\n\n[OCR]: {truncated_ocr}"

        # Combine info for storage (keep very short due to JSON Unicode expansion)
        final_details = ((additional_info or "") + ocr_result_info)[:200]
        
        # Calculate Image Hash for Adaptive Learning
        img_hash_details = ""
        if file and contents:
             try:
                 from app.utils.image_processing import calculate_image_hash
                 # We need to seek back to 0 if we read it? No, await file.read() returns bytes, we still have it in 'contents'.
                 h = calculate_image_hash(contents)
                 if h:
                     # Store in details for now as we can't easily change signature of submit_manual_report
                     img_hash_details = f" [Hash:{h}]"
             except Exception as e:
                 logger.warning(f"Failed to hash image in report: {e}")

        final_details += img_hash_details
        
        # Call service to submit report
        return await service.submit_manual_report(
            message=text, # Main text input
            is_scam=is_scam,
            details=final_details
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Report submission error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถบันทึกข้อมูลได้: {str(e)}"
        )


class FeedbackRequest(BaseModel):
    request_id: str
    feedback_type: str  # correct, incorrect
    comment: Optional[str] = None

@router.post(
    "/feedback",
    summary="ส่งผลตอบรับ (Feedback)",
    description="ให้ผู้ใช้แจ้งว่าผลการตรวจสอบถูกต้องหรือไม่ (เพื่อ Adaptive Learning)"
)
@limiter.limit("20/minute")
async def submit_feedback(
    request: Request,
    body: FeedbackRequest,
    service: DetectionService = Depends(get_detection_service)
):
    """
    Submit feedback for a detection result.
    If 'incorrect', it counts as a high-value negative sample.
    """
    try:
        await service.submit_feedback(
             request_id=body.request_id,
             feedback_type=body.feedback_type,
             comment=body.comment
        )
        return {"status": "success", "message": "ขอบคุณสำหรับข้อมูลครับ"}
    except Exception as e:
        logger.error(f"Feedback error: {e}", exc_info=True)
        # Don't fail the UI, just log
        return {"status": "error", "message": str(e)}
