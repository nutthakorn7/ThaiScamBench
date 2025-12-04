"""
Detection Service

Main business logic for scam detection.
Uses repository pattern and dependency injection.
"""
import logging
from typing import Optional
from datetime import datetime
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.repositories.detection import DetectionRepository
from app.services.interfaces.classifier import IScamClassifier
from app.services.interfaces.explainer import IExplainer
from app.core.security import sanitize_message, hash_message
from app.core.exceptions import ValidationError, ServiceError

logger = logging.getLogger(__name__)


@dataclass
class DetectionRequest:
    """Detection request data"""
    message: str
    channel: str = "SMS"
    user_ref: Optional[str] = None


@dataclass
class DetectionResponse:
    """Detection response data"""
    is_scam: bool
    risk_score: float
    category: str
    reason: str
    advice: str
    model_version: str
    llm_version: str
    request_id: str


class DetectionService:
    """
    Service for scam detection operations
    
    Handles the complete detection workflow:
    1. Input validation and sanitization
    2. Classification using ML model
    3. Explanation generation
    4. Result logging (PDPA compliant)
    """
    
    def __init__(
        self,
        db: Session,
        classifier: IScamClassifier,
        explainer: IExplainer
    ):
        """
        Initialize detection service
        
        Args:
            db: Database session
            classifier: Scam classifier implementation
            explainer: Explanation generator
        """
        self.db = db
        self.classifier = classifier
        self.explainer = explainer
        self.detection_repo = DetectionRepository(db)
        
        logger.info(
            f"DetectionService initialized with "
            f"classifier={classifier.model_name}, "
            f"explainer={explainer.provider}"
        )
    
    async def detect_scam(
        self,
        request: DetectionRequest,
        source: str = "public",
        partner_id: Optional[str] = None
    ) -> DetectionResponse:
        """
        Detect scam in message
        
        Args:
            request: Detection request data
            source: Source (public/partner)
            partner_id: Partner ID if from partner API
            
        Returns:
            Detection response with results
            
        Raises:
            ValidationError: If input is invalid
            ServiceError: If detection fails
        """
        try:
            # 1. Validate and sanitize input
            logger.debug(f"Processing detection request from {source}")
            
            if not request.message or not request.message.strip():
                raise ValidationError("Message cannot be empty")
            
            # Sanitize message (removes control chars, limits length)
            clean_message = sanitize_message(request.message)
            
            # 2. Check for duplicate (PDPA - use hash only)
            message_hash = hash_message(clean_message)
            existing = self.detection_repo.get_by_hash(message_hash, days=1)
            
            if existing:
                logger.info(f"Returning cached result for hash: {message_hash[:16]}...")
                return self._build_response_from_detection(existing)
            
            # 3. Classify message
            logger.debug("Running classification")
            class_result = self.classifier.classify(clean_message)
            
            # 4. Generate explanation
            logger.debug(f"Generating explanation for category: {class_result.category}")
            explain_result = await self.explainer.explain(
                message=clean_message,
                category=class_result.category,
                risk_score=class_result.risk_score,
                is_scam=class_result.is_scam
            )
            
            # 5. Save to database (PDPA compliant - hash only, no original message)
            logger.debug("Saving detection result")
            import uuid
            request_id = str(uuid.uuid4())
            
            detection = self.detection_repo.create_detection(
                message_hash=message_hash,
                category=class_result.category,
                risk_score=class_result.risk_score,
                is_scam=class_result.is_scam,
                reason=explain_result.reason,
                advice=explain_result.advice,
                model_version=self.classifier.get_version(),
                source=source,
                partner_id=partner_id,
                metadata={
                    "channel": request.channel,
                    "user_ref": request.user_ref,
                    "classifier_confidence": class_result.confidence,
                    "explainer_confidence": explain_result.confidence,
                }
            )
            
            logger.info(
                f"Detection complete: "
                f"category={class_result.category}, "
                f"risk={class_result.risk_score:.2f}, "
                f"scam={class_result.is_scam}"
            )
            
            # 6. Build response
            return DetectionResponse(
                is_scam=class_result.is_scam,
                risk_score=class_result.risk_score,
                category=class_result.category,
                reason=explain_result.reason,
                advice=explain_result.advice,
                model_version=self.classifier.get_version(),
                llm_version=self.explainer.get_version(),
                request_id=request_id
            )
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Detection service error: {e}", exc_info=True)
            raise ServiceError(f"Detection failed: {str(e)}")
    
    def _build_response_from_detection(self, detection) -> DetectionResponse:
        """Build response from cached detection record"""
        return DetectionResponse(
            is_scam=detection.is_scam,
            risk_score=detection.risk_score,
            category=detection.category,
            reason=getattr(detection, 'reason', ''),
            advice=getattr(detection, 'advice', ''),
            model_version=detection.model_version,
            llm_version=getattr(detection, 'llm_version', 'unknown'),
            request_id=detection.request_id
        )
