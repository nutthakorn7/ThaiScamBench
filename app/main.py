"""Thai Scam Detection API - Main Application"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.routes import health, detection, public, partner, admin, feedback, partner_management, admin_auth, csrf
from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler
from app.database import init_db
import logging
import os

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="""
    🔍 **Thai Scam Detection API**
    
    ระบบตรวจจับข้อความหลอกลวงภาษาไทย (Thai Scam Message Detection System)
    
    ## Features
    
    - ✅ ตรวจจับข้อความหลอกลวงประเภทต่างๆ (Detect various scam types)
    - ✅ วิเคราะห์ความเสี่ยง (Risk analysis)
    - ✅ ให้คำแนะนำในการป้องกัน (Safety recommendations)
    - ✅ รองรับภาษาไทย (Thai language support)
    
    ## Scam Categories
    
    - 📦 **Parcel Scam** - การหลอกลวงเกี่ยวกับพัสดุ
    - 🏦 **Banking Scam** - การหลอกลวงเกี่ยวกับธนาคาร
    - 🎁 **Prize Scam** - การหลอกลวงด้วยรางวัล
    - 💰 **Investment Scam** - การหลอกลวงการลงทุน
    - 👮 **Impersonation Scam** - การแอบอ้างเป็นเจ้าหน้าที่
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://thaiscam.zcr.ai",
        "https://thai-scam-bench.vercel.app",
        "http://localhost:3000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Add custom exception handlers for production
from app.models.error_responses import ErrorResponse, ErrorCode, create_error_response
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to prevent stack trace leaks in production
    
    In development: Returns detailed error with stack trace
    In production: Returns sanitized error message
    """
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=settings.is_development
    )
    
    if settings.is_development:
        # In development, return detailed error
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(exc),
                    "type": type(exc).__name__,
                    "traceback": traceback.format_exc().split('\n')
                }
            }
        )
    else:
        # In production, return sanitized error
        error_response = create_error_response(
            code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected error occurred. Please try again later."
        )
        return JSONResponse(
            status_code=500,
            content=error_response.model_dump()
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    HTTPException handler with standardized error format
    """
    # Map HTTP status codes to error codes
    status_code_map = {
        400: ErrorCode.VALIDATION_ERROR,
        401: ErrorCode.AUTHENTICATION_REQUIRED,
        403: ErrorCode.FORBIDDEN,
        404: ErrorCode.NOT_FOUND,
        413: ErrorCode.PAYLOAD_TOO_LARGE,
        429: ErrorCode.RATE_LIMIT_EXCEEDED,
        500: ErrorCode.INTERNAL_ERROR,
        503: ErrorCode.SERVICE_UNAVAILABLE,
    }
    
    error_code = status_code_map.get(exc.status_code, ErrorCode.INTERNAL_ERROR)
    
    error_response = create_error_response(
        code=error_code,
        message=str(exc.detail) if exc.detail else None
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump()
    )

# Security headers
from app.middleware.security import SecurityMiddleware
app.add_middleware(SecurityMiddleware)

# Monitoring
from app.middleware.monitoring import MonitoringMiddleware
app.add_middleware(MonitoringMiddleware)

# Add cache control middleware to prevent browser caching issues
from app.middleware.cache_control import CacheControlMiddleware
app.add_middleware(CacheControlMiddleware)

# Audit Logging (logs all requests - no PII)
if settings.audit_log_enabled:
    from app.middleware.audit import AuditLogMiddleware
    app.add_middleware(AuditLogMiddleware)
    logger.info("✅ Audit logging middleware enabled")

# CSRF Protection
from app.middleware.csrf import CSRFProtection  
app.add_middleware(CSRFProtection)
logger.info("✅ CSRF protection middleware enabled")

# Include routers
app.include_router(health.router)
app.include_router(csrf.router)  # CSRF token endpoint
app.include_router(detection.router)
app.include_router(public.router)
app.include_router(partner.router)
app.include_router(partner_management.router)
app.include_router(admin_auth.router)  # Auth endpoints (no auth required)
app.include_router(admin.router)  # Admin endpoints (auth required)
app.include_router(feedback.router)

# Mount static files for frontend (if directory exists)
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(f"🚀 Starting {settings.api_title} v{settings.api_version}")
    logger.info(f"📝 Environment: {settings.environment}")
    logger.info(f"🤖 Model Version: {settings.model_version}")
    logger.info(f"🧠 LLM Version: {settings.llm_version}")
    logger.info(f"📊 Log Level: {settings.log_level}")
    
    # Initialize database
    logger.info("💾 Initializing database...")
    init_db()
    logger.info("✅ Database initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("👋 Shutting down Thai Scam Detection API")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "👋 ยินดีต้อนรับสู่ Thai Scam Detection API",
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/health",
        "api": "/api/v1/detect"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.is_development
    )
