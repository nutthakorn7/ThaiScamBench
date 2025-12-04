#!/bin/bash
set -e

echo "🚀 Deploying Thai Scam Detection System..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Environment check
echo -e "${YELLOW}Step 1: Checking environment...${NC}"
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "Copy .env.production.example and configure it first"
    exit 1
fi
echo -e "${GREEN}✓ Environment file found${NC}"

# Step 2: Build Docker images
echo -e "${YELLOW}Step 2: Building Docker images...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✓ Images built${NC}"

# Step 3: Stop existing containers
echo -e "${YELLOW}Step 3: Stopping existing containers...${NC}"
docker-compose down
echo -e "${GREEN}✓ Containers stopped${NC}"

# Step 4: Start services
echo -e "${YELLOW}Step 4: Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"

# Step 5: Wait for API to be ready
echo -e "${YELLOW}Step 5: Waiting for API to be ready...${NC}"
for i in {1..30}; do
    if curl -sf http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✓ API is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API failed to start"
        docker-compose logs api
        exit 1
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Step 6: Setup SSL (optional)
echo -e "${YELLOW}Step 6: SSL Certificate Setup${NC}"
read -p "Do you want to setup Let's Encrypt SSL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name: " DOMAIN
    docker-compose run --rm certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN
    
    # Restart nginx to load certificates
    docker-compose restart nginx
    echo -e "${GREEN}✓ SSL certificate installed${NC}"
else
    echo "Skipping SSL setup"
fi

# Step 7: Initialize database
echo -e "${YELLOW}Step 7: Initializing database...${NC}"
docker-compose exec api python scripts/init_db.py
echo -e "${GREEN}✓ Database initialized${NC}"

# Step 8: Display status
echo -e "${YELLOW}Step 8: Checking service status...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Services:"
echo "  - API: http://localhost:8000"
echo "  - Health: http://localhost:8000/health"
echo "  - Docs: http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  docker-compose logs -f api"
echo "  docker-compose logs -f nginx"
echo ""
echo "Management:"
echo "  docker-compose stop    # Stop services"
echo "  docker-compose start   # Start services"
echo "  docker-compose down    # Remove containers"
echo ""
