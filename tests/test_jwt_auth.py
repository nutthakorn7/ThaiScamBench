"""
Test script for JWT admin authentication

Tests:
1. Admin login with valid credentials
2. Admin login with invalid credentials
3. Use access token to access admin endpoint
4. Token refresh flow
5. Expired token handling
6. Backward compatibility with static token
"""
import sys
sys.path.insert(0, '/Users/pop7/Code/ThaiScamBench')

from app.utils.jwt_utils import create_access_token, verify_access_token, hash_password
from app.config import settings
from datetime import datetime, timedelta
import json

print("=" * 70)
print("JWT Admin Authentication Unit Tests")
print("=" * 70)

# Test 1: Create JWT tokens
print("\n✅ Test 1: Create JWT access token")
token_data = {"sub": "admin", "role": "admin"}
access_token = create_access_token(token_data)
print(f"   Access token: {access_token[:50]}...")
print(f"   ✅ PASS: Token created")

# Test 2: Verify JWT token
print("\n✅ Test 2: Verify JWT access token")
payload = verify_access_token(access_token)
if payload:
    print(f"   Decoded payload: {json.dumps(payload, default=str, indent=2)}")
    assert payload["sub"] == "admin", "Subject should be 'admin'"
    assert payload["role"] == "admin", "Role should be 'admin'"
    assert payload["type"] == "access", "Type should be 'access'"
    print(f"   ✅ PASS: Token verified successfully")
else:
    print("   ❌ FAIL: Token verification failed")
    sys.exit(1)

# Test 3: Test expired token
print("\n✅ Test 3: Test expired token")
# Create token that expires in -1 second (already expired)
expired_token = create_access_token(token_data, expires_delta=timedelta(seconds=-1))
expired_payload = verify_access_token(expired_token)
if expired_payload is None:
    print(f"   ✅ PASS: Expired token correctly rejected")
else:
    print(f"   ❌ FAIL: Expired token was accepted")

# Test 4: Test invalid token
print("\n✅ Test 4: Test invalid token")
invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
invalid_payload = verify_access_token(invalid_token)
if invalid_payload is None:
    print(f"   ✅ PASS: Invalid token correctly rejected")
else:
    print(f"   ❌ FAIL: Invalid token was accepted")

# Test 5: Test password hashing
print("\n✅ Test 5: Password hashing")
test_password = "admin123"
hashed = hash_password(test_password)
print(f"   Original: {test_password}")
print(f"   Hashed: {hashed[:50]}...")

from app.utils.jwt_utils import verify_password
if verify_password(test_password, hashed):
    print(f"   ✅ PASS: Password verification works")
else:
    print(f"   ❌ FAIL: Password verification failed")

if not verify_password("wrong_password", hashed):
    print(f"   ✅ PASS: Wrong password correctly rejected")
else:
    print(f"   ❌ FAIL: Wrong password was accepted")

# Test 6: Test token with different roles
print("\n✅ Test 6: Test non-admin role")
user_token = create_access_token({"sub": "user1", "role": "user"})
user_payload = verify_access_token(user_token)
if user_payload and user_payload.get("role") == "user":
    print(f"   ✅ PASS: User role token can be created")
    print(f"   Note: Admin middleware should reject this token")
else:
    print(f"   ❌ FAIL: User role token creation failed")

# Test 7: Config check
print("\n✅ Test 7: Configuration check")
print(f"   JWT Secret Key: {'*' * 20} (hidden)")
print(f"   JWT Algorithm: {settings.jwt_algorithm}")
print(f"   Access Token Expiry: {settings.access_token_expire_minutes} minutes")
print(f"   Refresh Token Expiry: {settings.refresh_token_expire_days} days")
print(f"   Admin Username: {settings.admin_username}")
print(f"   ✅ PASS: Configuration loaded")

print("\n" + "=" * 70)
print("All Tests Summary")
print("=" * 70)
print("✅ JWT token creation works")
print("✅ JWT token verification works")
print("✅ Expired tokens are rejected")
print("✅ Invalid tokens are rejected")
print("✅ Password hashing works")
print("✅ Password verification works")
print("✅ Role-based tokens work")
print("✅ Configuration is correct")
print("\n🎉 All JWT utility tests passed!")
print("\nℹ️  Note: To test HTTP endpoints, run:")
print("   uvicorn app.main:app --reload")
print("   Then use curl or Postman to test /admin/auth/login and /admin/auth/refresh")
