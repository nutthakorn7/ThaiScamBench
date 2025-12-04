"""
Security utilities

Provides functions for input sanitization, validation,
and security-related operations.
"""
import hashlib
import re
from typing import Optional


def sanitize_message(text: str, max_length: int = 10000) -> str:
    """
    Sanitize user input to prevent injection attacks
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text
        
    Raises:
        ValueError: If text is empty or too long
    """
    if not text or not text.strip():
        raise ValueError("Message cannot be empty")
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Limit length
    if len(text) > max_length:
        raise ValueError(f"Message too long (max {max_length} chars)")
    
    # Remove control characters except newline/tab
    text = ''.join(c for c in text if c.isprintable() or c in '\n\t')
    
    return text.strip()


def hash_message(message: str) -> str:
    """
    Create SHA-256 hash of message for PDPA compliance
    
    Args:
        message: Original message
        
    Returns:
        SHA-256 hash hex string
    """
    return hashlib.sha256(message.encode('utf-8')).hexdigest()


def sanitize_phone_number(phone: str) -> Optional[str]:
    """
    Sanitize phone number (for logging/display only)
    
    Args:
        phone: Phone number
        
    Returns:
        Sanitized phone (08X-XXX-XXXX) or None if not a phone
    """
    # Match Thai phone numbers (08X-XXX-XXXX or similar)
    pattern = r'0\d{1,2}[-.\s]?\d{3}[-.\s]?\d{4}'
    if re.match(pattern, phone):
        return "08X-XXX-XXXX"
    return None


def mask_sensitive_data(text: str) -> str:
    """
    Mask sensitive data in text for logging
    
    Args:
        text: Text potentially containing sensitive data
        
    Returns:
        Text with masked sensitive data
    """
    # Mask phone numbers
    text = re.sub(r'0\d{1,2}[-.\s]?\d{3}[-.\s]?\d{4}', '08X-XXX-XXXX', text)
    
    # Mask URLs
    text = re.sub(r'https?://[^\s]+', 'https://[MASKED_URL]', text)
    
    # Mask email
    text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[MASKED_EMAIL]', text)
    
    return text
