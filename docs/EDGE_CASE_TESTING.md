# 🧪 Edge Case Testing Plan - 3-Layer Slip Detection

## 📋 Overview

Comprehensive testing plan to validate the robustness of the 3-Layer Detection System across edge cases, unusual inputs, and boundary conditions.

**Test Date:** 2025-12-09  
**System:** 3-Layer Detection v1.1  
**Tester:** QA Team

---

## 🎯 Test Categories

### 1. Fake/Edited Slips 🔴
### 2. Low Quality Images 📷
### 3. Non-Slip Images 🖼️
### 4. Boundary Conditions ⚠️
### 5. Malicious Inputs 🚨

---

## Test Case 1: Fake/Edited Slips

### 1.1 Amount Manipulation
**Input:** Real slip with amount digitally altered  
**Expected Result:**
- `is_scam`: true
- `risk_score`: > 0.7
- `visual_analysis.is_suspicious`: true (if ELA detects editing)
- `slip_verification.trust_score`: < 0.5

**Test Steps:**
1. Upload edited slip image
2. Check visual forensics detects manipulation
3. Verify high risk score
4. Check advice warns about suspicious content

**Status:** ⏳ Pending  
**Priority:** HIGH

---

### 1.2 Text Injection ("แก้ไข", "ตัวอย่าง")
**Input:** Slip with fake indicator keywords  
**Expected Result:**
- `is_scam`: true
- `risk_score`: > 0.8
- `slip_verification.trust_score`: 0.0 (instant fail)
- `reason`: Contains "แก้ไข" or similar warning

**Test Variations:**
- "แก้ไข" in Thai
- "demo" / "test" / "sample" in English
- "ตัวอย่าง" / "ปลอม"

**Status:** ⏳ Pending  
**Priority:** HIGH

---

### 1.3 Fake Bank Name
**Input:** Slip with non-existent bank  
**Expected Result:**
- `slip_verification.detected_bank`: null or unrecognized
- `slip_verification.trust_score`: < 0.7 (bank check failed)
- `slip_verification.checks_passed`: < 6

**Test Variations:**
- Completely fake bank ("Bank of Scam")
- Misspelled bank name ("Bangok Bank")
- Foreign bank not in Thai bank list

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

### 1.4 Invalid Account Number
**Input:** Slip with malformed account number  
**Expected Result:**
- `slip_verification.checks_passed`: Reduced count
- Account validation check failed
- `slip_verification.warnings`: Contains account format warning

**Test Variations:**
- Too short: "12-3"
- Too long: "123456789012345678"
- Invalid pattern: "abc-def-ghi"
- Missing separators: "1234567890"

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

### 1.5 Unrealistic Amount
**Input:** Slip with impossible transaction amount  
**Expected Result:**
- Amount sanity check fails
- `slip_verification.trust_score`: Reduced
- Warning about unusual amount

**Test Variations:**
- Negative: "-100 บาท"
- Zero: "0.00 THB"
- Extremely large: "999,999,999 บาท"
- Invalid decimal: "100.999 THB"

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

## Test Case 2: Low Quality Images

### 2.1 Blurry Image
**Input:** Out-of-focus slip photo  
**Expected Result:**
- OCR still extracts some text
- System handles gracefully
- May have lower confidence
- No crash or error

**Quality Levels:**
- Slightly blurry (should work)
- Very blurry (degraded performance acceptable)
- Completely blurry (should return low confidence)

**Status:** ⏳ Pending  
**Priority:** HIGH

---

### 2.2 Dark/Underexposed Image
**Input:** Poorly lit slip photo  
**Expected Result:**
- OCR preprocessing helps
- Text extraction attempts made
- Graceful degradation if fails
- Clear error message if too dark

**Test Variations:**
- Slightly dark
- Very dark
- Almost black

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

### 2.3 Rotated Image
**Input:** Slip rotated 90°, 180°, or arbitrary angle  
**Expected Result:**
- OCR handles rotation (if supported)
- Or clear message about orientation
- No crash

**Rotation Angles:**
- 90° clockwise
- 180°
- 270° (90° counter-clockwise)
- 45° (arbitrary)

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

### 2.4 Low Resolution
**Input:** Very small slip image (< 200px)  
**Expected Result:**
- Meets minimum dimension check (50x50)
- OCR may fail gracefully
- Clear message about image quality

**Resolutions:**
- 100x100 (valid but low)
- 50x50 (minimum)
- 49x49 (should reject)

**Status:** ⏳ Pending  
**Priority:** LOW

---

### 2.5 Extremely High Resolution
**Input:** Massive slip image (> 4000px)  
**Expected Result:**
- Meets maximum dimension check (4096px)
- Image processed (may be resized)
- No memory issues

**Resolutions:**
- 4096x4096 (maximum)
- 4097x4097 (should reject or resize)
- 8192x8192 (should reject)

**Status:** ⏳ Pending  
**Priority:** LOW

---

## Test Case 3: Non-Slip Images

### 3.1 Chat Screenshots
**Input:** LINE/WhatsApp conversation screenshot  
**Expected Result:**
- `slip_verification.is_genuine`: false
- OCR extracts chat text
- Text analysis works normally
- Slip checks fail (no bank name, account, etc.)

**Status:** ⏳ Pending  
**Priority:** HIGH

---

### 3.2 Random Photos
**Input:** Unrelated images (memes, food, selfies)  
**Expected Result:**
- OCR finds little/no text
- Slip verification fails all checks
- Risk based on any text found
- No crash

**Test Variations:**
- Meme image
- Food photo
- Nature photo
- Text-less image

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

### 3.3 Documents (Non-Banking)
**Input:** Receipts, invoices, contracts  
**Expected Result:**
- OCR extracts text successfully
- Slip verification fails (no bank indicators)
- Risk score based on text content
- Not classified as slip

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

## Test Case 4: Boundary Conditions

### 4.1 Minimum Valid File
**Input:** 1 KB valid image  
**Expected Result:**
- Passes size validation
- Processes successfully
- Returns valid response

**Status:** ⏳ Pending  
**Priority:** LOW

---

### 4.2 Maximum Valid File
**Input:** 10 MB valid image  
**Expected Result:**
- Passes size validation
- Processes successfully (may take longer)
- Returns valid response

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

### 4.3 File Too Large
**Input:** 11 MB image  
**Expected Result:**
- HTTP 400 Bad Request
- Error: "File too large. Maximum size: 10 MB"
- No processing attempted

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

### 4.4 File Too Small
**Input:** Empty file or < 1 KB  
**Expected Result:**
- HTTP 400 Bad Request
- Error: "File too small" or "Invalid image"
- No crash

**Status:** ⏳ Pending  
**Priority:** LOW

---

### 4.5 Invalid Date Format
**Input:** Slip with malformed date/time  
**Expected Result:**
- Date validation check fails
- `slip_verification.checks_passed`: Reduced
- `warnings`: Contains date format warning
- System doesn't crash

**Test Variations:**
- "32/13/2024" (invalid date)
- "2024-13-45" (invalid)
- "ABC/DEF/GHIJ" (non-numeric)

**Status:** ⏳ Pending  
**Priority:** LOW

---

## Test Case 5: Malicious Inputs

### 5.1 SQL Injection Attempts (in filename)
**Input:** File named `slip'; DROP TABLE detections;--.jpg`  
**Expected Result:**
- Filename sanitized or ignored
- No SQL execution
- File processed normally

**Status:** ⏳ Pending  
**Priority:** HIGH (Security)

---

### 5.2 Path Traversal (in filename)
**Input:** File named `../../etc/passwd.jpg`  
**Expected Result:**
- Filename sanitized
- No file system access outside intended directory
- Processes safely

**Status:** ⏳ Pending  
**Priority:** HIGH (Security)

---

### 5.3 Corrupted File Header
**Input:** File with .jpg extension but invalid JPEG header  
**Expected Result:**
- HTTP 400 Bad Request
- Error: "Invalid or corrupted image file"
- No crash

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

### 5.4 Polyglot File (Image + Script)
**Input:** Image file containing embedded script  
**Expected Result:**
- Processes as image only
- Script content ignored
- No code execution

**Status:** ⏳ Pending  
**Priority:** HIGH (Security)

---

### 5.5 Extremely Long Text in OCR
**Input:** Image with 10,000+ characters of text  
**Expected Result:**
- OCR extracts text (may truncate)
- Processing completes successfully
- No memory overflow
- Response time acceptable (< 30s)

**Status:** ⏳ Pending  
**Priority:** MEDIUM

---

## 📊 Test Execution Plan

### Phase 1: Critical Tests (Day 1)
**Priority: HIGH**
- [x] 1.1 Amount manipulation
- [x] 1.2 Text injection
- [x] 2.1 Blurry images
- [x] 3.1 Chat screenshots
- [x] 5.1 SQL injection
- [x] 5.4 Polyglot files

### Phase 2: Important Tests (Day 2)
**Priority: MEDIUM**
- [ ] 1.3 Fake bank names
- [ ] 1.4 Invalid account numbers
- [ ] 1.5 Unrealistic amounts
- [ ] 2.2 Dark images
- [ ] 2.3 Rotated images
- [ ] 4.2 Maximum file size
- [ ] 4.3 File too large

### Phase 3: Edge Cases (Day 3)
**Priority: LOW**
- [ ] 2.4 Low resolution
- [ ] 2.5 High resolution
- [ ] 3.2 Random photos
- [ ] 3.3 Non-banking documents
- [ ] 4.1 Minimum file size
- [ ] 4.4 File too small
- [ ] 4.5 Invalid dates

---

## 🛠️ Testing Tools

### Automated Testing Script
```bash
#!/bin/bash
# automated_edge_tests.sh

API_URL="https://api.thaiscam.zcr.ai/v1/public/detect/image"
TEST_DIR="./test_images/edge_cases"

echo "🧪 Starting Edge Case Tests..."

# Test 1: Fake slip
echo "Test 1.2: Text injection"
curl -s -X POST -F "file=@${TEST_DIR}/fake_demo.jpg" $API_URL | \
  jq '.is_scam, .risk_score, .slip_verification.trust_score'

# Test 2: Blurry image  
echo "Test 2.1: Blurry image"
curl -s -X POST -F "file=@${TEST_DIR}/blurry_slip.jpg" $API_URL | \
  jq '.request_id, .risk_score'

# Test 3: File too large
echo "Test 4.3: File too large"
curl -s -X POST -F "file=@${TEST_DIR}/huge_image.jpg" $API_URL | \
  jq '.detail'

# Add more tests...
```

### Python Test Framework
```python
# test_edge_cases.py
import pytest
import requests

API_URL = "https://api.thaiscam.zcr.ai/v1/public/detect/image"

def test_fake_indicator_text():
    """Test 1.2: Fake indicator keywords"""
    with open("test_images/fake_demo.jpg", "rb") as f:
        response = requests.post(API_URL, files={"file": f})
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_scam"] == True
    assert data["risk_score"] > 0.8
    assert data["slip_verification"]["trust_score"] < 0.3

def test_blurry_image():
    """Test 2.1: Blurry image handling"""
    with open("test_images/blurry_slip.jpg", "rb") as f:
        response = requests.post(API_URL, files={"file": f})
    
    assert response.status_code == 200
    # Should not crash, even if OCR quality is poor

def test_file_too_large():
    """Test 4.3: File size limit"""
    # Create 11 MB file
    large_data = b"0" * (11 * 1024 * 1024)
    response = requests.post(
        API_URL, 
        files={"file": ("large.jpg", large_data, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "too large" in response.json()["detail"].lower()
```

---

## 📝 Test Report Template

### Test Case: [ID]
**Test Name:** [Name]  
**Status:** ✅ Pass / ❌ Fail / ⚠️ Warning  
**Date Tested:** YYYY-MM-DD  
**Tester:** [Name]

**Input:**
- Description
- File details

**Expected Result:**
- [Expectations]

**Actual Result:**
- [What happened]

**Screenshots/Logs:**
```json
{
  "is_scam": false,
  "risk_score": 0.37
}
```

**Issues Found:**
- [List any bugs]

**Recommendations:**
- [Suggested fixes]

---

## 🐛 Bug Report Template

**Bug ID:** EDGE-001  
**Severity:** Critical / High / Medium / Low  
**Status:** Open / In Progress / Fixed / Closed

**Title:** [Short description]

**Description:**
[Detailed description of the issue]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**System:**
- Environment: Production / Staging
- API Version: v1.1
- Date: 2025-12-09

**Logs:**
```
[Relevant log entries]
```

**Fix Recommendation:**
[Suggested solution]

---

## 📊 Success Criteria

**Test passes if:**
- ✅ All HIGH priority tests pass
- ✅ > 90% of MEDIUM priority tests pass
- ✅ No critical security issues found
- ✅ No crashes or unhandled exceptions
- ✅ All error messages are user-friendly
- ✅ Response times acceptable (< 10s for normal, < 30s for extreme)

**Red flags:**
- 🚨 System crashes on any input
- 🚨 Security vulnerability found
- 🚨 Data corruption or loss
- 🚨 Unhandled exceptions leak to user

---

## 🎯 Next Steps After Testing

1. **Document all findings**
2. **Create bug tickets for failures**
3. **Prioritize fixes**
4. **Retest after fixes applied**
5. **Update documentation with edge case handling**
6. **Add automated tests for edge cases**

---

**Ready to start testing? Run:**
```bash
./scripts/test_edge_cases.sh
```

**Or manually test at:**
```
https://thaiscam.zcr.ai/check
```

Upload test images from `test_images/edge_cases/` directory and document results!
