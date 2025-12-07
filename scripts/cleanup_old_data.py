#!/usr/bin/env python3
"""
Data Retention Cleanup Script
Automatically deletes old data according to PDPA retention policy
Run this script daily via cron job
"""
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./data/thai_scam_detector.db')

# Retention periods (in days)
RETENTION_POLICY = {
    'message_hash': 30,      # Delete message hashes after 30 days
    'detection_details': 90,  # Keep detection results for 90 days
    'feedback': 180,         # Keep feedback for 6 months
    'partner_data': 365,     # Keep partner data for 1 year after account closure
}


def cleanup_old_detections(session, days=30):
    """Delete detections older than specified days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    query = text("""
        DELETE FROM detections 
        WHERE created_at < :cutoff_date
    """)
    
    result = session.execute(query, {'cutoff_date': cutoff_date})
    session.commit()
    
    deleted_count = result.rowcount
    logger.info(f"Deleted {deleted_count} detection records older than {days} days")
    return deleted_count


def cleanup_old_feedback(session, days=180):
    """Delete feedback older than specified days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    query = text("""
        DELETE FROM feedback 
        WHERE created_at < :cutoff_date
    """)
    
    result = session.execute(query, {'cutoff_date': cutoff_date})
    session.commit()
    
    deleted_count = result.rowcount
    logger.info(f"Deleted {deleted_count} feedback records older than {days} days")
    return deleted_count


def anonymize_old_detections(session, days=90):
    """
    Anonymize old detections by removing message_hash but keeping
    aggregated statistics (category, risk_score, etc.)
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    query = text("""
        UPDATE detections 
        SET message_hash = 'ANONYMIZED',
            user_ref = NULL
        WHERE created_at < :cutoff_date
        AND message_hash != 'ANONYMIZED'
    """)
    
    result = session.execute(query, {'cutoff_date': cutoff_date})
    session.commit()
    
    anonymized_count = result.rowcount
    logger.info(f"Anonymized {anonymized_count} detection records older than {days} days")
    return anonymized_count


def get_database_stats(session):
    """Get current database statistics"""
    stats = {}
    
    # Total detections
    result = session.execute(text("SELECT COUNT(*) FROM detections"))
    stats['total_detections'] = result.scalar()
    
    # Detections from last 30 days
    cutoff = datetime.utcnow() - timedelta(days=30)
    result = session.execute(
        text("SELECT COUNT(*) FROM detections WHERE created_at >= :cutoff"),
        {'cutoff': cutoff}
    )
    stats['recent_detections'] = result.scalar()
    
    # Anonymized detections
    result = session.execute(
        text("SELECT COUNT(*) FROM detections WHERE message_hash = 'ANONYMIZED'")
    )
    stats['anonymized_detections'] = result.scalar()
    
    # Total feedback
    result = session.execute(text("SELECT COUNT(*) FROM feedback"))
    stats['total_feedback'] = result.scalar()
    
    return stats


def main():
    """Main cleanup function"""
    logger.info("=" * 60)
    logger.info("Starting data retention cleanup")
    logger.info("=" * 60)
    
    # Create database connection
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    try:
        # Get stats before cleanup
        logger.info("\n📊 Database stats BEFORE cleanup:")
        before_stats = get_database_stats(session)
        for key, value in before_stats.items():
            logger.info(f"  {key}: {value}")
        
        # Step 1: Anonymize old detections (keep for statistics but remove PII)
        logger.info("\n🔐 Step 1: Anonymizing old detections...")
        anonymize_old_detections(session, days=RETENTION_POLICY['detection_details'])
        
        # Step 2: Delete very old detections
        logger.info("\n🗑️  Step 2: Deleting very old detections...")
        cleanup_old_detections(session, days=RETENTION_POLICY['message_hash'])
        
        # Step 3: Delete old feedback
        logger.info("\n🗑️  Step 3: Deleting old feedback...")
        cleanup_old_feedback(session, days=RETENTION_POLICY['feedback'])
        
        # Get stats after cleanup
        logger.info("\n📊 Database stats AFTER cleanup:")
        after_stats = get_database_stats(session)
        for key, value in after_stats.items():
            logger.info(f"  {key}: {value}")
        
        # Calculate space saved
        detections_freed = before_stats['total_detections'] - after_stats['total_detections']
        logger.info(f"\n✅ Cleanup complete! Freed {detections_freed} detection records")
        
        logger.info("=" * 60)
        logger.info("Data retention cleanup completed successfully")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Error during cleanup: {e}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
