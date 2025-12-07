"""Security middleware for input validation and sanitization"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import re
import logging

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Security middleware for validating and sanitizing requests
    """
    
    # Maximum message length
    MAX_MESSAGE_LENGTH = 5000
    
    # Blocked patterns (suspicious content)
    BLOCKED_PATTERNS = [
        r'<script[^>]*>.*?</script>',  # Script tags
        r'javascript:',  # JavaScript protocol
        r'on\w+\s*=',  # Event handlers (onclick, onload, etc.)
        r'eval\s*\(',  # eval() calls
        r'exec\s*\(',  # exec() calls
        r'<iframe',  # iframes
        r'<object',  # objects
        r'<embed',  # embeds
    ]
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request through security checks
        
        Args:
            request: FastAPI request
            call_next: Next middleware/handler
            
        Returns:
            Response from next handler
        """
        # Skip security checks for certain paths
        skip_paths = ['/health', '/docs', '/openapi.json', '/admin/']
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        # Check content length header
        content_length = request.headers.get('content-length')
        if content_length and int(content_length) > 10000000:  # 10MB limit
            logger.warning(f"Request too large: {content_length} bytes from {request.client.host}")
            raise HTTPException(
                status_code=413,
                detail="Request payload too large"
            )
        
        # Proceed to next handler
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response


def validate_message_content(message: str) -> None:
    """
    Validate and sanitize message content
    
    Args:
        message: Message text to validate
        
    Raises:
        HTTPException: If validation fails
    """
    # Check message length
    if len(message) > SecurityMiddleware.MAX_MESSAGE_LENGTH:
        logger.warning(f"Message too long: {len(message)} characters")
        raise HTTPException(
            status_code=400,
            detail=f"Message too long. Maximum {SecurityMiddleware.MAX_MESSAGE_LENGTH} characters allowed"
        )
    
    # Check for empty message
    if not message or not message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )
    
    # Check for suspicious patterns
    for pattern in SecurityMiddleware.BLOCKED_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE | re.DOTALL):
            logger.warning(f"Suspicious content detected: pattern={pattern}")
            raise HTTPException(
                status_code=400,
                detail="Suspicious content detected. Please provide plain text only"
            )
    
    logger.debug(f"Message validation passed: {len(message)} characters")


def sanitize_input(text: str) -> str:
    """
    Sanitize user input by removing potentially harmful content
    
    Args:
        text: Input text
        
    Returns:
        Sanitized text
    """
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Strip excessive whitespace
    text = ' '.join(text.split())
    
    # Remove common XSS patterns
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    
    return text
