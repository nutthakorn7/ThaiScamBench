"""
API v1 router

Combines all v1 endpoints.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import detection, feedback, admin, partner

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(detection.router, tags=["Detection"])
api_router.include_router(feedback.router, tags=["Feedback"])
api_router.include_router(admin.router, tags=["Admin"])
api_router.include_router(partner.router, tags=["Partner"])
