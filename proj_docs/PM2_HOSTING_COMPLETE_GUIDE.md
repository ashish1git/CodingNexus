# 🚀 PM2 Hosting Setup - Complete Guide

**Your Current Hosting**: PM2 on College Server  
**Status**: ✅ Fully Configured  

---

## 📊 Your Complete Architecture

```
┌─────────────────────────────────────────┐
│        Internet / Users                 │
└──────────────────┬──────────────────────┘
                   │
        Uses HTTPS (Port 443)
                   │
        ┌──────────▼─────────┐
        │  Apache/Nginx      │
        │  Reverse Proxy     │
        │  (Port 80/443)     │
        │                    │
        │ • Serves frontend  │
        │ • Routes /api      │
        │ • SSL/TLS          │
        └──────────┬─────────┘
                   │
        Routes to localhost:21000
                   │
        ┌──────────▼──────────────────┐
        │    PM2 Daemon                │
        │    ecosystem.config.cjs      │
        │                              │
        │  codingnexus-server         │
        │  └─ node server/index.js    │
        │     ├─ Express API          │
        │     ├─ Vite Frontend (dist/)│
        │     └─ Port 21000           │
        │                              │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────┐
        │   PostgreSQL 15         │
        │   Port 5432             │
        │   Database Connection   │
        └─────────────────────────┘
```

---

## 🔧 PM2 Configuration (What You Have)

### File: `ecosystem.config.cjs`
```javascript
module.exports = {
  apps: [
    {
      name: 'codingnexus-server',        // App name in PM2
      script: './server/index.js',       // Entry point
      instances: 1,                      // Single process (can scale to 'max')
      exec_mode: 'fork',                 // Process manager mode
      
      env: {                             // Environment variables
        NODE_ENV: 'production',
        PORT: 21000
      },
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart settings
      max_memory_restart: '1G',          // Restart if exceeds 1GB
      autorestart: true,                 // Auto-restart on crash
      watch: false,                      // Don't watch file changes
      max_restarts: 10,                  // Max crash restarts
      min_uptime: '10s'                  // Minimum uptime between restarts
    }
  ]
};
```

### Key Settings Explained
```
name: 'codingnexus-server'
  └─ Shows up as this in: pm2 ps

script: './server/index.js'
  └─ Run this Node.js file

instances: 1
  └─ 1 = Single process
  └─ 'max' = Use all CPU cores

PORT: 21000
  └─ Backend listens here
  └─ Reverse proxy forwards from 80/443

max_memory_restart: '1G'
  └─ If uses > 1GB RAM, auto-restart
  └─ Prevents memory leaks

autorestart: true
  └─ When app crashes, PM2 restarts it
  └─ max_restarts: 10 (max 10 auto-restarts)
```

---

## 🏗️ Reverse Proxy Setup (Nginx Recommended)

### Why You Need Reverse Proxy?
```
User access:    http://yourdomain.com:80
    ↓
Nginx listens:  Port 80
    ↓
Hides port:     localhost:21000
    ↓
Serves:         Frontend (static files)
                Backend (/api routes)
    ↓
SSL/TLS:        Encrypts with HTTPS
    ↓
Response:       Back to user
```

### Nginx Configuration (Recommended)

**File**: `/etc/nginx/sites-available/codingnexus`

```nginx
# Upstream backend server
upstream codingnexus_backend {
    server localhost:21000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server (production)
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend static files
    location / {
        root /home/user/codingnexus/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://codingnexus_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
```

### Enable Nginx Configuration
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/codingnexus /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Or restart if needed
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### If You Have Apache Instead

**File**: `/etc/apache2/sites-available/codingnexus.conf`

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # SSL certificates
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # DocumentRoot for frontend
    DocumentRoot /home/user/codingnexus/dist
    
    # Enable proxy modules (must be enabled: a2enmod proxy, a2enmod rewrite)
    ProxyPreserveHost On
    
    # API proxy
    ProxyPass /api http://localhost:21000
    ProxyPassReverse /api http://localhost:21000
    
    # Frontend SPA routing
    <Directory /home/user/codingnexus/dist>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### Enable Apache Configuration
```bash
# Enable proxy modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite

# Enable SSL module (if using HTTPS)
sudo a2enmod ssl

# Enable site
sudo a2ensite codingnexus

# Disable default site (if needed)
sudo a2dissite 000-default

# Test configuration
sudo apache2ctl configtest
# Expected: Syntax OK

# Restart Apache
sudo systemctl restart apache2

# Check status
sudo systemctl status apache2
```

---

## 🎯 Step-by-Step PM2 Deployment

### 1. Initial Setup (First Time)

```bash
# SSH into server
ssh user@yourserver.com

# Navigate to project
cd ~/codingnexus

# 1. Install dependencies
npm ci

# 2. Create logs directory
mkdir -p logs

# 3. Build frontend
npm run build

# 4. Setup database (if new)
npx prisma migrate deploy

# 5. Start with PM2
pm2 start ecosystem.config.cjs

# 6. Save PM2 state (auto-restart on server reboot)
pm2 save

# 7. Setup PM2 restart on server boot
pm2 startup

# Verify
pm2 ps
```

### 2. Daily Development (No Changes)

```bash
npm run dev:all

# Frontend: http://localhost:22000
# Backend: http://localhost:21000
```

### 3. Redeployment (When you push new code)

```bash
# On your local machine
git add .
git commit -m "New feature"
git push origin main

# Workflow triggers (deploy.yml or deploy-self-hosted.yml)
# OR manually SSH to server:

ssh user@yourserver.com
cd ~/codingnexus

# Pull latest code
git pull origin main

# Install new dependencies (if any)
npm ci

# Build frontend
npm run build

# Run migrations (if database schema changed)
npx prisma migrate deploy

# Restart PM2 with new code
pm2 restart ecosystem.config.cjs

# Verify
pm2 logs codingnexus-server
```

---

## 📋 PM2 Commands for Daily Use

### View Status
```bash
# List all processes
pm2 ps

# Show detailed info
pm2 info codingnexus-server

# Check logs
pm2 logs codingnexus-server

# Follow logs real-time
pm2 logs codingnexus-server --lines 100 --follow

# Monitor (CPU, memory, etc)
pm2 monit
```

### Control App
```bash
# Start
pm2 start ecosystem.config.cjs

# Stop
pm2 stop codingnexus-server

# Restart
pm2 restart codingnexus-server

# Delete from PM2
pm2 delete codingnexus-server
```

### Save & Auto-Restart
```bash
# Save current state
pm2 save

# Auto-restart after server reboot
pm2 startup
# Then copy and run the command it outputs

# Remove from startup
pm2 unstartup
```

---

## 🔒 Environment Variables (PM2)

### Create `.env` on Server

```bash
# On server
ssh user@yourserver.com
cd ~/codingnexus

# Create .env file
nano .env

# Add production values:
```

**Content of `.env`**:
```env
# Database (production)
DATABASE_URL="postgresql://prod_username:secure_password@prod_db_host:5432/codingnexus?sslmode=require"

# Server
NODE_ENV="production"
PORT=21000

# Auth
JWT_SECRET="generate_secure_random_string_64_characters_long"
JWT_EXPIRES_IN="7d"

# Frontend (your domain)
FRONTEND_URL="https://yourdomain.com"
VITE_API_URL="https://yourdomain.com/api"

# External Services
JUDGE0_URL="http://64.227.149.20:2358"

# Email
BREVO_API_KEY="your_brevo_api_key"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Coding Nexus"

# File Uploads
CLOUDINARY_CLOUD_NAME="your_cloud"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"

# Async Submissions
ENABLE_POLLING="false"
POLL_INTERVAL="15000"

# Maintenance
MAINTENANCE_MODE="false"
```

### Verify Variables Loaded
```bash
# SSH into server
ssh user@yourserver.com
cd ~/codingnexus

# Check if env vars loaded
pm2 start ecosystem.config.cjs --env .env

# View in logs
pm2 logs codingnexus-server | head -20

# Should see: "✅ Database connected successfully"
```

---

## 🧪 Testing Your Deployment

### 1. Check Backend
```bash
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

### 2. Check Frontend
```bash
# Open in browser:
https://yourdomain.com

# Should load React app
```

### 3. Check PM2 App
```bash
ssh user@yourserver.com
pm2 ps

# Expected:
# │ codingnexus-server │ node ./server/index.js │ 1 │ online │ 0     │ 0B     
```

### 4. Check Logs
```bash
ssh user@yourserver.com
pm2 logs codingnexus-server --lines 50

# Look for:
# ✅ Database connected successfully
# 🚀 Server running on port 21000
```

---

## ⚠️ Troubleshooting

### App Crashes After Restart
```bash
pm2 logs codingnexus-server

# Common issues:
# - DATABASE_URL not set → Add to .env
# - JWT_SECRET not set → Add to .env
# - Port 21000 already in use → Kill process: lsof -i :21000
```

### Can't Connect to Database
```bash
# On server
ssh user@yourserver.com

# Check if .env exists
cat .env | grep DATABASE_URL

# Test connection directly
psql "your_database_url_here"

# If fails, verify credentials
```

### Nginx/Apache Not Working
```bash
# Nginx
sudo nginx -t        # Test config
sudo systemctl status nginx
sudo systemctl reload nginx

# Apache
sudo apache2ctl configtest
sudo systemctl status apache2
sudo systemctl restart apache2
```

### Memory Usage Too High
```bash
# Check memory
pm2 monit

# If exceeds max_memory_restart (1G):
# PM2 will auto-restart

# To increase limit:
# Edit ecosystem.config.cjs
# Change: max_memory_restart: '2G'
# Then: pm2 restart ecosystem.config.cjs
```

---

## 📊 Your Setup Comparison

| Aspect | Your PM2 Setup | Docker Alternative |
|--------|---|---|
| **Location** | College server | Anywhere with Docker |
| **Management** | PM2 | docker-compose |
| **Restart** | pm2 restart | docker-compose restart |
| **Logs** | pm2 logs | docker logs |
| **Config** | .env file | .env.docker + .env |
| **Database** | PostgreSQL service | PostgreSQL container |
| **Frontend** | dist/ folder | Container dist/ |
| **Reverse Proxy** | Apache/Nginx | Nginx container |
| **Simplicity** | Simpler now | Easier later |

---

## ✅ Checklist Before Going Live

- [ ] PM2 installed on server
- [ ] Node.js 20+ installed
- [ ] PostgreSQL running with correct database
- [ ] .env file created with production values
- [ ] npm ci completed (dependencies installed)
- [ ] npm run build completed (frontend built)
- [ ] pm2 start ecosystem.config.cjs runs without errors
- [ ] pm2 logs shows "Server running on port 21000"
- [ ] Nginx/Apache configured and running
- [ ] HTTPS certificate installed (Let's Encrypt)
- [ ] API health check passes: curl https://yourdomain.com/api/health
- [ ] Frontend loads: https://yourdomain.com
- [ ] pm2 save && pm2 startup configured
- [ ] Log files will persist: logs/ directory exists

---

## 🎯 Quick Reference

```bash
# Development (your machine)
npm run dev:all

# Production (on server)
pm2 start ecosystem.config.cjs

# Redeploy
git pull && npm ci && npm run build && pm2 restart ecosystem.config.cjs

# View logs
pm2 logs codingnexus-server

# Check status
pm2 ps

# Monitor
pm2 monit
```

---

**Your setup is production-ready!** PM2 is handling app management and Nginx/Apache is handling web requests. Everything is properly configured.

