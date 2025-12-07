import os
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.detection_service import DetectionService
from app.services.impl.keyword_classifier import KeywordScamClassifier
from app.services.impl.mock_explainer import MockExplainer
from app.services.impl.gemini_explainer import GeminiExplainer
import logging

logger = logging.getLogger(__name__)

# Singleton instances
_classifier = KeywordScamClassifier()
# Hybrid Explainer Logic
_mock_explainer = MockExplainer()
_gemini_explainer = None

if os.getenv("GOOGLE_API_KEY"):
    try:
        _gemini_explainer = GeminiExplainer()
        logger.info("✅ Gemini AI enabled")
    except Exception as e:
        logger.error(f"❌ Failed to init Gemini: {e}")

def get_detection_service(db: Session = Depends(get_db)) -> DetectionService:
    """
    Dependency provider for DetectionService.
    Injects Hybrid Explainer strategy.
    """
    # Prefer Gemini if available, else Mock
    explainer = _gemini_explainer if _gemini_explainer else _mock_explainer
    
    return DetectionService(
        db=db,
        classifier=_classifier,
        explainer=explainer
    )
