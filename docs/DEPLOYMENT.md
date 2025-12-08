# 🚀 Production Deployment Guide

**ThaiScamBench Production Deployment to Linode Server**

---

## 📋 Prerequisites

### 1. GitHub Secrets Configuration

ไปที่ GitHub Repository Settings → Secrets and Variables → Actions และเพิ่ม secrets:

| Secret Name | Description | How to Get |
|:------------|:------------|:-----------|
| `LINODE_SSH_KEY` | SSH private key | `cat ~/.ssh/thaiscam_deploy` (copy entire content) |

### 2. Server Requirements

**Production Server:**
- ✅ IP: `172.104.171.16`
- ✅ OS: Ubuntu 20.04+ LTS
- ✅ Docker & Docker Compose installed
- ✅ Project directory: `/opt/thaiscam`
- ✅ SSH access with key authentication

---

## 🎯 Deployment Methods

### Method 1: GitHub Actions (Recommended) ⭐

**Best for:** Consistent, automated deployments with full CI/CD pipeline

#### Step 1: Configure GitHub Secrets

```bash
# On your local machine
cat ~/.ssh/thaiscam_deploy
# Copy the entire output
```

Then paste it as `LINODE_SSH_KEY` secret in GitHub.

#### Step 2: Trigger Deployment

1. Go to: **GitHub Repository → Actions → "🚀 Deploy to Production"**
2. Click **"Run workflow"**
3. Type **"DEPLOY"** in the confirmation box
4. Click **"Run workflow"** button

#### Step 3: Monitor Deployment

Watch the workflow progress:
- ✅ Pre-deployment validation (tests)
- ✅ Docker image build
- ✅ Deploy to server
- ✅ Health checks
- ✅ Auto-rollback on failure

**Total Time:** ~5-8 minutes

---

### Method 2: Manual SSH Deployment

**Best for:** Emergency deployments or troubleshooting

#### Quick Deploy Script

```bash
# From your local machine
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy << 'ENDSSH'
  cd /opt/thaiscam
  git pull origin main
  docker-compose down
  docker-compose up -d --build
  sleep 20
  curl -f http://localhost:8000/health && echo "✅ Deployed successfully!" || echo "❌ Health check failed"
ENDSSH
```

#### Manual Step-by-Step

```bash
# 1. SSH to server
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy

# 2. Navigate to project
cd /opt/thaiscam

# 3. Pull latest code
git pull origin main

# 4. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 5. Check health
curl http://localhost:8000/health

# 6. View logs if needed
docker-compose logs -f api
```

---

### Method 3: Automated Script (From Local Machine)

**Best for:** Quick deploys without GitHub Actions

```bash
# From project root
./scripts/deployment/deploy.sh
```

Or for Linode-specific deployment:

```bash
./scripts/deployment/deploy_linode.sh
```

---

## 🛡️ Safety Features

### 1. Manual Approval Gate

GitHub Actions workflow requires **manual confirmation**:
- Must type "DEPLOY" to proceed
- Prevents accidental deployments
- Provides time to review changes

### 2. Pre-Deployment Validation

Before deploying, the system runs:
- ✅ Unit tests (`pytest tests/unit/`)
- ✅ Integration tests (`pytest tests/integration/`)
- ✅ Security checks (`safety`, `bandit`)
- ✅ Frontend build validation

If **any test fails**, deployment is **automatically cancelled**.

### 3. Health Checks with Auto-Rollback

After deployment:
```bash
# Retry health check for 60 seconds
for i in {1..12}; do
  if curl -f http://localhost:8000/health; then
    echo "✅ Deployment successful"
    exit 0
  fi
  sleep 5
done

# If health check fails after 60s
echo "❌ Rolling back..."
docker tag thaiscambench:previous thaiscambench:latest
docker-compose up -d
```

### 4. Backup Before Deploy

```bash
# Create timestamped backup
BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
docker tag thaiscambench:latest thaiscambench:$BACKUP_TAG
```

---

## 📊 Monitoring & Verification

### Health Check

```bash
# Check API health
curl https://api.thaiscam.zcr.ai/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-08T15:30:00Z",
  "version": "0.1.0"
}
```

### View Logs

```bash
# SSH to server
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy

# View all logs
docker-compose logs -f

# View API logs only
docker-compose logs -f api

# View last 100 lines
docker-compose logs --tail=100 api
```

### Check Running Containers

```bash
docker-compose ps

# Expected output:
NAME         SERVICE      STATUS       PORTS
thaiscam-api api          running      0.0.0.0:8000->8000/tcp
thaiscam-db  postgres     running      5432/tcp
thaiscam-redis redis       running      6379/tcp
```

---

## 🔧 Common Operations

### Restart Services

```bash
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy
cd /opt/thaiscam
docker-compose restart
```

### Update Environment Variables

```bash
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy
cd /opt/thaiscam

# Edit .env file
nano .env

# Restart to apply changes
docker-compose down
docker-compose up -d
```

### Database Migrations

```bash
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy
cd /opt/thaiscam

# Run migrations
docker-compose exec api python scripts/migrations/migrate.py
```

### Cleanup Old Images

```bash
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy

# Remove unused images
docker image prune -f

# Full cleanup (careful - removes stopped containers)
docker system prune -af
```

---

## 🔄 Rollback Procedures

### Automatic Rollback

Already built into GitHub Actions workflow - triggers automatically if health check fails.

### Manual Rollback

```bash
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy
cd /opt/thaiscam

# Option 1: Rollback to previous Docker image
docker tag ghcr.io/nutthakorn7/thaiscambench:previous ghcr.io/nutthakorn7/thaiscambench:latest
docker-compose down
docker-compose up -d

# Option 2: Rollback to specific Git commit
git log --oneline  # Find commit hash
git checkout <commit-hash>
docker-compose down
docker-compose up -d --build

# Option 3: Rollback to tagged backup
docker images | grep backup  # Find backup tag
docker tag ghcr.io/nutthakorn7/thaiscambench:backup-20251208-153000 ghcr.io/nutthakorn7/thaiscambench:latest
docker-compose up -d
```

---

## ⚠️ Troubleshooting

### Issue: Deployment hangs during health check

**Solution:**
```bash
# Check if API is actually running
docker-compose ps

# Check API logs for errors
docker-compose logs api

# Common issues:
# - Database connection failed → Check DATABASE_URL in .env
# - Redis connection failed → Check REDIS_URL in .env
# - Port conflict → Check if 8000 is already in use
```

### Issue: Permission denied (SSH)

**Solution:**
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/thaiscam_deploy

# Test SSH connection
ssh -i ~/.ssh/thaiscam_deploy root@172.104.171.16 "echo 'Connection OK'"
```

### Issue: Docker out of space

**Solution:**
```bash
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy

# Check disk usage
df -h

# Clean up Docker
docker system prune -af --volumes

# If still full, check logs
du -sh /var/lib/docker/*
```

### Issue: API returning 502 Bad Gateway

**Solution:**
```bash
# Check Nginx (if using)
docker-compose logs nginx

# Check if API is listening
netstat -tlnp | grep 8000

# Restart everything
docker-compose down
docker-compose up -d
```

---

## 📈 Performance Monitoring

### Check Resource Usage

```bash
ssh root@172.104.171.16 -i ~/.ssh/thaiscam_deploy

# CPU & Memory
docker stats

# Disk usage
df -h
docker system df
```

### Database Performance

```bash
# Connect to PostgreSQL (if using)
docker-compose exec postgres psql -U postgres

# Check connection count
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('thai_scam_detector'));
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] All environment variables set in `.env`
- [ ] `ENVIRONMENT=prod` configured
- [ ] Strong `JWT_SECRET_KEY` generated
- [ ] `ADMIN_PASSWORD_HASH` set (not using plain password)
- [ ] `ADMIN_ALLOWED_IPS` configured (not empty!)
- [ ] Database credentials are secure
- [ ] `GOOGLE_API_KEY` is production key (not dev/test key)
- [ ] SSL certificates configured (if using custom domain)
- [ ] Firewall rules configured (only open necessary ports)
- [ ] Backup strategy in place

---

## 📞 Emergency Contacts

**If deployment fails and auto-rollback doesn't work:**

1. **Immediate action**: SSH to server and manually rollback
2. **Check logs**: `docker-compose logs -f`
3. **Alert team**: Notify via Slack/Discord/Email
4. **Create incident report**: Document what happened

---

## 🎯 Pre-Deployment Checklist

Use this before every production deployment:

```bash
# Local validation
- [ ] All changes tested locally
- [ ] All tests passing: pytest tests/
- [ ] Code reviewed (if team)
- [ ] CHANGELOG updated
- [ ] Version bumped in config

# GitHub validation
- [ ] GitHub Actions passing on main branch
- [ ] All secrets configured
- [ ] Backup taken (if manual deploy)

# Production validation
- [ ] Check current production status
- [ ] Notify users of upcoming deployment (if downtime expected)
- [ ] Schedule deployment during low traffic hours
- [ ] Have rollback plan ready

# Post-deployment
- [ ] Health check passed
- [ ] API docs accessible
- [ ] Admin dashboard working
- [ ] Partner API functioning
- [ ] Monitor logs for 15-30 minutes
```

---

## 📚 Related Documentation

- [API Documentation](./API.md)
- [Partner API Guide](./PARTNER_API.md)
- [Security Guidelines](./SECURITY.md)
- [Testing Guide](./TESTING.md)

---

*Last Updated: December 8, 2025*  
*Server: 172.104.171.16*  
*Deployment Method: GitHub Actions with Manual Approval*
