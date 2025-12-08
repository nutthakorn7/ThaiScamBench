"""
Advanced Visual Forensics for Image Manipulation Detection

Includes:
- Error Level Analysis (ELA) for photoshop detection
- Metadata extraction and tampering detection
- JPEG compression analysis
- Clone/copy-paste detection
"""
import cv2
import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import io
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class ForensicsResult:
    """Result of comprehensive forensics analysis."""
    is_manipulated: bool
    confidence: float
    manipulation_type: Optional[str]
    details: Optional[str]
    techniques: Dict[str, dict]


def analyze_error_level(image_content: bytes, quality: int = 95) -> dict:
    """
    Perform Error Level Analysis (ELA) to detect photoshopped regions.
    
    How it works:
    1. Resave image at specified quality
    2. Calculate pixel-by-pixel difference with original
    3. Amplify differences to detect edited regions
    4. High variance = likely edited, low/uniform = original
    
    Args:
        image_content: Raw image bytes
        quality: JPEG quality for resave (default: 95)
        
    Returns:
        dict with suspicious flag, variance score, and details
    """
    try:
        # Load original image
        img = Image.open(io.BytesIO(image_content))
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resave at specified quality
        buffer = io.BytesIO()
        img.save(buffer, 'JPEG', quality=quality)
        buffer.seek(0)
        
        # Load recompressed image
        recompressed = Image.open(buffer)
        
        # Convert to numpy arrays
        original_arr = np.array(img)
        recompressed_arr = np.array(recompressed)
        
        # Calculate absolute difference
        diff = cv2.absdiff(original_arr, recompressed_arr)
        
        # Amplify differences (scale by 10)
        diff_amplified = np.clip(diff * 10, 0, 255).astype(np.uint8)
        
        # Calculate variance (higher = more suspicious)
        variance = float(np.var(diff_amplified))
        mean = float(np.mean(diff_amplified))
        max_diff = float(np.max(diff_amplified))
        
        # Determine if suspicious
        # Thresholds based on empirical testing
        suspicious = False
        reason = ""
        
        if variance > 100:  # High variance threshold
            suspicious = True
            reason = "High ELA variance detected - likely edited"
        elif max_diff > 150:  # High max difference
            suspicious = True
            reason = "Extreme pixel differences detected"
        elif mean > 20:  # High mean difference
            suspicious = True
            reason = "Elevated average error levels"
        else:
            reason = "Normal error levels - likely unedited"
        
        # Calculate suspicion score (0-1)
        score = min((variance / 500.0) + (mean / 100.0) + (max_diff / 500.0), 1.0)
        
        logger.debug(f"ELA analysis - variance: {variance:.2f}, mean: {mean:.2f}, max: {max_diff:.2f}, score: {score:.2f}")
        
        return {
            "suspicious": suspicious,
            "score": round(score, 3),
            "variance": round(variance, 2),
            "mean_diff": round(mean, 2),
            "max_diff": round(max_diff, 2),
            "reason": reason
        }
        
    except Exception as e:
        logger.error(f"ELA analysis failed: {e}", exc_info=True)
        return {
            "suspicious": False,
            "score": 0.0,
            "variance": 0.0,
            "mean_diff": 0.0,
            "max_diff": 0.0,
            "reason": f"Analysis failed: {str(e)}"
        }


def extract_metadata(image_content: bytes) -> dict:
    """
    Extract and analyze EXIF metadata for tampering indicators.
    
    Checks for:
    - Editing software signatures (Photoshop, GIMP, Canva)
    - Missing expected fields
    - Timestamp inconsistencies
    - GPS data (if present)
    
    Args:
        image_content: Raw image bytes
        
    Returns:
        dict with metadata, tampering flag, and issues
    """
    try:
        img = Image.open(io.BytesIO(image_content))
        
        # Get EXIF data
        exif_data = {}
        try:
            exif = img._getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    
                    # Convert bytes to string
                    if isinstance(value, bytes):
                        try:
                            value = value.decode('utf-8', errors='ignore')
                        except:
                            value = str(value)
                    
                    # Handle GPS data separately
                    if tag == 'GPSInfo' and isinstance(value, dict):
                        gps_data = {}
                        for gps_tag_id, gps_value in value.items():
                            gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                            gps_data[gps_tag] = str(gps_value)
                        exif_data[tag] = gps_data
                    else:
                        exif_data[tag] = str(value)
        except AttributeError:
            # No EXIF data
            pass
        
        # Check for tampering indicators
        tampered = False
        issues = []
        editing_software = []
        
        # Check 1: Editing software
        if 'Software' in exif_data:
            software = exif_data['Software'].lower()
            
            suspicious_software = [
                'photoshop', 'gimp', 'canva', 'pixlr', 
                'paint.net', 'affinity', 'sketch'
            ]
            
            for sus in suspicious_software:
                if sus in software:
                    tampered = True
                    editing_software.append(sus.title())
                    issues.append(f"Edited with {sus.title()}")
        
        # Check 2: DateTime consistency
        has_datetime = 'DateTime' in exif_data
        has_datetime_original = 'DateTimeOriginal' in exif_data
        
        if has_datetime and has_datetime_original:
            # Check if they're different (might indicate editing)
            if exif_data['DateTime'] != exif_data['DateTimeOriginal']:
                issues.append("DateTime and DateTimeOriginal mismatch")
        
        # Check 3: Missing common fields
        if not exif_data:
            issues.append("No EXIF data found - possibly stripped")
        
        # Check 4: Has GPS but suspicious
        if 'GPSInfo' in exif_data and editing_software:
            issues.append("Has GPS data but edited with software")
        
        # Calculate tampering confidence
        confidence = 0.0
        if editing_software:
            confidence += 0.5
        if len(issues) > 1:
            confidence += 0.3
        if not exif_data:
            confidence += 0.2
        
        confidence = min(confidence, 1.0)
        
        return {
            "has_exif": bool(exif_data),
            "tampered": tampered,
            "confidence": round(confidence, 3),
            "metadata": exif_data,
            "issues": issues,
            "editing_software": editing_software,
            "timestamp": exif_data.get('DateTime', 'Not found'),
            "camera": exif_data.get('Make', 'Unknown'),
            "model": exif_data.get('Model', 'Unknown')
        }
        
    except Exception as e:
        logger.error(f"Metadata extraction failed: {e}", exc_info=True)
        return {
            "has_exif": False,
            "tampered": False,
            "confidence": 0.0,
            "metadata": {},
            "issues": [f"Extraction failed: {str(e)}"],
            "editing_software": [],
            "timestamp": "Error",
            "camera": "Unknown",
            "model": "Unknown"
        }


def analyze_jpeg_compression(image_content: bytes) -> dict:
    """
    Analyze JPEG compression artifacts to detect multiple saves/edits.
    
    Multiple JPEG saves create cumulative artifacts.
    This function estimates the number of save operations.
    
    Args:
        image_content: Raw image bytes
        
    Returns:
        dict with editing indicators and estimated save count
    """
    try:
        img = Image.open(io.BytesIO(image_content))
        
        # Only works for JPEG
        if img.format != 'JPEG':
            return {
                "edited": False,
                "confidence": 0.0,
                "estimated_saves": 1,
                "reason": f"Not a JPEG image (format: {img.format})"
            }
        
        # Convert to numpy array
        img_arr = np.array(img)
        
        # Calculate compression quality estimation
        # by looking at high-frequency components
        gray = cv2.cvtColor(img_arr, cv2.COLOR_RGB2GRAY) if len(img_arr.shape) == 3 else img_arr
        
        # Apply DCT (Discrete Cosine Transform)
        dct = cv2.dct(np.float32(gray))
        
        # High frequency components (bottom-right of DCT)
        h, w = dct.shape
        high_freq = dct[h//2:, w//2:]
        
        # Calculate energy in high frequencies
        # Multiple saves reduce high-frequency energy
        high_freq_energy = np.sum(np.abs(high_freq))
        total_energy = np.sum(np.abs(dct))
        
        high_freq_ratio = high_freq_energy / total_energy if total_energy > 0 else 0
        
        # Estimate number of saves
        # Lower ratio = more saves
        if high_freq_ratio > 0.15:
            estimated_saves = 1
            edited = False
            reason = "High quality - likely original or minimal edits"
        elif high_freq_ratio > 0.10:
            estimated_saves = 2
            edited = True
            reason = "Moderate compression - possibly saved once or twice"
        elif high_freq_ratio > 0.05:
            estimated_saves = 3
            edited = True
            reason = "Heavy compression - likely saved multiple times"
        else:
            estimated_saves = 4
            edited = True
            reason = "Very heavy compression - extensively edited/saved"
        
        confidence = min((4 - estimated_saves) / 4.0 + 0.2, 1.0) if edited else 0.0
        
        return {
            "edited": edited,
            "confidence": round(confidence, 3),
            "estimated_saves": estimated_saves,
            "high_freq_ratio": round(high_freq_ratio, 4),
            "reason": reason
        }
        
    except Exception as e:
        logger.error(f"JPEG analysis failed: {e}", exc_info=True)
        return {
            "edited": False,
            "confidence": 0.0,
            "estimated_saves": 1,
            "high_freq_ratio": 0.0,
            "reason": f"Analysis failed: {str(e)}"
        }


def detect_cloning(image_content: bytes, threshold: int = 50) -> dict:
    """
    Detect copy-pasted (cloned) regions using feature matching.
    
    Uses ORB (Oriented FAST and Rotated BRIEF) to find duplicate regions.
    
    Args:
        image_content: Raw image bytes
        threshold: Minimum matches to consider as cloning
        
    Returns:
        dict with detection flag and match count
    """
    try:
        # Convert bytes to image
        nparr = np.frombuffer(image_content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {
                "detected": False,
                "confidence": 0.0,
                "clone_regions": 0,
                "reason": "Failed to decode image"
            }
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Initialize ORB detector
        orb = cv2.ORB_create(nfeatures=1000) # Limit features for performance
        
        # Detect keypoints and descriptors
        kp, des = orb.detectAndCompute(gray, None)
        
        if des is None or len(kp) < 10:
            return {
                "detected": False,
                "confidence": 0.0,
                "clone_regions": 0,
                "reason": "Insufficient features detected"
            }
        
        # Match features with themselves
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        matches = bf.knnMatch(des, des, k=2)
        
        # Find good matches in different regions
        clone_matches = []
        for match_pair in matches:
            if len(match_pair) < 2:
                continue
                
            m, n = match_pair
            
            # Skip self-matches
            if m.queryIdx == m.trainIdx:
                continue
            
            # Good match criteria
            if m.distance < 0.7 * n.distance:
                # Check if keypoints are in different regions
                pt1 = kp[m.queryIdx].pt
                pt2 = kp[m.trainIdx].pt
                
                distance = np.sqrt((pt1[0] - pt2[0])**2 + (pt1[1] - pt2[1])**2)
                
                # If points are far apart (>50px) = potential clone
                if distance > 50:
                    clone_matches.append((m, distance))
        
        # Determine if cloning detected
        clone_count = len(clone_matches)
        detected = clone_count > threshold
        
        # Calculate confidence
        confidence = min(clone_count / 100.0, 1.0) if detected else 0.0
        
        reason = "No cloning detected"
        if detected:
            reason = f"Potential cloning detected - {clone_count} suspicious feature matches"
        elif clone_count > 0:
            reason = f"Some similar regions found ({clone_count} matches) but below threshold"
        
        return {
            "detected": detected,
            "confidence": round(confidence, 3),
            "clone_regions": clone_count,
            "total_features": len(kp),
            "reason": reason
        }
        
    except Exception as e:
        logger.error(f"Clone detection failed: {e}", exc_info=True)
        return {
            "detected": False,
            "confidence": 0.0,
            "clone_regions": 0,
            "total_features": 0,
            "reason": f"Detection failed: {str(e)}"
        }


def comprehensive_forensics(image_content: bytes) -> ForensicsResult:
    """
    Perform comprehensive forensics analysis using all techniques.
    
    Combines:
    - Error Level Analysis (ELA)
    - Metadata extraction
    - JPEG compression analysis
    - Clone detection
    
    Args:
        image_content: Raw image bytes
        
    Returns:
        ForensicsResult with comprehensive analysis
    """
    logger.info("🔬 Starting comprehensive forensics analysis")
    
    # Run all techniques
    ela_result = analyze_error_level(image_content)
    metadata_result = extract_metadata(image_content)
    compression_result = analyze_jpeg_compression(image_content)
    cloning_result = detect_cloning(image_content)
    
    # Combine results
    techniques = {
        "ela": ela_result,
        "metadata": metadata_result,
        "compression": compression_result,
        "cloning": cloning_result
    }
    
    # Calculate overall manipulation probability
    # Weighted combination of all techniques
    weights = {
        "ela": 0.4,          # Most reliable for photoshop
        "metadata": 0.3,     # Strong indicator if software found
        "compression": 0.2,  # Moderate indicator
        "cloning": 0.1       # Less common but strong when found
    }
    
    total_confidence = (
        ela_result["score"] * weights["ela"] +
        metadata_result["confidence"] * weights["metadata"] +
        compression_result["confidence"] * weights["compression"] +
        cloning_result["confidence"] * weights["cloning"]
    )
    
    # Determine if manipulated (threshold: 0.5)
    is_manipulated = total_confidence > 0.5
    
    # Determine manipulation type
    manipulation_type = None
    details = []
    
    if ela_result["suspicious"]:
        manipulation_type = "photoshop"
        details.append(ela_result["reason"])
    
    if metadata_result["tampered"] and metadata_result["editing_software"]:
        if not manipulation_type:
            manipulation_type = "editing_software"
        details.append(f"Edited with: {', '.join(metadata_result['editing_software'])}")
    
    if compression_result["edited"] and compression_result["estimated_saves"] >= 3:
        if not manipulation_type:
            manipulation_type = "multiple_edits"
        details.append(f"Saved ~{compression_result['estimated_saves']} times")
    
    if cloning_result["detected"]:
        if not manipulation_type:
            manipulation_type = "cloning"
        details.append(f"Cloned regions: {cloning_result['clone_regions']}")
    
    # Combine details
    details_str = " | ".join(details) if details else None
    
    logger.info(
        f"Forensics complete - manipulated: {is_manipulated}, "
        f"confidence: {total_confidence:.2f}, type: {manipulation_type}"
    )
    
    return ForensicsResult(
        is_manipulated=is_manipulated,
        confidence=round(total_confidence, 3),  
        manipulation_type=manipulation_type,
        details=details_str,
        techniques=techniques
    )
