"""Custom exceptions for Thai Scam Detection API"""


class ThaiScamAPIException(Exception):
    """Base exception for all API errors"""
    pass


class ValidationError(ThaiScamAPIException):
    """Raised when input validation fails"""
    pass


class CacheError(ThaiScamAPIException):
    """Raised when cache operation fails"""
    pass


class DatabaseError(ThaiScamAPIException):
    """Raised when database operation fails"""
    pass


class AuthenticationError(ThaiScamAPIException):
    """Raised when authentication fails"""
    pass


class RateLimitError(ThaiScamAPIException):
    """Raised when rate limit is exceeded"""
    pass
