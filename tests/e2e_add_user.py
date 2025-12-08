import requests
import sys
import time
import json

BASE_URL = "https://api.thaiscam.zcr.ai/v1"
ADMIN_EMAIL = "admin@thaiscam.zcr.ai"
ADMIN_PASSWORD = "admin123"

def test_add_user_flow():
    print(f"🔄 1. Logging in as Admin ({ADMIN_EMAIL})...")
    session = requests.Session()
    
    # 1. Login
    login_resp = session.post(f"{BASE_URL}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if login_resp.status_code != 200:
        print(f"❌ Admin login failed: {login_resp.text}")
        sys.exit(1)
        
    print("✅ Admin login successful")

    # Get Access Token
    login_data = login_resp.json()
    access_token = login_data.get("access_token")
    if not access_token:
        print("❌ Login response missing access_token! Security upgrade failed?")
        print(login_data)
        sys.exit(1)
        
    print(f"🔑 Received Access Token: {access_token[:10]}...")
    
    # 2. Create New User
    timestamp = int(time.time())
    new_email = f"e2e_test_{timestamp}@example.com"
    print(f"🔄 2. Creating new user: {new_email} (No password provided)...")
    
    # Admin endpoints might be protected, but for now verify_auth.py showed it wasn't strictly enforced or I might need to send header
    # Let's try sending the 'Authorization' header just in case, though the backend code we saw earlier for 'create_user' didn't explicitly check token yet (it had a TODO).
    # But wait, looking at my previous edit to app/routes/auth.py, I added `create_user`.
    # It has `# TODO: Add admin auth check via JWT or session`
    # So it is PUBLICLY accessible right now for testing? Or maybe it implicitly requires DB access which Depends(get_db) handles.
    # Middleware requires Bearer token to bypass CSRF check
    # Use Real Token
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    create_resp = session.post(
        f"{BASE_URL}/auth/users", 
        json={
            "email": new_email,
            "name": "E2E Test User",
            "role": "partner",
            "password": "testPassword123!" # Explicit password for verification
        },
        headers=headers
    )
    
    if create_resp.status_code != 200:
        print(f"❌ Create user failed: {create_resp.text}")
        sys.exit(1)
        
    user_data = create_resp.json()
    print(f"✅ User created successfully: ID {user_data['id']}")
    print(f"ℹ️  Target Email: {new_email}")
    
    # Save email to file for next step
    with open("e2e_temp_email.txt", "w") as f:
        f.write(new_email)
        
    print(f"🔄 3. Verifying Login for {new_email}...")
    # 3. Verify Login
    verify_resp = session.post(f"{BASE_URL}/auth/login", json={
        "email": new_email,
        "password": "testPassword123!"
    })
    
    if verify_resp.status_code != 200:
        print(f"❌ Verification Login failed: {verify_resp.text}")
        sys.exit(1)
        
    print(f"✅ Verification Login successful! New User ID: {verify_resp.json()['user_id']}")
    print("🎉 End-to-End Test Passed!")

if __name__ == "__main__":
    test_add_user_flow()
