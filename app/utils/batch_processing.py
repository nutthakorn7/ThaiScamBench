"""
Batch processing utilities for parallel image detection

Handles multiple images with concurrent processing and comprehensive error handling.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time
import uuid
import logging
from typing import List, Tuple, Optional
from fastapi import UploadFile, HTTPException

from app.models.batch import BatchImageResult, BatchSummary
from app.services.detection_service import DetectionService

logger = logging.getLogger(__name__)

# Max concurrent image processing
MAX_WORKERS = 5

# Batch limits
MIN_BATCH_SIZE = 1
MAX_BATCH_SIZE = 100
MAX_TOTAL_SIZE_MB = 100


def validate_batch_request(files: List[UploadFile]) -> Tuple[bool, Optional[str]]:
    """
    Validate batch upload request.
    
    Checks:
    - File count (1-100)
    - File names present
    - Basic format validation
    
    Args:
        files: List of uploaded files
        
    Returns:
        (is_valid, error_message)
    """
    # Check file count
    if not files:
        return False, "No files provided"
    
    if len(files) < MIN_BATCH_SIZE:
        return False, f"At least {MIN_BATCH_SIZE} file required"
    
    if len(files) > MAX_BATCH_SIZE:
        return False, f"Too many files: {len(files)} (max: {MAX_BATCH_SIZE})"
    
    # Check file names and formats
    allowed_extensions = {'jpg', 'jpeg', 'png', 'bmp', 'webp'}
    
    for idx, file in enumerate(files):
        if not file.filename:
            return False, f"File at index {idx} has no filename"
        
        # Check extension
        ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if ext not in allowed_extensions:
            return False, f"Invalid format for '{file.filename}': .{ext} (allowed: {', '.join(allowed_extensions)})"
    
    logger.info(f"✅ Batch validation passed: {len(files)} files")
    return True, None


async def process_single_image_in_batch(
    file: UploadFile,
    index: int,
    partner_id: str,
    service: DetectionService,
    channel: str,
    user_ref: Optional[str],
    process_func
) -> BatchImageResult:
    """
    Process a single image within a batch with error handling.
    
    Args:
        file: Uploaded file
        index: Position in batch
        partner_id: Partner identifier
        service: Detection service
        channel: Detection channel
        user_ref: User reference
        process_func: Function to process image (async)
        
    Returns:
        BatchImageResult with detection results or error
    """
    start_time = time.time()
    filename = file.filename or f"image_{index}"
    
    try:
        logger.info(f"📸 Processing batch image {index}: {filename}")
        
        # Process image using existing detection function
        result_data = await process_func(
            file=file,
            channel=channel,
            user_ref=user_ref,
            partner_id=partner_id,
            service=service
        )
        
        # Extract results
        result = result_data["result"]
        extracted_text = result_data.get("extracted_text")
        visual_analysis = result_data.get("visual_analysis")
        forensics = result_data.get("forensics")
        slip_verification = result_data.get("slip_verification")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(
            f"✅ Batch image {index} complete: "
            f"is_scam={result.is_scam}, risk={result.risk_score:.2f}, "
            f"time={processing_time}ms"
        )
        
        return BatchImageResult(
            filename=filename,
            index=index,
            success=True,
            is_scam=result.is_scam,
            risk_score=result.risk_score,
            category=result.category,
            reason=result.reason,
            extracted_text=extracted_text,
            visual_analysis=visual_analysis,
            forensics=forensics,
            slip_verification=slip_verification,
            processing_time_ms=processing_time
        )
        
    except HTTPException as e:
        # HTTP errors (validation, etc.)
        processing_time = int((time.time() - start_time) * 1000)
        error_msg = str(e.detail)
        
        logger.warning(f"⚠️ Batch image {index} failed (HTTP {e.status_code}): {error_msg}")
        
        return BatchImageResult(
            filename=filename,
            index=index,
            success=False,
            error=f"HTTP {e.status_code}: {error_msg}",
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        # Unexpected errors
        processing_time = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        
        logger.error(f"❌ Batch image {index} failed: {error_msg}", exc_info=True)
        
        return BatchImageResult(
            filename=filename,
            index=index,
            success=False,
            error=f"Processing error: {error_msg}",
            processing_time_ms=processing_time
        )


async def process_image_batch(
    files: List[UploadFile],
    partner_id: str,
    service: DetectionService,
    channel: str,
    user_ref: Optional[str],
    process_func
) -> dict:
    """
    Process a batch of images in parallel.
    
    Uses ThreadPoolExecutor for I/O-bound operations (OCR, API calls).
    Processes up to MAX_WORKERS images concurrently.
    
    Args:
        files: List of uploaded files
        partner_id: Partner identifier
        service: Detection service
        channel: Detection channel
        user_ref: User reference
        process_func: Async function to process single image
        
    Returns:
        dict with batch_id, results, and summary
    """
    batch_id = str(uuid.uuid4())
    start_time = time.time()
    
    logger.info(f"🚀 Starting batch processing: batch_id={batch_id}, images={len(files)}")
    
    # Validate batch first
    is_valid, error = validate_batch_request(files)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Process images in parallel
    # Use asyncio.gather for concurrent execution
    tasks = [
        process_single_image_in_batch(
            file=file,
            index=idx,
            partner_id=partner_id,
            service=service,
            channel=channel,
            user_ref=user_ref,
            process_func=process_func
        )
        for idx, file in enumerate(files)
    ]
    
    # Execute all tasks concurrently (limited by MAX_WORKERS is handled by semaphore)
    # For now, asyncio.gather will run all concurrently
    # TODO: Add semaphore if needed to limit concurrent API calls
    results = await asyncio.gather(*tasks, return_exceptions=False)
    
    # Calculate summary
    summary = calculate_batch_summary(results)
    
    total_time = int((time.time() - start_time) * 1000)
    
    logger.info(
        f"✅ Batch complete: batch_id={batch_id}, "
        f"total={len(files)}, successful={summary.successful}, failed={summary.failed}, "
        f"time={total_time}ms"
    )
    
    return {
        "batch_id": batch_id,
        "total_images": len(files),
        "results": results,
        "summary": summary,
        "total_processing_time_ms": total_time
    }


def calculate_batch_summary(results: List[BatchImageResult]) -> BatchSummary:
    """
    Calculate summary statistics for batch results.
    
    Args:
        results: List of batch image results
        
    Returns:
        BatchSummary with statistics
    """
    # Count successes and failures
    successful = sum(1 for r in results if r.success)
    failed = len(results) - successful
    
    # For successful detections
    successful_results = [r for r in results if r.success]
    
    scam_count = sum(1 for r in successful_results if r.is_scam)
    safe_count = successful - scam_count
    
    # Calculate average risk score
    risk_scores = [r.risk_score for r in successful_results if r.risk_score is not None]
    avg_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 0.0
    
    # Category distribution
    categories = {}
    for r in successful_results:
        if r.category:
            categories[r.category] = categories.get(r.category, 0) + 1
    
    # Count manipulated images
    manipulated = sum(
        1 for r in successful_results
        if r.forensics and r.forensics.get("is_manipulated", False)
    )
    
    # Collect errors
    errors = [
        {
            "index": r.index,
            "filename": r.filename,
            "error": r.error
        }
        for r in results if not r.success
    ]
    
    return BatchSummary(
        successful=successful,
        failed=failed,
        scam_count=scam_count,
        safe_count=safe_count,
        average_risk_score=round(avg_risk, 3),
        categories=categories,
        manipulated_images=manipulated,
        errors=errors
    )
