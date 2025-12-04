"""
Core exceptions for ThaiScamBench

All custom exceptions inherit from ThaiScamBenchException
for consistent error handling across the application.
"""

class ThaiScamBenchException(Exception):
    """Base exception for all ThaiScamBench errors"""
    
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(ThaiScamBenchException):
    """Input validation failed"""
    pass


class AuthenticationError(ThaiScamBenchException):
    """Authentication failed"""
    pass


class AuthorizationError(ThaiScamBenchException):
    """Authorization failed (user not allowed)"""
    pass


class RateLimitError(ThaiScamBenchException):
    """Rate limit exceeded"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = None):
        super().__init__(message)
        self.retry_after = retry_after


class ResourceNotFoundError(ThaiScamBenchException):
    """Requested resource not found"""
    pass


class DatabaseError(ThaiScamBenchException):
    """Database operation failed"""
    pass


class ServiceError(ThaiScamBenchException):
    """External service error"""
    pass


class ConfigurationError(ThaiScamBenchException):
    """Configuration error"""
    pass


class ModelError(ThaiScamBenchException):
    """ML model prediction error"""
    pass
