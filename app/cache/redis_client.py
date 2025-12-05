"""Redis client for caching detection results"""
import redis
import json
import logging
from typing import Optional, Any
from app.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis client wrapper for caching"""
    
    def __init__(self):
        """Initialize Redis connection"""
        self._client: Optional[redis.Redis] = None
        self._enabled = settings.cache_enabled
        
        if self._enabled:
            try:
                self._client = redis.from_url(
                    settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                self._client.ping()
                logger.info(f"✅ Redis connected: {settings.redis_url}")
            except Exception as e:
                logger.warning(f"⚠️  Redis connection failed: {e}")
                logger.warning("Caching disabled - continuing without Redis")
                self._enabled = False
                self._client = None
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        if not self._enabled or not self._client:
            return None
        
        try:
            value = self._client.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(value)
            else:
                logger.debug(f"Cache MISS: {key}")
                return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default: from settings)
            
        Returns:
            True if successful, False otherwise
        """
        if not self._enabled or not self._client:
            return False
        
        try:
            ttl = ttl or settings.cache_ttl_seconds
            value_json = json.dumps(value)
            self._client.setex(key, ttl, value_json)
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete key from cache
        
        Args:
            key: Cache key
            
        Returns:
            True if deleted, False otherwise
        """
        if not self._enabled or not self._client:
            return False
        
        try:
            self._client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    def clear(self) -> bool:
        """
        Clear all cache
        
        Returns:
            True if successful, False otherwise
        """
        if not self._enabled or not self._client:
            return False
        
        try:
            self._client.flushdb()
            logger.info("Cache cleared")
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    def get_stats(self) -> dict:
        """
        Get cache statistics
        
        Returns:
            Dict with cache stats
        """
        if not self._enabled or not self._client:
            return {"enabled": False}
        
        try:
            info = self._client.info()
            return {
                "enabled": True,
                "connected": True,
                "used_memory": info.get("used_memory_human", "N/A"),
                "total_keys": self._client.dbsize(),
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "hit_rate": round(
                    info.get("keyspace_hits", 0) / 
                    max(info.get("keyspace_hits", 0) + info.get("keyspace_misses", 0), 1) * 100,
                    2
                )
            }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"enabled": True, "connected": False, "error": str(e)}


# Global Redis client instance
redis_client = RedisClient()
