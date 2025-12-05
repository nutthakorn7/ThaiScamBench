# Docker Quick Start Guide

## 🚀 Quick Start (สำหรับ Development)

### Option 1: PostgreSQL Only (แนะนำ)

```bash
# เริ่ม PostgreSQL ด้วย Docker
docker compose up -d postgres

# รอให้ PostgreSQL พร้อม
docker compose logs -f postgres

# เชื่อมต่อกับ PostgreSQL
DATABASE_URL=postgresql://thaiscam_user:thaiscam_dev_password@localhost:5432/thaiscam

# Run migration
PYTHONPATH=/Users/pop7/Code/ThaiScamBench python3 scripts/migrate_to_postgres.py

# Run app ปกติ
uvicorn app.main:app --reload
```

### Option 2: Full Stack (PostgreSQL + Redis + API)

```bash
# เริ่มทั้งหมด
docker compose up -d

# ดู logs
docker compose logs -f api

# เข้าถึง API
curl http://localhost:8000/health
```

---

## 📋 Docker Commands

### Start Services
```bash
# เริ่มทั้งหมด
docker compose up -d

# เริ่มเฉพาะ PostgreSQL
docker compose up -d postgres

# เริ่มพร้อม logs
docker compose up
```

### Stop Services
```bash
# หยุดทั้งหมด
docker compose down

# หยุด + ลบ volumes (ข้อมูลหายหมด!)
docker compose down -v
```

### View Logs
```bash
# ดู logs ทั้งหมด
docker compose logs

# ดู logs แบบ follow
docker compose logs -f api

# ดู logs เฉพาะ postgres
docker compose logs postgres
```

### Database Access
```bash
# เข้า PostgreSQL shell
docker compose exec postgres psql -U thaiscam_user -d thaiscam

# Run SQL command
docker compose exec postgres psql -U thaiscam_user -d thaiscam -c "SELECT COUNT(*) FROM partners;"
```

---

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` or create `.env.docker`:

```env
# Database
POSTGRES_USER=thaiscam_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=thaiscam

# API
API_PORT=8000
ENVIRONMENT=dev
```

### Ports

| Service | Port | Description |
|---------|------|-------------|
| API | 8000 | FastAPI application |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache (future) |

---

## 📊 Health Checks

```bash
# Check API health
curl http://localhost:8000/health

# Check PostgreSQL
docker compose exec postgres pg_isready -U thaiscam_user

# Check Redis
docker compose exec redis redis-cli ping
```

---

## 🛠️ Development Workflow

### 1. Start PostgreSQL
```bash
docker compose up -d postgres
```

### 2. Wait for Ready
```bash
# Wait until healthy
docker compose ps
# postgres should show "healthy"
```

### 3. Run Migration
```bash
export DATABASE_URL=postgresql://thaiscam_user:thaiscam_dev_password@localhost:5432/thaiscam
python3 scripts/migrate_to_postgres.py
```

### 4. Start Development Server
```bash
# Local
uvicorn app.main:app --reload

# Or in Docker
docker compose up api
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 5432
lsof -i :5432

# Kill existing PostgreSQL
brew services stop postgresql@15
```

### Database Connection Failed
```bash
# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker compose logs postgres

# Verify credentials
docker compose exec postgres psql -U thaiscam_user -d thaiscam
```

### Reset Database
```bash
# Stop and remove volumes
docker compose down -v

# Start fresh
docker compose up -d postgres

# Re-run migration
python3 scripts/migrate_to_postgres.py
```

---

## 🚀 Production Deployment

### Build Production Image
```bash
docker build -t thaiscam-api:latest .
```

### Run Production Stack
```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up -d
```

### With Secrets
```bash
# Use Docker secrets
docker compose --env-file .env.production up -d
```

---

## ✅ Summary

**ตอนนี้มี Docker support แล้ว:**
- ✅ PostgreSQL container
- ✅ Redis container (ready for caching)
- ✅ API container
- ✅ Health checks
- ✅ Volume persistence
- ✅ Network isolation

**วิธีใช้งานง่ายๆ:**
```bash
# เริ่ม PostgreSQL
docker compose up -d postgres

# รอ 10 วินาที แล้ว run migration
sleep 10
DATABASE_URL=postgresql://thaiscam_user:thaiscam_dev_password@localhost:5432/thaiscam python3 scripts/migrate_to_postgres.py

# เริ่มทำงาน!
uvicorn app.main:app --reload
```
