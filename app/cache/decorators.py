"""Cache decorators for detection endpoints"""
import hashlib
import functools
from typing import Callable
from app.cache.redis_client import redis_client
import logging

logger = logging.getLogger(__name__)


def generate_cache_key(message: str, prefix: str = "detection") -> str:
    """
    Generate cache key from message
    
    Args:
        message: Message text
        prefix: Key prefix
        
    Returns:
        Cache key (e.g., "detection:abc123...")
    """
    message_hash = hashlib.sha256(message.encode()).hexdigest()
    return f"{prefix}:{message_hash}"


def cache_detection(ttl: int = None):
    """
    Decorator to cache detection results
    
    Usage:
        @cache_detection(ttl=3600)
        async def detect_text(...):
            ...
    
    Args:
        ttl: Time to live in seconds (optional)
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract message from request
            request = kwargs.get('request') or (args[0] if args else None)
            if not request or not hasattr(request, 'message'):
                # No message found, skip caching
                return await func(*args, **kwargs)
            
            message = request.message
            cache_key = generate_cache_key(message)
            
            # Try to get from cache
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info(f"✅ Cache hit for message hash: {cache_key}")
                return cached_result
            
            # Cache miss - execute function
            logger.info(f"⚠️  Cache miss for message hash: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Cache the result (convert Pydantic model to dict if needed)
            if hasattr(result, 'model_dump'):
                cache_value = result.model_dump()
            elif hasattr(result, 'dict'):
                cache_value = result.dict()
            else:
                cache_value = result
            
            redis_client.set(cache_key, cache_value, ttl=ttl)
            
            return result
        
        return wrapper
    return decorator
