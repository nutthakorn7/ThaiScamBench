"""
Integration tests for API endpoints

Tests full request/response flow.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import settings


# Test database
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestSessionLocal()
        yield db
    finally:
        db.close()


# Override dependency
app.dependency_overrides[get_db] = override_get_db

# Create tables
Base.metadata.create_all(bind=engine)

# Test client
client = TestClient(app)


class TestDetectionEndpoints:
    """Test detection endpoints"""
    
    def test_detect_parcel_scam(self):
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
    
    def test_detect_safe_message(self):
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
    
    def test_detect_empty_message_error(self):
        """Test empty message returns 400"""
        response = client.post(
            "/v1/public/detect/text",
            json={
                "message": "",
                "channel": "SMS"
            }
        )
        
        assert response.status_code == 422  # Pydantic validation
    
    def test_detect_missing_message_error(self):
        """Test missing message field"""
        response = client.post(
            "/v1/public/detect/text",
            json={"channel": "SMS"}
        )
        
        assert response.status_code == 422


class TestFeedbackEndpoints:
    """Test feedback endpoints"""
    
    def test_submit_feedback_success(self):
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
                "is_correct": False,
                "user_category": "normal",
                "comment": "ไม่ใช่การหลอกลวง"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "feedback_id" in data
    
    def test_submit_feedback_not_found(self):
        """Test feedback for non-existent detection"""
        response = client.post(
            "/v1/public/feedback",
            json={
                "request_id": "nonexistent-request-id",
                "is_correct": True
            }
        )
        
        assert response.status_code == 404


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"


class TestAdminEndpoints:
    """Test admin endpoints (with auth)"""
    
    def test_stats_without_auth(self):
        """Test stats endpoint requires auth"""
        response = client.get("/admin/stats/summary")
        
        assert response.status_code == 401
    
    def test_stats_with_auth(self):
        """Test stats endpoint with valid token"""
        headers = {"Authorization": f"Bearer {settings.admin_token}"}
        
        response = client.get("/admin/stats/summary", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data
        assert "category_breakdown" in data
