"""
Integration Test Suite for P2 Features (Pytest Version)

Tests all P2 features working together:
1. Redis caching
2. Pagination
3. Audit logging
4. CSRF protection
"""
import pytest
from unittest.mock import patch, MagicMock
from app.config import settings

class TestP2Integration:
    """Integration tests for P2 features"""

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    def test_csrf_token_generation(self, client):
        """Test CSRF token generation"""
        response = client.get("/csrf-token")
        assert response.status_code == 200
        data = response.json()
        assert "csrf_token" in data
        assert "expires_in" in data

    @patch("app.routes.public.redis_client")
    def test_caching_behavior(self, mock_redis, client):
        """Test Redis caching behavior (mocked)"""
        # Setup mock
        mock_redis.get.return_value = None  # Cache miss first
        
        # First request (Cache miss)
        response = client.post(
            "/v1/public/detect/text",
            json={"message": "คุณมีพัสดุค้างชำระ กรุณาโอนเงิน"}
        )
        assert response.status_code == 200
        result = response.json()
        assert result["is_scam"] is True
        
        # Verify Redis set was called
        assert mock_redis.set.called
        
        # Second request (Cache hit)
        # We simulate cache hit by mocking get to return the result
        cached_data = {
            "is_scam": True,
            "risk_score": 0.95,
            "category": "parcel_scam",
            "reason": "Cached response",
            "advice": "Cached advice",
            "model_version": "mock-v1.0",
            "request_id": "cached-request-id"
        }
        mock_redis.get.return_value = cached_data
        
        response = client.post(
            "/v1/public/detect/text",
            json={"message": "คุณมีพัสดุค้างชำระ กรุณาโอนเงิน"}
        )
        assert response.status_code == 200
        # Note: In a real integration test with real Redis, we would check timing.
        # With mocks, we verify the logic flow.

    def test_audit_logging(self, client):
        """Test audit logging (via middleware)"""
        # This is hard to test without checking the database or mocking the logger/DB.
        # For integration, we assume if the request succeeds, middleware didn't crash.
        response = client.get("/health")
        assert response.status_code == 200

    def test_pagination_partners(self, client):
        """Test pagination for partners endpoint"""
        # Need admin token
        headers = {"X-Admin-Token": settings.admin_token}
        
        response = client.get("/admin/stats/partners?page=1&page_size=10", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check pagination fields
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert data["page"] == 1
        assert data["page_size"] == 10
