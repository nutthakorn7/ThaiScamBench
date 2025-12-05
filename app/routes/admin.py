"""Admin API endpoints for statistics and monitoring"""
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.admin_auth import verify_admin_token
from app.services.stats_service import get_summary_stats, get_partner_stats, get_category_distribution
from app.models.pagination import PaginationParams, PaginatedResponse
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/stats/summary",
    summary="Get summary statistics",
    description="Admin endpoint for overall system statistics"
)
async def stats_summary(
    days: int = 7,
    _authenticated: bool = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """
    Get summary statistics for the admin dashboard
    
    Args:
        days: Number of days to look back (7, 30, or 365)
        _authenticated: Admin authentication dependency
        db: Database session
        
    Returns:
        Summary statistics including requests, categories, and ratios
    """
    logger.info(f"Admin stats summary requested for {days} days")
    
    # Validate days parameter
    if days not in [7, 30, 365]:
        days = 7
    
    stats = get_summary_stats(db, days=days)
    return stats


@router.get(
    "/stats/partners",
    summary="Get partner statistics",
    description="Admin endpoint for partner usage statistics"
)
async def stats_partners(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    _authenticated: bool = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """
    Get usage statistics per partner with pagination
    
    Args:
        page: Page number (1-indexed)
        page_size: Items per page (max 100)
        _authenticated: Admin authentication dependency
        db: Database session
        
    Returns:
        Paginated partner usage statistics
    """
    logger.info(f"Admin partner stats requested (page={page}, size={page_size})")
    
    pagination = PaginationParams(page=page, page_size=page_size)
    stats = get_partner_stats(db, pagination=pagination)
    return stats


@router.get(
    "/stats/categories",
    summary="Get category distribution",
    description="Admin endpoint for category distribution"
)
async def stats_categories(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    _authenticated: bool = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """
    Get distribution of all scam categories with pagination
    
    Args:
        page: Page number (1-indexed)
        page_size: Items per page (max 100)
        _authenticated: Admin authentication dependency
        db: Database session
        
    Returns:
        Paginated category distribution
    """
    logger.info(f"Admin category stats requested (page={page}, size={page_size})")
    
    pagination = PaginationParams(page=page, page_size=page_size)
    categories = get_category_distribution(db, pagination=pagination)
    return categories


@router.get(
    "/review/uncertain",
    summary="Get Uncertain Cases for Review",
    description="Get detections with medium risk scores (40-60%) and incorrect feedback for model improvement"
)
async def get_uncertain_cases(
    request: Request,
    db: Session = Depends(get_db),
    limit: int = 50,
    include_feedback: bool = True,
    _authenticated: bool = Depends(verify_admin_token)
):
    """
    Get interesting cases for model improvement:
    - Messages with risk_score between 0.4 and 0.6 (uncertain)
    - Messages with 'incorrect' feedback
    
    Args:
        db: Database session
        limit: Maximum number of results
        include_feedback: Include cases with incorrect feedback
        
    Returns:
        List of cases to review
    """
    from sqlalchemy import and_, or_, func
    from app.models.database import Detection, Feedback
    
    # Query for uncertain cases (risk 40-60%)
    uncertain_query = db.query(Detection).filter(
        and_(
            Detection.risk_score >= 0.4,
            Detection.risk_score <= 0.6
        )
    ).order_by(Detection.created_at.desc())
    
    uncertain_cases = uncertain_query.limit(limit // 2).all()
    
    # Query for cases with incorrect feedback
    feedback_cases = []
    if include_feedback:
        feedback_query = db.query(Detection).join(
            Feedback,
            Detection.request_id == Feedback.request_id
        ).filter(
            Feedback.feedback_type == 'incorrect'
        ).order_by(Detection.created_at.desc())
        
        feedback_cases = feedback_query.limit(limit // 2).all()
    
    # Combine and deduplicate
    all_cases = {}
    for case in uncertain_cases + feedback_cases:
        if case.request_id not in all_cases:
            all_cases[case.request_id] = case
    
    # Format results
    results = []
    for detection in list(all_cases.values())[:limit]:
        # Get feedback count for this detection
        feedback_count = db.query(func.count(Feedback.id)).filter(
            Feedback.request_id == detection.request_id,
            Feedback.feedback_type == 'incorrect'
        ).scalar()
        
        results.append({
            "request_id": detection.request_id,
            "created_at": detection.created_at.isoformat(),
            "message_hash": detection.message_hash,
            "is_scam": detection.is_scam,
            "risk_score": detection.risk_score,
            "category": detection.category,
            "model_version": detection.model_version,
            "channel": detection.channel,
            "source": detection.source,
            "incorrect_feedback_count": feedback_count,
            "reason": "uncertain" if 0.4 <= detection.risk_score <= 0.6 else "incorrect_feedback",
            "priority": "high" if feedback_count > 2 else "medium" if feedback_count > 0 else "low"
        })
    
    # Sort by priority and feedback count
    results.sort(key=lambda x: (
        0 if x["priority"] == "high" else 1 if x["priority"] == "medium" else 2,
        -x["incorrect_feedback_count"],
        abs(x["risk_score"] - 0.5)  # Closer to 0.5 = more uncertain
    ))
    
    return {
        "total": len(results),
        "uncertain_count": len([r for r in results if r["reason"] == "uncertain"]),
        "incorrect_feedback_count": len([r for r in results if r["incorrect_feedback_count"] > 0]),
        "cases": results
    }
