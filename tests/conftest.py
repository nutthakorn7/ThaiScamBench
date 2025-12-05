"""
Pytest configuration and fixtures

Provides shared fixtures for all tests.
"""
import pytest
import asyncio
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
# Import all models to ensure they are registered with Base.metadata
from app.models.database import Detection, Feedback, Partner
from app.models.audit_log import AuditLog


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
    Uses StaticPool to share connection across threads.
    """
    # Create engine with StaticPool
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    
    # Import models to ensure they are registered with Base.metadata
    from app.models.database import Detection, Feedback, Partner
    from app.models.audit_log import AuditLog
    
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


@pytest.fixture(scope="function")
def client(test_db: Session) -> Generator[TestClient, None, None]:
    """
    Create test client with database override
    """
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
        
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def clear_redis():
    """Clear Redis cache before each test"""
    from app.cache import redis_client
    if redis_client._enabled and redis_client._client:
        try:
            redis_client.clear()
        except Exception:
            pass


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


@pytest.fixture
def test_partner_with_key(test_db: Session):
    """Create test partner and return (partner, api_key)"""
    from app.services.partner_service import create_partner
    import uuid
    name = f"Test Partner {uuid.uuid4()}"
    return create_partner(test_db, name, rate_limit_per_min=100)
