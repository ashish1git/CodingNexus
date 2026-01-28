#!/bin/bash

# CodingNexus Quick Deployment Script
# This script helps you quickly deploy or update your CodingNexus application

set -e  # Exit on error

echo "🚀 CodingNexus Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    if [ -f .env.production.example ]; then
        echo "Creating .env.production from example..."
        cp .env.production.example .env.production
        echo -e "${YELLOW}⚠️  Please edit .env.production with your actual values${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.production.example not found${NC}"
        exit 1
    fi
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node --version)"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm --version)"

# Check PM2
if ! command_exists pm2; then
    echo -e "${YELLOW}⚠️  PM2 is not installed. Installing...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓${NC} PM2 installed"

echo ""
echo "📦 Installing dependencies..."
npm ci

echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo ""
echo "🏗️  Building frontend..."
npm run build

echo ""
echo "🔄 Managing PM2 processes..."

# Check if PM2 process exists
if pm2 describe codingnexus > /dev/null 2>&1; then
    echo "Restarting existing PM2 process..."
    pm2 restart ecosystem.config.js
else
    echo "Starting new PM2 process..."
    pm2 start ecosystem.config.js
fi

echo ""
echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "📊 Current PM2 status:"
pm2 status

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 logs codingnexus        - View application logs"
echo "  pm2 monit                    - Monitor application"
echo "  pm2 restart codingnexus      - Restart application"
echo "  pm2 stop codingnexus         - Stop application"
echo ""
echo "To enable PM2 startup on system boot:"
echo "  pm2 startup"
echo "  (follow the instructions shown)"
