# 🛡️ ThaiScamBench (World Class Edition)

**The Gold Standard in Thai Scam Detection & Prevention**

A production-grade, AI-powered scam detection platform featuring a modern **Next.js 14 Frontend**, **FastAPI Backend**, and enterprise-grade **Security**.

[![Next.js](https://img.shields.io/badge/Front--End-Next.js_14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Back--End-FastAPI-teal)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-green)](https://thaiscambench.com)

---

## ✨ Key Features (New!)

### 🎨 World-Class UX
- **Dynamic Hero**: Interactive 3D typewriter effects and aurora backgrounds.
- **Glassmorphism 2.0**: Premium frosted glass aesthetics across the entire UI.
- **Responsive Design**: Mobile-perfect touch targets (>44px) and fluid grids.

### 🚀 Interactive Detection
- **Radar Scanning**: High-tech scanning animations (no more boring spinners).
- **Instant Haptics**: Screen shake for danger, confetti detonation for safe results.
- **Staggered Results**: Data points reveal sequentially for maximum impact.

### 📊 Enterprise Dashboard
- **Real-Time Ticker**: Live view of detection events as they happen (`/stats/recent`).
- **Interactive Analytics**: Rich `recharts` Area Charts visualizing 7-month trends.
- **Data Integration**: Connected directly to PostgreSQL for live insights.

### 🛡️ Pro Security
- **NextAuth.js**: Secure, session-based authentication for admins.
- **Middleware**: Server-side route protection for all `/admin` paths.
- **Rate Limiting**: Intelligent throttling per IP and Partner API key.

---

## 🛠️ Tech Stack

| Component | Technology | Highlights |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14** (App Router) | React Server Components, TailwindCSS v4, Framer Motion |
| **Backend** | **Python 3.9 + FastAPI** | Async, SQLAlchemy, Pydantic v2 |
| **Database** | **PostgreSQL** | Relational data, optimized indexing |
| **Auth** | **NextAuth.js** | Credential provider, Secure HTTP-only cookies |
| **Ops** | **Docker** | Multi-stage builds, CI/CD with GitHub Actions |

---

## 🚀 Quick Start

### 1. Requirements
- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.9+ (for local backend dev)

### 2. Run with Docker (Recommended)
```bash
# Start all services (Frontend + Backend + DB)
docker-compose up -d --build
```
Access the app at **http://localhost:3000**.

### 3. Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security

This project implements **Phase 5 Security Standards**:
1.  **Strict Middleware**: Unauthenticated users are strictly blocked from `/admin`.
2.  **Environment Isolation**: Secrets are loaded from `.env` only (see `.env.example`).
3.  **Hashed Tokens**: API keys are hashed SHA-256 before storage.

---

## 🤝 Partners & API

Partners can integrate using our secure REST API:
```http
POST /api/partner/detect
Authorization: Bearer <YOUR_API_KEY>
Content-Type: application/json

{
  "message": "คุณได้รับรางวัล 1,000 บาท"
}
```

---

## 📄 License
MIT License © 2024 ThaiScamBench Team

**Made with ❤️ for Thai Internet Safety**
