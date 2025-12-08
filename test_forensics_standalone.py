#!/usr/bin/env python3
"""
Simple standalone test for visual forensics (no pytest dependencies)
"""
import sys
sys.path.insert(0, '/Users/pop7/Code/ThaiScamBench')

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


def test_ela():
    print("\n🧪 Test 1: Error Level Analysis")
    image_bytes = create_test_image()
    result = analyze_error_level(image_bytes)
    print(f"  ✅ ELA Result: suspicious={result['suspicious']}, score={result['score']:.3f}")
    print(f"     Variance: {result['variance']:.2f}, Reason: {result['reason']}")
    assert 0 <= result['score'] <= 1, "Score must be in range [0,1]"


def test_metadata():
    print("\n🧪 Test 2: Metadata Extraction")
    image_bytes = create_test_image()
    result = extract_metadata(image_bytes)
    print(f"  ✅ Metadata: has_exif={result['has_exif']}, tampered={result['tampered']}")
    print(f"     Confidence: {result['confidence']:.3f}, Camera: {result['camera']}")
    assert 0 <= result['confidence'] <= 1, "Confidence must be in range [0,1]"


def test_compression():
    print("\n🧪 Test 3: JPEG Compression Analysis")
    image_bytes = create_test_image()
    result = analyze_jpeg_compression(image_bytes)
    print(f"  ✅ Compression: edited={result['edited']}, saves={result['estimated_saves']}")
    print(f"     Reason: {result['reason']}")
    assert result['estimated_saves'] >= 1, "Should estimate at least 1 save"


def test_cloning():
    print("\n🧪 Test 4: Clone Detection")
    image_bytes = create_test_image()
    result = detect_cloning(image_bytes)
    print(f"  ✅ Cloning: detected={result['detected']}, regions={result['clone_regions']}")
    print(f"     Total features: {result.get('total_features', 0)}")
    assert 0 <= result['confidence'] <= 1, "Confidence must be in range [0,1]"


def test_comprehensive():
    print("\n🧪 Test 5: Comprehensive Forensics")
    image_bytes = create_test_image()
    result = comprehensive_forensics(image_bytes)
    print(f"  ✅ Comprehensive: manipulated={result.is_manipulated}, confidence={result.confidence:.3f}")
    print(f"     Type: {result.manipulation_type}, Details: {result.details}")
    print(f"     Techniques:")
    print(f"       - ELA score: {result.techniques['ela']['score']:.3f}")
    print(f"       - Metadata confidence: {result.techniques['metadata']['confidence']:.3f}")
    print(f"       - Compression confidence: {result.techniques['compression']['confidence']:.3f}")
    print(f"       - Cloning confidence: {result.techniques['cloning']['confidence']:.3f}")
    assert 0 <= result.confidence <= 1, "Confidence must be in range [0,1]"


def test_error_handling():
    print("\n🧪 Test 6: Error Handling")
    invalid_data = b"not an image"
    ela_result = analyze_error_level(invalid_data)
    print(f"  ✅ Invalid data handled: {ela_result['reason']}")
    assert ela_result['suspicious'] == False, "Should not be suspicious on error"


def test_low_quality_image():
    print("\n🧪 Test 7: Low Quality Image")
    image_bytes = create_test_image(quality=50)
    result = comprehensive_forensics(image_bytes)
    print(f"  ✅ Low quality: manipulated={result.is_manipulated}, confidence={result.confidence:.3f}")
    print(f"     ELA detected compression: {result.techniques['compression']['edited']}")


def main():
    print("=" * 70)
    print("🔬 Visual Forensics - Standalone Tests")
    print("=" * 70)
    
    try:
        test_ela()
        test_metadata()
        test_compression()
        test_cloning()
        test_comprehensive()
        test_error_handling()
        test_low_quality_image()
        
        print("\n" + "=" * 70)
        print("✅ All tests passed!")
        print("=" * 70)
        return 0
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
