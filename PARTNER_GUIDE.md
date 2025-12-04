# Partner Integration Guide

**ThaiScamBench Partner Program**  
**For Banks, Telecom Providers, and E-Commerce Platforms**

---

## 🤝 Welcome Partners!

ThaiScamBench API ช่วยให้คุณสามารถตรวจจับข้อความหลอกลวงได้แบบ real-time ผ่าน REST API

---

## Quick Start

### 1. สมัครใช้งาน

**ติดต่อ:** partnerships@thaiscambench.com

**ข้อมูลที่ต้องการ:**
- ชื่อบริษัท/องค์กร
- Use case (เช่น SMS filtering, customer protection)
- Estimated volume (requests/month)
- Technical contact

**ระยะเวลาอนุมัติ:** 1-2 วันทำการ

---

### 2. รับ API Key

หลังจากอนุมัติ คุณจะได้รับ:
- **API Key** (เก็บเป็นความลับ!)
- **Partner ID**
- **Documentation**
- **Slack channel** สำหรับ technical support

---

### 3. Integration

#### Python Example

```python
import requests

API_KEY = "your-partner-api-key-here"
API_BASE = "https://api.thaiscambench.com"  # Production
# API_BASE = "https://staging-api.thaiscambench.com"  # Staging

def check_message(message: str, channel: str = "SMS"):
    """ตรวจสอบข้อความว่าเป็น scam หรือไม่"""
    
    response = requests.post(
        f"{API_BASE}/v1/partner/detect/text",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "message": message,
            "channel": channel,
            "user_ref": "optional-your-user-id"  # Optional
        },
        timeout=5  # 5 seconds timeout
    )
    
    if response.status_code == 200:
        result = response.json()
        return {
            "is_scam": result["is_scam"],
            "risk_score": result["risk_score"],
            "category": result["category"]
        }
    elif response.status_code == 429:
        # Rate limit exceeded
        return {"error": "rate_limit_exceeded"}
    else:
        # Handle error
        return {"error": response.status_code}

# ใช้งาน
result = check_message("คุณมีพัสดุค้างชำระ 50 บาท")
if result.get("is_scam"):
    print(f"⚠️ Scam detected! Risk: {result['risk_score']}")
    print(f"Category: {result['category']}")
else:
    print("✅ Message appears safe")
```

#### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_KEY = 'your-partner-api-key-here';
const API_BASE = 'https://api.thaiscambench.com';

async function checkMessage(message, channel = 'SMS') {
  try {
    const response = await axios.post(
      `${API_BASE}/v1/partner/detect/text`,
      {
        message: message,
        channel: channel
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
    }
    throw error;
  }
}

// Usage
checkMessage('คุณมีพัสดุค้างชำระ 50 บาท')
  .then(result => {
    if (result.is_scam) {
      console.log(`⚠️ Scam! Risk: ${result.risk_score}`);
    }
  });
```

---

## API Details

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.thaiscambench.com` |
| Staging | `https://staging-api.thaiscambench.com` |

### Rate Limits

| Tier | Requests/Minute | Requests/Month |
|------|----------------|----------------|
| Pilot | 100 | 10,000 |
| Standard | 500 | 100,000 |
| Enterprise | Custom | Custom |

### Response Format

```json
{
  "is_scam": true,
  "risk_score": 0.85,
  "category": "parcel_scam",
  "reason": "ข้อความมีลักษณะของการแอบอ้างเป็นบริษัทขนส่ง...",
  "advice": "🚫 ไม่ควรคลิกลิงก์ใดๆ...",
  "model_version": "v1.0.0",
  "request_id": "req_abc123"
}
```

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process result |
| 400 | Bad Request | Check input format |
| 401 | Unauthorized | Check API key |
| 429 | Too Many Requests | Implement retry with backoff |
| 500 | Server Error | Retry or contact support |

---

## Integration Checklist

### Before Production

- [ ] ทดสอบใน staging environment
- [ ] อ่าน [Privacy Policy](PRIVACY_POLICY.md)
- [ ] Implement error handling
- [ ] Implement rate limiting
- [ ] Setup monitoring/alerting
- [ ] Prepare for API key rotation
- [ ] Review SLA requirements

### Security Best Practices

✅ **DO:**
- เก็บ API key ใน environment variables
- ใช้ HTTPS เท่านั้น
- Implement retry with exponential backoff
- Log API errors (แต่ไม่ log ข้อความต้นฉบับ)
- Rotate API keys ทุก 90 วัน

❌ **DON'T:**
- Commit API key ใน code
- แชร์ API key กับบุคคลภายนอก
- เก็บข้อความต้นฉบับใน log
- Hard-code API key

---

## Pilot Program

### Benefits

- **Duration:** 30 days trial
- **Free Credits:** 10,000 API calls
- **Support:** Dedicated Slack channel
- **Custom Integration:** Technical consultation

### How to Join

Email: partnerships@thaiscambench.com

**Subject:** "Pilot Program Application - [Company Name]"

**Include:**
1. Company name and website
2. Use case description
3. Expected volume
4. Technical contact

---

## SLA (Service Level Agreement)

### Production SLA

| Metric | Target |
|--------|--------|
| **Uptime** | 99.9% |
| **Response Time (P95)** | < 2 seconds |
| **Response Time (P99)** | < 5 seconds |
| **Support Response** | < 24 hours (email) |
| **Support Response** | < 4 hours (Slack, business hours) |

### Maintenance Windows

- **Scheduled:** Sundays 02:00-04:00 AM ICT
- **Notification:** 48 hours advance notice

---

## Monitoring & Alerts

### Dashboard

Partners มี access ไปยัง real-time dashboard:
- API usage (requests/hour)
- Error rates
- Response times
- Detection statistics

**URL:** https://dashboard.thaiscambench.com

### Webhooks (Optional)

รับ notification เมื่อ:
- Rate limit approaching (80%)
- API errors spike
- System maintenance scheduled

---

## Support

### Technical Support

- **Email:** support@thaiscambench.com
- **Slack:** #partner-support (invite only)
- **Hours:** Mon-Fri 09:00-18:00 ICT

### Business Inquiries

- **Email:** partnerships@thaiscambench.com
- **Phone:** +66-X-XXX-XXXX (business hours)

### Documentation

- **API Docs:** [docs/API.md](docs/API.md)
- **Privacy Policy:** [PRIVACY_POLICY.md](PRIVACY_POLICY.md)
- **FAQ:** https://thaiscambench.com/faq

---

## Sample Use Cases

### 1. **SMS Filtering** (Telecom)

```python
# ตรวจสอบ SMS ก่อนส่งถึงผู้ใช้
sms_text = incoming_sms.content
result = check_message(sms_text, channel="SMS")

if result["is_scam"] and result["risk_score"] > 0.8:
    # Block message
    block_sms(incoming_sms)
    log_blocked_message(result["category"])
elif result["is_scam"]:
    # Flag as suspicious
    tag_sms_as_suspicious(incoming_sms)
```

### 2. **Customer Protection** (Bank)

```python
# ตรวจสอบข้อความที่ลูกค้าแจ้ง
reported_message = customer_report.message
result = check_message(reported_message)

if result["is_scam"]:
    alert_fraud_team({
        "customer_id": customer.id,
        "scam_type": result["category"],
        "risk_score": result["risk_score"]
    })
```

### 3. **Marketplace Safety** (E-commerce)

```python
# ตรวจสอบ chat ระหว่าง buyer-seller
chat_message = marketplace_chat.message
result = check_message(chat_message, channel="Chat")

if result["is_scam"]:
    warn_user("⚠️ ข้อความนี้อาจเป็นการหลอกลวง ระวังให้ดี!")
```

---

## Pricing

| Tier | Price/Month | Included Requests | Overage |
|------|-------------|-------------------|---------|
| Pilot | Free | 10,000 | N/A |
| Standard | ฿X,XXX | 100,000 | ฿X/1,000 |
| Enterprise | Custom | Custom | Custom |

**ติดต่อ:** sales@thaiscambench.com

---

## FAQ

**Q: ข้อความของลูกค้าจะถูกเก็บหรือไม่?**  
A: ไม่ เราไม่เก็บข้อความต้นฉบับ เก็บเฉพาะ hash และ metadata (ดู [Privacy Policy](PRIVACY_POLICY.md))

**Q: Response time เฉลี่ยเท่าไร?**  
A: < 2 วินาที (P95)

**Q: รองรับภาษาอื่นนอกจากไทยไหม?**  
A: ปัจจุบันรองรับเฉพาะภาษาไทย (English support coming soon)

**Q: มี SLA รับประกันหรือไม่?**  
A: ใช่ Uptime 99.9% (ดู SLA section)

**Q: สามารถ fine-tune model เฉพาะของเราได้ไหม?**  
A: ติดต่อ Enterprise plan

---

**Ready to Get Started?**  
Email: partnerships@thaiscambench.com

---

**Last Updated:** December 5, 2024
