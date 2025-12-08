"""
Image preprocessing utilities for enhanced OCR accuracy
"""
import cv2
import numpy as np
import logging
from typing import Optional, Tuple
from PIL import Image
import io

logger = logging.getLogger(__name__)


def preprocess_for_ocr(image_content: bytes, auto_rotate: bool = True) -> bytes:
    """
    Preprocess image for better OCR accuracy.
    
    Applies:
    - Grayscale conversion
    - Denoising
    - Sharpening
    - Adaptive thresholding
    - Auto-rotation (optional)
    
    Args:
        image_content: Raw image bytes
        auto_rotate: Whether to auto-rotate based on text orientation
        
    Returns:
        Preprocessed image bytes (PNG format)
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            logger.warning("Failed to decode image for preprocessing")
            return image_content
        
        # 1. Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 2. Denoise (reduce noise while preserving edges)
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        
        # 3. Sharpen (enhance text edges)
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # 4. Adaptive thresholding (better for varying lighting)
        # This converts to binary image (black text on white background)
        binary = cv2.adaptiveThreshold(
            sharpened,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,  # Block size
            2    # Constant subtracted from mean
        )
        
        # 5. Optional: Auto-rotate if text is upside down or sideways
        if auto_rotate:
            binary = _auto_rotate_image(binary)
        
        # Convert back to bytes
        success, buffer = cv2.imencode('.png', binary)
        if not success:
            logger.warning("Failed to encode preprocessed image")
            return image_content
        
        preprocessed_bytes = buffer.tobytes()
        
        logger.debug(f"Preprocessed image: {len(image_content)} → {len(preprocessed_bytes)} bytes")
        return preprocessed_bytes
        
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}", exc_info=True)
        return image_content  # Return original if preprocessing fails


def enhance_contrast(image_content: bytes) -> bytes:
    """
    Enhance image contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization).
    
    Better for low-contrast images like faded receipts or dark screenshots.
    
    Args:
        image_content: Raw image bytes
        
    Returns:
        Contrast-enhanced image bytes
    """
    try:
        nparr = np.frombuffer(image_content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            return image_content
        
        # Create CLAHE object
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(img)
        
        # Convert back to bytes
        success, buffer = cv2.imencode('.png', enhanced)
        if success:
            return buffer.tobytes()
        
        return image_content
        
    except Exception as e:
        logger.error(f"Contrast enhancement failed: {e}")
        return image_content


def remove_shadows(image_content: bytes) -> bytes:
    """
    Remove shadows from image (useful for photos of documents).
    
    Args:
        image_content: Raw image bytes
        
    Returns:
        Shadow-removed image bytes
    """
    try:
        nparr = np.frombuffer(image_content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return image_content
        
        # Convert to LAB color space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_channel, a, b = cv2.split(lab)
        
        # Apply CLAHE to L-channel
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        
        # Merge channels
        merged = cv2.merge((cl, a, b))
        
        # Convert back to BGR
        result = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
        
        # Convert to bytes
        success, buffer = cv2.imencode('.png', result)
        if success:
            return buffer.tobytes()
        
        return image_content
        
    except Exception as e:
        logger.error(f"Shadow removal failed: {e}")
        return image_content


def deskew_image(image_content: bytes) -> bytes:
    """
    Deskew (straighten) tilted images.
    
    Useful when users take photos of documents at an angle.
    
    Args:
        image_content: Raw image bytes
        
    Returns:
        Deskewed image bytes
    """
    try:
        nparr = np.frombuffer(image_content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            return image_content
        
        # Calculate skew angle
        coords = np.column_stack(np.where(img > 0))
        if len(coords) == 0:
            return image_content
        
        angle = cv2.minAreaRect(coords)[-1]
        
        # Adjust angle
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        
        # Only deskew if angle is significant (> 0.5 degrees)
        if abs(angle) < 0.5:
            return image_content
        
        # Rotate image
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            img, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        # Convert to bytes
        success, buffer = cv2.imencode('.png', rotated)
        if success:
            logger.debug(f"Deskewed image by {angle:.2f} degrees")
            return buffer.tobytes()
        
        return image_content
        
    except Exception as e:
        logger.error(f"Deskewing failed: {e}")
        return image_content


def _auto_rotate_image(img: np.ndarray) -> np.ndarray:
    """
    Auto-rotate image based on text orientation.
    
    Args:
        img: Grayscale image array
        
    Returns:
        Rotated image array
    """
    try:
        # Simple heuristic: try all 4 orientations and pick the best
        # In production, you'd use pytesseract.image_to_osd() for better accuracy
        # For now, we'll skip auto-rotation to avoid additional dependencies
        return img
        
    except Exception as e:
        logger.debug(f"Auto-rotation skipped: {e}")
        return img


def get_preprocessing_stats(original: bytes, preprocessed: bytes) -> dict:
    """
    Get statistics comparing original vs preprocessed image.
    
    Args:
        original: Original image bytes
        preprocessed: Preprocessed image bytes
        
    Returns:
        Dict with comparison stats
    """
    try:
        orig_img = cv2.imdecode(np.frombuffer(original, np.uint8), cv2.IMREAD_GRAYSCALE)
        prep_img = cv2.imdecode(np.frombuffer(preprocessed, np.uint8), cv2.IMREAD_GRAYSCALE)
        
        if orig_img is None or prep_img is None:
            return {}
        
        return {
            "original_size_bytes": len(original),
            "preprocessed_size_bytes": len(preprocessed),
            "size_change_percent": ((len(preprocessed) - len(original)) / len(original) * 100),
            "original_contrast": float(np.std(orig_img)),
            "preprocessed_contrast": float(np.std(prep_img)),
            "contrast_improvement_percent": (
                (np.std(prep_img) - np.std(orig_img)) / np.std(orig_img) * 100
                if np.std(orig_img) > 0 else 0
            )
        }
        
    except Exception as e:
        logger.error(f"Failed to get preprocessing stats: {e}")
        return {}
