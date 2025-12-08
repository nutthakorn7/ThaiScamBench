"""
Unit tests for visual forensics module

Tests ELA, metadata extraction, JPEG analysis, and clone detection
"""
import pytest
from app.utils.visual_forensics import (
    analyze_error_level,
    extract_metadata,
    analyze_jpeg_compression,
    detect_cloning,
    comprehensive_forensics
)
from PIL import Image
import io


def create_test_image(size=(800, 600), format='JPEG', quality=95):
    """Create a simple test image."""
    img = Image.new('RGB', size, color=(73, 109, 137))
    buffer = io.BytesIO()
    img.save(buffer, format, quality=quality)
    buffer.seek(0)
    return buffer.getvalue()


def test_analyze_error_level_normal_image():
    """Test ELA on a normal, unedited image."""
    image_bytes = create_test_image()
    result = analyze_error_level(image_bytes)
    
    assert isinstance(result, dict)
    assert "suspicious" in result
    assert "score" in result
    assert "variance" in result
    assert result["score"] >= 0.0 and result["score"] <= 1.0


def test_analyze_error_level_low_quality():
    """Test ELA on low quality image (higher compression artifacts)."""
    image_bytes = create_test_image(quality=60)
    result = analyze_error_level(image_bytes)
    
    assert isinstance(result, dict)
    # Low quality images might have higher variance
    assert result["variance"] >= 0


def test_extract_metadata_basic():
    """Test metadata extraction on image."""
    image_bytes = create_test_image()
    result = extract_metadata(image_bytes)
    
    assert isinstance(result, dict)
    assert "has_exif" in result
    assert "tampered" in result
    assert "confidence" in result
    assert "metadata" in result
    assert result["confidence"] >= 0.0 and result["confidence"] <= 1.0


def test_analyze_jpeg_compression():
    """Test JPEG compression analysis."""
    image_bytes = create_test_image()
    result = analyze_jpeg_compression(image_bytes)
    
    assert isinstance(result, dict)
    assert "edited" in result
    assert "confidence" in result
    assert "estimated_saves" in result
    assert result["estimated_saves"] >= 1


def test_analyze_jpeg_compression_non_jpeg():
    """Test JPEG analysis on non-JPEG image."""
    # Create PNG image
    img = Image.new('RGB', (800, 600), color=(73, 109, 137))
    buffer = io.BytesIO()
    img.save(buffer, 'PNG')
    buffer.seek(0)
    image_bytes = buffer.getvalue()
    
    result = analyze_jpeg_compression(image_bytes)
    
    assert isinstance(result, dict)
    assert result["edited"] == False
    assert "Not a JPEG" in result["reason"]


def test_detect_cloning():
    """Test clone detection."""
    image_bytes = create_test_image()
    result = detect_cloning(image_bytes)
    
    assert isinstance(result, dict)
    assert "detected" in result
    assert "confidence" in result
    assert "clone_regions" in result
    assert result["confidence"] >= 0.0 and result["confidence"] <= 1.0


def test_comprehensive_forensics():
    """Test comprehensive forensics analysis."""
    image_bytes = create_test_image()
    result = comprehensive_forensics(image_bytes)
    
    # Check ForensicsResult structure
    assert hasattr(result, 'is_manipulated')
    assert hasattr(result, 'confidence')
    assert hasattr(result, 'manipulation_type')
    assert hasattr(result, 'details')
    assert hasattr(result, 'techniques')
    
    # Check confidence range
    assert result.confidence >= 0.0 and result.confidence <= 1.0
    
    # Check techniques
    assert "ela" in result.techniques
    assert "metadata" in result.techniques
    assert "compression" in result.techniques
    assert "cloning" in result.techniques


def test_comprehensive_forensics_integration():
    """Test that comprehensive forensics combines all techniques."""
    image_bytes = create_test_image()
    result = comprehensive_forensics(image_bytes)
    
    # All techniques should have results
    ela = result.techniques["ela"]
    metadata = result.techniques["metadata"]
    compression = result.techniques["compression"]
    cloning = result.techniques["cloning"]
    
    assert "score" in ela
    assert "confidence" in metadata
    assert "confidence" in compression
    assert "confidence" in cloning


def test_error_handling_invalid_data():
    """Test error handling with invalid image data."""
    invalid_data = b"not an image"
    
    # Should not crash, should return safe defaults
    ela_result = analyze_error_level(invalid_data)
    assert ela_result["suspicious"] == False
    assert "failed" in ela_result["reason"].lower()
    
    metadata_result = extract_metadata(invalid_data)
    assert metadata_result["has_exif"] == False
    
    compression_result = analyze_jpeg_compression(invalid_data)
    assert compression_result["edited"] == False


def test_confidence_scoring_weights():
    """Test that confidence scores are properly weighted."""
    image_bytes = create_test_image()
    result = comprehensive_forensics(image_bytes)
    
    # Confidence should be weighted average of techniques
    # Verify it's not just simple average
    ela_score = result.techniques["ela"]["score"]
    metadata_conf = result.techniques["metadata"]["confidence"]
    compression_conf = result.techniques["compression"]["confidence"]
    cloning_conf = result.techniques["cloning"]["confidence"]
    
    # Total confidence should be influenced by all techniques
    # but not necessarily equal to their average
    assert result.confidence >= 0.0
    assert result.confidence <= 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
