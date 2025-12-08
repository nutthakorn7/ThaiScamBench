"""
Image utilities for validation and caching
"""
import hashlib
import logging
from typing import Optional, Tuple
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Validation constants
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MIN_IMAGE_SIZE = 1024  # 1KB
ALLOWED_FORMATS = {"JPEG", "PNG", "BMP", "WEBP"}
MAX_DIMENSION = 4096  # Max width/height


def generate_image_hash(image_content: bytes) -> str:
    """
    Generate SHA-256 hash of image content for caching.
    
    Args:
        image_content: Raw image bytes
        
    Returns:
        Hex digest of SHA-256 hash
    """
    return hashlib.sha256(image_content).hexdigest()


def validate_image_content(image_content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
    """
    Comprehensive image validation.
    
    Args:
        image_content: Raw image bytes
        filename: Original filename
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # 1. Size validation
    size = len(image_content)
    
    if size == 0:
        return False, "Image file is empty"
    
    if size < MIN_IMAGE_SIZE:
        return False, f"Image too small (min {MIN_IMAGE_SIZE} bytes)"
    
    if size > MAX_IMAGE_SIZE:
        size_mb = size / (1024 * 1024)
        return False, f"Image too large ({size_mb:.1f}MB, max 10MB)"
    
    # 2. Format validation (not just extension)
    try:
        img = Image.open(io.BytesIO(image_content))
        
        # Verify it's a valid image
        img.verify()
        
        # Re-open for format check (verify() closes the image)
        img = Image.open(io.BytesIO(image_content))
        
        # Check format
        if img.format not in ALLOWED_FORMATS:
            return False, f"Unsupported format: {img.format} (allowed: JPEG, PNG, BMP, WEBP)"
        
        # Check dimensions
        width, height = img.size
        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            return False, f"Image dimensions too large ({width}x{height}, max {MAX_DIMENSION}px)"
        
        if width < 50 or height < 50:
            return False, f"Image too small ({width}x{height}, min 50x50px)"
        
        logger.debug(f"Image validated: {img.format}, {width}x{height}, {size} bytes")
        return True, None
        
    except Exception as e:
        logger.warning(f"Image validation failed: {e}")
        return False, f"Invalid image file: {str(e)}"


def get_image_info(image_content: bytes) -> dict:
    """
    Get image metadata.
    
    Args:
        image_content: Raw image bytes
        
    Returns:
        Dict with image info
    """
    try:
        img = Image.open(io.BytesIO(image_content))
        
        return {
            "format": img.format,
            "mode": img.mode,
            "size": img.size,
            "width": img.size[0],
            "height": img.size[1],
            "bytes": len(image_content)
        }
    except Exception as e:
        logger.error(f"Failed to get image info: {e}")
        return {}
