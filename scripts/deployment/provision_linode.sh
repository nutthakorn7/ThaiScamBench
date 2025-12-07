#!/bin/bash

# Linode Server Provisioning Script
# Run this script on your Linode instance to set up the server

set -e

echo "========================================="
echo "ThaiScamBench Linode Server Setup"
echo "========================================="

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🐙 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install essential tools
echo "🛠️  Installing tools..."
sudo apt-get install -y \
    git \
    curl \
    wget \
    htop \
    nload \
    vim \
    ufw \
    fail2ban

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
echo "🛡️  Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/thaiscam
sudo chown $USER:$USER /opt/thaiscam
cd /opt/thaiscam

# Clone repository
echo "📥 Cloning repository..."
read -p "Enter your GitHub repository URL: " REPO_URL
git clone $REPO_URL .

# Create .env file
echo "📝 Creating .env file..."
cat > .env.prod << 'EOF'
# PostgreSQL
POSTGRES_USER=thaiscam_user
POSTGRES_PASSWORD=CHANGE_ME_SECURE_PASSWORD
POSTGRES_DB=thaiscam

# Redis
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD

# GitHub (for Docker image)
GITHUB_REPO=your-username/ThaiScamBench

# API
JWT_SECRET_KEY=CHANGE_ME_JWT_SECRET
ADMIN_PASSWORD_HASH=CHANGE_ME_HASH
ADMIN_ALLOWED_IPS=your.server.ip

# Domain
DOMAIN=api.thaiscamdetector.com
EOF

echo ""
echo "✅ Basic setup complete!"
echo ""
echo "⚠️  IMPORTANT: Next steps:"
echo "1. Edit /opt/thaiscam/.env.prod and update all CHANGE_ME values"
echo "2. Generate secure passwords: openssl rand -base64 32"
echo "3. Generate JWT secret: python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
echo "4. Hash admin password: python3 scripts/utils/hash_password.py"
echo "5. Set up SSH key for GitHub Actions (see deploy guide)"
echo "6. Configure domain DNS to point to this server"
echo "7. Run: ./scripts/deployment/deploy_linode.sh"
echo ""
