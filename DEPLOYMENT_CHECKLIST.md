# 🚀 Deployment Checklist - PM2 + Apache

## ✅ Your Configuration Status

| Item | Status | Value |
|------|--------|-------|
| Database | ✅ Ready | Neon PostgreSQL |
| JWT Secret | ✅ Ready | Configured |
| Port | ✅ 21000 | Backend |
| Cloudinary | ✅ Ready | Uploaded |
| Judge0 | ✅ 64.227.149.20:2358 | Code execution |
| Email (Brevo) | ✅ Ready | Configured |
| API Base URL | ⏳ UPDATE | `https://yourdomain.com/api` |
| Frontend URL | ⏳ UPDATE | `https://yourdomain.com` |

---

## 🔑 GitHub Secrets to Configure

Go to: `https://github.com/YOUR_USERNAME/Coding_Nexus/settings/secrets/actions`

Add these 7 secrets:

| Secret Name | Description | Example |
|---|---|---|
| `SERVER_HOST` | Your server IP address | `192.168.1.100` |
| `SERVER_USER` | Non-root user on server | `codingnexus` |
| `SSH_PRIVATE_KEY` | SSH private key for GitHub Actions | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `APP_DIRECTORY` | App path on server | `/home/codingnexus/Coding_Nexus` |
| `SERVER_PORT` | SSH port (optional, defaults to 22) | `22` |
| `VITE_API_BASE_URL` | Production API URL | `https://yourdomain.com/api` |
| `DEPLOYMENT_URL` | Production domain for health check | `https://yourdomain.com` |

---

## 📋 Deployment Steps

### Step 1: Generate SSH Key (Your Machine)
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
```

Get private key:
```bash
Get-Content ~/.ssh/github_actions
```
Copy output → Paste into `SSH_PRIVATE_KEY` secret

---

### Step 2: Server Initial Setup (One-time)

```bash
# SSH to server
ssh codingnexus@YOUR_SERVER_IP

# Create directory
mkdir -p ~/Coding_Nexus
cd ~/Coding_Nexus

# Clone repo
git clone https://github.com/YOUR_USERNAME/Coding_Nexus.git .

# Install dependencies
npm install

# Create .env with your values
nano .env
# Paste your production .env values
# Save: Ctrl+X → Y → Enter

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build frontend
npm run build

# Start PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Add SSH public key for GitHub
nano ~/.ssh/authorized_keys
# Paste: cat ~/.ssh/github_actions.pub
# Save: Ctrl+X → Y → Enter
```

---

### Step 3: Apache Configuration (On Server)

Create vhost file `/etc/apache2/sites-available/codingnexus.conf`:

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
    
    # SSL Certificate (use Let's Encrypt)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # Reverse Proxy (Backend on :21000)
    ProxyPreserveHost On
    ProxyPass /api http://localhost:21000/api
    ProxyPassReverse /api http://localhost:21000/api
    
    # Serve Frontend (built dist folder)
    DocumentRoot /home/codingnexus/Coding_Nexus/dist
    
    <Directory /home/codingnexus/Coding_Nexus/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA routing
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [QSA,L]
    </Directory>
</VirtualHost>
```

Enable:
```bash
sudo a2ensite codingnexus.conf
sudo apache2ctl configtest  # Should return "Syntax OK"
sudo systemctl reload apache2
```

---

### Step 4: Test Deployment

```bash
# Push code to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Go to GitHub → Actions → Deploy → Run Workflow
# OR manually on server:
pm2 restart ecosystem.config.cjs
pm2 logs
```

Verify health:
```bash
curl https://yourdomain.com/api/health
# Should return: {"status":"ok"}
```

---

## ✅ Final Checklist

- [ ] SSH key generated
- [ ] GitHub Secrets configured (7 secrets)
- [ ] Server initial setup complete
- [ ] .env file created on server with production values
- [ ] PM2 started on server
- [ ] Apache vhost configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] First deployment test passed
- [ ] Health check returns OK
- [ ] Login works with database credentials

---

## 🎯 Workflow Explained

| When | What Happens | Who |
|------|---|---|
| You push code to `main` | GitHub runs ci.yml (auto-test) | GitHub Actions |
| You manually trigger deploy.yml | SSH to server, pull code, build, restart PM2 | GitHub Actions → Your Server |
| Server runs PM2 | Express backend listens on :21000 | PM2 |
| Apache receives requests | Routes `/api/*` to :21000, serves `dist/` folder | Apache |
| User visits domain | Gets frontend from Apache, API calls to Express | Browser ↔ Server |

---

## 🆘 Troubleshooting

| Issue | Solution |
|---|---|
| SSH authentication fails | Check SSH key is in `authorized_keys` on server |
| PM2 won't start | Check `.env` values, run `pm2 logs` for errors |
| API returns 502 | Express crashed, check `pm2 logs`, restart with `pm2 restart` |
| Frontend shows old version | Run `npm run build` again, Apache defaults to browser cache |
| SSL fails | Check certificate path, make sure port 443 is open |

---

## 📝 Your Current Setup

```
Local Machine:
├─ npm run dev:all         (Vite + Express local)
├─ npm run build           (Production frontend build)
├─ npm run server          (Backend only)

GitHub:
├─ ci.yml                  (Auto-test on push)
└─ deploy.yml              (Manual SSH deployment)

Server (PM2 + Apache):
├─ ecosystem.config.cjs    (PM2 config)
├─ .env                    (Production variables)
├─ dist/                   (Frontend files)
├─ server/                 (Backend code)
├─ Apache :80/443          (Reverse proxy)
└─ Express :21000          (API server)
```

---

**You're all set! Ready to deploy when you have your server IP and Apache configured.** 🚀
