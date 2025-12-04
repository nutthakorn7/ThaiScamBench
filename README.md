# 🔍 Thai Scam Detection System

ระบบตรวจจับข้อความหลอกลวงภาษาไทย - Thai Scam Message Detection System

## 📋 Overview

A FastAPI-based backend service for detecting scam messages in Thai language. The system analyzes text messages and identifies potential scams across various categories including parcel scams, banking fraud, prize scams, investment fraud, and impersonation.

## ✨ Features

- ✅ **Multi-Category Detection** - Detects 5+ types of common Thai scams
- ✅ **Risk Scoring** - Provides 0-1 risk probability scores
- ✅ **AI Explanations** - Explains why a message is flagged as scam
- ✅ **Safety Advice** - Provides actionable recommendations
- ✅ **Thai Language Support** - Full Thai language interface
- ✅ **RESTful API** - Easy integration with any frontend

## 🏗️ Architecture

### Milestone 0 - Core Backend (Current)

```
app/
├── main.py              # FastAPI application entry point
├── config.py            # Environment-based configuration
├── models/
│   └── schemas.py       # Pydantic request/response models
├── services/
│   ├── scam_classifier.py   # Mock scam detection logic
│   └── llm_explainer.py     # Mock LLM explanations
└── routes/
    ├── health.py        # Health check endpoint
    └── detection.py     # Scam detection endpoint
```

### Current Implementation

- **Classifier**: Mock keyword-based detection (ready for ML model integration)
- **Explainer**: Static Thai language responses (ready for LLM API integration)

### Future Milestones

- **Milestone 1**: Real ML model integration (HuggingFace, etc.)
- **Milestone 2**: LLM API integration (OpenAI, Anthropic, etc.)
- **Milestone 3**: Frontend UI development
- **Milestone 4**: Database and analytics

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- pip

### Installation

1. **Clone the repository**
```bash
cd ThaiScamBench
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Setup environment**
```bash
cp .env.example .env
# Edit .env if needed
```

### Running the Application

**Development mode** (with auto-reload):
```bash
uvicorn app.main:app --reload
```

**Production mode**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## 📡 API Usage

### Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "model_version": "mock-v1.0",
  "llm_version": "mock-v1.0",
  "environment": "dev"
}
```

### Detect Scam

```bash
curl -X POST http://localhost:8000/api/v1/detect \
  -H "Content-Type: application/json" \
  -d '{
    "message": "คุณมีพัสดุค้างชำระ กรุณาคลิกลิงก์เพื่อชำระเงิน: https://fake-site.com"
  }'
```

Response:
```json
{
  "is_scam": true,
  "risk_score": 0.85,
  "category": "parcel_scam",
  "reason": "ข้อความมีลักษณะของการแอบอ้างเป็นบริษัทขนส่ง...",
  "advice": "🚫 ไม่ควรคลิกลิงก์ใดๆ ในข้อความ..."
}
```

## 🎯 Scam Categories

| Category | Thai Name | Description |
|----------|-----------|-------------|
| `parcel_scam` | การหลอกลวงเกี่ยวกับพัสดุ | Fake parcel delivery messages |
| `banking_scam` | การหลอกลวงเกี่ยวกับธนาคาร | Banking/card verification fraud |
| `prize_scam` | การหลอกลวงด้วยรางวัล | Fake prize/lottery scams |
| `investment_scam` | การหลอกลวงการลงทุน | Investment fraud |
| `impersonation_scam` | การแอบอ้างเป็นเจ้าหน้าที่ | Government official impersonation |

## ⚙️ Configuration

Environment variables (`.env`):

```bash
# Environment
ENVIRONMENT=dev          # dev or prod

# Logging
LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR

# Model
MODEL_VERSION=mock-v1.0
SCAM_CLASSIFIER_TYPE=mock

# LLM
LLM_VERSION=mock-v1.0
LLM_PROVIDER=mock
OPENAI_API_KEY=         # For future LLM integration

# Service
API_TITLE=Thai Scam Detection API
API_VERSION=0.1.0
API_HOST=0.0.0.0
API_PORT=8000
```

## 🛠️ Development

### Project Structure

- `app/main.py` - FastAPI app with middleware and routers
- `app/config.py` - Settings management with Pydantic
- `app/models/schemas.py` - Request/response data models
- `app/services/` - Business logic layer
- `app/routes/` - API endpoint definitions

### Adding New Scam Patterns

Edit `app/services/scam_classifier.py`:

```python
SCAM_PATTERNS = {
    "your_category": ["keyword1", "keyword2", "keyword3"],
}
```

Edit `app/services/llm_explainer.py`:

```python
MOCK_EXPLANATIONS = {
    "your_category": {
        "reason": "เหตุผล...",
        "advice": "คำแนะนำ..."
    }
}
```

## 🗺️ Roadmap

- [x] **Milestone 0** - Core Backend & Mock Services
- [ ] **Milestone 1** - Real ML Model Integration
- [ ] **Milestone 2** - LLM API Integration (OpenAI/Anthropic)
- [ ] **Milestone 3** - Frontend UI
- [ ] **Milestone 4** - Database & Analytics
- [ ] **Milestone 5** - User Reporting & Feedback
- [ ] **Milestone 6** - Production Deployment

## 📝 License

[Add your license here]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ for Thai internet safety**
