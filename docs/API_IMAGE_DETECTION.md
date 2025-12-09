# 🔌 3-Layer Image Detection API

## Overview

The 3-Layer Image Detection API provides advanced bank slip verification combining OCR, Visual Forensics, and Slip Verification to accurately identify genuine slips while filtering out scams.

**Base URL:** `https://api.thaiscam.zcr.ai`

---

## Authentication

### Public Endpoints (No Auth Required)
- `/v1/public/detect/image` - Public image detection

### Partner Endpoints (API Key Required)
- `/api/partner/detect/image` - Partner image detection with higher rate limits

**Header:**
```http
Authorization: Bearer YOUR_API_KEY
```

---

## Endpoint: Detect Image

### POST `/v1/public/detect/image`

Upload an image (bank slip, chat screenshot) for scam detection.

**Features:**
- ✅ OCR text extraction
- ✅ Visual forensics analysis
- ✅ Bank slip verification (6 criteria)
- ✅ 3-Layer risk fusion

---

### Request

**Method:** `POST`

**Content-Type:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | ✅ | Image file (JPG, PNG, BMP, WEBP) |

**File Requirements:**
- Max size: 10 MB
- Min size: 1 KB
- Formats: JPEG, PNG, BMP, WEBP
- Max dimensions: 4096 x 4096 px
- Min dimensions: 50 x 50 px

---

### Response

**Success Response (200 OK):**

```json
{
  "request_id": "0949c8cb-8712-4acf-9349-ea0299e072b4",
  "is_scam": false,
  "risk_score": 0.37,
  "category": "safe",
  "reason": "✅ Slip Verification (Trust: 83%) | Safe content detected",
  "advice": "✓ สลิปนี้มีรูปแบบสมบูรณ์และน่าเชื่อถือ แต่ควรตรวจสอบยอดเงินจริงในบัญชีเพื่อยืนยัน",
  "model_version": "v1.1-hybrid+gemini",
  "llm_version": "gemini-pro",
  "extracted_text": "Bangkok Bank\nรายการสำเร็จ\n02 ส.ค. 68, 13:32\nจำนวนเงิน\n20.00 THB\n...",
  "visual_analysis": {
    "enabled": true,
    "is_suspicious": false,
    "risk_score": 0.0,
    "detected_patterns": ["legitimate"],
    "slip_verification": {
      "trust_score": 0.83,
      "is_genuine": true,
      "detected_bank": "bbl",
      "detected_amount": "20.00",
      "checks_passed": 5,
      "total_checks": 6,
      "warnings": ["ไม่พบวันที่/เวลาที่ชัดเจน"]
    }
  }
}
```

---

### Response Fields

#### Root Level

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | Unique request identifier for tracking |
| `is_scam` | boolean | Whether the image is classified as scam |
| `risk_score` | number | Overall risk score (0.0 = safe, 1.0 = scam) |
| `category` | string | Detection category (see categories below) |
| `reason` | string | Human-readable explanation |
| `advice` | string | Thai language advice for user |
| `model_version` | string | Detection model version |
| `llm_version` | string | AI model used for analysis |
| `extracted_text` | string | OCR extracted text from image |
| `visual_analysis` | object | Visual forensics result (see below) |

#### Categories

| Category | Description | Risk Range |
|----------|-------------|------------|
| `safe` | No scam indicators | 0.0 - 0.3 |
| `banking_scam` | Suspicious banking content | 0.3 - 0.7 |
| `parcel_scam` | Fake delivery messages | 0.5 - 0.8 |
| `investment_scam` | Investment fraud | 0.6 - 0.9 |
| `phishing` | Phishing attempts | 0.7 - 1.0 |

#### Visual Analysis Object

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether visual analysis was performed |
| `is_suspicious` | boolean | Visual forensics detected manipulation |
| `risk_score` | number | Visual analysis risk (0.0 - 1.0) |
| `detected_patterns` | array | List of detected visual patterns |
| `slip_verification` | object | Slip verification result (see below) |

#### Slip Verification Object

| Field | Type | Description |
|-------|------|-------------|
| `trust_score` | number | Trust score (0.0 = fake, 1.0 = genuine) |
| `is_genuine` | boolean | Whether slip appears genuine |
| `detected_bank` | string | Bank code detected (bbl, kbank, scb, etc.) |
| `detected_amount` | string | Transaction amount found |
| `checks_passed` | number | Number of criteria passed |
| `total_checks` | number | Total criteria checked (6) |
| `warnings` | array | List of warnings/issues found |

---

### Error Responses

#### 400 Bad Request

**Invalid file format:**
```json
{
  "detail": "Unsupported file type. Only JPG, PNG, BMP, WEBP allowed"
}
```

**File too large:**
```json
{
  "detail": "File too large. Maximum size: 10 MB"
}
```

#### 413 Payload Too Large

```json
{
  "detail": "Request entity too large"
}
```

#### 429 Too Many Requests

```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

#### 500 Internal Server Error

```json
{
  "detail": "Internal server error. Please contact support."
}
```

---

## Code Examples

### cURL

```bash
curl -X POST "https://api.thaiscam.zcr.ai/v1/public/detect/image" \
  -F "file=@/path/to/slip.jpg"
```

### Python

```python
import requests

url = "https://api.thaiscam.zcr.ai/v1/public/detect/image"
files = {"file": open("slip.jpg", "rb")}

response = requests.post(url, files=files)
result = response.json()

print(f"Is Scam: {result['is_scam']}")
print(f"Risk Score: {result['risk_score']}")
print(f"Trust Score: {result['visual_analysis']['slip_verification']['trust_score']}")
```

### JavaScript (Node.js)

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('slip.jpg'));

axios.post('https://api.thaiscam.zcr.ai/v1/public/detect/image', form, {
  headers: form.getHeaders()
})
.then(response => {
  console.log('Is Scam:', response.data.is_scam);
  console.log('Risk Score:', response.data.risk_score);
  console.log('Trust Score:', response.data.visual_analysis.slip_verification.trust_score);
})
.catch(error => console.error('Error:', error));
```

### JavaScript (Browser)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('https://api.thaiscam.zcr.ai/v1/public/detect/image', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Is Scam:', data.is_scam);
  console.log('Risk Score:', data.risk_score);
  
  if (data.visual_analysis?.slip_verification) {
    const slip = data.visual_analysis.slip_verification;
    console.log('Slip Trust:', slip.trust_score);
    console.log('Checks Passed:', `${slip.checks_passed}/${slip.total_checks}`);
  }
});
```

### PHP

```php
<?php
$url = 'https://api.thaiscam.zcr.ai/v1/public/detect/image';

$file = new CURLFile('slip.jpg', 'image/jpeg', 'slip.jpg');
$data = array('file' => $file);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);

echo "Is Scam: " . ($result['is_scam'] ? 'Yes' : 'No') . "\n";
echo "Risk Score: " . $result['risk_score'] . "\n";
echo "Trust Score: " . $result['visual_analysis']['slip_verification']['trust_score'] . "\n";
?>
```

---

## Rate Limits

### Public API

- **Rate Limit:** 10 requests per minute per IP
- **Burst:** 20 requests
- **Daily Limit:** 1,000 requests

**Response Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1702123456
```

### Partner API

Contact us for higher rate limits and dedicated support.

---

## Testing

### Test Endpoints

**Staging:** `https://staging-api.thaiscam.zcr.ai`

**Use staging for:**
- Integration testing
- Load testing
- Development

### Test Images

We provide test images for integration testing:

**Genuine Slip (Expected: low risk)**
```bash
curl -X POST "https://api.thaiscam.zcr.ai/v1/public/detect/image" \
  -F "file=@test_genuine_slip.jpg"
```

**Fake Slip (Expected: high risk)**
```bash
curl -X POST "https://api.thaiscam.zcr.ai/v1/public/detect/image" \
  -F "file=@test_fake_slip.jpg"
```

---

## Understanding Risk Scores

### 3-Layer Fusion

The final `risk_score` is calculated using weighted fusion:

**For Genuine Slips (trust > 0.7):**
```
final_risk = (text_risk × 0.3) + (visual_risk × 0.2) + (slip_risk × 0.5)
```

**For Non-Slips or Suspicious (trust ≤ 0.7):**
```
final_risk = (text_risk × 0.4) + (visual_risk × 0.3) + (slip_risk × 0.3)
```

Where:
- `text_risk` = OCR text analysis risk
- `visual_risk` = Visual forensics risk
- `slip_risk` = 1.0 - trust_score

### Interpretation Guide

| Risk Score | Category | Recommendation |
|------------|----------|----------------|
| 0.0 - 0.3 | ✅ Safe | Likely genuine, proceed with caution |
| 0.3 - 0.5 | ⚠️ Low Risk | Review carefully, some indicators present |
| 0.5 - 0.7 | ⚠️ Medium Risk | Multiple warning signs, verify thoroughly |
| 0.7 - 0.9 | 🚨 High Risk | Strong scam indicators, avoid transaction |
| 0.9 - 1.0 | 🚨 Critical | Clear scam, do not proceed |

### Trust Score Interpretation

| Trust Score | Meaning | Action |
|-------------|---------|--------|
| 0.9 - 1.0 | Perfect genuine slip | All checks passed |
| 0.7 - 0.9 | Likely genuine | 1-2 minor warnings |
| 0.5 - 0.7 | Uncertain | Further verification needed |
| 0.3 - 0.5 | Suspicious | Multiple red flags |
| 0.0 - 0.3 | Likely fake | Do not trust |

---

## Best Practices

### 1. Always Check Trust Score

For banking slips specifically:

```javascript
if (data.visual_analysis?.slip_verification) {
  const slip = data.visual_analysis.slip_verification;
  
  if (slip.trust_score > 0.7) {
    // High confidence - likely genuine
    console.log('✅ Genuine slip detected');
  } else if (slip.trust_score > 0.5) {
    // Uncertain - manual review recommended
    console.log('⚠️ Slip requires verification');
  } else {
    // Low confidence - likely fake
    console.log('🚨 Suspicious slip');
  }
}
```

### 2. Verify Transaction Independently

Always verify the actual transaction in your bank account, even if trust score is high.

### 3. Handle Errors Gracefully

```javascript
try {
  const response = await fetch(url, { method: 'POST', body: formData });
  
  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - retry after delay
      await sleep(60000);
      return retry();
    }
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Detection failed:', error);
  // Fallback to manual verification
}
```

### 4. Cache Results

Cache detection results to avoid redundant API calls:

```javascript
const cache = new Map();
const imageHash = await hashImage(file);

if (cache.has(imageHash)) {
  return cache.get(imageHash);
}

const result = await detectImage(file);
cache.set(imageHash, result);
return result;
```

---

## Webhooks (Coming Soon)

Subscribe to detection events for real-time notifications.

**Webhook payload:**
```json
{
  "event": "detection.completed",
  "timestamp": "2025-12-09T11:45:00Z",
  "data": {
    "request_id": "abc123",
    "is_scam": false,
    "risk_score": 0.37
  }
}
```

---

## Support

### Documentation
- [3-Layer Detection Guide](./SLIP_DETECTION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Testing Guide](./TESTING.md)

### Contact
- **Email:** support@thaiscam.zcr.ai
- **GitHub Issues:** https://github.com/nutthakorn7/ThaiScamBench/issues

### Status Page
- **API Status:** https://status.thaiscam.zcr.ai
- **Uptime:** 99.9% SLA (Partner tier)

---

## Changelog

### v1.1 (Current)
- ✅ 3-Layer Detection System
- ✅ Slip Verification (6 criteria)
- ✅ Smart Fusion Algorithm
- ✅ 57-61% risk reduction for genuine slips

### v1.0
- Basic OCR detection
- Simple keyword matching
- Text-only analysis

---

**Last Updated:** 2025-12-09  
**API Version:** v1.1  
**Status:** Production Ready ✅
