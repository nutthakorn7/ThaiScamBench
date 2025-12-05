"""
Script to hash admin password for environment configuration

Usage:
    python scripts/hash_password.py
    
Then copy the hash to ADMIN_PASSWORD_HASH in .env
"""
from app.utils.jwt_utils import hash_password
import getpass

def main():
    print("=" * 60)
    print("Admin Password Hash Generator")
    print("=" * 60)
    print()
    
    # Get password
    password = getpass.getpass("Enter admin password: ")
    password_confirm = getpass.getpass("Confirm password: ")
    
    if password != password_confirm:
        print("❌ Passwords don't match!")
        return
    
    if len(password) < 8:
        print("❌ Password must be at least 8 characters!")
        return
    
    # Generate hash
    print("\nGenerating hash...")
    hashed = hash_password(password)
    
    print("\n" + "=" * 60)
    print("✅ Password Hash Generated")
    print("=" * 60)
    print(f"\nAdd this to your .env file:\n")
    print(f"ADMIN_PASSWORD_HASH={hashed}")
    print("\n" + "=" * 60)
    print("\n⚠️  IMPORTANT:")
    print("- Keep this hash secure!")
    print("- Don't commit .env to git")
    print("- Use a strong, unique password")
    print()

if __name__ == "__main__":
    main()
