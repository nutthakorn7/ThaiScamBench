#!/usr/bin/env python3
"""
Simple standalone test for batch processing utilities
"""
import sys
sys.path.insert(0, '/Users/pop7/Code/ThaiScamBench')

from app.utils.batch_processing import validate_batch_request, calculate_batch_summary
from app.models.batch import BatchImageResult, BatchSummary
from fastapi import UploadFile
from io import BytesIO


class MockUploadFile:
    """Mock UploadFile for testing."""
    def __init__(self, filename: str):
        self.filename = filename
        self.file = BytesIO(b"fake image data")


def test_batch_validation():
    print("\n🧪 Test 1: Batch Validation")
    
    # Valid batch
    files = [MockUploadFile(f"image{i}.jpg") for i in range(10)]
    is_valid, error = validate_batch_request(files)
    print(f"  ✅ 10 images: valid={is_valid}")
    assert is_valid, "Should be valid"
    
    # Empty batch
    is_valid, error = validate_batch_request([])
    print(f"  ✅ Empty batch: valid={is_valid}, error={error}")
    assert not is_valid, "Should be invalid"
    
    # Too many
    files = [MockUploadFile(f"image{i}.jpg") for i in range(101)]
    is_valid, error = validate_batch_request(files)
    print(f"  ✅ 101 images: valid={is_valid}, error={error}")
    assert not is_valid, "Should be invalid"
    
    # Invalid format
    files = [MockUploadFile("test.pdf")]
    is_valid, error = validate_batch_request(files)
    print(f"  ✅ PDF file: valid={is_valid}, error={error}")
    assert not is_valid, "Should be invalid"


def test_batch_summary():
    print("\n🧪 Test 2: Batch Summary Calculation")
    
    # Create mock results
    results = [
        BatchImageResult(
            filename="slip1.jpg",
            index=0,
            success=True,
            is_scam=False,
            risk_score=0.15,
            category="banking",
            processing_time_ms=1500
        ),
        BatchImageResult(
            filename="slip2.jpg",
            index=1,
            success=True,
            is_scam=True,
            risk_score=0.92,
            category="banking",
            forensics={"is_manipulated": True},
            processing_time_ms=1600
        ),
        BatchImageResult(
            filename="slip3.jpg",
            index=2,
            success=False,
            error="Invalid image",
            processing_time_ms=100
        ),
        BatchImageResult(
            filename="slip4.jpg",
            index=3,
            success=True,
            is_scam=False,
            risk_score=0.25,
            category="parcel",
            processing_time_ms=1400
        ),
    ]
    
    summary = calculate_batch_summary(results)
    
    print(f"  ✅ Summary calculated:")
    print(f"     Total: {len(results)}")
    print(f"     Successful: {summary.successful}")
    print(f"     Failed: {summary.failed}")
    print(f"     Scam count: {summary.scam_count}")
    print(f"     Safe count: {summary.safe_count}")
    print(f"     Avg risk: {summary.average_risk_score:.3f}")
    print(f"     Categories: {summary.categories}")
    print(f"     Manipulated: {summary.manipulated_images}")
    print(f"     Errors: {len(summary.errors)}")
    
    # Assertions
    assert summary.successful == 3, f"Expected 3 successful, got {summary.successful}"
    assert summary.failed == 1, f"Expected 1 failed, got {summary.failed}"
    assert summary.scam_count == 1, f"Expected 1 scam, got {summary.scam_count}"
    assert summary.safe_count == 2, f"Expected 2 safe, got {summary.safe_count}"
    assert summary.manipulated_images == 1, f"Expected 1 manipulated, got {summary.manipulated_images}"
    assert len(summary.errors) == 1, f"Expected 1 error, got {len(summary.errors)}"
    
    # Check average calculation
    expected_avg = (0.15 + 0.92 + 0.25) / 3
    assert abs(summary.average_risk_score - expected_avg) < 0.01, "Average calculation incorrect"
    
    # Check categories
    assert summary.categories["banking"] == 2, "Banking count incorrect"
    assert summary.categories["parcel"] == 1, "Parcel count incorrect"


def test_edge_cases():
    print("\n🧪 Test 3: Edge Cases")
    
    # All failed
    results = [
        BatchImageResult(filename=f"fail{i}.jpg", index=i, success=False, 
                        error="Error", processing_time_ms=100)
        for i in range(3)
    ]
    summary = calculate_batch_summary(results)
    print(f"  ✅ All failed: successful={summary.successful}, failed={summary.failed}")
    assert summary.successful == 0
    assert summary.failed == 3
    assert summary.average_risk_score == 0.0
    
    # All successful, all scams
    results = [
        BatchImageResult(filename=f"scam{i}.jpg", index=i, success=True,
                        is_scam=True, risk_score=0.9, category="banking",
                        processing_time_ms=1500)
        for i in range(5)
    ]
    summary = calculate_batch_summary(results)
    print(f"  ✅ All scams: scam_count={summary.scam_count}, safe_count={summary.safe_count}")
    assert summary.scam_count == 5
    assert summary.safe_count == 0


def main():
    print("=" * 70)
    print("📦 Batch Processing - Standalone Tests")
    print("=" * 70)
    
    try:
        test_batch_validation()
        test_batch_summary()
        test_edge_cases()
        
        print("\n" + "=" * 70)
        print("✅ All batch processing tests passed!")
        print("=" * 70)
        return 0
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
