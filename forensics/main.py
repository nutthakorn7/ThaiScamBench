"""
Image Forensics Service - Main API

FastAPI application for digital forensics analysis of images.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import logging
from datetime import datetime

from analyzers.file_metadata import FileMetadataAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Thai Scam Bench - Image Forensics API",
    description="Digital forensics analysis for detecting AI-generated and manipulated images",
    version="0.1.0"
)

# Initialize analyzers
metadata_analyzer = FileMetadataAnalyzer()

# Track metrics
metrics = {
    "requests_total": 0,
    "requests_by_result": {"FAKE_LIKELY": 0, "SUSPICIOUS": 0, "REAL_LIKE": 0},
    "start_time": datetime.now()
}


class ForensicsResponse(BaseModel):
    """Response schema for forensics analysis"""
    forensic_result: str = Field(..., description="FAKE_LIKELY | SUSPICIOUS | REAL_LIKE")
    score: float = Field(..., ge=0.0, le=1.0, description="Suspicion score (0=genuine, 1=fake)")
    reasons: List[str] = Field(default_factory=list, description="List of suspicious indicators")
    features: Dict = Field(default_factory=dict, description="Detailed forensics features")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "image-forensics",
        "version": "0.1.0",
        "uptime_seconds": (datetime.now() - metrics["start_time"]).total_seconds()
    }


@app.get("/metrics")
async def get_metrics():
    """Get service metrics"""
    return {
        "service": "api-img",
        "requests_total": metrics["requests_total"],
        "requests_by_result": metrics["requests_by_result"],
        "uptime_seconds": (datetime.now() - metrics["start_time"]).total_seconds()
    }


@app.post("/forensics/analyze", response_model=ForensicsResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze image for forensics indicators
    
    Performs digital forensics analysis including:
    - File metadata & EXIF analysis
    - JPEG compression forensics
    - Noise residual analysis
    - Frequency domain analysis
    
    Returns suspicion score and detailed reasons.
    """
    metrics["requests_total"] += 1
    
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        logger.info(f"Analyzing image: {file.filename}, size: {len(image_bytes)} bytes")
        
        # Phase 1: File & Metadata Analysis
        metadata_result = metadata_analyzer.analyze(image_bytes)
        
        # TODO: Add other analyzers (JPEG, Noise, FFT) in next phase
        
        # Combine results
        all_features = {
            "file_metadata": metadata_result["features"]
        }
        
        all_warnings = metadata_result["warnings"]
        
        # Calculate final score (currently only metadata)
        final_score = metadata_result["score"]
        
        # Determine result category
        if final_score >= 0.7:
            result = "FAKE_LIKELY"
        elif final_score >= 0.4:
            result = "SUSPICIOUS"
        else:
            result = "REAL_LIKE"
        
        # Update metrics
        metrics["requests_by_result"][result] += 1
        
        logger.info(f"Analysis complete: {result}, score: {final_score:.2f}")
        
        return ForensicsResponse(
            forensic_result=result,
            score=final_score,
            reasons=all_warnings,
            features=all_features
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Forensics analysis failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Thai Scam Bench - Image Forensics API",
        "version": "0.1.0",
        "status": "operational",
        "endpoints": {
            "analyze": "/forensics/analyze",
            "health": "/health",
            "metrics": "/metrics"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
