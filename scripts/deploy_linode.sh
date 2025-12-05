#!/bin/bash

# Deployment script for Linode
# Run this after provision_linode.sh

set -e

cd /opt/thaiscam

echo "========================================="
echo "ThaiScamBench Deployment"
echo "========================================="

# Load environment variables
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
else
    echo "❌ .env.prod не найден!"
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Log in to GitHub Container Registry
echo "🔐 Logging in to GitHub Container Registry..."
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Enter your GitHub Personal Access Token (with read:packages permission):"
    read -s GITHUB_TOKEN
fi
echo $GITHUB_TOKEN | docker login ghcr.io -u $(git config user.name) --password-stdin

# Pull latest images
echo "🐳 Pulling latest Docker images..."
docker compose -f docker-compose.prod.yml pull

# Start services
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 20

# Check health
echo "🏥 Checking API health..."
if curl -f http://localhost:8000/health; then
    echo "✅ API is healthy!"
else
    echo "❌ API health check failed!"
    docker compose -f docker-compose.prod.yml logs api
    exit 1
fi

# Set up SSL (first time only)
if [ ! -d "./certbot/conf/live/$DOMAIN" ]; then
    echo "🔒 Setting up SSL certificate..."
    docker compose -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        -d $DOMAIN \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email
    
    # Reload Nginx
    docker compose -f docker-compose.prod.yml restart nginx
fi

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "🌐 Your API is now running at:"
echo "   http://$DOMAIN"
echo "   https://$DOMAIN (if SSL configured)"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "   Restart:      docker compose -f docker-compose.prod.yml restart"
echo "   Stop:         docker compose -f docker-compose.prod.yml down"
echo "   Update:       git pull && docker compose -f docker-compose.prod.yml up -d"
echo ""
