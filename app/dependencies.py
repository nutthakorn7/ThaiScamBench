from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.detection_service import DetectionService
from app.services.impl.keyword_classifier import KeywordScamClassifier
from app.services.impl.mock_explainer import MockExplainer

# Singleton instances (assuming stateless or thread-safe)
_classifier = KeywordScamClassifier()
_explainer = MockExplainer()

def get_detection_service(db: Session = Depends(get_db)) -> DetectionService:
    """
    Dependency provider for DetectionService.
    Injects required dependencies (DB, Classifier, Explainer).
    """
    return DetectionService(
        db=db,
        classifier=_classifier,
        explainer=_explainer
    )
