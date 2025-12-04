"""
Unit tests for services

Tests business logic layer.
"""
import pytest
from sqlalchemy.orm import Session

from app.services.impl.keyword_classifier import KeywordScamClassifier
from app.services.impl.mock_explainer import MockExplainer
from app.services.detection_service import DetectionService, DetectionRequest
from app.repositories.detection import DetectionRepository
from app.core.exceptions import ValidationError


class TestKeywordClassifier:
    """Test KeywordScamClassifier"""
    
    def test_classify_parcel_scam(self):
        """Test classifying parcel scam"""
        classifier = KeywordScamClassifier()
        
        result = classifier.classify("คุณมีพัสดุค้างชำระ 50 บาท")
        
        assert result.is_scam is True
        assert result.category == "parcel_scam"
        assert result.risk_score > 0.5
    
    def test_classify_safe_message(self):
        """Test classifying safe message"""
        classifier = KeywordScamClassifier()
        
        result = classifier.classify("สวัสดีครับ สบายดีไหม")
        
        assert result.is_scam is False
        assert result.category == "safe"
        assert result.risk_score < 0.5
    
    def test_classify_banking_scam(self):
        """Test banking scam detection"""
        classifier = KeywordScamClassifier()
        
        result = classifier.classify("ธนาคารแจ้ง: กรุณาแจ้งรหัส OTP")
        
        assert result.is_scam is True
        assert result.category == "banking_scam"
    
    def test_model_name(self):
        """Test model name property"""
        classifier = KeywordScamClassifier()
        
        assert classifier.model_name == "keyword_classifier"
        assert "v" in classifier.get_version()
    
    def test_empty_message_raises_error(self):
        """Test empty message raises ValidationError"""
        classifier = KeywordScamClassifier()
        
        with pytest.raises(ValidationError):
            classifier.classify("")


class TestMockExplainer:
    """Test MockExplainer"""
    
    @pytest.mark.asyncio
    async def test_explain_parcel_scam(self):
        """Test explanation for parcel scam"""
        explainer = MockExplainer()
        
        result = await explainer.explain(
            message="test",
            category="parcel_scam",
            risk_score=0.8,
            is_scam=True
        )
        
        assert "พัสดุ" in result.reason
        assert "คลิกลิงก์" in result.advice
        assert result.llm_used is False
    
    @pytest.mark.asyncio
    async def test_explain_safe_message(self):
        """Test explanation for safe message"""
        explainer = MockExplainer()
        
        result = await explainer.explain(
            message="test",
            category="safe",
            risk_score=0.1,
            is_scam=False
        )
        
        assert "ปกติ" in result.reason
        assert result.confidence == 1.0
    
    def test_provider_name(self):
        """Test provider property"""
        explainer = MockExplainer()
        
        assert explainer.provider == "mock"


@pytest.mark.asyncio
class TestDetectionService:
    """Test DetectionService"""
    
    async def test_detect_scam_success(self, test_db: Session):
        """Test successful scam detection"""
        classifier = KeywordScamClassifier()
        explainer = MockExplainer()
        service = DetectionService(test_db, classifier, explainer)
        
        request = DetectionRequest(
            message="คุณมีพัสดุค้างชำระ 50 บาท",
            channel="SMS"
        )
        
        result = await service.detect_scam(request, source="public")
        
        assert result.is_scam is True
        assert result.category == "parcel_scam"
        assert result.request_id is not None
    
    async def test_detect_scam_sanitization(self, test_db: Session):
        """Test input sanitization"""
        classifier = KeywordScamClassifier()
        explainer = MockExplainer()
        service = DetectionService(test_db, classifier, explainer)
        
        # Message with control characters
        request = DetectionRequest(
            message="  สวัสดี\x00ครับ  ",
            channel="SMS"
        )
        
        result = await service.detect_scam(request, source="public")
        
        # Should not crash and should sanitize
        assert result.request_id is not None
    
    async def test_detect_empty_message_raises_error(self, test_db: Session):
        """Test empty message raises ValidationError"""
        classifier = KeywordScamClassifier()
        explainer = MockExplainer()
        service = DetectionService(test_db, classifier, explainer)
        
        request = DetectionRequest(message="", channel="SMS")
        
        with pytest.raises(ValidationError):
            await service.detect_scam(request, source="public")
