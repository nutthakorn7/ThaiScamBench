
"""
Integration Tests for Text Detection Workflow
Tests the full flow from API -> Service -> Classifier -> DB Persistence.
Uses REAL DetectionService but mocks expensive LLM calls.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.orm import Session
from app.models.database import Detection

# Mock LLM Service Response to avoid API costs
MOCK_LLM_RESPONSE = {
    "is_scam": False,
    "risk_score": 0.1,
    "category": "safe",
    "reason": "Mocked LLM Analysis: Safe",
    "advice": "Mocked Advice",
    "confidence": 0.9,
    "entities": []
}

@pytest.fixture
def mock_llm_service():
    """Mock the Explainer (currently MockExplainer)"""
    from app.services.interfaces.explainer import ExplanationResult

    # Mock return object
    mock_result = ExplanationResult(
        reason="Mocked LLM Analysis: Safe",
        advice="Mocked Advice",
        confidence=0.9
    )
    
    # Patch the 'explain' method on MockExplainer
    with patch("app.services.impl.mock_explainer.MockExplainer.explain", new_callable=AsyncMock) as mock_method:
        mock_method.return_value = mock_result
        yield mock_method

@pytest.fixture
def mock_redis():
    """Mock Redis to avoid connection errors"""
    mock_client = MagicMock()
    mock_client.get.return_value = None
    mock_client.set.return_value = True
    
    with patch("app.cache.redis_client.redis_client", mock_client):
        yield mock_client

@pytest.fixture
def client_with_real_service(client, mock_llm_service, mock_redis):
    """
    Client that uses the REAL DetectionService (by NOT overriding it),
    but ensures dependencies inside are mocked if needed.
    
    Note: The default 'client' fixture in conftest.py usually overrides get_db.
    The 'test_api.py' overrides get_detection_service.
    Here we WANT get_detection_service to run, so we ensure no override exists for it.
    """
    from app.main import app
    from app.api.deps import get_detection_service
    
    # Ensure NO override for detection service
    app.dependency_overrides.pop(get_detection_service, None)
    
    # We still rely on the 'client' fixture's DB override (get_db)
    # so we are writing to the test database (SQLite).
    
    yield client

class TestTextDetectionIntegration:
    
    def test_public_detection_scam_flow(self, client_with_real_service, test_db: Session):
        """
        Test full flow: Input Scam Keyword -> Classifier Detects -> DB Persists
        """
        # 1. Send Request with KNOWN scam keyword
        payload = {
            "message": "ด่วน! บัญชีม้า โอนเงินคืนทันที",
            "channel": "SMS"
        }
        response = client_with_real_service.post("/v1/public/detect/text", json=payload)
        
        # 2. Verify API Response
        assert response.status_code == 200
        data = response.json()
        
        # Keyword classifier should flag "บัญชีม้า" as scam
        assert data["is_scam"] is True
        assert data["risk_score"] >= 0.8
        assert data["category"] == "banking_scam" # Correct category for mule account
        assert "request_id" in data
        
        # 3. Verify Database Persistence
        request_id = data["request_id"]
        record = test_db.query(Detection).filter(Detection.request_id == request_id).first()
        
        assert record is not None
        assert record.is_scam is True
        assert record.source == "public"
        assert record.message_hash is not None

    def test_public_detection_safe_flow(self, client_with_real_service, test_db: Session):
        """
        Test full flow: Input Safe Text -> Classifier Passes -> LLM (Mock) Confirms -> DB Persists
        """
        payload = {
            "message": "สวัสดีครับ วันนี้อากาศดีมาก",
            "channel": "LINE"
        }
        response = client_with_real_service.post("/v1/public/detect/text", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_scam"] is False
        assert data["risk_score"] < 0.5
        
        # Verify DB
        request_id = data["request_id"]
        record = test_db.query(Detection).filter(Detection.request_id == request_id).first()
        assert record is not None
        assert record.is_scam is False

    def test_partner_detection_flow(self, client_with_real_service, test_partner_with_key, test_db: Session):
        """
        Test flow with Partner Authentication
        """
        partner, api_key = test_partner_with_key
        payload = {
            "message": "คุณได้รับสิทธิ์กู้เงิน 100,000 บาท คลิกเลย",
            "channel": "SMS"
        }
        headers = {"Authorization": f"Bearer {api_key}"}
        
        response = client_with_real_service.post("/v1/partner/detect/text", json=payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_scam"] is True
        
        # Verify DB records partner_id
        request_id = data["request_id"]
        record = test_db.query(Detection).filter(Detection.request_id == request_id).first()
        
        assert record.source == "partner"
        assert record.partner_id == partner.id

