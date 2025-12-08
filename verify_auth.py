import sys
import os
import logging
from app.database import SessionLocal, init_db
from app.models.database import User, UserRole
from app.routes.auth import hash_password, verify_password

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_auth():
    print("Testing Authentication Logic...")
    
    # Initialize DB (create tables if not exist)
    init_db()
    
    db = SessionLocal()
    try:
        email = "admin@thaiscam.zcr.ai"
        password = "admin123" # Default
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User {email} NOT FOUND in database!")
            
            # Create it now for testing
            print("Creating test admin user...")
            admin_user = User(
                email=email,
                password_hash=hash_password(password),
                name="System Admin",
                role=UserRole.admin.value,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Test admin user created.")
            
            # Fetch again
            user = db.query(User).filter(User.email == email).first()
            
        print(f"✅ User found: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Hash: {user.password_hash}")
        
        # Verify password
        is_valid = verify_password(password, user.password_hash)
        print(f"🔐 Password Verification ('{password}'): {is_valid}")
        
        if is_valid:
            print("🎉 Authentication SUCCESS!")
        else:
            print("❌ Authentication FAILED! Password mismatch.")
            
            # Debug hash
            new_hash = hash_password(password)
            print(f"   Expected hash generation: {new_hash}")
            print(f"   Verify new hash: {verify_password(password, new_hash)}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_auth()
