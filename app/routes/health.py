"""Health check endpoint"""
from fastapi import APIRouter
from app.models.schemas import HealthCheckResponse
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health Check",
    description="ตรวจสอบสถานะของ API และเวอร์ชันต่างๆ (Check API health and version info)"
)
async def health_check() -> HealthCheckResponse:
    """
    Health check endpoint to verify service is running
    
    Returns:
        HealthCheckResponse with service status and version information
    """
    return HealthCheckResponse(
        status="healthy",
        version=settings.api_version,
        model_version=settings.model_version,
        llm_version=settings.llm_version,
        environment=settings.environment
    )
