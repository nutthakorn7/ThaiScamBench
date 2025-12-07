"""Create a new partner account"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.partner_service import create_partner
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Interactive script to create a new partner"""
    print("=" * 60)
    print("Thai Scam Detector - Create Partner")
    print("=" * 60)
    print()
    
    # Get partner details
    name = input("Partner name: ").strip()
    if not name:
        print("❌ Partner name cannot be empty")
        return
    
    # Get rate limit
    rate_limit_input = input("Rate limit per minute (default: 100): ").strip()
    rate_limit = int(rate_limit_input) if rate_limit_input else 100
    
    print()
    print(f"Creating partner: {name}")
    print(f"Rate limit: {rate_limit} requests/minute")
    print()
    
    # Confirm
    confirm = input("Continue? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Cancelled.")
        return
    
    # Create partner
    db = SessionLocal()
    try:
        partner, api_key = create_partner(
            db=db,
            name=name,
            rate_limit_per_min=rate_limit
        )
        
        print()
        print("=" * 60)
        print("✅ Partner created successfully!")
        print("=" * 60)
        print(f"Partner ID: {partner.id}")
        print(f"Partner Name: {partner.name}")
        print(f"Status: {partner.status}")
        print(f"Rate Limit: {partner.rate_limit_per_min} requests/minute")
        print(f"Created: {partner.created_at}")
        print()
        print("🔑 API Key (SAVE THIS - it won't be shown again):")
        print()
        print(f"   {api_key}")
        print()
        print("=" * 60)
        print()
        print("💡 Usage:")
        print("   Use this key in the Authorization header:")
        print(f"   Authorization: Bearer {api_key}")
        print()
        print("   Example with curl:")
        print(f'   curl -X POST http://localhost:8000/v1/partner/detect/text \\')
        print(f'     -H "Authorization: Bearer {api_key}" \\')
        print(f'     -H "Content-Type: application/json" \\')
        print(f'     -d \'{{"message": "test message"}}\'')
        print("=" * 60)
        
    except ValueError as e:
        print(f"❌ Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
