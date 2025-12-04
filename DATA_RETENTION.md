# Data Retention & Cleanup - Cron Job Setup

## Overview
Automated cleanup script for PDPA compliance - deletes/anonymizes old data according to retention policy.

## Retention Policy

| Data Type | Retention Period | Action After Period |
|-----------|------------------|---------------------|
| Message Hash | 30 days | **Delete** completely |
| Detection Details | 90 days | **Anonymize** (remove hash, keep stats) |
| Feedback | 180 days | **Delete** |
| Partner Data | 1 year after closure | **Delete** |

## Setup Instructions

### 1. Test the Script

```bash
# Dry run (check what would be deleted)
python scripts/cleanup_old_data.py

# Check the logs
tail -f logs/cleanup.log
```

### 2. Setup Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/ThaiScamBench && /path/to/venv/bin/python scripts/cleanup_old_data.py >> logs/cleanup.log 2>&1
```

### 3. Setup Task Scheduler (Windows)

```powershell
# Create scheduled task
schtasks /create /tn "ThaiScamCleanup" /tr "C:\path\to\python.exe C:\path\to\cleanup_old_data.py" /sc daily /st 02:00
```

### 4. Setup with Docker

Add to `docker-compose.yml`:

```yaml
services:
  cleanup:
    image: python:3.9
    volumes:
      - ./:/app
    working_dir: /app
    command: python scripts/cleanup_old_data.py
    environment:
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      restart_policy:
        condition: none
```

Run with cron:
```bash
0 2 * * * docker-compose run --rm cleanup
```

## Monitoring

### Check Cleanup Status

```bash
# View last cleanup
tail -100 logs/cleanup.log

# Check database stats
sqlite3 thai_scam_detector.db "
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN message_hash = 'ANONYMIZED' THEN 1 END) as anonymized,
    COUNT(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 END) as recent
FROM detections;
"
```

### Alerts

Set up monitoring alerts for:
- Cleanup script failures
- Unexpected data growth
- Retention policy violations

## Emergency Operations

### Force Delete All Old Data

```bash
python scripts/cleanup_old_data.py --force --days 0
```

### Restore from Backup

```bash
# If cleanup was too aggressive
cp thai_scam_detector.db.backup thai_scam_detector.db
```

## PDPA Compliance Checklist

- [x] Message hashes deleted after 30 days
- [x] Detection details anonymized after 90 days  
- [x] Feedback deleted after 180 days
- [x] Automated cleanup runs daily
- [x] Cleanup logs retained for audit
- [x] Database backups before cleanup
- [x] Data recovery procedure documented

## Verification

```bash
# Verify retention policy is working
python -c "
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.database import Detection

db = SessionLocal()
old_count = db.query(Detection).filter(
    Detection.created_at < datetime.utcnow() - timedelta(days=30)
).count()

print(f'Detections older than 30 days: {old_count}')
print('Should be 0 if cleanup is working!')
"
```

## Troubleshooting

**Problem:** Script fails with database locked

**Solution:**
```bash
# Ensure no other processes are using the database
lsof thai_scam_detector.db
# Run cleanup during low-traffic hours
```

**Problem:** Too much data being deleted

**Solution:**
- Review retention policy in `RETENTION_POLICY` dict
- Increase retention periods if needed
- Check backup before running cleanup

**Problem:** Script runs but nothing is deleted

**Solution:**
- Check if data is actually older than retention period
- Verify database connection
- Check script permissions

## Legal & Compliance

This cleanup script helps comply with:
- ✅ PDPA (Thailand) - Personal Data Protection Act
- ✅ GDPR (EU) - Right to be forgotten
- ✅ Data minimization principle
- ✅ Storage limitation principle

## Next Steps

1. Set up the cron job
2. Monitor first few runs
3. Verify data retention works as expected
4. Document in operations runbook
5. Train team on data retention policies
