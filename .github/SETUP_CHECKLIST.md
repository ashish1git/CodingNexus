# CI/CD Pipeline Setup Checklist

Follow this checklist to set up your CI/CD pipeline:

## ✅ Pre-deployment Checklist

### 1. GitHub Repository Setup
- [ ] Repository is on GitHub
- [ ] You have admin access to the repository
- [ ] Main branch is protected (recommended)

### 2. Server Preparation

#### Option A: Direct Deployment (PM2)
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL (if needed)
sudo apt-get install postgresql postgresql-contrib

# Create application directory
sudo mkdir -p /var/www/codingnexus
sudo chown $USER:$USER /var/www/codingnexus
```

#### Option B: Docker Deployment
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

### 3. SSH Key Setup
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy.pub user@server-ip

# Test connection
ssh -i ~/.ssh/github_deploy user@server-ip

# Get private key (copy this to GitHub Secrets)
cat ~/.ssh/github_deploy
```

### 4. GitHub Secrets Configuration

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

#### Essential Secrets:
- [ ] `SERVER_HOST` = Your server IP (e.g., `192.168.1.100`)
- [ ] `SERVER_USER` = SSH username (e.g., `ubuntu`)
- [ ] `SSH_PRIVATE_KEY` = Content of `~/.ssh/github_deploy` private key
- [ ] `APP_DIRECTORY` = `/var/www/codingnexus` (or your path)
- [ ] `DEPLOYMENT_URL` = `https://yourdomain.com` or `http://your-ip:5000`
- [ ] `VITE_API_BASE_URL` = `https://api.yourdomain.com` or `http://your-ip:5000`

#### Optional Secrets:
- [ ] `SERVER_PORT` = `22` (if different)
- [ ] `DOCKER_USERNAME` = Your Docker Hub username (if using Docker registry)
- [ ] `DOCKER_PASSWORD` = Your Docker Hub password

### 5. Environment Variables on Server

```bash
# SSH into your server
ssh user@server-ip

# Navigate to app directory
cd /var/www/codingnexus

# Clone repository (first time only)
git clone https://github.com/yourusername/CodingNexus.git .

# Create .env.production
cp .env.production.example .env.production
nano .env.production
```

Edit `.env.production` with your values:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/codingnexus
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://yourdomain.com
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
NODE_ENV=production
PORT=5000
```

### 6. Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE codingnexus;
CREATE USER codingnexus_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE codingnexus TO codingnexus_user;
\q

# Run migrations
npx prisma migrate deploy
```

### 7. Initial Deployment Test

#### For PM2:
```bash
cd /var/www/codingnexus
npm ci
npx prisma generate
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions
```

#### For Docker:
```bash
cd /var/www/codingnexus
docker-compose up -d
docker-compose logs -f
```

### 8. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # If accessing backend directly
sudo ufw enable
sudo ufw status
```

### 9. SSL Certificate (Production)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (requires domain pointing to server)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 10. Test GitHub Actions

- [ ] Push a small change to `main` branch
- [ ] Check Actions tab in GitHub
- [ ] Verify CI workflow runs successfully
- [ ] Verify deployment workflow completes
- [ ] Check server to confirm deployment
- [ ] Test health endpoint: `curl https://yourdomain.com/api/health`

## 🎯 Quick Start Commands

### First Time Setup on Server
```bash
./deploy.sh
```

### Manual Deployment
```bash
git pull origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart codingnexus
```

### Check Status
```bash
# PM2
pm2 status
pm2 logs codingnexus

# Docker
docker-compose ps
docker-compose logs app
```

### Rollback
```bash
git reset --hard HEAD~1
./deploy.sh
```

## 🔍 Verification

After setup, verify:

- [ ] GitHub Actions workflows are visible in Actions tab
- [ ] CI workflow runs on push/PR
- [ ] CD workflow runs on push to main
- [ ] Health check passes: `https://yourdomain.com/api/health`
- [ ] Application is accessible: `https://yourdomain.com`
- [ ] PM2/Docker shows application running
- [ ] Database migrations are applied
- [ ] Logs show no errors

## 📚 Documentation

- Full guide: [CI_CD_SETUP.md](CI_CD_SETUP.md)
- GitHub Actions: [.github/ACTIONS_GUIDE.md](.github/ACTIONS_GUIDE.md)
- Deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

## 🆘 Common Issues

### "Permission denied" during deployment
- Check SSH key is correctly added to GitHub Secrets
- Verify SSH key is authorized on server: `~/.ssh/authorized_keys`

### "Cannot connect to server"
- Verify `SERVER_HOST` is correct
- Check server firewall allows SSH (port 22)
- Test SSH manually: `ssh -i ~/.ssh/github_deploy user@server-ip`

### "Health check failed"
- Application may not be running: `pm2 status` or `docker-compose ps`
- Check application logs for errors
- Verify port 5000 is accessible

### Database migration fails
- Check `DATABASE_URL` is correct
- Verify database exists and is accessible
- Check database user permissions

## 🎉 Success!

Once all items are checked and workflows are green, your CI/CD pipeline is ready!

Every push to `main` will automatically:
1. Run tests and linting
2. Build the application
3. Deploy to your server
4. Run database migrations
5. Restart the application
6. Verify with health checks
