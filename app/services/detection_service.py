"""
Detection Service

Main business logic for scam detection.
Uses repository pattern and dependency injection.
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass, asdict

from sqlalchemy.orm import Session

from app.repositories.detection import DetectionRepository
from app.services.interfaces.classifier import IScamClassifier
from app.services.interfaces.explainer import IExplainer
from app.core.security import sanitize_message, hash_message
from app.core.exceptions import ValidationError, ServiceError
from app.config import settings
from app.cache import redis_client, generate_cache_key
from app.models.database import Dataset, DetectionSource

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
    2. Caching (Redis)
    3. Classification using ML model
    4. Explanation generation
    5. Result logging (PDPA compliant)
    6. Raw Data Collection (Opt-in)
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
            
            # 2. CACHE CHECK: Redis
            # Use appropriate prefix based on source
            cache_prefix = "partner" if source == DetectionSource.partner else "public"
            cache_key = generate_cache_key(clean_message, prefix=cache_prefix)
            cached_result = redis_client.get(cache_key)
            
            if cached_result:
                logger.info(f"✅ Cache HIT for {source} detection")
                # Even if cached, we might want to log the "hit" or create a detection record
                # For now, to match previous behavior, we will behave as if we just detected it
                # depending on business logic. 
                # Strategy: If cached, we return the cached result immediately for speed/cost.
                # However, for analytics, we might still want to log it asynchronously or skip logging.
                # The previous implementation in routes would log even on cache hit for partners to track usage.
                # Let's support that behavior.
                
                # Check if we need to re-log (e.g. for Partner quota tracking)
                if source == DetectionSource.partner:
                     return await self._handle_cache_hit_logging(
                        cached_result, clean_message, request, source, partner_id, cache_key
                    )
                
                # For public, just return cached result directly
                return DetectionResponse(**cached_result)

            
            # 3. Check DB duplicate (Deduplication / Anti-Spam via hash)
            message_hash = hash_message(clean_message)
            existing = self.detection_repo.get_by_hash(message_hash, days=1)
            
            if existing:
                logger.info(f"Returning DB-cached result for hash: {message_hash[:16]}...")
                response = self._build_response_from_detection(existing)
                # Should we cache this back to Redis? Yes.
                self._cache_result(cache_key, response)
                return response
            
            # 4. Classify message
            logger.debug("Running classification")
            # Different thresholds for public vs partner
            threshold = settings.partner_threshold if source == DetectionSource.partner else settings.public_threshold
            class_result = self.classifier.classify(clean_message)
            # Override is_scam based on threshold if the classifier doesn't handle it directly
            # The classifier usually returns probability. Let's rely on its output but we could enforce strictness here.
            # Assuming classifier.classify returns results based on its internal logic or general probability. 
            # If we need strict thresholding, we might check class_result.risk_score >= threshold
            
            # 5. Generate explanation
            logger.debug(f"Generating explanation for category: {class_result.category}")
            explain_result = await self.explainer.explain(
                message=clean_message,
                category=class_result.category,
                risk_score=class_result.risk_score,
                is_scam=class_result.is_scam
            )
            
            # 6. Hybrid Logic Override (Layer 2 - AI)
            # If Explainer used LLM, use its judgement for final verdict
            final_risk_score = class_result.risk_score
            final_is_scam = class_result.is_scam
            
            if getattr(explain_result, 'llm_used', False):
                ai_risk = explain_result.metadata.get("ai_risk_score")
                ai_is_scam = explain_result.metadata.get("ai_is_scam")
                
                if ai_risk is not None:
                    logger.info(f"🤖 AI Override: Rule({class_result.risk_score}) -> AI({ai_risk})")
                    final_risk_score = float(ai_risk)
                    final_is_scam = bool(ai_is_scam)

            # 6.5. Crowd Wisdom Override (Layer 3 - Community)
            # Check if many people reported this same message as scam
            try:
                crowd_reports = self.detection_repo.get_scam_count(message_hash)
                if crowd_reports > 0:
                    logger.info(f"⚖️ Crowd Wisdom: Found {crowd_reports} previous reports")
                    
                    # If confirmed by crowd (> 2 people), boost score
                    if crowd_reports >= 2:
                        old_score = final_risk_score
                        final_risk_score = max(final_risk_score, 0.95)
                        final_is_scam = True
                        if final_risk_score > old_score:
                             logger.info(f"   └── Boosted score {old_score} -> {final_risk_score} (Community Confirmed)")
            except Exception as e:
                logger.warning(f"Layer 3 check failed: {e}")

            # 7. Save to database
            logger.debug("Saving detection result")
            import uuid
            request_id = str(uuid.uuid4())
            
            # Create Detection Record
            detection = self.detection_repo.create_detection(
                message_hash=message_hash,
                category=class_result.category,
                risk_score=final_risk_score,
                is_scam=final_is_scam,
                reason=explain_result.reason,
                advice=explain_result.advice,
                model_version=f"{self.classifier.get_version()}+{self.explainer.provider}",
                source=source,
                partner_id=partner_id,
                metadata={
                    "channel": request.channel,
                    "user_ref": request.user_ref,
                    "classifier_confidence": class_result.confidence,
                    "explainer_confidence": explain_result.confidence,
                    "rule_score": class_result.risk_score,
                    "ai_score": final_risk_score
                }
            )
            
            # Create Dataset Entry
            if settings.collect_training_data:
                try:
                    dataset_entry = Dataset(
                        request_id=detection.request_id,
                        source=source,
                        content=clean_message,
                        labeled_category=class_result.category,
                        is_scam=final_is_scam
                    )
                    self.db.add(dataset_entry)
                    self.db.commit()
                except Exception as e:
                    logger.error(f"Failed to save dataset entry: {e}")

            logger.info(
                f"Detection complete: "
                f"category={class_result.category}, "
                f"risk={final_risk_score:.2f}, "
                f"scam={final_is_scam}"
            )
            
            # 8. Build response
            response = DetectionResponse(
                is_scam=final_is_scam,
                risk_score=final_risk_score,
                category=class_result.category,
                reason=explain_result.reason,
                advice=explain_result.advice,
                model_version=f"{self.classifier.get_version()}+{self.explainer.provider}",
                llm_version=self.explainer.get_version(),
                request_id=detection.request_id
            )
            
            # 8. Set Redis Cache
            self._cache_result(cache_key, response)
            
            return response
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Detection service error: {e}", exc_info=True)
            raise ServiceError(f"Detection failed: {str(e)}")
    
    async def _handle_cache_hit_logging(
        self, 
        cached_result: Dict[str, Any], 
        message: str, 
        request: DetectionRequest,
        source: str,
        partner_id: Optional[str],
        cache_key: str
    ) -> DetectionResponse:
        """
        Handle logging logic when cache is hit (especially for partners who need usage tracking)
        """
        # Create a new detection record to track this request
        message_hash = hash_message(message)
        
        # We need to create a new detection record even if cached for proper tracking
        detection = self.detection_repo.create_detection(
            message_hash=message_hash,
            category=cached_result['category'],
            risk_score=cached_result['risk_score'],
            is_scam=cached_result['is_scam'],
            reason=cached_result['reason'],
            advice=cached_result['advice'],
            model_version=cached_result['model_version'],
            source=source,
            partner_id=partner_id,
            metadata={
                "channel": request.channel,
                "user_ref": request.user_ref,
                "cached": True
            }
        )
        
        # Update response with new request_id
        response = DetectionResponse(
            is_scam=cached_result['is_scam'],
            risk_score=cached_result['risk_score'],
            category=cached_result['category'],
            reason=cached_result['reason'],
            advice=cached_result['advice'],
            model_version=cached_result['model_version'],
            llm_version=cached_result.get('llm_version', 'unknown'),
            request_id=detection.request_id
        )
        
        return response

    def _cache_result(self, key: str, response: DetectionResponse):
        """Helper to cache response to Redis"""
        try:
            data = asdict(response)
            # Store without request_id usually, but for public API strict caching, it might just return the old object.
            # But the response object includes request_id.
            # If we serve from cache, should we generate a NEW request_id?
            # Ideally yes for tracking, but for public anonymous it might not matter as much.
            # However, logic above in _handle_cache_hit_logging handles generating new ID for partners.
            # For public, we just return the cached dict.
            # The cached dict will have the OLD request_id. 
            # If we want public users to have unique IDs we should strip it or regenerate.
            # Simplified: Store full object. Public users get cached ID (deduplication behavior).
            redis_client.set(key, data, ttl=settings.cache_ttl_seconds)
        except Exception as e:
            logger.warning(f"Failed to cache result: {e}")

    async def submit_manual_report(
        self,
        message: str,
        is_scam: bool,
        details: Optional[str] = None
    ) -> DetectionResponse:
        """
        Submit a manual report (Crowd Wisdom Source)
        """
        try:
            if not message or not message.strip():
                raise ValidationError("Message cannot be empty")
            
            clean_message = sanitize_message(message)
            message_hash = hash_message(clean_message)
            
            # Construct standard fields based on user report
            final_risk_score = 1.0 if is_scam else 0.0
            category = "start_form_report" if is_scam else "safe_report"
            # Truncate heavily - Thai chars expand ~6x in JSON (\u0e2b format)
            # Keep reason short: 80 chars * 6 = 480 which fits in reason column (2000)
            truncated_details = (details[:80] + "...") if details and len(details) > 80 else details
            reason = f"User Reported: {truncated_details if truncated_details else 'No details'}"
            advice = "Beware! This was reported by a community member." if is_scam else "Marked as safe by community."
            
            # Create Detection Record - metadata goes to extra_data (1000 chars)
            # 50 Thai chars * 6 = 300 JSON chars + {"details": "", "manual_report": true} = ~350 chars safe
            metadata_details = (details[:50] + "...") if details and len(details) > 50 else details
            detection = self.detection_repo.create_detection(
                message_hash=message_hash,
                category=category,
                risk_score=final_risk_score,
                is_scam=is_scam,
                reason=reason,
                advice=advice,
                model_version="crowd-v1.0",
                source="report",
                partner_id=None,
                metadata={
                    "details": metadata_details,
                    "manual_report": True
                }
            )
            
            # Save Raw for training
            if settings.collect_training_data:
                 dataset_entry = Dataset(
                    request_id=detection.request_id,
                    source="report",
                    content=clean_message,
                    labeled_category=category,
                    is_scam=is_scam
                )
                 self.db.add(dataset_entry)
                 self.db.commit()
            
            logger.info(f"📝 Manual Report Saved: {message[:20]}... is_scam={is_scam}")
            
            return DetectionResponse(
                is_scam=is_scam,
                risk_score=final_risk_score,
                category=category,
                reason=reason,
                advice=advice,
                model_version="crowd-v1.0",
                llm_version="manual",
                request_id=detection.request_id
            )
            
        except Exception as e:
            logger.error(f"Manual report error: {e}", exc_info=True)
            raise ServiceError(f"Report failed: {str(e)}")

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
