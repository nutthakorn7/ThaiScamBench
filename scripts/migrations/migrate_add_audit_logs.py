"""
Database migration: Add audit_logs table

Adds audit_logs table for tracking API usage without PII
"""
from sqlalchemy import create_engine, text
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Create audit_logs table"""
    logger.info("Starting migration: Add audit_logs table")
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # Check if table exists
        try:
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'"
            ))
            if result.fetchone():
                logger.info("Table 'audit_logs' already exists, skipping")
                return
            
            logger.info("Creating audit_logs table...")
            
            # For SQLite
            if "sqlite" in settings.database_url:
                conn.execute(text("""
                    CREATE TABLE audit_logs (
                        id VARCHAR(36) PRIMARY KEY,
                        timestamp DATETIME NOT NULL,
                        endpoint VARCHAR(255) NOT NULL,
                        method VARCHAR(10) NOT NULL,
                        status_code INTEGER NOT NULL,
                        ip_hash VARCHAR(64),
                        user_agent VARCHAR(255),
                        partner_id VARCHAR(36),
                        request_id VARCHAR(36),
                        response_time_ms INTEGER,
                        error_message TEXT
                    )
                """))
                
                # Create indexes
                conn.execute(text("CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp)"))
                conn.execute(text("CREATE INDEX idx_audit_endpoint ON audit_logs(endpoint)"))
                conn.execute(text("CREATE INDEX idx_audit_partner ON audit_logs(partner_id)"))
                
            # For PostgreSQL
            else:
                conn.execute(text("""
                    CREATE TABLE audit_logs (
                        id VARCHAR(36) PRIMARY KEY,
                        timestamp TIMESTAMP NOT NULL,
                        endpoint VARCHAR(255) NOT NULL,
                        method VARCHAR(10) NOT NULL,
                        status_code INTEGER NOT NULL,
                        ip_hash VARCHAR(64),
                        user_agent VARCHAR(255),
                        partner_id VARCHAR(36),
                        request_id VARCHAR(36),
                        response_time_ms INTEGER,
                        error_message TEXT
                    )
                """))
                
                # Create indexes
                conn.execute(text("CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp)"))
                conn.execute(text("CREATE INDEX idx_audit_endpoint ON audit_logs(endpoint)"))
                conn.execute(text("CREATE INDEX idx_audit_partner ON audit_logs(partner_id)"))
            
            conn.commit()
            logger.info("✅ audit_logs table created successfully")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise


if __name__ == "__main__":
    migrate()
