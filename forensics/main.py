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
from analyzers.jpeg_forensics import JpegForensicsAnalyzer
from analyzers.noise_residual import NoiseResidualAnalyzer
from analyzers.frequency_domain import FrequencyDomainAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Thai Scam Bench - Image Forensics API",
    description="Digital forensics analysis for detecting AI-generated and manipulated images",
    version="0.4.0"
)

# Initialize analyzers
metadata_analyzer = FileMetadataAnalyzer()
jpeg_analyzer = JpegForensicsAnalyzer()
noise_analyzer = NoiseResidualAnalyzer()
fft_analyzer = FrequencyDomainAnalyzer()

# Track metrics
metrics = {
    "requests_total": 0,
    "requests_by_result": {"FAKE_LIKELY": 0, "SUSPICIOUS": 0, "REAL_LIKE": 0},
    "start_time": datetime.now()
}

# ... (Previous code) ...

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
        
        # Phase 2: JPEG Forensics
        jpeg_result = jpeg_analyzer.analyze(image_bytes)
        
        # Phase 3: Noise Residual Analysis
        noise_result = noise_analyzer.analyze(image_bytes)
        
        # Phase 4: Frequency Domain Analysis
        fft_result = fft_analyzer.analyze(image_bytes)
        
        # Combine results
        all_features = {
            "file_metadata": metadata_result["features"],
            "jpeg_forensics": jpeg_result["features"],
            "noise_analysis": noise_result["features"],
            "frequency_analysis": fft_result["features"]
        }
        
        all_warnings = (
            metadata_result["warnings"] + 
            jpeg_result["warnings"] +
            noise_result["warnings"] +
            fft_result["warnings"]
        )
        
        # Calculate final score using MAX for strong signals
        final_score = max(
            metadata_result["score"], 
            jpeg_result["score"],
            noise_result["score"],
            fft_result["score"]
        )
        
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
