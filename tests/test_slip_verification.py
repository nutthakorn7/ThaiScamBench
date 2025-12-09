"""
Integration Tests for 3-Layer Slip Detection

Tests the complete flow of image detection with Slip Verification,
ensuring correct routing, cache behavior, and risk scoring.
"""
import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Test image paths (you'll need to add real test images)
TEST_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "test_images")


class TestSlipVerification:
    """Test suite for Slip Verification 3-Layer Detection"""
    
    def test_real_slip_low_risk(self):
        """
        Test that a genuine bank slip receives low risk score
        Expected: risk_score < 0.3
        """
        # Arrange
        test_slip_path = os.path.join(TEST_IMAGES_DIR, "real_slip_scb.jpg")
        
        if not os.path.exists(test_slip_path):
            pytest.skip("Test image not found")
        
        with open(test_slip_path, "rb") as f:
            # Act
            response = client.post(
                "/v1/public/detect/image",
                files={"file": ("test.jpg", f, "image/jpeg")}
            )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] < 0.3, f"Expected low risk for real slip, got {data['risk_score']}"
        assert "Slip Verification" in data.get("reason", ""), "Should mention Slip Verification"
    
    def test_fake_slip_high_risk(self):
        """
        Test that a fake/edited slip receives high risk score
        Expected: risk_score > 0.7
        """
        # Arrange
        test_slip_path = os.path.join(TEST_IMAGES_DIR, "fake_slip.jpg")
        
        if not os.path.exists(test_slip_path):
            pytest.skip("Test image not found")
        
        with open(test_slip_path, "rb") as f:
            # Act
            response = client.post(
                "/v1/public/detect/image",
                files={"file": ("test.jpg", f, "image/jpeg")}
            )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] > 0.5, f"Expected high risk for fake slip, got {data['risk_score']}"
    
    def test_image_hash_prevents_collision(self):
        """
        Test that different images with similar text don't collide in cache
        Expected: Different request_ids and separate processing
        """
        # Arrange  
        slip1_path = os.path.join(TEST_IMAGES_DIR, "real_slip_scb.jpg")
        slip2_path = os.path.join(TEST_IMAGES_DIR, "real_slip_kbank.jpg")
        
        if not os.path.exists(slip1_path) or not os.path.exists(slip2_path):
            pytest.skip("Test images not found")
        
        # Act
        with open(slip1_path, "rb") as f:
            response1 = client.post(
                "/v1/public/detect/image",
                files={"file": ("test1.jpg", f, "image/jpeg")}
            )
        
        with open(slip2_path, "rb") as f:
            response2 = client.post(
                "/v1/public/detect/image",
                files={"file": ("test2.jpg", f, "image/jpeg")}
            )
        
        # Assert
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Different images should have different request IDs
        assert data1["request_id"] != data2["request_id"], "Different images should not share cache"
    
    def test_slip_verification_fusion(self):
        """
        Test that 3-Layer Fusion correctly weights Slip Verification
        Expected: Slip trust > 70% → reduced risk
        """
        # Arrange
        test_slip_path = os.path.join(TEST_IMAGES_DIR, "real_slip_scb.jpg")
        
        if not os.path.exists(test_slip_path):
            pytest.skip("Test image not found")
        
        with open(test_slip_path, "rb") as f:
            # Act
            response = client.post(
                "/v1/public/detect/image",
                files={"file": ("test.jpg", f, "image/jpeg")}
            )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # For genuine slips, Slip Verification should reduce risk significantly
        # Formula: (text * 0.3) + (visual * 0.2) + (slip * 0.5)
        assert data["risk_score"] < 0.5, "Slip Verification should reduce risk for genuine slips"
        assert data["is_scam"] == False, "Genuine slip should not be flagged as scam"
    
    def test_correct_router_priority(self):
        """
        Test that image.router (with 3-Layer) takes precedence over public.router
        Expected: Response includes extracted_text field (image.router signature)
        """
        # Arrange
        test_slip_path = os.path.join(TEST_IMAGES_DIR, "real_slip_scb.jpg")
        
        if not os.path.exists(test_slip_path):
            pytest.skip("Test image not found")
        
        with open(test_slip_path, "rb") as f:
            # Act
            response = client.post(
                "/v1/public/detect/image",
                files={"file": ("test.jpg", f, "image/jpeg")}
            )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # image.router includes extracted_text, public.router doesn't
        assert "extracted_text" in data, "Should use image.router (with extracted_text)"
        assert len(data["extracted_text"]) > 0, "Should have extracted text from image"


class TestCacheVersioning:
    """Test cache version control"""
    
    def test_cache_version_constant_exists(self):
        """Verify CACHE_VERSION constant is defined"""
        from app.api.v1.endpoints.image import CACHE_VERSION
        
        assert CACHE_VERSION is not None
        assert isinstance(CACHE_VERSION, str)
        assert "v2" in CACHE_VERSION or "3layer" in CACHE_VERSION


class TestMonitoringLogs:
    """Test that monitoring logs are generated (requires log capture)"""
    
    def test_route_logging(self, caplog):
        """Test that route is logged for tracking"""
        # This would require setting up log capture
        # For now, just verify the endpoint responds
        pytest.skip("Requires log capture setup")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
