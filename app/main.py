"""Thai Scam Detection API - Main Application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, detection
import logging

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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.is_development else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(detection.router)


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(f"🚀 Starting {settings.api_title} v{settings.api_version}")
    logger.info(f"📝 Environment: {settings.environment}")
    logger.info(f"🤖 Model Version: {settings.model_version}")
    logger.info(f"🧠 LLM Version: {settings.llm_version}")
    logger.info(f"📊 Log Level: {settings.log_level}")


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
