"""Additional tests for stats service to improve coverage"""
import pytest
from datetime import datetime, timedelta
from app.services.stats_service import (
    get_summary_stats,
    get_partner_stats,
    get_category_distribution
)
from app.models.database import Detection, Partner, DetectionSource


class TestStatsService:
    """Test cases for statistics service"""
    
    def test_summary_stats_empty_database(self, test_db):
        """Test summary stats with empty database"""
        stats = get_summary_stats(test_db, days=7)
        
        assert stats['total_requests'] == 0
        assert stats['range_requests'] == 0
        assert stats['scam_count'] == 0
        assert stats['scam_ratio'] == 0.0
        assert stats['public_requests'] == 0
        assert stats['partner_requests'] == 0
        assert len(stats['requests_per_day']) == 0
        assert len(stats['top_categories']) == 0
    
    def test_summary_stats_with_detections(self, test_db):
        """Test summary stats with multiple detections"""
        import uuid
        
        # Create test detections
        detections = [
            Detection(
                request_id=str(uuid.uuid4()),
                source=DetectionSource.public,
                channel="SMS",
                message_hash="hash1",
                is_scam=True,
                category="parcel_scam",
                risk_score=0.85,
                model_version="v1",
                llm_version="v1"
            ),
            Detection(
                request_id=str(uuid.uuid4()),
                source=DetectionSource.public,
                channel="LINE",
                message_hash="hash2",
                is_scam=False,
                category="normal",
                risk_score=0.1,
                model_version="v1",
                llm_version="v1"
            ),
        ]
        for det in detections:
            test_db.add(det)
        test_db.commit()
        
        stats = get_summary_stats(test_db, days=7)
        
        assert stats['total_requests'] == 2
        assert stats['scam_count'] == 1
        assert stats['scam_ratio'] == 0.5
        assert stats['public_requests'] == 2
        assert stats['partner_requests'] == 0
    
    def test_summary_stats_different_timeframes(self, test_db):
        """Test summary stats with different time ranges"""
        import uuid
        
        # Add a detection
        det = Detection(
            request_id=str(uuid.uuid4()),
            source=DetectionSource.public,
            message_hash="hash",
            is_scam=True,
            category="fake_officer",
            risk_score=0.9,
            model_version="v1",
            llm_version="v1"
        )
        test_db.add(det)
        test_db.commit()
        
        # Test different timeframes
        stats_7 = get_summary_stats(test_db, days=7)
        stats_30 = get_summary_stats(test_db, days=30)
        stats_365 = get_summary_stats(test_db, days=365)
        
        assert stats_7['range_requests'] == 1
        assert stats_30['range_requests'] == 1
        assert stats_365['range_requests'] == 1
    
    def test_partner_stats_empty(self, test_db):
        """Test partner stats with no partners"""
        stats = get_partner_stats(test_db)
        
        assert stats['total_partners'] == 0
        assert stats['active_partners'] == 0
        assert len(stats['partners']) == 0
    
    def test_partner_stats_with_partners(self, test_db, test_partner_with_key):
        """Test partner stats with partners"""
        partner, _ = test_partner_with_key
        
        stats = get_partner_stats(test_db)
        
        assert stats['total_partners'] >= 1
        assert stats['active_partners'] >= 1
        assert len(stats['partners']) >= 1
        
        partner_stat = stats['partners'][0]
        assert 'id' in partner_stat
        assert 'name' in partner_stat
        assert 'status' in partner_stat
        assert 'total_requests' in partner_stat
    
    def test_category_distribution_empty(self, test_db):
        """Test category distribution with no detections"""
        result = get_category_distribution(test_db)
        
        # get_category_distribution returns a dict with 'categories' key
        assert isinstance(result, dict)
        assert "categories" in result
        assert len(result["categories"]) == 0
    
    def test_category_distribution_with_data(self, test_db):
        """Test category distribution with detections"""
        import uuid
        
        # Create detections with different categories
        categories = ["parcel_scam", "loan_scam", "fake_officer"]
        for cat in categories:
            det = Detection(
                request_id=str(uuid.uuid4()),
                source=DetectionSource.public,
                message_hash=f"hash_{cat}",
                is_scam=True,
                category=cat,
                risk_score=0.8,
                model_version="v1",
                llm_version="v1"
            )
            test_db.add(det)
        test_db.commit()
        
        result = get_category_distribution(test_db)
        
        # Result is a dict
        assert isinstance(result, dict)
        assert "categories" in result
        assert len(result["categories"]) >= 3
        
        # Check category counts
        category_names = [c['category'] for c in result["categories"]]
        assert "parcel_scam" in category_names
        assert "loan_scam" in category_names
        assert "fake_officer" in category_names
