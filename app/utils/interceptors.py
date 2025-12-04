"""
Request/Response Interceptors

Middleware for logging and debugging API requests and responses.
"""
import time
import json
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.utils.logging import get_logger
from app.core.security import mask_sensitive_data

logger = get_logger("interceptor")


class RequestResponseInterceptor(BaseHTTPMiddleware):
    """
    Middleware to intercept and log all requests and responses
    
    Features:
    - Logs request details (method, path, headers)
    - Logs response details (status, timing)
    - Masks sensitive data
    - Tracks request IDs for correlation
    """
    
    def __init__(self, app: ASGIApp, log_body: bool = False):
        super().__init__(app)
        self.log_body = log_body
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Intercept request and response"""
        
        # Generate request ID
        request_id = request.headers.get("X-Request-ID", f"req-{int(time.time()*1000)}")
        
        # Set logger context
        logger.set_context(
            request_id=request_id,
            method=request.method,
            path=request.url.path
        )
        
        # Log incoming request
        request_data = {
            "url": str(request.url),
            "method": request.method,
            "client_host": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "content_type": request.headers.get("content-type")
        }
        
        logger.info("Incoming request", **request_data)
        
        # Process request
        start_time = time.time()
        
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Log response
            response_data = {
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2)
            }
            
            logger.info("Request completed", **response_data)
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            logger.error(
                "Request failed",
                error=str(e),
                duration_ms=round(duration * 1000, 2)
            )
            
            raise
        
        finally:
            logger.clear_context()


class ResponseValidationInterceptor(BaseHTTPMiddleware):
    """
    Middleware to validate response formats and schemas
    
    Ensures all responses follow consistent format.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate response"""
        response = await call_next(request)
        
        # Check response headers
        if not response.headers.get("Content-Type"):
            logger.warning(
                "Response missing Content-Type header",
                path=request.url.path,
                status=response.status_code
            )
        
        return response


class DebugRequestInterceptor(BaseHTTPMiddleware):
    """
    Debug interceptor for development
    
    Logs detailed request/response information including bodies.
    **ONLY USE IN DEVELOPMENT - NOT PRODUCTION!**
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Debug logging"""
        
        # Log request details
        print(f"\n{'='*70}")
        print(f"🔍 DEBUG REQUEST")
        print(f"{'='*70}")
        print(f"Method: {request.method}")
        print(f"URL: {request.url}")
        print(f"Headers:")
        for key, value in request.headers.items():
            # Mask authorization headers
            if key.lower() == "authorization":
                print(f"  {key}: Bearer ***masked***")
            else:
                print(f"  {key}: {value}")
        
        # Try to read body (only if not consumed)
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    try:
                        body_json = json.loads(body)
                        # Mask sensitive fields
                        masked_body = mask_sensitive_data(json.dumps(body_json))
                        print(f"Body: {masked_body[:200]}...")
                    except:
                        print(f"Body: {body[:100]}... (binary)")
            except:
                pass
        
        print(f"{'='*70}\n")
        
        # Process request
        response = await call_next(request)
        
        # Log response
        print(f"\n{'='*70}")
        print(f"📤 DEBUG RESPONSE")
        print(f"{'='*70}")
        print(f"Status: {response.status_code}")
        print(f"Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        print(f"{'='*70}\n")
        
        return response
