"""
Database migration: Add API key expiration fields to partners table

Adds:
- api_key_expires_at: DateTime for key expiration
- last_rotated_at: DateTime for tracking last rotation
"""
from sqlalchemy import create_engine, text
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Run migration to add expiration fields"""
    logger.info("Starting migration: Add API key expiration fields")
    
    # Create engine
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # Check if columns already exist
        try:
            result = conn.execute(text("PRAGMA table_info(partners)"))
            columns = [row[1] for row in result]
            
            if "api_key_expires_at" in columns:
                logger.info("Column 'api_key_expires_at' already exists, skipping")
            else:
                logger.info("Adding column 'api_key_expires_at'")
                conn.execute(text(
                    "ALTER TABLE partners ADD COLUMN api_key_expires_at DATETIME NULL"
                ))
                conn.commit()
                logger.info("✅ Added column 'api_key_expires_at'")
            
            if "last_rotated_at" in columns:
                logger.info("Column 'last_rotated_at' already exists, skipping")
            else:
                logger.info("Adding column 'last_rotated_at'")
                conn.execute(text(
                    "ALTER TABLE partners ADD COLUMN last_rotated_at DATETIME NULL"
                ))
                conn.commit()
                logger.info("✅ Added column 'last_rotated_at'")
            
            logger.info("✅ Migration completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise


if __name__ == "__main__":
    migrate()
