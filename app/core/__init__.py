"""
Core module initialization
"""
from app.core.exceptions import (
    ThaiScamBenchException,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    ResourceNotFoundError,
    DatabaseError,
    ServiceError,
    ConfigurationError,
    ModelError,
)

__all__ = [
    "ThaiScamBenchException",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "RateLimitError",
    "ResourceNotFoundError",
    "DatabaseError",
    "ServiceError",
    "ConfigurationError",
    "ModelError",
]
