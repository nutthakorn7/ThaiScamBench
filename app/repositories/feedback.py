"""
Feedback repository

Handles all database operations related to user feedback.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.database import Feedback


class FeedbackRepository(BaseRepository[Feedback]):
    """
    Repository for feedback records
    
    Handles user feedback on detection results.
    """
    
    def __init__(self, db: Session):
        super().__init__(Feedback, db)
    
    def create_feedback(
        self,
        detection_id: str,
        is_correct: bool,
        user_category: Optional[str] = None,
        comment: Optional[str] = None,
        user_ref: Optional[str] = None
    ) -> Feedback:
        """
        Create feedback record
        
        Args:
            detection_id: ID of detection being reviewed (request_id)
            is_correct: Whether detection was correct
            user_category: User's suggested category
            comment: Optional comment
            user_ref: Optional user reference
            
        Returns:
            Created feedback record
        """
        # Map detection_id to request_id (actual field name in DB)
        return self.create(
            request_id=detection_id,  # This is the actual field name!
            feedback_type="correct" if is_correct else "incorrect",
            comment=comment,
            created_at=datetime.utcnow()
        )
    
    def get_by_detection(self, detection_id: str) -> Optional[Feedback]:
        """
        Get feedback for specific detection
        
        Args:
            detection_id: Detection ID (request_id in DB)
            
        Returns:
            Feedback record if exists
        """
        return (
            self.db.query(Feedback)
            .filter(Feedback.request_id == detection_id)  # Use request_id
            .first()
        )
