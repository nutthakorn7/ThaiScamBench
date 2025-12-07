"""Statistics service for admin dashboard"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.database import Detection, Partner, DetectionSource
from app.models.pagination import PaginationParams, PaginatedResponse, paginate_query
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


def get_summary_stats(db: Session, days: int = 7) -> Dict[str, Any]:
    """
    Get summary statistics for the dashboard
    
    Args:
        db: Database session
        days: Number of days to look back (7, 30, or 365)
        
    Returns:
        Dictionary with summary stats
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Total requests
    total_requests = db.query(func.count(Detection.id)).scalar() or 0
    
    # Requests in date range
    range_requests = db.query(func.count(Detection.id)).filter(
        Detection.created_at >= start_date
    ).scalar() or 0
    
    # Scam ratio
    scam_count = db.query(func.count(Detection.id)).filter(
        Detection.is_scam == True
    ).scalar() or 0
    scam_ratio = scam_count / total_requests if total_requests > 0 else 0
    
    # Requests per day
    requests_per_day = db.query(
        func.date(Detection.created_at).label('date'),
        func.count(Detection.id).label('count')
    ).filter(
        Detection.created_at >= start_date
    ).group_by(
        func.date(Detection.created_at)
    ).order_by(
        func.date(Detection.created_at)
    ).all()
    
    # Top 5 categories
    top_categories = db.query(
        Detection.category,
        func.count(Detection.id).label('count')
    ).group_by(
        Detection.category
    ).order_by(
        desc('count')
    ).limit(5).all()
    
    # Source breakdown
    public_count = db.query(func.count(Detection.id)).filter(
        Detection.source == DetectionSource.public.value
    ).scalar() or 0
    partner_count = db.query(func.count(Detection.id)).filter(
        Detection.source == DetectionSource.partner.value
    ).scalar() or 0
    
    return {
        "total_requests": total_requests,
        "range_requests": range_requests,
        "scam_count": scam_count,
        "scam_ratio": round(scam_ratio, 3),
        "public_requests": public_count,
        "partner_requests": partner_count,
        "requests_per_day": [
            {
                "date": str(row.date),
                "count": row.count
            }
            for row in requests_per_day
        ],
        "top_categories": [
            {
                "category": row.category,
                "count": row.count
            }
            for row in top_categories
        ]
    }


def get_partner_stats(db: Session, pagination: Optional[PaginationParams] = None) -> Dict[str, Any]:
    """
    Get usage statistics per partner with pagination
    
    Args:
        db: Database session
        pagination: Optional pagination parameters
        
    Returns:
        Dictionary with partner stats (paginated if pagination provided)
    """
    # Get all partners
    partners_query = db.query(Partner)
    
    # Apply pagination if provided
    if pagination:
        partners, total_partners = paginate_query(partners_query, pagination)
    else:
        partners = partners_query.all()
        total_partners = len(partners)
    
    partner_stats = []
    
    for partner in partners:
        # Total requests
        total_requests = db.query(func.count(Detection.id)).filter(
            Detection.partner_id == partner.id
        ).scalar() or 0
        
        # Scam count
        scam_count = db.query(func.count(Detection.id)).filter(
            Detection.partner_id == partner.id,
            Detection.is_scam == True
        ).scalar() or 0
        
        # Average risk score
        avg_risk = db.query(func.avg(Detection.risk_score)).filter(
            Detection.partner_id == partner.id
        ).scalar() or 0
        
        # Scam ratio
        scam_ratio = scam_count / total_requests if total_requests > 0 else 0
        
        partner_stats.append({
            "id": partner.id,
            "name": partner.name,
            "status": partner.status,
            "rate_limit": partner.rate_limit_per_min,
            "total_requests": total_requests,
            "scam_count": scam_count,
            "scam_ratio": round(scam_ratio, 3),
            "avg_risk_score": round(float(avg_risk), 3)
        })
    
    # Sort by total requests descending
    partner_stats.sort(key=lambda x: x['total_requests'], reverse=True)
    
    # All active partners count
    all_partners_count = db.query(func.count(Partner.id)).scalar() or 0
    active_partners_count = db.query(func.count(Partner.id)).filter(Partner.status == 'active').scalar() or 0
    
    if pagination:
        return PaginatedResponse.create(
            data=partner_stats,
            total=total_partners,
            page=pagination.page,
            page_size=pagination.page_size
        ).model_dump()
    else:
        return {
            "total_partners": all_partners_count,
            "active_partners": active_partners_count,
            "partners": partner_stats
        }


def get_category_distribution(db: Session, pagination: Optional[PaginationParams] = None) -> Dict[str, Any]:
    """
    Get distribution of all categories with pagination
    
    Args:
        db: Database session
        pagination: Optional pagination parameters
        
    Returns:
        Category distribution (paginated if pagination provided)
    """
    categories_query = db.query(
        Detection.category,
        func.count(Detection.id).label('count')
    ).group_by(
        Detection.category
    ).order_by(
        desc('count')
    )
    
    if pagination:
        # Count total  categories
        total = db.query(func.count(func.distinct(Detection.category))).scalar() or 0
        
        # Apply pagination
        categories = categories_query.offset(pagination.offset).limit(pagination.limit).all()
        
        category_data = [
            {
                "category": row.category,
                "count": row.count
            }
            for row in categories
        ]
        
        return PaginatedResponse.create(
            data=category_data,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size
        ).model_dump()
    else:
        categories = categories_query.all()
        return {
            "categories": [
                {
                    "category": row.category,
                    "count": row.count
                }
                for row in categories
            ]
        }


def get_recent_activity(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent detection activity
    
    Args:
        db: Database session
        limit: Number of items to return
        
    Returns:
        List of recent activities
    """
    recent_detections = db.query(Detection).order_by(
        desc(Detection.created_at)
    ).limit(limit).all()
    
    return [
        {
            "id": detection.id,
            "type": "scam" if detection.is_scam else "safe",
            "message": detection.message[:50] + "..." if len(detection.message) > 50 else detection.message,
            "time": detection.created_at.isoformat(),
            "location": "Thailand", # Placeholder until geo-ip is implemented
            "source": detection.source
        }
        for detection in recent_detections
    ]
