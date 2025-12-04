"""Scam detection endpoints"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import ScamCheckRequest, ScamCheckResponse
from app.services.scam_classifier import classify_scam
from app.services.llm_explainer import explain_with_llm
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Detection"])


@router.post(
    "/detect",
    response_model=ScamCheckResponse,
    summary="Detect Scam",
    description="ตรวจสอบข้อความว่ามีลักษณะการหลอกลวงหรือไม่ (Check if a message is a scam)"
)
async def detect_scam(request: ScamCheckRequest) -> ScamCheckResponse:
    """
    Analyze a message for scam indicators
    
    Args:
        request: ScamCheckRequest containing the message to analyze
        
    Returns:
        ScamCheckResponse with detection results, risk score, and advice
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        logger.info(f"Received scam detection request (message length: {len(request.message)})")
        
        # Step 1: Classify the message
        is_scam, risk_score, category = classify_scam(request.message)
        
        # Step 2: Generate explanation with LLM
        reason, advice = explain_with_llm(request.message, category)
        
        # Step 3: Build response
        response = ScamCheckResponse(
            is_scam=is_scam,
            risk_score=risk_score,
            category=category,
            reason=reason,
            advice=advice
        )
        
        logger.info(f"Detection completed: is_scam={is_scam}, category={category}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error during scam detection: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการตรวจสอบ: {str(e)}"
        )
