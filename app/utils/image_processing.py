"""
Image Processing Utilities
"""
import io
import imagehash
from PIL import Image
import logging

logger = logging.getLogger(__name__)

def calculate_image_hash(image_bytes: bytes) -> str:
    """
    Calculate Perceptual Hash (pHash) of an image.
    Returns a hex string representation of the hash.
    Differences in this hash correspond to visual differences.
    """
    try:
        # Load image from bytes
        img = Image.open(io.BytesIO(image_bytes))
        
        # Calculate pHash (robust to scaling/coloring)
        phash = imagehash.phash(img)
        
        return str(phash)
    except Exception as e:
        logger.error(f"Failed to calculate image hash: {e}")
        return ""

def is_similar_hash(hash1: str, hash2: str, threshold: int = 5) -> bool:
    """
    Check if two image hashes are similar.
    Threshold is the Hamming distance (number of different bits).
    Default threshold 5 is usually good for 'visually identical' but with minor noise.
    """
    try:
        if not hash1 or not hash2:
            return False
            
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        
        return (h1 - h2) <= threshold
    except Exception:
        return False
