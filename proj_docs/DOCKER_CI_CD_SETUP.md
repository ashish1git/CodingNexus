# Docker CI/CD Setup Guide

This guide explains how to set up CI/CD pipelines for Docker deployment on your server.

## Architecture Overview

```
GitHub Actions (CI/CD)
    ↓
Build Docker Image
    ↓
Push to Server via SSH/SCP
    ↓
Docker Container (Backend on port 3000)
    ↓
Nginx (Port 80/443) → Proxy to Container
    ↓
Database (on server localhost:5432)
```

## Files Modified/Created

### 1. **Dockerfile** - Multi-stage production build
- Builds frontend with Vite
- Creates optimized production image
- Non-root user for security
- Health checks configured

### 2. **docker-compose.yml** - Container orchestration
- **app service**: Backend container
  - Connects to database via `host.docker.internal:5432`
  - Port 3000 (internal)
  - Health checks enabled
- **nginx service**: Reverse proxy
  - Ports 80/443
  - SSL support
  - Rate limiting configured
  - Static asset caching

### 3. **.env.docker** - Docker environment template
- Database configuration
- API endpoints
- Email/Cloudinary settings
- AI service keys (optional)

### 4. **nginx.conf** - Reverse proxy configuration
- Fixed typo (events block)
- SSL/TLS support
- Rate limiting
- Gzip compression
- Proper proxy headers

### 5. **.github/workflows/deploy-docker.yml** - CI/CD Pipeline
- Builds Docker images
- Copies to server via SCP
- Loads images and starts containers
- Runs migrations
- Health checks

---

## GitHub Secrets Configuration

Add these secrets to your GitHub repository: `Settings → Secrets and variables → Actions`

### SSH/Server Connection Secrets

```
SERVER_HOST          = your-server-ip.com
SERVER_USER          = ubuntu (or your deployment user)
SSH_PRIVATE_KEY      = [Private SSH key content - full key with BEGIN/END]
SERVER_PORT          = 22 (default)
APP_DIRECTORY        = ~/codingnexus (or /opt/codingnexus)
DEPLOYMENT_URL       = https://yourdomain.com (for health checks)
```

### Database Secrets

```
DATABASE_URL        = postgresql://user:password@YOUR_SERVER_IP:5432/codingnexus
                      # ⚠️ Use your actual server IP, NOT localhost
                      # Docker container needs to reach server's DB
```

### JWT & Security

```
JWT_SECRET          = your-super-secret-jwt-key-here (generate strong random)
JWT_EXPIRES_IN      = 7d
```

### Frontend URLs

```
FRONTEND_URL        = https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL        = https://api.yourdomain.com
VITE_API_BASE_URL   = https://api.yourdomain.com
```

### Cloudinary (File Uploads)

```
CLOUDINARY_CLOUD_NAME           = your_cloud_name
CLOUDINARY_API_KEY              = your_api_key
CLOUDINARY_API_SECRET           = your_api_secret
VITE_CLOUDINARY_CLOUD_NAME      = your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET   = profile_photos
VITE_CLOUDINARY_NOTES_PRESET    = codingnexus_notes
```

### Judge0 (Code Execution)

```
JUDGE0_URL          = http://64.227.149.20:2358
VITE_JUDGE0_URL     = http://64.227.149.20:2358
```

### Brevo Email Service

```
BREVO_API_KEY       = your_brevo_api_key
EMAIL_FROM          = noreply@yourdomain.com
EMAIL_FROM_NAME     = Coding Nexus
```

### Optional Settings

```
ENABLE_POLLING              = false (set true if using polling for submissions)
POLL_INTERVAL               = 15000 (milliseconds)
MAINTENANCE_MODE            = false
VITE_MAINTENANCE_MODE       = false
GEMINI_API_KEY              = (optional - for AI features)
OPENROUTER_API_KEY          = (optional)
OPENROUTER_MODEL            = (optional)
```

---

## Server Setup Requirements

### Prerequisites on Server

1. **Docker & Docker Compose installed**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **PostgreSQL running on localhost:5432**
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

3. **Create database and user**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE codingnexus;
   CREATE USER codingnexus_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE codingnexus TO codingnexus_user;
   ```

4. **SSH key for deployment**
   ```bash
   # On server, add your GitHub Actions SSH public key
   cat >> ~/.ssh/authorized_keys << 'EOF'
   ssh-rsa AAAA... (your public key)
   EOF
   ```

5. **Directory structure**
   ```bash
   mkdir -p ~/codingnexus
   cd ~/codingnexus
   git clone <your-repo>
   ```

6. **SSL Certificates (for HTTPS)**
   ```bash
   sudo mkdir -p /opt/codingnexus/ssl
   sudo cp /path/to/cert.pem /opt/codingnexus/ssl/
   sudo cp /path/to/key.pem /opt/codingnexus/ssl/
   sudo chown -R $USER:$USER /opt/codingnexus
   ```

---

## How to Trigger Deployment

### Option 1: Automatic (On Push to Main)
```bash
git commit -m "Update feature"
git push origin main
# GitHub Actions automatically deploys
```

### Option 2: Manual Trigger
1. Go to GitHub repo → **Actions** tab
2. Select **CD - Deploy with Docker**
3. Click **Run workflow**

---

## Deployment Workflow Steps

1. **Checkout code** - Gets latest from GitHub
2. **Build Docker image** - Compiles frontend & backend
3. **Save Docker image** - Exports as tar.gz
4. **Copy to server** - Uses SCP to transfer
5. **Load images** - Docker loads the image
6. **Stop old containers** - Gracefully shuts down
7. **Start new containers** - Launches fresh instances
8. **Run migrations** - Updates database schema if needed
9. **Health checks** - Verifies deployment success
10. **Cleanup** - Removes temporary files

---

## Monitoring & Logs

### Check Docker containers
```bash
docker-compose ps
```

### View application logs
```bash
docker-compose logs -f app
```

### View Nginx logs
```bash
docker-compose logs -f nginx
```

### Check health endpoint
```bash
curl https://yourdomain.com/api/health
```

---

## Database Connection from Docker

### Key Point: Database on Server Localhost

The database runs on your server's `localhost:5432`, but from inside the Docker container, `localhost` refers to the container itself.

**Solution in docker-compose.yml:**
```yaml
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/codingnexus
```

- **host.docker.internal** = special DNS name that maps to host machine
- Works on Docker Desktop (Windows/Mac)
- For Linux servers, use actual server IP or hostname

---

## Troubleshooting

### Health check failing
- Check if port 3000 is accessible: `curl http://localhost:3000/api/health`
- Check container logs: `docker-compose logs app`

### Database connection errors
- Verify DATABASE_URL secret is correct
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Test connection: `psql postgresql://user:password@localhost:5432/codingnexus`

### Nginx not proxying
- Check nginx logs: `docker-compose logs nginx`
- Verify nginx.conf is loaded: `docker-compose exec nginx nginx -t`

### Permission denied errors
- Ensure user is in docker group: `sudo usermod -aG docker $USER`
- Logout and login for group changes to take effect

---

## Rolling Back

If deployment fails, previous Docker images are still available:

```bash
# List all images
docker images | grep codingnexus

# Run specific version
docker run -d --name app -e DATABASE_URL=... codingnexus:SHA
```

---

## Next Steps

1. ✅ Configure all GitHub Secrets
2. ✅ Set up server with Docker & PostgreSQL
3. ✅ Generate SSH keys and add to authorized_keys
4. ✅ Push code to trigger deployment
5. ✅ Monitor logs and health checks

Testing deployment:
```bash
# Manual check
curl https://yourdomain.com/api/health

# Check container
docker-compose ps

# View logs
docker-compose logs -f app
```
