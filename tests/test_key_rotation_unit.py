"""
Unit tests for API key rotation functionality
"""
import sys
import pytest
from datetime import datetime, timedelta, UTC
from sqlalchemy.orm import Session

from app.services.partner_service import create_partner, rotate_partner_api_key, get_partner_by_api_key
from app.database import SessionLocal, init_db, Base, engine
from app.models.database import Partner

# Fixture to setup DB
@pytest.fixture(scope="module")
def db():
    # Setup
    init_db()
    session = SessionLocal()
    yield session
    # Teardown
    session.close()

def test_partner_key_flow(db: Session):
    """
    Test the full lifecycle of partner creation and key rotation.
    Grouped in one test function because of state dependency in the original script.
    """
    # 1. Create Partner
    partner_name = "Rotation Test Partner Pytest"
    try:
        partner, original_key = create_partner(db, partner_name, rate_limit_per_min=100)
    except ValueError:
        # Cleanup if exists from previous run
        existing = db.query(Partner).filter(Partner.name == partner_name).first()
        if existing:
            db.delete(existing)
            db.commit()
        partner, original_key = create_partner(db, partner_name, rate_limit_per_min=100)
    
    assert partner.name == partner_name
    original_hash = partner.api_key_hash
    
    # 2. Rotate API key with expiration
    expires_at = datetime.now(UTC) + timedelta(days=365)
    new_key = rotate_partner_api_key(db, partner.id, expires_at)
    db.refresh(partner)
    
    assert partner.api_key_hash != original_hash
    
    # Handle timezones (User's sqlite fix)
    db_expires = partner.api_key_expires_at
    if db_expires.tzinfo is None:
        db_expires = db_expires.replace(tzinfo=UTC)
        
    assert abs((db_expires - expires_at).total_seconds()) < 1.0
    
    # 3. Verify old key invalidated
    old_partner = get_partner_by_api_key(db, original_key)
    assert old_partner is None, "Old key should be invalid"
    
    # 4. Verify new key works
    found_partner = get_partner_by_api_key(db, new_key)
    assert found_partner is not None
    assert found_partner.id == partner.id
    
    # 5. Rotate again (custom expiration)
    new_expires = datetime.now(UTC) + timedelta(days=90)
    newer_key = rotate_partner_api_key(db, partner.id, new_expires)
    db.refresh(partner)
    
    db_expires_new = partner.api_key_expires_at
    if db_expires_new.tzinfo is None:
        db_expires_new = db_expires_new.replace(tzinfo=UTC)
        
    assert abs((db_expires_new - new_expires).total_seconds()) < 1.0
    
    # 6. Rotate (no expiration)
    never_expire_key = rotate_partner_api_key(db, partner.id, None)
    db.refresh(partner)
    assert partner.api_key_expires_at is None
