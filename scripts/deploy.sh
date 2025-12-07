#!/bin/bash

# Deployment Script for ThaiScamBench
# Usage: ./scripts/deploy.sh

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest changes..."
git pull origin main

# 2. Stop old containers
echo "🛑 Stopping old containers..."
docker-compose down

# 3. Prune unused images (save space)
echo "🧹 Cleaning up..."
docker system prune -f

# 4. Build and Start new containers (Production Mode)
echo "🏗️ Building and Starting server..."
docker-compose up -d --build

# 5. Check status
echo "✅ Deployment Complete! Status:"
docker-compose ps
