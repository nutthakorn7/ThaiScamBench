"""Unit tests for scam classifier"""
import pytest
from app.services.scam_classifier import classify_scam, SCAM_PATTERNS


class TestScamClassifier:
    """Test cases for scam classification"""
    
    def test_fake_officer_detection(self):
        """Test detection of fake officer scam"""
        message = "ตำรวจแจ้งว่าท่านมีหมายจับ กรุณาโอนเงิน 5000 บาท"
        is_scam, risk_score, category = classify_scam(message, threshold=0.5)
        
        assert is_scam is True
        assert category == "impersonation_scam"
        assert risk_score > 0.5

    def test_parcel_scam_detection(self):
        """Test detection of parcel scam"""
        message = "คุณมีพัสดุค้างชำระ 25 บาท คลิก https://fake.com"
        is_scam, risk_score, category = classify_scam(message, threshold=0.5)
        
        assert is_scam is True
        assert category == "parcel_scam"
        assert risk_score > 0.5
    
    def test_loan_scam_detection(self):
        """Test detection of loan scam"""
        message = "กู้เงินด่วน ไม่ต้องค้ำ ไม่เช็คเครดิต อนุมัติภายใน 5 นาที"
        is_scam, risk_score, category = classify_scam(message, threshold=0.5)
        
        assert is_scam is True
        assert category == "loan_scam"
        assert risk_score > 0.5
    
    def test_investment_scam_detection(self):
        """Test detection of investment scam"""
        message = "ลงทุนน้อย รวยเร็ว กำไร 30% ต่อเดือน forex bitcoin"
        is_scam, risk_score, category = classify_scam(message, threshold=0.5)
        
        assert is_scam is True
        assert category == "investment_scam"
        assert risk_score > 0.5
    
    def test_otp_phishing_detection(self):
        """Test detection of OTP phishing"""
        message = "ระบบตรวจพบบัญชีผิดปกติ กรุณาแจ้งรหัส OTP เพื่อยืนยันตัวตน"
        is_scam, risk_score, category = classify_scam(message, threshold=0.5)
        
        assert is_scam is True
        assert category == "banking_scam"
        assert risk_score > 0.5
    
    def test_marketplace_scam_detection(self):
        """Test detection of marketplace scam"""
        message = "ขายไอโฟน ราคาถูกมาก โอนก่อนส่งของ Line: @seller123"
        is_scam, risk_score, category = classify_scam(message, threshold=0.5)
        
        # Should detect as scam (marketplace or parcel related)
        assert is_scam is True
        assert category in ["marketplace_scam", "parcel_scam"]  # Both valid
        assert risk_score > 0.3
    
    def test_normal_message(self):
        """Test normal message detection"""
        message = "สวัสดีครับ วันนี้ทานข้าวหรือยัง"
        is_scam, risk_score, category = classify_scam(message, threshold=0.5)
        
        assert is_scam is False
        assert category == "safe"
        assert risk_score < 0.5
    
    def test_threshold_behavior(self):
        """Test threshold affects classification"""
        message = "คุณมีพัสดุค้างชำระ"  # Moderate risk
        
        # Low threshold (conservative)
        is_scam_low, risk_low, _ = classify_scam(message, threshold=0.3)
        
        # High threshold (strict)
        is_scam_high, risk_high, _ = classify_scam(message, threshold=0.8)
        
        # Risk score should be the same
        assert risk_low == risk_high
        
        # But classification may differ
        # (depends on actual risk score of this message)
    
    def test_all_categories_defined(self):
        """Test all categories are properly defined"""
        assert len(SCAM_PATTERNS) >= 6  # At least 6 scam categories
        assert "impersonation_scam" in SCAM_PATTERNS
        assert "parcel_scam" in SCAM_PATTERNS
        assert "loan_scam" in SCAM_PATTERNS
        assert "investment_scam" in SCAM_PATTERNS
        assert "banking_scam" in SCAM_PATTERNS
        assert "prize_scam" in SCAM_PATTERNS
