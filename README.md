# 🛡️ ThaiScamBench

**Thai Scam Detection Benchmark & API System**

A comprehensive Thai language scam message detection system with web interface, REST API, and admin dashboard for continuous model improvement.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Features

- **🔍 Scam Detection** - Detects 8+ types of Thai scam messages
- **🌐 Web Interface** - User-friendly detection interface
- **📡 REST API** - Integration-ready API for partners
- **📊 Admin Dashboard** - Review uncertain cases and improve model
- **📈 Analytics** - Track detection stats and trends
- **🔐 Secure** - Rate limiting, authentication, privacy protection

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- pip & virtualenv

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/ThaiScamBench.git
cd ThaiScamBench

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from app.database import init_db; init_db()"

# Run server
uvicorn app.main:app --reload
```

**Access:**
- **Web UI:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Admin:** http://localhost:8000/admin.html (token: see `.env` file)

---

## 📖 Documentation

### User Guides
- [Setup Guide](docs/SETUP.md) - Detailed installation
- [API Documentation](docs/API.md) - Complete API reference
- [Admin Guide](ADMIN_REVIEW_GUIDE.md) - Dashboard usage

### For Developers
- [Architecture](docs/ARCHITECTURE.md) - System design
- [Contributing](docs/CONTRIBUTING.md) - Development guide

---

## 🔌 API Usage

### Public Detection

```bash
curl -X POST http://localhost:8000/v1/public/detect/text \
  -H "Content-Type: application/json" \
  -d '{"message":"คุณมีพัสดุค้างชำระ 50 บาท","channel":"SMS"}'
```

**Response:**
```json
{
  "is_scam": true,
  "risk_score": 1.0,
  "category": "parcel_scam",
  "reason": "ข้อความมีลักษณะของการแอบอ้างเป็นบริษัทขนส่ง...",
  "advice": "🚫 ไม่ควรคลิกลิงก์ใดๆ ในข้อความ..."
}
```

### Partner API

```python
import requests

API_KEY = "your-partner-api-key"
response = requests.post(
    "http://localhost:8000/v1/partner/detect/text",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"message": "ข้อความที่ต้องการตรวจสอบ"}
)
print(response.json())
```

**See [API Documentation](docs/API.md) for complete reference.**

---

## 🎨 Tech Stack

**Backend:**
- FastAPI - High-performance async API
- SQLAlchemy - Database ORM
- Pydantic - Data validation

**Frontend:**
- Vanilla HTML/CSS/JavaScript
- Inter + IBM Plex Sans Thai fonts
- Chart.js for admin analytics

**Database:**
- SQLite (development)
- PostgreSQL ready (production)

---

## 📊 Benchmark

### Dataset

ThaiScamBench includes curated datasets for research and evaluation:

- **Train:** 26 examples (70%)
- **Val:** 5 examples (15%)  
- **Test:** 7 examples (15%)
- **Labels:** 7 scam categories + normal

**Categories:**
- `parcel_scam` - Fake parcel delivery
- `banking_scam` - Bank/OTP phishing
- `prize_scam` - Fake prize/lottery
- `investment_scam` - Investment fraud
- `impersonation_scam` - Government official impersonation
- `loan_scam` - Loan scams
- `normal` - Safe messages

📖 **Full specification:** [`datasets/README.md`](datasets/README.md)

### Evaluation

Run benchmark evaluation:

```bash
# Generate dataset (first time only)
python scripts/create_dataset.py

# Run evaluation on test set
python scripts/evaluate.py --test-file datasets/test.jsonl

# Results saved to evaluation_results.json
cat evaluation_results.json
```

### Baselines

| Model | Accuracy | F1-Score | Speed | Status |
|-------|----------|----------|-------|--------|
| Keyword Matching | ~65% | ~0.62 | < 5ms | ✅ Available |
| TF-IDF + LR | TBD | TBD | ~15ms | 🚧 Planned |
| Thai BERT | TBD | TBD | ~50ms | 🚧 Planned |

📖 **Details:** [`baselines/README.md`](baselines/README.md)

### Leaderboard

**We welcome contributions!** Submit your model:

1. Fork this repo
2. Add your model to `baselines/`
3. Run evaluation: `python scripts/evaluate.py`
4. Submit PR with results

**See:** [Contributing](#-contributing)

---

## 🔒 Privacy & PDPA

ThaiScamBench is designed with privacy-first principles:

- ✅ **No message storage** - Messages deleted immediately after detection
- ✅ **Hash-based tracking** - Only SHA-256 hashes stored
- ✅ **Auto-deletion** - Data removed after 30 days
- ✅ **PDPA compliant** - Full compliance with Thai data protection law

**Full policy:** [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md)

---

## 📊 Scam Categories

| Category | Thai Name | Example |
|----------|-----------|---------|
| `parcel_scam` | พัสดุปลอม | มีพัสดุค้างชำระ |
| `fake_officer` | ปลอมเจ้าหน้าที่ | ตำรวจแจ้งมีหมายจับ |
| `loan_scam` | สินเชื่อปลอม | กู้เงินไม่ต้องค้ำ |
| `investment_scam` | ลงทุนปลอม | กำไร 30% ต่อเดือน |
| `otp_phishing` | ขอ OTP | กรุณาแจ้งรหัส OTP |
| `marketplace_scam` | ตลาดออนไลน์ | โอนก่อนส่งของ |
| `prize_scam` | รางวัลปลอม | คุณถูกรางวัล |
| `normal` | ปกติ | ข้อความทั่วไป |

---

## 🔐 Security

- **Rate Limiting:** 10 requests/min (public), 100/min (partner)
- **Authentication:** Bearer tokens for API & admin
- **Privacy:** Message hashing, auto-deletion after 30 days
- **HTTPS Ready:** SSL/TLS support for production

---

## 📈 Admin Dashboard

Access at `/admin.html` with your admin token from `.env` file (`ADMIN_TOKEN` variable)

**Features:**
- Real-time statistics
- Review uncertain cases  
- Track detection accuracy
- Export training data
- Partner analytics

---

## 🧪 Testing

```bash
# Run production tests
python scripts/production_test.py

# Run unit tests
pytest

# Check coverage
pytest --cov=app tests/
```

**Current Status:** 37% pass rate (limited by rate limiting)

---

## 🚀 Deployment

### Development
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
# Using Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Using Docker
docker-compose up -d
```

**See [Deployment Guide](docs/DEPLOYMENT.md) for details.**

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md).

**Quick Start:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- Thai scam patterns from real-world data
- Inter + IBM Plex Sans Thai fonts
- FastAPI community
- Contributors and users

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/ThaiScamBench/issues)
- **Email:** support@thaiscambench.com
- **Docs:** http://localhost:8000/docs

---

## 🗺️ Roadmap

- [ ] Machine learning model integration
- [ ] Real-time detection API
- [ ] Mobile SDKs (iOS/Android)
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Partner dashboard

---

**Made with ❤️ for Thai internet safety**
# Auto-deploy test - Fri Dec  5 15:12:06 +07 2025
