"""
Detection repository

Handles all database operations related to scam detection records.
"""
from datetime import datetime, timedelta, UTC
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.repositories.base import BaseRepository
from app.models.database import Detection
from app.core.exceptions import DatabaseError


class DetectionRepository(BaseRepository[Detection]):
    """
    Repository for detection records
    
    Provides specialized queries for detection analytics and history.
    """
    
    def __init__(self, db: Session):
        super().__init__(Detection, db)
    
    def create_detection(
        self,
        message_hash: str,
        category: str,
        risk_score: float,
        is_scam: bool,
        reason: str,
        advice: str,
        model_version: str,
        source: str = "public",
        partner_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Detection:
        """
        Create new detection record
        
        Args:
            message_hash: SHA-256 hash of message (PDPA compliant)
            category: Scam category
            risk_score: Risk score (0.0-1.0)
            is_scam: Whether classified as scam
            reason: Detection reason
            advice: User advice
            model_version: Model version used
            source: Source (public/partner)
            partner_id: Partner ID if from partner API
            metadata: Additional metadata
            
        Returns:
            Created detection record
        """
        import json
        import uuid
        
        # Serialize metadata to JSON string if provided
        extra_data_str = json.dumps(metadata) if metadata else None
        
        return self.create(
            message_hash=message_hash,
            category=category,
            risk_score=risk_score,
            is_scam=is_scam,
            reason=reason,
            advice=advice,
            model_version=model_version,
            llm_version="mock-v1.0",  # Default LLM version
            source=source,
            partner_id=partner_id,
            extra_data=extra_data_str,
            request_id=str(uuid.uuid4()),
            created_at=datetime.now(UTC)
        )
    
    def get_by_id(self, request_id: str) -> Optional[Detection]:
        """
        Get detection by request_id (public ID)
        
        Args:
            request_id: Public request ID
            
        Returns:
            Detection record or None
        """
        try:
            return (
                self.db.query(Detection)
                .filter(Detection.request_id == request_id)
                .first()
            )
        except Exception as e:
            raise DatabaseError(f"Failed to get detection by ID: {str(e)}")

    def get_by_hash(self, message_hash: str, days: int = 7) -> Optional[Detection]:
        """
        Get recent detection by message hash (for deduplication)
        
        Args:
            message_hash: Message hash
            days: Look back period in days
            
        Returns:
            Detection record if found within period
        """
        try:
            since = datetime.now(UTC) - timedelta(days=days)
            return (
                self.db.query(Detection)
                .filter(
                    Detection.message_hash == message_hash,
                    Detection.created_at >= since
                )
                .order_by(Detection.created_at.desc())
                .first()
            )
        except Exception as e:
            raise DatabaseError(f"Failed to query detection by hash: {str(e)}")
    
    def get_scam_count(self, message_hash: str) -> int:
        """
        Count how many times this message was flagged as scam
        
        Args:
            message_hash: Message hash
            
        Returns:
            Number of times flagged as scam
        """
        try:
            return (
                self.db.query(func.count(Detection.id))
                .filter(
                    Detection.message_hash == message_hash,
                    Detection.is_scam == True
                )
                .scalar()
            ) or 0
        except Exception as e:
            logger.error(f"Failed to count scam reports: {e}")
            return 0
    
    def get_recent_detections(
        self, 
        limit: int = 100,
        source: Optional[str] = None,
        is_scam: Optional[bool] = None
    ) -> List[Detection]:
        """
        Get recent detections with optional filters
        
        Args:
            limit: Maximum number of records
            source: Filter by source (public/partner)
            is_scam: Filter by scam status
            
        Returns:
            List of detection records
        """
        try:
            query = self.db.query(Detection)
            
            if source:
                query = query.filter(Detection.source == source)
            if is_scam is not None:
                query = query.filter(Detection.is_scam == is_scam)
            
            return (
                query
                .order_by(Detection.created_at.desc())
                .limit(limit)
                .all()
            )
        except Exception as e:
            raise DatabaseError(f"Failed to get recent detections: {str(e)}")
    
    def get_stats_summary(self, days: int = 7) -> Dict[str, int]:
        """
        Get detection statistics summary
        
        Args:
            days: Period in days
            
        Returns:
            Dictionary with stats (total, scam_count, etc.)
        """
        try:
            since = datetime.now(UTC) - timedelta(days=days)
            
            total = self.db.query(func.count(Detection.id)).scalar()
            total_period = (
                self.db.query(func.count(Detection.id))
                .filter(Detection.created_at >= since)
                .scalar()
            )
            scam_count = (
                self.db.query(func.count(Detection.id))
                .filter(Detection.is_scam == True)
                .scalar()
            )
            
            return {
                "total_requests": total or 0,
                "requests_period": total_period or 0,
                "scam_detected": scam_count or 0,
                "safe_messages": (total or 0) - (scam_count or 0),
            }
        except Exception as e:
            raise DatabaseError(f"Failed to get stats summary: {str(e)}")
    
    def get_category_stats(self) -> List[Dict[str, Any]]:
        """
        Get detection count by category
        
        Returns:
            List of dicts with category and count
        """
        try:
            results = (
                self.db.query(
                    Detection.category,
                    func.count(Detection.id).label('count')
                )
                .group_by(Detection.category)
                .order_by(func.count(Detection.id).desc())
                .limit(10)
                .all()
            )
            
            return [
                {"category": r.category, "count": r.count}
                for r in results
            ]
        except Exception as e:
            raise DatabaseError(f"Failed to get category stats: {str(e)}")
    
    def delete_old_records(self, days: int = 30) -> int:
        """
        Delete old detection records (data retention)
        
        Args:
            days: Delete records older than this
            
        Returns:
            Number of deleted records
        """
        try:
            cutoff = datetime.utcnow() - timedelta(days=days)
            deleted = (
                self.db.query(Detection)
                .filter(Detection.created_at < cutoff)
                .delete()
            )
            self.db.commit()
            return deleted
        except Exception as e:
            self.db.rollback()
            raise DatabaseError(f"Failed to delete old records: {str(e)}")
