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

logger = logging.getLogger(__name__)

router = APIRouter()

# Response model extending DetectTextResponse to include extracted text
class DetectImageResponse(DetectTextResponse):
    extracted_text: str = Field(..., description="Text extracted from the image by OCR")

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
        # 1. Validate Image Extension
        if not validate_image_extension(file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="นามสกุลไฟล์ไม่ถูกต้อง (รองรับ .jpg, .png, .bmp, .webp)"
            )

        # 2. Read Image Content
        image_content = await file.read()
        if len(image_content) == 0:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ไฟล์รูปภาพว่างเปล่า"
            )

        # 3. Perform OCR
        logger.info(f"Processing OCR for file: {file.filename}")
        ocr_service = OCRService() # Get Singleton
        extracted_text = ocr_service.extract_text(image_content)
        
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
                extracted_text=""
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
        
        # 5. Return Result
        return DetectImageResponse(
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            advice=result.advice,
            model_version=result.model_version,
            llm_version=result.llm_version,
            request_id=result.request_id,
            extracted_text=extracted_text
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Image detection error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="เกิดข้อผิดพลาดในการประมวลผลรูปภาพ"
        )
