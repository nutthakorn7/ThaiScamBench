"""
Unit tests for Redis caching utilities
"""
import pytest
from unittest.mock import patch, MagicMock
from app.cache import redis_client, generate_cache_key

class TestRedisCache:
    """Test cases for Redis cache wrapper"""

    @patch("redis.Redis")
    def test_redis_connection_check(self, mock_redis_cls):
        """Test connection check"""
        # Mock successful ping
        mock_instance = mock_redis_cls.return_value
        mock_instance.ping.return_value = True
        mock_instance.info.return_value = {"keyspace_hits": 0, "keyspace_misses": 0}
        
        # We need to re-initialize or patch the client instance in app.cache
        # Since redis_client is already initialized, we patch the underlying client
        with patch.object(redis_client, '_client', mock_instance):
            with patch.object(redis_client, '_enabled', True):
                stats = redis_client.get_stats()
                assert stats["enabled"] is True
                assert stats["connected"] is True

    @patch("redis.Redis")
    def test_set_get(self, mock_redis_cls):
        """Test set and get operations"""
        mock_instance = mock_redis_cls.return_value
        
        # Mock get to return serialized data
        test_data = {"is_scam": True, "risk_score": 0.85}
        import json
        mock_instance.get.return_value = json.dumps(test_data).encode('utf-8')
        
        with patch.object(redis_client, '_client', mock_instance):
            with patch.object(redis_client, '_enabled', True):
                # Test Set
                redis_client.set("test:key", test_data, ttl=60)
                mock_instance.setex.assert_called()
                
                # Test Get
                result = redis_client.get("test:key")
                assert result == test_data

    def test_generate_cache_key(self):
        """Test cache key generation"""
        message = "test message"
        key = generate_cache_key(message)
        assert key is not None
        assert "detection" in key
        assert len(key) > 10

    @patch("redis.Redis")
    def test_delete(self, mock_redis_cls):
        """Test delete operation"""
        mock_instance = mock_redis_cls.return_value
        
        with patch.object(redis_client, '_client', mock_instance):
            with patch.object(redis_client, '_enabled', True):
                redis_client.delete("test:key")
                mock_instance.delete.assert_called_with("test:key")

    @patch("redis.Redis")
    def test_stats(self, mock_redis_cls):
        """Test stats retrieval"""
        mock_instance = mock_redis_cls.return_value
        mock_instance.dbsize.return_value = 100
        mock_instance.info.return_value = {
            "used_memory_human": "1M",
            "keyspace_hits": 50,
            "keyspace_misses": 10
        }
        
        with patch.object(redis_client, '_client', mock_instance):
            with patch.object(redis_client, '_enabled', True):
                stats = redis_client.get_stats()
                assert stats["total_keys"] == 100
                assert stats["hits"] == 50
                assert stats["misses"] == 10
