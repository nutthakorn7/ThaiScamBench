"""
Dependency injection container

Provides factory functions for creating service instances
with proper dependency injection.
"""
from typing import Generator
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.core.exceptions import DatabaseError


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency
    
    Yields:
        SQLAlchemy session
        
    Usage:
        @app.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise DatabaseError(f"Database operation failed: {str(e)}")
    finally:
        db.close()


# Service factories
def get_classifier():
    """
    Get scam classifier instance
    
    Returns:
        IScamClassifier implementation
    """
    from app.services.impl.keyword_classifier import get_classifier
    return get_classifier()


def get_explainer():
    """
    Get explainer instance
    
    Returns:
        IExplainer implementation
    """
    from app.services.impl.mock_explainer import get_explainer
    return get_explainer()


def get_detection_service(db: Session = None):
    """
    Get detection service instance
    
    Args:
        db: Database session (optional, will create if not provided)
        
    Returns:
        DetectionService instance
    """
    from app.services.detection_service import DetectionService
    
    if db is None:
        # For testing or standalone use
        db = next(get_db())
    
    classifier = get_classifier()
    explainer = get_explainer()
    
    return DetectionService(
        db=db,
        classifier=classifier,
        explainer=explainer
    )
