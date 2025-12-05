"""Common validation utilities"""
from typing import Optional
from app.exceptions import ValidationError
from app.middleware.security import validate_message_content as _validate_xss


def validate_message(
    message: str,
    max_length: int = 5000,
    min_length: int = 1
) -> None:
    """
    Validate message content and length.
    
    Args:
        message: Message text to validate
        max_length: Maximum allowed length
        min_length: Minimum allowed length
        
    Raises:
        ValidationError: If validation fails
    """
    if not message or not message.strip():
        raise ValidationError("Message cannot be empty")
    
    if len(message) < min_length:
        raise ValidationError(f"Message too short (min: {min_length})")
    
    if len(message) > max_length:
        raise ValidationError(f"Message too long (max: {max_length})")
    
    # XSS/injection checks
    _validate_xss(message)


def validate_pagination_params(
    page: int,
    page_size: int,
    max_page_size: int = 100
) -> None:
    """
    Validate pagination parameters.
    
    Args:
        page: Page number (1-indexed)
        page_size: Items per page
        max_page_size: Maximum allowed page size
        
    Raises:
        ValidationError: If parameters are invalid
    """
    if page < 1:
        raise ValidationError("Page must be >= 1")
    
    if page_size < 1:
        raise ValidationError("Page size must be >= 1")
    
    if page_size > max_page_size:
        raise ValidationError(f"Page size too large (max: {max_page_size})")
