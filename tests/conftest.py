"""
Pytest configuration and fixtures

Provides shared fixtures for all tests.
"""
import pytest
import asyncio
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.database import Base
from app.models.database import Detection, Feedback, Partner


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def test_db() -> Generator[Session, None, None]:
    """
    Create test database session
    
    Creates fresh in-memory database for each test.
    """
    # Create engine
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_detection(test_db: Session) -> Detection:
    """Create sample detection record"""
    detection = Detection(
        message_hash="test_hash_123",
        category="parcel_scam",
        risk_score=0.85,
        is_scam=True,
        model_version="keyword-v1.0",
        llm_version="mock-v1.0",
        source="public",
        request_id="test-request-123",
        reason="Test reason",
        advice="Test advice"
    )
    test_db.add(detection)
    test_db.commit()
    test_db.refresh(detection)
    return detection


@pytest.fixture
def sample_partner(test_db: Session) -> Partner:
    """Create sample partner record"""
    partner = Partner(
        name="Test Partner",
        api_key_hash="test_api_key_hash",
        status="active",
        rate_limit_per_min=100
    )
    test_db.add(partner)
    test_db.commit()
    test_db.refresh(partner)
    return partner
