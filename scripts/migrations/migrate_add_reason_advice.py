"""
Database migration: Add reason and advice columns to detections table

These columns store LLM-generated explanations for detection results
"""
from sqlalchemy import create_engine, text
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add reason and advice columns to detections table"""
    logger.info("Starting migration: Add reason and advice to detections")
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        try:
            # Check if columns already exist
            result = conn.execute(text("PRAGMA table_info(detections)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'reason' in columns and 'advice' in columns:
                logger.info("Columns already exist, skipping migration")
                return
            
            logger.info("Adding reason and advice columns...")
            
            # Add reason column
            if 'reason' not in columns:
                conn.execute(text("ALTER TABLE detections ADD COLUMN reason TEXT"))
                logger.info("✅ Added 'reason' column")
            
            # Add advice column
            if 'advice' not in columns:
                conn.execute(text("ALTER TABLE detections ADD COLUMN advice TEXT"))
                logger.info("✅ Added 'advice' column")
            
            conn.commit()
            logger.info("✅ Migration completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise


if __name__ == "__main__":
    migrate()
