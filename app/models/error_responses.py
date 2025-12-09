"""Standardized error response models"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from enum import Enum


class ErrorCode(str, Enum):
    """Standard error codes"""
    # Client errors (4xx)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE"
    SUSPICIOUS_CONTENT = "SUSPICIOUS_CONTENT"
    
    # Server errors (5xx)
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    DATABASE_ERROR = "DATABASE_ERROR"


class ErrorDetail(BaseModel):
    """Error detail structure"""
    code: ErrorCode = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "code": "VALIDATION_ERROR",
            "message": "Message too long. Maximum 5000 characters allowed",
            "details": {
                "field": "message",
                "max_length": 5000,
                "actual_length": 6000
            }
        }
    })


class ErrorResponse(BaseModel):
    """Standardized error response"""
    error: ErrorDetail


# Error message templates
ERROR_MESSAGES = {
    ErrorCode.VALIDATION_ERROR: "Request validation failed",
    ErrorCode.AUTHENTICATION_REQUIRED: "Authentication required. Please provide valid credentials",
    ErrorCode.INVALID_CREDENTIALS: "Invalid credentials provided",
    ErrorCode.FORBIDDEN: "You don't have permission to access this resource",
    ErrorCode.NOT_FOUND: "The requested resource was not found",
    ErrorCode.RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later",
    ErrorCode.PAYLOAD_TOO_LARGE: "Request payload too large",
    ErrorCode.SUSPICIOUS_CONTENT: "Suspicious content detected. Please provide plain text only",
    ErrorCode.INTERNAL_ERROR: "An internal error occurred. Please try again later",
    ErrorCode.SERVICE_UNAVAILABLE: "Service temporarily unavailable",
    ErrorCode.DATABASE_ERROR: "Database operation failed",
}


def create_error_response(
    code: ErrorCode,
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> ErrorResponse:
    """
    Create standardized error response
    
    Args:
        code: Error code
        message: Custom message (uses default if None)
        details: Additional error details
        
    Returns:
        ErrorResponse object
    """
    if message is None:
        message = ERROR_MESSAGES.get(code, "An error occurred")
    
    return ErrorResponse(
        error=ErrorDetail(
            code=code,
            message=message,
            details=details
        )
    )
