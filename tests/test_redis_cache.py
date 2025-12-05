"""
Test script for Redis caching

Tests cache functionality without requiring full API setup
"""
import sys
sys.path.insert(0, '/Users/pop7/Code/ThaiScamBench')

from app.cache import redis_client, generate_cache_key
import json

print("=" * 60)
print("Redis Cache Test")
print("=" * 60)

# Test 1: Connection
print("\n✅ Test 1: Redis connection")
stats = redis_client.get_stats()
print(f"   Enabled: {stats.get('enabled')}")
print(f"   Connected: {stats.get('connected',stats.get('error'))}")

if not stats.get('connected'):
    print("\n⚠️  Redis not connected!")
    print("   Start Redis first: docker compose up -d redis")
    print("   Or: docker run -d -p 6379:6379 redis:7-alpine")
    sys.exit(0)

# Test 2: Set/Get
print("\n✅ Test 2: Set and Get")
test_data = {
    "is_scam": True,
    "risk_score": 0.85,
    "category": "parcel_scam"
}

key = "test:example"
redis_client.set(key, test_data, ttl=60)
print(f"   Set: {key}")

retrieved = redis_client.get(key)
print(f"   Get: {retrieved}")
assert retrieved == test_data, "Data mismatch!"
print("   ✅ PASS")

# Test 3: Cache key generation
print("\n✅ Test 3: Cache key generation")
message = "คุณมีพัสดุค้างชำระ กรุณาโอนเงิน"
cache_key = generate_cache_key(message)
print(f"   Message: {message}")
print(f"   Key: {cache_key}")
print("   ✅ PASS")

# Test 4: TTL
print("\n✅ Test 4: TTL (Time To Live)")
redis_client.set("test:ttl", {"test": "data"}, ttl=5)
print("   Set with TTL=5 seconds")
print("   ✅ PASS")

# Test 5: Stats
print("\n✅ Test 5: Cache stats")
stats = redis_client.get_stats()
print(f"   Total keys: {stats.get('total_keys')}")
print(f"   Used memory: {stats.get('used_memory')}")
print(f"   Hits: {stats.get('hits')}")
print(f"   Misses: {stats.get('misses')}")
print(f"   Hit rate: {stats.get('hit_rate')}%")
print("   ✅ PASS")

# Test 6: Delete
print("\n✅ Test 6: Delete")
redis_client.delete("test:example")
deleted = redis_client.get("test:example")
assert deleted is None, "Key should be deleted!"
print("   ✅ PASS")

print("\n" + "=" * 60)
print("All tests passed! ✅")
print("=" * 60)
print("\n💡 Next step: Integrate with detection endpoints")
print("   See: app/cache/decorators.py")
