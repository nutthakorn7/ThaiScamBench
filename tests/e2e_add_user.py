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
            "role": "partner"
            # No password provided -> trigger auto-gen
        },
        headers=headers
    )
    
    if create_resp.status_code != 200:
        print(f"❌ Create user failed: {create_resp.text}")
        sys.exit(1)
        
    user_data = create_resp.json()
    new_user_id = user_data["id"]
    generated_password = user_data.get("generated_password")
    
    print(f"✅ User created: {new_user_id}")
    
    if not generated_password:
        print("❌ Failed to get generated_password from response! Feature failed.")
        sys.exit(1)
        
    print(f"🔑 Generated Password: {generated_password}")
    
    # Save email to file for next step
    with open("e2e_temp_email.txt", "w") as f:
        f.write(new_email)
        
    # 3. New User Login
    print(f"🔄 3. Logging in as new user: {new_email}...")
    
    login_payload = {
        "email": new_email,
        "password": generated_password  # Use the auto-generated one
    }
    verify_resp = session.post(f"{BASE_URL}/auth/login", json=login_payload)
    
    if verify_resp.status_code != 200:
        print(f"❌ Verification Login failed: {verify_resp.text}")
        sys.exit(1)
        
    print(f"✅ Verification Login successful! New User ID: {new_user_id}")
    
    # 4. Search and Pagination
    print(f"🔄 4. Testing Search API...")
    search_resp = session.get(
        f"{BASE_URL}/auth/users",
        params={"q": new_email, "page": 1, "page_size": 10},
        headers=headers
    )
    if search_resp.status_code != 200:
        print(f"❌ Search failed: {search_resp.text}")
        sys.exit(1)
        
    search_data = search_resp.json()
    if search_data["total"] < 1:
        print("❌ Search returned 0 total users!")
        sys.exit(1)
    
    found_user = next((u for u in search_data["items"] if u["id"] == new_user_id), None)
    if not found_user:
        print("❌ Created user not found in search results!")
        sys.exit(1)
        
    print("✅ Search API working correctly")
    
    # 5. Update User (Ban)
    print(f"🔄 5. Testing Ban User (PATCH)...")
    ban_resp = session.patch(
        f"{BASE_URL}/auth/users/{new_user_id}",
        json={"is_active": False},
        headers=headers
    )
    if ban_resp.status_code != 200:
        print(f"❌ Ban user failed: {ban_resp.text}")
        sys.exit(1)
        
    if ban_resp.json()["is_active"] is not False:
        print("❌ User status not updated to False!")
        sys.exit(1)
        
    print("✅ User Banned Successfully")
    
    # 6. Reset Password
    print(f"🔄 6. Testing Reset Password...")
    reset_resp = session.post(
        f"{BASE_URL}/auth/users/{new_user_id}/reset-password",
        headers=headers
    )
    if reset_resp.status_code != 200:
        print(f"❌ Reset password failed: {reset_resp.text}")
        sys.exit(1)
        
    new_generated_password = reset_resp.json().get("generated_password")
    if not new_generated_password or new_generated_password == generated_password:
        print("❌ Reset password failed (no new password or same as old)!")
        sys.exit(1)
        
    print("✅ Password Reset Successfully")
    
    # 7. Delete User
    print(f"🔄 7. Testing Delete User...")
    del_resp = session.delete(
        f"{BASE_URL}/auth/users/{new_user_id}",
        headers=headers
    )
    if del_resp.status_code != 204:
        print(f"❌ Delete user failed: {del_resp.status_code} {del_resp.text}")
        sys.exit(1)

    # Verify ID is gone
    check_resp = session.get(f"{BASE_URL}/auth/users", params={"q": new_email}, headers=headers)
    check_data = check_resp.json()
    found_deleted = next((u for u in check_data["items"] if u["id"] == new_user_id), None)
    
    if found_deleted:
        print("❌ Deleted user still found in list!")
        sys.exit(1)

    print("✅ User Deleted Successfully")
    print("🎉 ALL CRUD Tests Passed!")

if __name__ == "__main__":
    test_add_user_flow()
