#!/bin/bash

# Quick Production Deployment Script
# Usage: ./scripts/deployment/quick_deploy.sh

set -e

echo "🚀 ThaiScamBench Quick Deploy"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="172.104.171.16"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/thaiscam_deploy"
PROJECT_DIR="/opt/thaiscam"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found: $SSH_KEY${NC}"
    echo "Please ensure your SSH key is at $SSH_KEY"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will deploy to PRODUCTION server${NC}"
echo "Server: $SERVER_IP"
echo ""
read -p "Type 'DEPLOY' to continue: " confirm

if [ "$confirm" != "DEPLOY" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "✅ Deployment confirmed. Starting..."
echo ""

# Test SSH connection
echo "🔐 Testing SSH connection..."
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    exit 1
fi

# Deploy
echo ""
echo "🚀 Deploying to production..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    set -e
    
    echo "📂 Navigating to project directory..."
    cd /opt/thaiscam || {
        echo "❌ Project directory not found at /opt/thaiscam"
        exit 1
    }
    
    echo "📥 Pulling latest code..."
    git pull origin main
    
    echo "🛑 Stopping old containers..."
    docker-compose down
    
    echo "🏗️  Building and starting new containers..."
    docker-compose up -d --build
    
    echo "⏳ Waiting for services to start (30s)..."
    sleep 30
    
    echo "🏥 Running health check..."
    for i in {1..10}; do
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ Health check PASSED!"
            echo ""
            echo "========================================="
            echo "✅ DEPLOYMENT SUCCESSFUL!"
            echo "========================================="
            echo "🌐 API: https://api.thaiscam.zcr.ai"
            echo "📊 Docs: https://api.thaiscam.zcr.ai/docs"
            echo ""
            docker-compose ps
            exit 0
        fi
        echo "Retry $i/10..."
        sleep 3
    done
    
    echo "❌ Health check FAILED"
    echo "Rolling back..."
    docker-compose down
    docker-compose up -d
    exit 1
ENDSSH

# Check deployment result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  - Check API: https://api.thaiscam.zcr.ai/health"
    echo "  - View docs: https://api.thaiscam.zcr.ai/docs"
    echo "  - Monitor logs: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'cd /opt/thaiscam && docker-compose logs -f'"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check server logs for details"
    exit 1
fi
