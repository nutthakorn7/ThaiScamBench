# 🔌 API Documentation

Complete API reference for ThaiScamBench

---

## Base URL

```
Development: http://localhost:8000
Production: https://api.thaiscambench.com
```

---

## Authentication

### Public API
No authentication required. Rate limited to **10 requests/minute**.

### Partner API
Requires API key via Bearer token:
```bash
Authorization: Bearer YOUR_API_KEY
```
> **Security:** Never commit your actual API key. Use environment variables.
Rate limit: **100 requests/minute**

### Admin API
Requires admin token:
```bash
Authorization: Bearer $ADMIN_TOKEN
```
> **Security:** Never commit your actual admin token. Use environment variables.

---

## Endpoints

### 1. Public Detection

**POST** `/v1/public/detect/text`

Detect scam in Thai text message.

**Request:**
```json
{
  "message": "คุณมีพัสดุค้างชำระ 50 บาท",
  "channel": "SMS"
}
```

**Parameters:**
- `message` (required): Thai text to analyze
- `channel` (optional): Source channel (SMS, LINE, Email, etc.)

**Response:**
```json
{
  "is_scam": true,
  "risk_score": 0.95,
  "category": "parcel_scam",
  "reason": "ข้อความมีลักษณะของการแอบอ้างเป็นบริษัทขนส่ง...",
  "advice": "🚫 ไม่ควรคลิกลิงก์ใดๆ...",
  "model_version": "mock-v1.0",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:8000/v1/public/detect/text \
  -H "Content-Type: application/json" \
  -d '{"message":"คุณมีพัสดุค้างชำระ","channel":"SMS"}'
```

**Example (Python):**
```python
import requests

response = requests.post(
    "http://localhost:8000/v1/public/detect/text",
    json={
        "message": "คุณมีพัสดุค้างชำระ 50 บาท",
        "channel": "SMS"
    }
)
data = response.json()
print(f"Is Scam: {data['is_scam']}")
print(f"Risk: {data['risk_score']}")
```

---

### 2. Feedback Submission

**POST** `/v1/public/feedback`

Submit user feedback on detection result.

**Request:**
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "feedback_type": "correct"
}
```

**Parameters:**
- `request_id` (required): From detection response
- `feedback_type` (required): "correct" or "incorrect"

**Response:**
```json
{
  "message": "ขอบคุณสำหรับ feedback ครับ",
  "feedback_id": "abc-123-def-456"
}
```

---

### 3. Partner Detection

**POST** `/v1/partner/detect/text`

Same as public detection but with higher rate limits.

**Headers:**
```
Authorization: Bearer YOUR_PARTNER_API_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "message": "ข้อความที่ต้องการตรวจสอบ",
  "user_ref": "user-12345"
}
```

**Parameters:**
- `message` (required): Thai text to analyze
- `user_ref` (optional): Your user reference ID

---

### 4. Admin - Stats Summary

**GET** `/admin/stats/summary?days=7`

Get overall system statistics.

**Headers:**
```
Authorization: Bearer admin-secret-key-2024
```

**Query Parameters:**
- `days` (optional): 7, 30, or 365 (default: 7)

**Response:**
```json
{
  "total_requests": 150,
  "scam_count": 95,
  "scam_ratio": 0.633,
  "public_requests": 140,
  "partner_requests": 10,
  "requests_per_day": [
    {"date": "2024-12-04", "count": 50}
  ],
  "top_categories": [
    {"category": "parcel_scam", "count": 30}
  ]
}
```

---

### 5. Admin - Review Uncertain

**GET** `/admin/review/uncertain?limit=10`

Get uncertain cases for review.

**Headers:**
```
Authorization: Bearer admin-secret-key-2024
```

**Query Parameters:**
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "total": 5,
  "uncertain_count": 3,
  "incorrect_feedback_count": 2,
  "cases": [
    {
      "request_id": "abc-123",
      "message_hash": "sha256...",
      "risk_score": 0.55,
      "category": "loan_scam",
      "feedback_count": 2,
      "created_at": "2024-12-04T10:30:00"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request format"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid API key"
}
```

### 429 Too Many Requests
```json
{
  "detail": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Public Detection | 10 req | 1 minute |
| Public Feedback | 10 req | 1 minute |
| Partner Detection | 100 req | 1 minute |
| Admin (all) | Unlimited | - |

---

## Code Examples

### Python with requests
```python
import requests

class ThaiScamDetector:
    def __init__(self, api_key=None):
        self.base_url = "http://localhost:8000"
        self.api_key = api_key
    
    def detect(self, message, channel="SMS"):
        endpoint = "/v1/partner/detect/text" if self.api_key else "/v1/public/detect/text"
        headers = {"Content-Type": "application/json"}
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        response = requests.post(
            f"{self.base_url}{endpoint}",
            json={"message": message, "channel": channel},
            headers=headers
        )
        return response.json()

# Usage
detector = ThaiScamDetector()
result = detector.detect("คุณมีพัสดุค้างชำระ")
print(result)
```

### JavaScript
```javascript
async function detectScam(message) {
  const response = await fetch('http://localhost:8000/v1/public/detect/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      channel: 'SMS'
    })
  });
  
  return await response.json();
}

// Usage
detectScam('คุณมีพัสดุค้างชำระ').then(result => {
  console.log('Is Scam:', result.is_scam);
  console.log('Risk Score:', result.risk_score);
});
```

### PHP
```php
<?php
function detectScam($message) {
    $url = 'http://localhost:8000/v1/public/detect/text';
    
    $data = [
        'message' => $message,
        'channel' => 'SMS'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Usage
$result = detectScam('คุณมีพัสดุค้างชำระ');
echo 'Is Scam: ' . ($result['is_scam'] ? 'Yes' : 'No');
?>
```

---

## Interactive API Docs

Visit **http://localhost:8000/docs** for interactive Swagger UI documentation.

---

## Support

For API support:
- Email: api@thaiscambench.com
- Issues: GitHub Issues
- Docs: http://localhost:8000/docs
