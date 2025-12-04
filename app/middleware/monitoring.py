"""
Monitoring middleware for production

Tracks API performance, errors, and usage metrics.
"""
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

class MonitoringMiddleware(BaseHTTPMiddleware):
    """
    Monitoring middleware for tracking API performance
    
    Logs:
    - Request path, method, status
    - Response time
    - Errors
    
    Adds X-Process-Time header to responses
    """
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Get request info
        path = request.url.path
        method = request.method
        
        try:
            # Process request
            response: Response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log request
            logger.info(
                "request_processed",
                extra={
                    "path": path,
                    "method": method,
                    "status": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "user_agent": request.headers.get("user-agent", "unknown")
                }
            )
            
            # Add response time header
            response.headers["X-Process-Time"] = f"{duration:.3f}"
            
            return response
            
        except Exception as e:
            # Log error
            duration = time.time() - start_time
            
            logger.error(
                "request_error",
                extra={
                    "path": path,
                    "method": method,
                    "error": str(e),
                    "duration_ms": round(duration * 1000, 2)
                },
                exc_info=True
            )
            
            # Re-raise exception
            raise
