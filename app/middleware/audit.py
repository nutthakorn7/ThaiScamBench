"""Audit logging middleware"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.models.audit_log import AuditLog
from app.database import SessionLocal
from app.config import settings
import hashlib
import time
import logging

logger = logging.getLogger(__name__)


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests without PII"""
    
    async def dispatch(self, request: Request, call_next):
        """
        Log API request and response
        
        Args:
            request: FastAPI Request
            call_next: Next middleware/endpoint
            
        Returns:
            Response from endpoint
        """
        if not settings.audit_log_enabled:
            return await call_next(request)
        
        # Start timer
        start_time = time.time()
        
        # Extract request info
        endpoint = request.url.path
        method = request.method
        user_agent = request.headers.get("user-agent", "")[:255]
        
        # Hash IP address (no PII)
        client_ip = request.client.host if request.client else "unknown"
        ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()
        
        # Get partner ID if authenticated
        partner_id = None
        if hasattr(request.state, "partner"):
            partner_id = request.state.partner.id
        
        # Execute request
        response = await call_next(request)
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Get request ID if available
        request_id = getattr(request.state, "request_id", None)
        
        # Log to database (async - don't block response)
        try:
            db = SessionLocal()
            audit_log = AuditLog(
                endpoint=endpoint,
                method=method,
                status_code=response.status_code,
                ip_hash=ip_hash,
                user_agent=user_agent,
                partner_id=partner_id,
                request_id=request_id,
                response_time_ms=response_time_ms
            )
            db.add(audit_log)
            db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Failed to log audit entry: {e}")
            # Don't fail the request if audit logging fails
        
        return response


def hash_ip(ip: str) -> str:
    """
    Hash IP address for privacy
    
    Args:
        ip: IP address
        
    Returns:
        SHA256 hash of IP
    """
    return hashlib.sha256(ip.encode()).hexdigest()
