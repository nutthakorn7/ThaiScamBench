"""
PostgreSQL Migration Script

Migrates data from SQLite to PostgreSQL database.

Usage:
    python scripts/migrate_to_postgres.py
    
Prerequisites:
    - PostgreSQL server running
    - DATABASE_URL configured in .env
    - psycopg2-binary installed
"""
import sys
sys.path.insert(0, '/Users/pop7/Code/ThaiScamBench')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.database import Partner, Detection, Feedback, Base
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def backup_sqlite():
    """Backup SQLite database before migration"""
    import shutil
    from pathlib import Path
    
    sqlite_db = Path("thai_scam_detector.db")
    if not sqlite_db.exists():
        logger.warning("SQLite database not found, skipping backup")
        return None
    
    backup_path = f"thai_scam_detector.db.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy(sqlite_db, backup_path)
    logger.info(f"✅ SQLite database backed up to: {backup_path}")
    return backup_path


def get_sqlite_session():
    """Create SQLite session"""
    sqlite_url = "sqlite:///./thai_scam_detector.db"
    engine = create_engine(sqlite_url)
    Session = sessionmaker(bind=engine)
    return Session(), engine


def get_postgres_session():
    """Create PostgreSQL session"""
    if not settings.database_url.startswith("postgresql"):
        raise ValueError(
            "DATABASE_URL must start with 'postgresql://'\n"
            f"Current: {settings.database_url}"
        )
    
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    return Session(), engine


def create_postgres_tables(pg_engine):
    """Create all tables in PostgreSQL"""
    logger.info("Creating tables in PostgreSQL...")
    Base.metadata.create_all(bind=pg_engine)
    logger.info("✅ Tables created")


def migrate_partners(sqlite_session, postgres_session):
    """Migrate partners table"""
    logger.info("\n📦 Migrating partners...")
    
    partners = sqlite_session.query(Partner).all()
    total = len(partners)
    
    if total == 0:
        logger.info("   No partners to migrate")
        return 0
    
    for i, partner in enumerate(partners, 1):
        # Create new partner instance for postgres
        new_partner = Partner(
            id=partner.id,
            name=partner.name,
            api_key_hash=partner.api_key_hash,
            api_key_expires_at=partner.api_key_expires_at,
            last_rotated_at=partner.last_rotated_at,
            status=partner.status,
            rate_limit_per_min=partner.rate_limit_per_min,
            created_at=partner.created_at
        )
        postgres_session.add(new_partner)
        
        if i % 100 == 0:
            logger.info(f"   Migrated {i}/{total} partners...")
    
    postgres_session.commit()
    logger.info(f"✅ Migrated {total} partners")
    return total


def migrate_detections(sqlite_session, postgres_session):
    """Migrate detections table"""
    logger.info("\n📦 Migrating detections...")
    
    detections = sqlite_session.query(Detection).all()
    total = len(detections)
    
    if total == 0:
        logger.info("   No detections to migrate")
        return 0
    
    for i, detection in enumerate(detections, 1):
        new_detection = Detection(
            id=detection.id,
            created_at=detection.created_at,
            source=detection.source,
            partner_id=detection.partner_id,
            channel=detection.channel,
            message_hash=detection.message_hash,
            is_scam=detection.is_scam,
            category=detection.category,
            risk_score=detection.risk_score,
            model_version=detection.model_version,
            llm_version=detection.llm_version,
            request_id=detection.request_id,
            user_ref=detection.user_ref,
            reason=detection.reason,
            advice=detection.advice,
            extra_data=detection.extra_data
        )
        postgres_session.add(new_detection)
        
        if i % 1000 == 0:
            logger.info(f"   Migrated {i}/{total} detections...")
            postgres_session.commit()  # Commit in batches
    
    postgres_session.commit()
    logger.info(f"✅ Migrated {total} detections")
    return total


def migrate_feedback(sqlite_session, postgres_session):
    """Migrate feedback table"""
    logger.info("\n📦 Migrating feedback...")
    
    feedbacks = sqlite_session.query(Feedback).all()
    total = len(feedbacks)
    
    if total == 0:
        logger.info("   No feedback to migrate")
        return 0
    
    for i, feedback in enumerate(feedbacks, 1):
        new_feedback = Feedback(
            id=feedback.id,
            request_id=feedback.request_id,
            feedback_type=feedback.feedback_type,
            comment=feedback.comment,
            created_at=feedback.created_at,
            user_agent=feedback.user_agent,
            ip_address=feedback.ip_address
        )
        postgres_session.add(new_feedback)
        
        if i % 1000 == 0:
            logger.info(f"   Migrated {i}/{total} feedback...")
            postgres_session.commit()
    
    postgres_session.commit()
    logger.info(f"✅ Migrated {total} feedback records")
    return total


def verify_migration(sqlite_session, postgres_session):
    """Verify data was migrated correctly"""
    logger.info("\n🔍 Verifying migration...")
    
    checks = []
    
    # Check partners count
    sqlite_partners = sqlite_session.query(Partner).count()
    postgres_partners = postgres_session.query(Partner).count()
    checks.append(("Partners", sqlite_partners, postgres_partners))
    
    # Check detections count
    sqlite_detections = sqlite_session.query(Detection).count()
    postgres_detections = postgres_session.query(Detection).count()
    checks.append(("Detections", sqlite_detections, postgres_detections))
    
    # Check feedback count
    sqlite_feedback = sqlite_session.query(Feedback).count()
    postgres_feedback = postgres_session.query(Feedback).count()
    checks.append(("Feedback", sqlite_feedback, postgres_feedback))
    
    all_match = True
    for table, sqlite_count, postgres_count in checks:
        match = "✅" if sqlite_count == postgres_count else "❌"
        logger.info(f"   {match} {table}: SQLite={sqlite_count}, PostgreSQL={postgres_count}")
        if sqlite_count != postgres_count:
            all_match = False
    
    return all_match


def main():
    """Main migration function"""
    print("=" * 70)
    print("PostgreSQL Migration Script")
    print("=" * 70)
    print()
    
    # Step 1: Backup SQLite
    logger.info("Step 1: Backing up SQLite database...")
    backup_path = backup_sqlite()
    
    # Step 2: Check PostgreSQL connection
    logger.info("\nStep 2: Checking PostgreSQL connection...")
    try:
        pg_session, pg_engine = get_postgres_session()
        logger.info(f"✅ Connected to PostgreSQL: {settings.database_url.split('@')[1] if '@' in settings.database_url else 'localhost'}")
    except Exception as e:
        logger.error(f"❌ Failed to connect to PostgreSQL: {e}")
        logger.error("\nPlease ensure:")
        logger.error("1. PostgreSQL server is running")
        logger.error("2. DATABASE_URL is correct in .env")
        logger.error("3. Database exists (create it if needed)")
        return 1
    
    # Step 3: Create tables
    logger.info("\nStep 3: Creating tables in PostgreSQL...")
    try:
        create_postgres_tables(pg_engine)
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")
        return 1
    
    # Step 4: Load SQLite data
    logger.info("\nStep 4: Loading data from SQLite...")
    try:
        sqlite_session, sqlite_engine = get_sqlite_session()
        logger.info("✅ SQLite database loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load SQLite: {e}")
        return 1
    
    # Step 5: Migrate data
    logger.info("\nStep 5: Migrating data...")
    try:
        partners_count = migrate_partners(sqlite_session, pg_session)
        detections_count = migrate_detections(sqlite_session, pg_session)
        feedback_count = migrate_feedback(sqlite_session, pg_session)
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        logger.error("Rolling back PostgreSQL changes...")
        pg_session.rollback()
        return 1
    
    # Step 6: Verify
    logger.info("\nStep 6: Verifying migration...")
    if verify_migration(sqlite_session, pg_session):
        logger.info("\n✅ Migration verified successfully!")
    else:
        logger.warning("\n⚠️  Warning: Record counts don't match!")
        logger.warning("Please review the data manually")
    
    # Cleanup
    sqlite_session.close()
    pg_session.close()
    
    # Summary
    print("\n" + "=" * 70)
    print("Migration Complete!")
    print("=" * 70)
    print(f"✅ Partners migrated: {partners_count}")
    print(f"✅ Detections migrated: {detections_count}")
    print(f"✅ Feedback migrated: {feedback_count}")
    if backup_path:
        print(f"\n💾 Backup saved to: {backup_path}")
    print("\n📝 Next steps:")
    print("1. Update DATABASE_URL in .env to use PostgreSQL")
    print("2. Restart your application")
    print("3. Test all endpoints")
    print("4. Keep SQLite backup for safety")
    print()
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
