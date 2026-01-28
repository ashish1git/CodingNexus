# CI/CD Pipeline Documentation

## Overview
This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD). The pipeline consists of three main workflows:

1. **CI Workflow** (`ci.yml`) - Automated testing and building
2. **Direct Deployment** (`deploy.yml`) - SSH-based deployment to server
3. **Docker Deployment** (`deploy-docker.yml`) - Container-based deployment

---

## 🔧 Setup Instructions

### 1. GitHub Secrets Configuration

Navigate to your GitHub repository → Settings → Secrets and Variables → Actions, and add the following secrets:

#### Required Secrets for All Workflows:
- `VITE_API_BASE_URL` - Your backend API URL (e.g., `https://api.yourdomain.com`)

#### Required for SSH Deployment (`deploy.yml`):
- `SERVER_HOST` - Your server's IP address or domain
- `SERVER_USER` - SSH username (e.g., `ubuntu`, `root`)
- `SSH_PRIVATE_KEY` - Your SSH private key (see below for generation)
- `SERVER_PORT` - SSH port (default: 22)
- `APP_DIRECTORY` - Application directory on server (e.g., `/home/ubuntu/codingnexus`)
- `DEPLOYMENT_URL` - Your application URL for health checks

#### Optional for Docker Registry:
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password or access token

### 2. SSH Key Generation

If you don't have an SSH key for deployment:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Copy public key to your server
ssh-copy-id -i ~/.ssh/github_deploy.pub user@your-server-ip

# Copy the private key content to GitHub Secrets
cat ~/.ssh/github_deploy
```

Add the entire private key (including `-----BEGIN` and `-----END` lines) as `SSH_PRIVATE_KEY` in GitHub Secrets.

---

## 📋 Workflow Details

### CI Workflow (ci.yml)
**Triggers:** Push or Pull Request to `main` or `develop` branches

**Jobs:**
1. **Frontend Build & Lint**
   - Runs ESLint
   - Builds React application
   - Uploads build artifacts

2. **Backend Tests**
   - Sets up PostgreSQL test database
   - Runs Prisma migrations
   - Verifies server startup

3. **Security Audit**
   - Runs `npm audit` for vulnerabilities
   - Checks for high-severity issues

### Direct SSH Deployment (deploy.yml)
**Triggers:** Push to `main` branch or manual workflow dispatch

**Process:**
1. Builds frontend locally
2. Connects to server via SSH
3. Pulls latest code from Git
4. Installs dependencies
5. Runs database migrations
6. Rebuilds application
7. Restarts using PM2
8. Verifies deployment with health check

### Docker Deployment (deploy-docker.yml)
**Triggers:** Push to `main` branch (excluding markdown files) or manual

**Process:**
1. Builds Docker image
2. Transfers image to server
3. Deploys using Docker Compose
4. Runs database migrations in container
5. Performs health checks

---

## 🚀 Deployment Methods

### Method 1: Direct Deployment (Recommended for VPS)

**Server Prerequisites:**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL (if not using external DB)
sudo apt-get install postgresql postgresql-contrib

# Clone your repository
git clone https://github.com/yourusername/CodingNexus.git
cd CodingNexus

# Install dependencies
npm ci

# Setup environment variables
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# Run initial setup
npx prisma generate
npx prisma migrate deploy
npm run build

# Start with PM2
pm2 start npm --name codingnexus -- run dev:all
pm2 save
pm2 startup  # Follow the instructions to enable PM2 on boot
```

### Method 2: Docker Deployment

**Server Prerequisites:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Clone repository
git clone https://github.com/yourusername/CodingNexus.git
cd CodingNexus

# Create environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# Deploy
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 🔍 Monitoring & Maintenance

### Check Deployment Status
```bash
# For PM2 deployment
pm2 status
pm2 logs codingnexus
pm2 monit

# For Docker deployment
docker-compose ps
docker-compose logs -f app
```

### Manual Deployment
You can trigger deployment manually from GitHub:
1. Go to Actions tab
2. Select the workflow you want to run
3. Click "Run workflow"
4. Select branch and confirm

### Rollback
```bash
# For PM2 deployment
cd /path/to/app
git reset --hard HEAD~1
npm ci
npm run build
pm2 restart codingnexus

# For Docker deployment
docker-compose down
git reset --hard HEAD~1
docker-compose up -d
```

---

## 🔒 Security Best Practices

1. **Environment Variables:** Never commit `.env.production` file
2. **SSH Keys:** Use dedicated keys for deployment, not your personal SSH key
3. **Database:** Use strong passwords and restrict network access
4. **HTTPS:** Configure SSL certificates (use Let's Encrypt)
5. **Firewall:** Only open necessary ports (80, 443, 22)
6. **Updates:** Regularly update dependencies and system packages

### Setting up SSL with Let's Encrypt (Nginx)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

---

## 🐛 Troubleshooting

### Build Fails
- Check GitHub Actions logs for specific errors
- Ensure all environment variables are set correctly
- Verify Node.js version compatibility

### Deployment Fails
- Verify SSH credentials and server access
- Check server disk space: `df -h`
- Check server memory: `free -h`
- Review PM2/Docker logs for errors

### Health Check Fails
- Ensure server is accessible from internet
- Check firewall rules: `sudo ufw status`
- Verify application is running: `pm2 status` or `docker-compose ps`
- Check application logs for startup errors

### Database Migration Issues
```bash
# Reset migrations (DANGER: data loss)
npx prisma migrate reset

# Apply specific migration
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

---

## 📊 Monitoring Recommendations

### Application Monitoring
- Set up PM2 monitoring: `pm2 install pm2-logrotate`
- Consider using monitoring services: Uptime Robot, New Relic, Datadog
- Set up log aggregation: ELK stack, Grafana Loki

### Performance Monitoring
```bash
# PM2 monitoring
pm2 install pm2-server-monit

# Docker stats
docker stats codingnexus-app

# System resources
htop
```

---

## 🔄 Continuous Improvement

### Optimization Tips
1. Enable Redis caching for database queries
2. Set up CDN for static assets (Cloudflare)
3. Implement database connection pooling
4. Add application-level caching
5. Monitor and optimize slow queries

### Scaling Considerations
- Consider load balancing with multiple app instances
- Separate database to dedicated server
- Use managed database service (AWS RDS, DigitalOcean Managed DB)
- Implement horizontal scaling with Kubernetes

---

## 📞 Support

For issues with the CI/CD pipeline:
1. Check GitHub Actions logs
2. Review server logs
3. Consult this documentation
4. Check repository issues

Remember to keep your secrets secure and never commit sensitive information to Git!
