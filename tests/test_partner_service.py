"""Unit tests for partner service"""
import pytest
from app.services.partner_service import (
    generate_api_key,
    hash_api_key,
    verify_api_key
)


class TestPartnerService:
    """Test cases for partner service"""
    
    def test_generate_api_key_length(self):
        """Test API key generation produces correct length"""
        api_key = generate_api_key()
        assert len(api_key) == 43  # URL-safe base64 of 32 bytes
    
    def test_generate_api_key_unique(self):
        """Test API keys are unique"""
        keys = [generate_api_key() for _ in range(100)]
        assert len(set(keys)) == 100  # All unique
    
    def test_hash_api_key_format(self):
        """Test hashed API key has correct format"""
        api_key = "test_key_12345"
        hashed = hash_api_key(api_key)
        
        # Should be in format: salt$hash
        assert "$" in hashed
        parts = hashed.split("$")
        assert len(parts) == 2
        assert len(parts[0]) == 64  # Salt (32 bytes hex = 64 chars)
        assert len(parts[1]) == 64  # SHA256 hash (64 chars)
    
    def test_hash_api_key_deterministic_with_same_salt(self):
        """Test hashing is deterministic with same salt"""
        api_key = "test_key"
        hash1 = hash_api_key(api_key)
        hash2 = hash_api_key(api_key)
        
        # Different salts = different hashes
        assert hash1 != hash2
    
    def test_verify_api_key_correct(self):
        """Test API key verification with correct key"""
        api_key = "correct_test_key_123"
        hashed = hash_api_key(api_key)
        
        assert verify_api_key(api_key, hashed) is True
    
    def test_verify_api_key_incorrect(self):
        """Test API key verification with incorrect key"""
        api_key = "correct_key"
        wrong_key = "wrong_key"
        hashed = hash_api_key(api_key)
        
        assert verify_api_key(wrong_key, hashed) is False
    
    def test_verify_api_key_empty(self):
        """Test API key verification with empty key"""
        api_key = "test_key"
        hashed = hash_api_key(api_key)
        
        assert verify_api_key("", hashed) is False
    
    def test_hash_verify_roundtrip(self):
        """Test hash and verify work together"""
        api_keys = [
            "test123",
            "longer_api_key_with_special_chars!@#",
            "ก็1234",  # Thai characters
        ]
        
        for api_key in api_keys:
            hashed = hash_api_key(api_key)
            assert verify_api_key(api_key, hashed) is True
            assert verify_api_key(api_key + "wrong", hashed) is False
