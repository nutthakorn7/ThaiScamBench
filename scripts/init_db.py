"""Initialize database - Create all tables"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, SessionLocal
from app.services.partner_service import create_partner
from app.models.database import Partner
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Initialize database and optionally create test partner"""
    print("=" * 60)
    print("Thai Scam Detector - Database Initialization")
    print("=" * 60)
    print()
    
    # Create tables
    print("Creating database tables...")
    init_db()
    print("✅ Database tables created successfully!")
    print()
    
    # Ask if user wants to create a test partner
    create_test = input("Create a test partner? (y/n): ").strip().lower()
    
    if create_test == 'y':
        db = SessionLocal()
        try:
            partner, api_key = create_partner(
                db=db,
                name="Test Partner",
                rate_limit_per_min=100
            )
            
            print()
            print("=" * 60)
            print("✅ Test partner created successfully!")
            print("=" * 60)
            print(f"Partner ID: {partner.id}")
            print(f"Partner Name: {partner.name}")
            print(f"Rate Limit: {partner.rate_limit_per_min} requests/minute")
            print()
            print("🔑 API Key (save this - it won't be shown again):")
            print(f"   {api_key}")
            print("=" * 60)
            print()
            print("💡 Use this key in the Authorization header:")
            print(f"   Authorization: Bearer {api_key}")
            print("=" * 60)
            
        except Exception as e:
            print(f"❌ Error creating test partner: {e}")
        finally:
            db.close()
    
    print()
    print("✅ Database initialization complete!")


if __name__ == "__main__":
    main()
