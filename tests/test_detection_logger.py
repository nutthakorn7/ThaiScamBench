"""Tests for detection logger service"""
import pytest
from app.services.detection_logger import log_detection
from app.models.database import Detection, DetectionSource


class TestDetectionLogger:
    """Test cases for detection logger"""
    
    def test_log_public_detection(self, test_db):
        """Test logging public detection"""
        detection = log_detection(
            db=test_db,
            source=DetectionSource.public,
            message="คุณมีพัสดุค้างชำระ",
            is_scam=True,
            category="parcel_scam",
            risk_score=0.85,
            model_version="v1.0",
            llm_version="llm-v1.0",
            channel="SMS"
        )
        
        assert detection is not None
        assert detection.source == DetectionSource.public
        assert detection.is_scam is True
        assert detection.category == "parcel_scam"
        assert detection.risk_score == 0.85
        assert detection.channel == "SMS"
        assert detection.partner_id is None
        assert len(detection.message_hash) > 0
        assert detection.request_id is not None
    
    def test_log_partner_detection(self, test_db, test_partner):
        """Test logging partner detection"""
        partner, _ = test_partner
        
        detection = log_detection(
            db=test_db,
            source=DetectionSource.partner,
            message="test message",
            is_scam=False,
            category="normal",
            risk_score=0.1,
            model_version="v1.0",
            llm_version="llm-v1.0",
            partner_id=partner.id,
            user_ref="user_123"
        )
        
        assert detection.source == DetectionSource.partner
        assert detection.partner_id == partner.id
        assert detection.user_ref == "user_123"
        assert detection.channel is None
    
    def test_log_detection_with_all_fields(self, test_db, test_partner):
        """Test logging with all optional fields"""
        partner, _ = test_partner
        
        detection = log_detection(
            db=test_db,
            source=DetectionSource.partner,
            message="complete test",
            is_scam=True,
            category="loan_scam",
            risk_score=0.75,
            model_version="v2.0",
            llm_version="llm-v2.0",
            channel="LINE",
            partner_id=partner.id,
            user_ref="ref_456"
        )
        
        assert detection.channel == "LINE"
        assert detection.user_ref == "ref_456"
        assert detection.model_version == "v2.0"
        assert detection.llm_version == "llm-v2.0"
    
    def test_message_hashing_privacy(self, test_db):
        """Test that messages are hashed, not stored in plaintext"""
        message = "sensitive message content ข้อความลับ"
        
        detection = log_detection(
            db=test_db,
            source=DetectionSource.public,
            message=message,
            is_scam=True,
            category="fake_officer",
            risk_score=0.9,
            model_version="v1",
            llm_version="v1"
        )
        
        # Message should be hashed
        assert detection.message_hash != message
        assert len(detection.message_hash) == 64  # SHA256 hex length
        
        # Verify same message produces same hash
        detection2 = log_detection(
            db=test_db,
            source=DetectionSource.public,
            message=message,
            is_scam=False,
            category="normal",
            risk_score=0.1,
            model_version="v1",
            llm_version="v1"
        )
        
        assert detection.message_hash == detection2.message_hash
    
    def test_unique_request_ids(self, test_db):
        """Test that each detection gets unique request_id"""
        detections = []
        
        for i in range(5):
            det = log_detection(
                db=test_db,
                source=DetectionSource.public,
                message=f"message {i}",
                is_scam=False,
                category="normal",
                risk_score=0.1,
                model_version="v1",
                llm_version="v1"
            )
            detections.append(det)
        
        # All request IDs should be unique
        request_ids = [d.request_id for d in detections]
        assert len(set(request_ids)) == 5
