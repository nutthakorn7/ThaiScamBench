"""Unit tests for security middleware"""
import pytest
from fastapi import HTTPException
from app.middleware.security import validate_message_content, sanitize_input


class TestSecurityValidation:
    """Test cases for security validation"""
    
    def test_valid_message(self):
        """Test validation passes for normal message"""
        message = "นี่คือข้อความปกติที่ไม่มีอะไรแปลกๆ"
        # Should not raise exception
        validate_message_content(message)
    
    def test_message_too_long(self):
        """Test message length limit"""
        message = "a" * 6000  # Exceeds 5000 char limit
        
        with pytest.raises(HTTPException) as exc_info:
            validate_message_content(message)
        
        assert exc_info.value.status_code == 400
        assert "too long" in exc_info.value.detail.lower()
    
    def test_empty_message(self):
        """Test empty message rejection"""
        with pytest.raises(HTTPException) as exc_info:
            validate_message_content("")
        
        assert exc_info.value.status_code == 400
        assert "empty" in exc_info.value.detail.lower()
    
    def test_whitespace_only_message(self):
        """Test whitespace-only message rejection"""
        with pytest.raises(HTTPException) as exc_info:
            validate_message_content("   \n\t  ")
        
        assert exc_info.value.status_code == 400
    
    def test_script_tag_blocked(self):
        """Test script tag is blocked"""
        message = "ข้อความ <script>alert('xss')</script> ปกติ"
        
        with pytest.raises(HTTPException) as exc_info:
            validate_message_content(message)
        
        assert exc_info.value.status_code == 400
        assert "suspicious" in exc_info.value.detail.lower()
    
    def test_javascript_protocol_blocked(self):
        """Test JavaScript protocol is blocked"""
        message = "คลิก javascript:alert(1)"
        
        with pytest.raises(HTTPException) as exc_info:
            validate_message_content(message)
        
        assert exc_info.value.status_code == 400
    
    def test_eval_blocked(self):
        """Test eval() is blocked"""
        message = "test eval(malicious_code)"
        
        with pytest.raises(HTTPException) as exc_info:
            validate_message_content(message)
        
        assert exc_info.value.status_code == 400
    
    def test_iframe_blocked(self):
        """Test iframe tag is blocked"""
        message = "<iframe src='evil.com'></iframe>"
        
        with pytest.raises(HTTPException) as exc_info:
            validate_message_content(message)
        
        assert exc_info.value.status_code == 400
    
    def test_event_handler_blocked(self):
        """Test event handler attributes are blocked"""
        message = "test onclick=alert(1)"
        
        with pytest.raises(HTTPException) as exc_info:
            validate_message_content(message)
        
        assert exc_info.value.status_code == 400


class TestSanitization:
    """Test cases for input sanitization"""
    
    def test_sanitize_null_bytes(self):
        """Test null byte removal"""
        text = "test\x00message"
        result = sanitize_input(text)
        assert "\x00" not in result
    
    def test_sanitize_script_tags(self):
        """Test script tag removal"""
        text = "before <script>evil</script> after"
        result = sanitize_input(text)
        assert "<script>" not in result.lower()
    
    def test_sanitize_javascript_protocol(self):
        """Test JavaScript protocol removal"""
        text = "link javascript:alert(1)"
        result = sanitize_input(text)
        assert "javascript:" not in result.lower()
    
    def test_sanitize_whitespace(self):
        """Test excessive whitespace stripping"""
        text = "test    multiple     spaces"
        result = sanitize_input(text)
        assert "    " not in result
        assert result == "test multiple spaces"
    
    def test_sanitize_preserves_thai(self):
        """Test Thai text is preserved"""
        text = "ข้อความภาษาไทยปกติ"
        result = sanitize_input(text)
        assert result == text
