# GitHub Actions Quick Reference

## Common Tasks

### View Workflow Runs
1. Go to your repository on GitHub
2. Click the "Actions" tab
3. View running, completed, or failed workflows

### Manually Trigger Deployment
1. Go to Actions tab
2. Select "CD - Deploy to Server" or "CD - Deploy with Docker"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

### Check Deployment Status
```bash
# SSH into your server
ssh user@your-server-ip

# For PM2 deployment
pm2 status
pm2 logs codingnexus --lines 100

# For Docker deployment
docker-compose ps
docker-compose logs -f app --tail=100
```

### View Secrets
- Go to Repository Settings → Secrets and variables → Actions
- You can see secret names but not values
- Update secrets as needed

## Workflow Files

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | Push/PR to main/develop | Build, lint, test |
| SSH Deploy | `.github/workflows/deploy.yml` | Push to main | Deploy via SSH |
| Docker Deploy | `.github/workflows/deploy-docker.yml` | Push to main | Deploy with Docker |

## Required Secrets

### For SSH Deployment
- `SERVER_HOST` - Server IP or domain
- `SERVER_USER` - SSH username
- `SSH_PRIVATE_KEY` - SSH private key
- `SERVER_PORT` - SSH port (default: 22)
- `APP_DIRECTORY` - App path on server
- `DEPLOYMENT_URL` - App URL for health check
- `VITE_API_BASE_URL` - Backend API URL

### For Docker Deployment
- Same as above, plus:
- `DOCKER_USERNAME` (optional)
- `DOCKER_PASSWORD` (optional)

## Troubleshooting Workflows

### Build Fails
1. Click on the failed workflow run
2. Click on the failed job
3. Expand the failed step
4. Read the error message
5. Fix the issue locally
6. Push the fix

### Deployment Fails
1. Check GitHub Actions logs
2. SSH into server and check:
   ```bash
   # Disk space
   df -h
   
   # Memory
   free -h
   
   # Application logs
   pm2 logs codingnexus
   # or
   docker-compose logs app
   ```

### Health Check Fails
1. Check if app is running:
   ```bash
   pm2 status
   # or
   docker-compose ps
   ```
2. Test health endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```
3. Check firewall:
   ```bash
   sudo ufw status
   ```

## Useful Commands

### Re-run Failed Workflow
1. Go to the failed workflow run
2. Click "Re-run jobs" → "Re-run failed jobs"

### Cancel Running Workflow
1. Go to the running workflow
2. Click "Cancel workflow"

### Disable/Enable Workflow
1. Go to Actions tab
2. Select the workflow
3. Click "..." → "Disable workflow" (or "Enable workflow")

## Best Practices

1. **Test locally first** before pushing
2. **Use pull requests** for feature branches
3. **Monitor deployments** via GitHub Actions
4. **Keep secrets updated** when credentials change
5. **Review logs** regularly for issues
6. **Use manual triggers** for important deployments
7. **Tag releases** for version tracking

## Health Check URLs

After deployment, verify:
- Backend health: `https://your-domain.com/api/health`
- Frontend: `https://your-domain.com`

## Emergency Rollback

If deployment fails and app is down:

### Via SSH
```bash
ssh user@server
cd /path/to/app
git reset --hard HEAD~1
npm ci
npm run build
pm2 restart codingnexus
```

### Via Docker
```bash
ssh user@server
cd /path/to/app
docker-compose down
git reset --hard HEAD~1
docker-compose up -d
```

## Contact

For urgent issues:
1. Check server directly via SSH
2. Review application logs
3. Check database connectivity
4. Verify environment variables
