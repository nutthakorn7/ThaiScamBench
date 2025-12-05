"""
Test script for CSRF protection

Tests CSRF middleware without requiring full server setup
"""
import sys
sys.path.insert(0, '/Users/pop7/Code/ThaiScamBench')

from app.middleware.csrf import generate_csrf_token, CSRFProtection

print("=" * 60)
print("CSRF Protection Tests")
print("=" * 60)

# Test 1: Token generation
print("\n✅ Test 1: Token generation")
token1 = generate_csrf_token()
token2 = generate_csrf_token()
print(f"   Token 1: {token1[:20]}...")
print(f"   Token 2: {token2[:20]}...")
assert token1 != token2, "Tokens should be unique!"
assert len(token1) > 20, "Token should be long enough!"
print("   ✅ PASS")

# Test 2: Protected methods
print("\n✅ Test 2: Protected methods")
csrf = CSRFProtection(app=None)
print(f"   Protected methods: {csrf.PROTECTED_METHODS}")
assert "POST" in csrf.PROTECTED_METHODS
assert "GET" not in csrf.PROTECTED_METHODS
print("   ✅ PASS")

# Test 3: Exempt paths
print("\n✅ Test 3: Exempt paths")
print(f"   Exempt paths: {len(csrf.EXEMPT_PATHS)} endpoints")
assert "/v1/public/detect/text" in csrf.EXEMPT_PATHS
assert "/admin/auth/login" in csrf.EXEMPT_PATHS
print("   ✅ PASS")

print("\n" + "=" * 60)
print("All tests passed! ✅")
print("=" * 60)
print("\n💡 CSRF Protection Features:")
print("   - Random token generation")
print("   - Cookie + form/header validation")
print("   - API endpoints exempt (use Bearer tokens)")
print("   - Safe methods (GET) exempt")
print("   - SameSite strict policy")
