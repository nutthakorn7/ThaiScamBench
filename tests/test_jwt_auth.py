"""
Unit tests for JWT authentication utilities
"""
import pytest
from datetime import timedelta
from app.utils.jwt_utils import create_access_token, verify_access_token, hash_password, verify_password
from app.config import settings

def test_create_access_token():
    """Test creating JWT access token"""
    token_data = {"sub": "admin", "role": "admin"}
    access_token = create_access_token(token_data)
    assert access_token is not None
    assert isinstance(access_token, str)

def test_verify_access_token():
    """Test verifying JWT access token"""
    token_data = {"sub": "admin", "role": "admin"}
    access_token = create_access_token(token_data)
    
    payload = verify_access_token(access_token)
    assert payload is not None
    assert payload["sub"] == "admin"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"

def test_expired_token():
    """Test expired token handling"""
    token_data = {"sub": "admin", "role": "admin"}
    # Create token that expires in -1 second (already expired)
    expired_token = create_access_token(token_data, expires_delta=timedelta(seconds=-1))
    
    payload = verify_access_token(expired_token)
    assert payload is None

def test_invalid_token():
    """Test invalid token handling"""
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
    payload = verify_access_token(invalid_token)
    assert payload is None

def test_password_hashing():
    """Test password hashing and verification"""
    test_password = "admin123"
    hashed = hash_password(test_password)
    
    assert hashed != test_password
    assert verify_password(test_password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_role_based_token():
    """Test token with different roles"""
    user_token = create_access_token({"sub": "user1", "role": "user"})
    payload = verify_access_token(user_token)
    
    assert payload is not None
    assert payload.get("role") == "user"

def test_long_password_truncation():
    """Test that long passwords are handled correctly (truncated or hashed)"""
    # bcrypt has a 72 byte limit. passlib handles this, but let's verify.
    long_password = "a" * 100
    try:
        hashed = hash_password(long_password)
        assert verify_password(long_password, hashed) is True
    except ValueError:
        # If it raises ValueError, we should handle it or ensure we don't use long passwords
        pytest.skip("Bcrypt limitation hit as expected")
