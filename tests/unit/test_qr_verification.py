"""
Unit tests for QR Code Verification module
Tests QR decoding, PromptPay parsing, and risk assessment logic.
"""
import pytest
from unittest.mock import MagicMock, patch, Mock
import sys

# Mock cv2 and pyzbar modules before importing the utils
sys.modules['cv2'] = MagicMock()
sys.modules['pyzbar'] = MagicMock()
sys.modules['pyzbar.pyzbar'] = MagicMock()

from app.utils.slip_verification import (
    scan_qr_code,
    parse_promptpay_amount,
    verify_thai_bank_slip,
    SlipVerificationResult
)

# Test Data
VALID_PROMPTPAY_QR = "00020101021129370016A000000677010111011300668912345675802TH53037645406150.0063041234"
# Tag 54 (Amount) = "150.00" (Length 06)

class TestQRCodeLogic:
    
    def test_parse_promptpay_amount_valid(self):
        """Test parsing amount from valid PromptPay QR string"""
        amount = parse_promptpay_amount(VALID_PROMPTPAY_QR)
        assert amount == 150.00
        assert isinstance(amount, float)
        
    def test_parse_promptpay_amount_invalid(self):
        """Test parsing invalid strings"""
        assert parse_promptpay_amount("not_a_qr_code") is None
        assert parse_promptpay_amount(None) is None
        # valid structure but missing tag 54
        assert parse_promptpay_amount("000201010211") is None 

    @patch('app.utils.slip_verification.scan_qr_code')
    def test_verify_slip_with_matching_qr(self, mock_scan):
        """Test that matching QR boosts trust score"""
        # Arrange
        mock_scan.return_value = VALID_PROMPTPAY_QR
        # Provide full slip details to ensure high trust score
        ocr_text = """
        ธนาคารกสิกรไทย 
        โอนเงินสำเร็จ
        นาย ก.
        เลขที่บัญชี xxx-2-12345-x
        จำนวนเงิน 150.00 บาท
        วันที่ 10 พ.ย. 66 เวลา 12:30 น.
        รหัสอ้างอิง: 202311105555555555
        """
        image_bytes = b"fake_image_bytes"
        
        # Act
        result = verify_thai_bank_slip(ocr_text, image_bytes)
        
        # Assert
        assert result.qr_valid == True
        # Implementation hides long QR data
        assert result.qr_data == "Hidden data"
        assert "QR Code Amount Verified" in result.checks
        assert "Date/Time Found" in result.checks
        assert "Ref Number Found" in result.checks
        # Trust score should be high (6 or 7 checks passed => >0.85)
        assert result.trust_score > 0.8

    @patch('app.utils.slip_verification.scan_qr_code')
    def test_verify_slip_with_mismatch_qr(self, mock_scan):
        """Test that mismatching QR triggers critical risk"""
        # Arrange
        mock_scan.return_value = VALID_PROMPTPAY_QR # Amount = 150.00
        ocr_text = "โอนเงิน 5,000.00 บาท" # Text says 5000
        image_bytes = b"fake_image_bytes"
        
        # Act
        result = verify_thai_bank_slip(ocr_text, image_bytes)
        
        # Assert
        assert result.qr_valid == False
        # Mismatch adds to warnings, not checks
        assert any("QR ยอดเงิน" in w for w in result.warnings)
        # Trust score should be penalized heavily => 0.0
        assert result.trust_score == 0.0
        assert result.is_likely_genuine == False

    @patch('app.utils.slip_verification.scan_qr_code')
    def test_verify_slip_no_qr(self, mock_scan):
        """Test slip verification without QR code matches standard logic"""
        mock_scan.return_value = None
        ocr_text = "โอนเงิน 150.00 บาท"
        image_bytes = b"fake_image_bytes"
        
        result = verify_thai_bank_slip(ocr_text, image_bytes)
        
        assert result.qr_data is None
        assert result.qr_valid == False
        # Should still process other checks
        assert any("Amount Found" in c for c in result.checks)

