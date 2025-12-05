"""
Integration tests for API endpoints

Tests full request/response flow.
"""
import pytest
from app.config import settings


class TestDetectionEndpoints:
    """Test detection endpoints"""
    
    def test_detect_parcel_scam(self, client):
        """Test detecting parcel scam"""
        response = client.post(
            "/v1/public/detect/text",
            json={
                "message": "คุณมีพัสดุค้างชำระ 50 บาท",
                "channel": "SMS"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_scam"] is True
        assert data["category"] == "parcel_scam"
        assert "request_id" in data
        assert "reason" in data
        assert "advice" in data
    
    def test_detect_safe_message(self, client):
        """Test detecting safe message"""
        response = client.post(
            "/v1/public/detect/text",
            json={
                "message": "สวัสดีครับ สบายดีไหม",
                "channel": "LINE"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_scam"] is False
        assert data["category"] == "safe"
    
    def test_detect_empty_message_error(self, client):
        """Test empty message returns 400"""
        response = client.post(
            "/v1/public/detect/text",
            json={
                "message": "",
                "channel": "SMS"
            }
        )
        
        assert response.status_code == 422  # Pydantic validation
    
    def test_detect_missing_message_error(self, client):
        """Test missing message field"""
        response = client.post(
            "/v1/public/detect/text",
            json={"channel": "SMS"}
        )
        
        assert response.status_code == 422


class TestFeedbackEndpoints:
    """Test feedback endpoints"""
    
    def test_submit_feedback_success(self, client):
        """Test successful feedback submission"""
        # First create a detection
        detect_response = client.post(
            "/v1/public/detect/text",
            json={"message": "test message"}
        )
        request_id = detect_response.json()["request_id"]
        
        # Submit feedback
        response = client.post(
            "/v1/public/feedback",
            json={
                "request_id": request_id,
                "feedback_type": "incorrect",
                "comment": "ไม่ใช่การหลอกลวง"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "feedback_id" in data
    
    def test_submit_feedback_not_found(self, client):
        """Test feedback for non-existent detection"""
        response = client.post(
            "/v1/public/feedback",
            json={
                "request_id": "nonexistent-request-id",
                "feedback_type": "correct"
            }
        )
        
        assert response.status_code == 404


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check(self, client):
        """Test health endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"


class TestAdminEndpoints:
    """Test admin endpoints (with auth)"""
    
    def test_stats_without_auth(self, client):
        """Test stats endpoint requires auth"""
        response = client.get("/admin/stats/summary")
        
        # Admin auth middleware returns 403 for missing/invalid token
        assert response.status_code == 403
    
    def test_stats_with_auth(self, client):
        """Test stats endpoint with valid token"""
        headers = {"X-Admin-Token": settings.admin_token}
        
        response = client.get("/admin/stats/summary", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_requests" in data
        assert "scam_ratio" in data
        assert "requests_per_day" in data
        assert "top_categories" in data
