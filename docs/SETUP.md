# 🔧 Setup Guide

Complete installation and setup instructions for ThaiScamBench.

---

## System Requirements

- **OS:** Linux, macOS, or Windows
- **Python:** 3.9 or higher
- **RAM:** 2GB minimum
- **Disk:** 500MB free space

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ThaiScamBench.git
cd ThaiScamBench
```

### 2. Create Virtual Environment

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Initialize Database

```bash
python -c "from app.database import init_db; init_db()"
```

This creates `thai_scam_detector.db` with the required schema.

### 5. Start Server

```bash
uvicorn app.main:app --reload
```

Server will start at: http://localhost:8000

---

## Configuration

### Environment Variables

Create `.env` file:

```bash
# Environment
ENVIRONMENT=dev

# Logging
LOG_LEVEL=INFO

# API Server
API_HOST=0.0.0.0
API_PORT=8000

# Database
DATABASE_URL=sqlite:///./thai_scam_detector.db

# Authentication
ADMIN_TOKEN=admin-secret-key-2024
SECRET_KEY=your-secret-key-change-in-production

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60

# Model Configuration
MODEL_VERSION=mock-v1.0
SCAM_CLASSIFIER_TYPE=mock
```

### Production Settings

```bash
# .env.production
ENVIRONMENT=prod
LOG_LEVEL=WARNING
DATABASE_URL=postgresql://user:pass@localhost/thaiscam
ADMIN_TOKEN=<strong-random-token>
SECRET_KEY=<strong-random-key>
RATE_LIMIT_REQUESTS=100
```

---

## Database Setup

### SQLite (Development)

Automatically created on first run. No additional setup needed.

### PostgreSQL (Production)

```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Create database
sudo -u postgres createdb thaiscam
sudo -u postgres createuser scam_user

# Update .env
DATABASE_URL=postgresql://scam_user:password@localhost/thaiscam
```

---

## Running the Application

### Development Mode

```bash
# With auto-reload
uvicorn app.main:app --reload

# With custom host/port
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# With debug logging
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

### Production Mode

```bash
# Using Gunicorn (recommended)
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000

# Using Docker
docker-compose up -d
```

---

## Verification

### 1. Check Health

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy"}`

### 2. Test Detection

```bash
curl -X POST http://localhost:8000/v1/public/detect/text \
  -H "Content-Type: application/json" \
  -d '{"message":"สวัสดี","channel":"SMS"}'
```

### 3. Access Web UI

Open browser: http://localhost:8000

### 4. Access API Docs

Open browser: http://localhost:8000/docs

### 5. Test Admin Dashboard

1. Go to: http://localhost:8000/admin.html
2. Enter token: `admin-secret-key-2024`
3. Should see dashboard stats

---

## Troubleshooting

### Port Already in Use

```bash
# Linux/macOS - Find and kill process
lsof -i :8000
kill -9 <PID>

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --port 8080
```

### Import Errors

```bash
# Reinstall dependencies
pip install --force-reinstall -r requirements.txt

# Check Python version
python --version  # Should be 3.9+
```

### Database Errors

```bash
# Delete and reinitialize
rm thai_scam_detector.db
python -c "from app.database import init_db; init_db()"
```

### Permission Errors

```bash
# Linux/macOS
chmod +x scripts/*.py
chmod +x scripts/*.sh
```

---

## Testing

### Run Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=app tests/

# Specific test
pytest tests/test_detection.py

# Production tests
python scripts/production_test.py
```

---

## Docker Setup (Optional)

### Build Image

```bash
docker build -t thaiscambench .
```

### Run Container

```bash
docker run -p 8000:8000 thaiscambench
```

### Docker Compose

```bash
docker-compose up -d
```

---

## Updating

### Pull Latest Changes

```bash
git pull origin main
```

### Update Dependencies

```bash
pip install --upgrade -r requirements.txt
```

### Migrate Database

```bash
# If schema changes
python scripts/migrate_database.py
```

---

## Uninstallation

```bash
# Deactivate virtual environment
deactivate

# Remove project directory
cd ..
rm -rf ThaiScamBench
```

---

## Next Steps

- [API Documentation](API.md)
- [Admin Guide](../ADMIN_REVIEW_GUIDE.md)
- [Contributing Guide](CONTRIBUTING.md)

---

## Support

Having issues? 

1. Check [GitHub Issues](https://github.com/yourusername/ThaiScamBench/issues)
2. Read [FAQ](FAQ.md)
3. Contact: support@thaiscambench.com
