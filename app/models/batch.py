"""
Batch detection models for partner API

Supports uploading multiple images for parallel processing.
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class BatchImageResult(BaseModel):
    """Result for a single image in a batch."""
    filename: str = Field(..., description="Original filename")
    index: int = Field(..., description="Position in batch (0-indexed)")
    success: bool = Field(..., description="Whether processing succeeded")
    
    # Detection results (if successful)
    is_scam: Optional[bool] = Field(None, description="Scam detection result")
    risk_score: Optional[float] = Field(None, description="Risk score (0-1)")
    category: Optional[str] = Field(None, description="Scam category")
    reason: Optional[str] = Field(None, description="Detection reasoning")
    
    # Additional analysis
    extracted_text: Optional[str] = Field(None, description="OCR extracted text")
    forensics: Optional[dict] = Field(None, description="Image manipulation analysis")
    slip_verification: Optional[dict] = Field(None, description="Bank slip verification")
    visual_analysis: Optional[dict] = Field(None, description="Visual pattern detection")
    
    # Error information (if failed)
    error: Optional[str] = Field(None, description="Error message if failed")
    
    # Performance tracking
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")


class BatchSummary(BaseModel):
    """Summary statistics for batch processing."""
    successful: int = Field(..., description="Number of successful detections")
    failed: int = Field(..., description="Number of failed detections")
    scam_count: int = Field(..., description="Number of scams detected")
    safe_count: int = Field(..., description="Number of safe images")
    average_risk_score: float = Field(..., description="Average risk score of successful detections")
    categories: dict = Field(default_factory=dict, description="Category distribution")
    manipulated_images: int = Field(0, description="Number of manipulated images detected")
    errors: List[dict] = Field(default_factory=list, description="List of errors")


class BatchDetectionResponse(BaseModel):
    """Response for batch image detection."""
    batch_id: str = Field(..., description="Unique batch identifier")
    total_images: int = Field(..., description="Total images in batch")
    successful: int = Field(..., description="Successfully processed images")
    failed: int = Field(..., description="Failed images")
    total_processing_time_ms: int = Field(..., description="Total processing time")
    
    results: List[BatchImageResult] = Field(..., description="Per-image results")
    summary: BatchSummary = Field(..., description="Batch statistics")
    usage: dict = Field(..., description="Quota usage information")


class BatchStatusResponse(BaseModel):
    """Response for async batch status check (future use)."""
    batch_id: str = Field(..., description="Batch identifier")
    status: str = Field(..., description="Status: pending, processing, completed, failed")
    progress: int = Field(..., description="Progress percentage (0-100)")
    total_images: int = Field(..., description="Total images to process")
    processed: int = Field(..., description="Images processed so far")
    results: Optional[List[BatchImageResult]] = Field(None, description="Results if completed")
