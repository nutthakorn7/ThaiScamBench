"""
Integration tests for API key rotation
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.main import app
from app.models.database import Partner
from app.services.partner_service import hash_api_key

from app.services.partner_service import hash_api_key, create_partner
from app.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

client = TestClient(app)

@pytest.fixture
def test_db():
    """Create test database session with StaticPool"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def override_dependency(test_db):
    """Override get_db dependency for all tests"""
    app.dependency_overrides[get_db] = lambda: test_db
    yield
    app.dependency_overrides = {}

@pytest.fixture
def test_partner(test_db):
    """Create a test partner with API key"""
    # Use unique name to avoid conflicts
    import uuid
    name = f"Test Partner {uuid.uuid4()}"
    partner, api_key = create_partner(test_db, name, rate_limit_per_min=100)
    return partner, api_key

class TestKeyRotation:
    """Test cases for API key rotation"""

    def test_rotate_key_success(self, test_db, test_partner):
        """Test successful key rotation"""
        partner, old_api_key = test_partner
        
        # Rotate key
        response = client.post(
            "/v1/partner/rotate-key",
            headers={"Authorization": f"Bearer {old_api_key}"},
            json={"validity_days": 30}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "new_api_key" in data
        assert "expires_at" in data
        
        new_api_key = data["new_api_key"]
        assert new_api_key != old_api_key
        
        # Verify old key is invalidated
        response = client.post(
            "/v1/partner/detect/text",
            headers={"Authorization": f"Bearer {old_api_key}"},
            json={"message": "test"}
        )
        assert response.status_code == 401
        
        # Verify new key works
        response = client.post(
            "/v1/partner/detect/text",
            headers={"Authorization": f"Bearer {new_api_key}"},
            json={"message": "test"}
        )
        assert response.status_code == 200

    def test_rotate_key_invalid_auth(self):
        """Test rotation with invalid auth"""
        response = client.post(
            "/v1/partner/rotate-key",
            headers={"Authorization": "Bearer invalid_key"},
            json={"validity_days": 30}
        )
        assert response.status_code == 401

    def test_expired_key_rejection(self, test_db):
        """Test that expired keys are rejected"""
        # Create partner with expired key
        expired_date = datetime.utcnow() - timedelta(days=1)
        partner = Partner(
            name="Expired Partner",
            api_key_hash=hash_api_key("expired_key"),
            api_key_expires_at=expired_date,
            status="active",
            rate_limit_per_min=100
        )
        test_db.add(partner)
        test_db.commit()
        
        response = client.post(
            "/v1/partner/detect/text",
            headers={"Authorization": "Bearer expired_key"},
            json={"message": "test"}
        )
        assert response.status_code == 401
