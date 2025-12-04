"""Thai Scam Detection API - Main Application"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.routes import health, detection, public, partner, admin, feedback
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

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://scamdetect.th",
        "https://www.scamdetect.th",
        "http://localhost:8000",  # For local testing
        "http://localhost:3000",  # For frontend dev
    ] if not settings.is_development else ["*"],  # Allow all in dev
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Token"],
)

# Add security middleware
from app.middleware.security import SecurityMiddleware
app.add_middleware(SecurityMiddleware)

# Add cache control middleware to prevent browser caching issues
from app.middleware.cache_control import CacheControlMiddleware
app.add_middleware(CacheControlMiddleware)

# Include routers
app.include_router(health.router)
app.include_router(detection.router)
app.include_router(public.router)
app.include_router(partner.router)
app.include_router(admin.router)
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
