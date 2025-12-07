#!/bin/bash
# Quick fix script for database schema issue

echo "🔧 Fixing Database Schema..."
echo "================================"

# Backup existing databases
echo "📦 Backing up existing databases..."
if [ -f "thai_scam_detector.db" ]; then
    cp thai_scam_detector.db "thai_scam_detector.db.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backed up thai_scam_detector.db"
fi

if [ -f "test.db" ]; then
    cp test.db "test.db.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backed up test.db"
fi

# Remove old databases
echo ""
echo "🗑️  Removing old database files..."
rm -f thai_scam_detector.db test.db
echo "✅ Removed old databases"

# Reinitialize database with current schema
echo ""
echo "🏗️  Reinitializing database with current schema..."
python3 << EOF
from app.database import init_db
from app.models import database  # Import all models

print("Creating database tables...")
init_db()
print("✅ Database initialized successfully!")
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✅ Database schema fixed!"
    echo ""
    echo "Next steps:"
    echo "1. Restart the server: uvicorn app.main:app --reload"
    echo "2. Test the API: curl http://localhost:8000/health"
    echo "3. Run production tests: python scripts/maintenance/production_test.py"
    echo "================================"
else
    echo ""
    echo "❌ Error initializing database"
    echo "Please check the error messages above"
    exit 1
fi
