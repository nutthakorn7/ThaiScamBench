# 📊 Guide: Achieving 100% Test Coverage

## Current Coverage Analysis

Based on the coverage report, here are the modules that need more tests:

### Low Coverage Areas (<70%)

| Module | Coverage | Missing Tests |
|--------|----------|---------------|
| `app/services/stats_service.py` | 30% | Stats aggregation functions |
| `app/middleware/admin_auth.py` | 35% | Admin authentication |
| `app/middleware/auth.py` | 36% | Partner authentication |
| `app/services/llm_explainer.py` | 40% | LLM prompt functions |
| `app/routes/detection.py` | 47% | Internal detection endpoint |
| `app/services/detection_logger.py` | 50% | Database logging |
| `app/services/partner_service.py` | 51% | Partner CRUD operations |
| `app/routes/admin.py` | 58% | Admin endpoints |
| `app/routes/public.py` | 59% | Public endpoint error cases |
| `app/routes/partner.py` | 60% | Partner endpoint error cases |

---

## Strategy to Reach 100%

### 1. Test Error Paths

**Currently missing:** Exception handling and edge cases

Add tests for:
- Database connection errors
- Invalid input formats
- Rate limit exceeded scenarios
- Authentication failures
- Missing configuration

### 2. Test Middleware

**Add tests for:**
```python
# test_middleware.py
def test_admin_auth_valid_token(client):
    """Test admin auth with valid token"""
    
def test_admin_auth_invalid_token(client):
    """Test admin auth with invalid token"""
    
def test_admin_auth_ip_allowlist(client):
    """Test admin auth with IP allowlist"""
    
def test_partner_auth_valid(client, test_partner):
    """Test partner Bearer token auth"""
    
def test_partner_auth_missing_token(client):
    """Test partner auth without token"""
```

### 3. Test Database Operations

**Add tests for:**
```python
# test_database.py
def test_log_detection_public(test_db):
    """Test logging public detection"""
    
def test_log_detection_partner(test_db, test_partner):
    """Test logging partner detection"""
    
def test_partner_create(test_db):
    """Test creating partner"""
    
def test_partner_update_status(test_db, test_partner):
    """Test updating partner status"""
```

### 4. Test Stats Service

**Add tests for:**
```python
# test_stats.py
def test_get_summary_stats(test_db, test_detection):
    """Test summary stats calculation"""
    
def test_get_partner_stats(test_db, test_partner):
    """Test partner stats aggregation"""
    
def test_get_category_distribution(test_db, test_detection):
    """Test category distribution"""
```

### 5. Test LLM Functions

**Add tests for:**
```python
# test_llm.py
def test_llm_json_parsing_valid():
    """Test JSON parsing with valid response"""
    
def test_llm_json_parsing_invalid():
    """Test JSON parsing with invalid response"""
    
def test_llm_prompt_template():
    """Test prompt template generation"""
```

---

## Quick Wins for Coverage

### Add More API Integration Tests

```python
# test_api.py additions

def test_public_detection_all_categories(client):
    """Test detection for each category"""
    test_messages = {
        "fake_officer": "ตำรวจแจ้ง...",
        "parcel_scam": "พัสดุค้างชำระ...",
        # ... all 8 categories
    }
    for category, message in test_messages.items():
        response = client.post("/v1/public/detect/text", 
            json={"message": message})
        assert response.status_code == 200

def test_public_detection_no_channel(client):
    """Test detection without channel"""
    
def test_partner_detection_threshold_difference(client, test_partner):
    """Test partner uses different threshold"""
```

### Add Negative Test Cases

```python
def test_detection_invalid_json(client):
    """Test with malformed JSON"""
    
def test_detection_missing_required_field(client):
    """Test with missing required fields"""
    
def test_detection_wrong_content_type(client):
    """Test with wrong content type"""
```

---

## Running Coverage Analysis

### 1. Generate Coverage Report

```bash
# Run tests with coverage
pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

# Open HTML report
open htmlcov/index.html  # macOS
# or
xdg-open htmlcov/index.html  # Linux
```

### 2. See Uncovered Lines

```bash
# Show missing lines in terminal
pytest tests/ --cov=app --cov-report=term-missing

# Example output:
# app/routes/public.py    59%   44-48, 82-92
#                                ^^^^^^^^^^^^
#                                Lines not covered
```

### 3. Focus on One Module at a Time

```bash
# Test only specific module
pytest tests/test_api.py --cov=app/routes/public.py --cov-report=term-missing
```

---

## Coverage Best Practices

### ✅ DO:

1. **Test Happy Paths First**
   - Normal successful operations
   - Expected user workflows

2. **Then Test Error Paths**
   - Invalid inputs
   - Edge cases
   - Exception handling

3. **Test Edge Cases**
   - Empty inputs
   - Maximum lengths
   - Boundary conditions

4. **Test Integration Points**
   - Database operations
   - API calls
   - Authentication

### ❌ DON'T:

1. **Don't Chase 100% Just for Metrics**
   - Some code is hard to test (config loading, etc.)
   - Focus on critical business logic first

2. **Don't Test Third-Party Libraries**
   - FastAPI internals
   - SQLAlchemy
   - External APIs

3. **Don't Skip Error Cases**
   - Error handling is critical
   - Often where bugs hide

---

## Practical Steps to 100%

### Step 1: Identify Uncovered Lines

```bash
pytest tests/ --cov=app --cov-report=term-missing | grep -A2 "TOTAL"
```

### Step 2: Create Tests for Each Module

Create one test file per module that needs coverage:

- `tests/test_stats_service.py` (for stats_service.py)
- `tests/test_admin_auth.py` (for admin_auth.py)
- `tests/test_auth.py` (for auth.py)
- `tests/test_llm.py` (for llm_explainer.py)
- `tests/test_detection_logger.py` (for detection_logger.py)

### Step 3: Write Tests for Uncovered Lines

Look at the coverage report, find uncovered lines, and write tests that execute them.

### Step 4: Mock External Dependencies

For hard-to-test code:

```python
from unittest.mock import Mock, patch

def test_with_database_error(client):
    """Test handling of database errors"""
    with patch('app.database.get_db') as mock_db:
        mock_db.side_effect = Exception("DB Error")
        response = client.post("/v1/public/detect/text", 
            json={"message": "test"})
        # Verify error handling
```

---

## Target Coverage Goals

**Realistic Goals:**
- Critical business logic: 95-100%
- API endpoints: 90-95%
- Middleware: 85-90%
- Utilities: 80-85%
- Config/setup: 60-70%

**Overall Target:** 85-90% is excellent for most production systems

**100% Coverage:** Possible but may require excessive effort for diminishing returns

---

## Next Steps

1. **Run coverage report:** `pytest --cov=app --cov-report=html`
2. **Open HTML report:** See which lines need tests
3. **Add tests module by module:** Start with lowest coverage
4. **Focus on critical paths:** Business logic first
5. **Re-run coverage:** Track progress

---

## Example: Complete Test for Stats Service

```python
# tests/test_stats_service_complete.py
import pytest
from datetime import datetime, timedelta
from app.services.stats_service import (
    get_summary_stats, 
    get_partner_stats,
    get_category_distribution
)

class TestStatsService:
    
    def test_summary_stats_empty_db(self, test_db):
        """Test summary stats with no data"""
        stats = get_summary_stats(test_db, days=7)
        assert stats['total_requests'] == 0
        assert stats['scam_ratio'] == 0.0
        assert len(stats['requests_per_day']) == 0
    
    def test_summary_stats_with_data(self, test_db, test_detection):
        """Test summary stats with detection data"""
        stats = get_summary_stats(test_db, days=7)
        assert stats['total_requests'] >= 1
        assert 'scam_ratio' in stats
        assert 'top_categories' in stats
    
    def test_partner_stats(self, test_db, test_partner, test_detection):
        """Test partner statistics"""
        stats = get_partner_stats(test_db)
        assert stats['total_partners'] >= 1
        assert len(stats['partners']) >= 1
        partner = stats['partners'][0]
        assert 'name' in partner
        assert 'total_requests' in partner
    
    def test_category_distribution(self, test_db, test_detection):
        """Test category distribution"""
        dist = get_category_distribution(test_db)
        assert 'categories' in dist
        assert isinstance(dist['categories'], list)
```

---

## 🎯 Summary

**To reach 100% coverage:**

1. ✅ Run `pytest --cov=app --cov-report=html`
2. ✅ Identify uncovered lines in HTML report
3. ✅ Add tests for uncovered code paths
4. ✅ Focus on error handling and edge cases
5. ✅ Mock external dependencies
6. ✅ Test all API endpoints thoroughly
7. ✅ Re-run coverage to verify

**Realistic target: 85-90% overall coverage**  
**Critical modules: 95-100% coverage**
