"""Cache control middleware to prevent browser caching issues"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class CacheControlMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add cache control headers to responses
    
    Prevents browser caching of HTML files in development,
    while allowing caching of static assets (CSS, JS, images)
    """
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Get the content type
        content_type = response.headers.get("content-type", "")
        
        # Don't cache HTML files
        if "text/html" in content_type:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        # Cache static assets for 1 hour in dev, longer in prod
        elif any(asset_type in content_type for asset_type in [
            "text/css", 
            "application/javascript", 
            "image/", 
            "font/"
        ]):
            response.headers["Cache-Control"] = "public, max-age=3600"
        
        return response
