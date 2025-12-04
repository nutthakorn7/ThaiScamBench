"""Test configuration and fixtures"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.database import Partner, Detection, Feedback
from app.services.partner_service import hash_api_key
import os

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """FastAPI test client with test database"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Use positional argument for app (not keyword 'app=')
    test_client = TestClient(app)
    yield test_client
    
    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def test_partner(test_db):
    """Create a test partner"""
    api_key = "test_api_key_12345678901234567890123456789"
    partner = Partner(
        name="Test Bank",
        api_key_hash=hash_api_key(api_key),
        status="active",
        rate_limit_per_min=200
    )
    test_db.add(partner)
    test_db.commit()
    test_db.refresh(partner)
    return partner, api_key


@pytest.fixture
def test_detection(test_db, test_partner):
    """Create a test detection"""
    import uuid
    partner, _ = test_partner
    detection = Detection(
        request_id=str(uuid.uuid4()),
        source="partner",
        partner_id=partner.id,
        channel="SMS",
        message_hash="test_hash",
        is_scam=True,
        category="parcel_scam",
        risk_score=0.85,
        model_version="test-v1.0",
        llm_version="test-llm-v1.0"
    )
    test_db.add(detection)
    test_db.commit()
    test_db.refresh(detection)
    return detection
