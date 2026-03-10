# GitHub Secrets - Complete Setup Guide

## How to Add Secrets

1. Go to GitHub → Your Repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Copy the **Secret Name** → paste into "Name" field
5. Copy the **Secret Value** → paste into "Secret" field
6. Click **Add secret**

---

## 22 Secrets You Need to Add

### 1️⃣ SERVER CONNECTION - `SERVER_HOST`
**Value:**
```
202.179.85.68
```

### 2️⃣ SERVER USER - `SERVER_USER`
**Value:**
```
apsit
```
*(Your server SSH user - change if different)*

### 3️⃣ SSH PRIVATE KEY - `SSH_PRIVATE_KEY`
**Value:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
paste_your_entire_private_key_here
-----END OPENSSH PRIVATE KEY-----
```
*(Get it from: `cat ~/.ssh/id_rsa` on your local machine)*

### 4️⃣ SERVER PORT - `SERVER_PORT`
**Value:**
```
22
```

### 5️⃣ APP DIRECTORY - `APP_DIRECTORY`
**Value:**
```
~/codingnexus
```

### 6️⃣ DEPLOYMENT URL - `DEPLOYMENT_URL`
**Value:**
```
http://202.179.85.68
```

---

### 7️⃣ DATABASE URL - `DATABASE_URL` ⚠️ CRITICAL
**Value:**
```
postgresql://codingnexus_user:your_password@host.docker.internal:5432/codingnexus
```

**BEFORE ADDING:**
- ✏️ Replace `your_password` with your actual PostgreSQL password
- ✏️ If `host.docker.internal` doesn't work on Linux server, use: `postgresql://codingnexus_user:your_password@202.179.85.68:5432/codingnexus`

---

### 8️⃣ JWT SECRET - `JWT_SECRET` ⚠️ CRITICAL
**Generate with:**
```bash
openssl rand -base64 32
```

**Example output:**
```
aBcDeFgHiJkLmNoPqRsT1uVwXyZ2+3/4567890aB=
```
*(Just paste whatever `openssl` outputs)*

---

### 9️⃣ FRONTEND URL - `FRONTEND_URL`
**Value:**
```
http://202.179.85.68
```

### 🔟 API URL - `VITE_API_URL`
**Value:**
```
http://202.179.85.68
```

### 1️⃣1️⃣ API BASE URL - `VITE_API_BASE_URL`
**Value:**
```
http://202.179.85.68
```

---

### 1️⃣2️⃣ CLOUDINARY CLOUD NAME - `CLOUDINARY_CLOUD_NAME`
**Get from:** [Cloudinary Dashboard](https://cloudinary.com/console/) → Settings → Cloud Name

**Example:**
```
my_cloud_name
```

### 1️⃣3️⃣ CLOUDINARY API KEY - `CLOUDINARY_API_KEY`
**Get from:** Cloudinary Dashboard → Settings → API Keys

**Example:**
```
123456789012345
```

### 1️⃣4️⃣ CLOUDINARY API SECRET - `CLOUDINARY_API_SECRET`
**Get from:** Cloudinary Dashboard → Settings → API Keys

**Example:**
```
abcdefghijklmnopqrstuvwxyz123456
```

### 1️⃣5️⃣ VITE CLOUDINARY CLOUD NAME - `VITE_CLOUDINARY_CLOUD_NAME`
**Value:** *(Same as CLOUDINARY_CLOUD_NAME)*
```
my_cloud_name
```

### 1️⃣6️⃣ VITE CLOUDINARY UPLOAD PRESET - `VITE_CLOUDINARY_UPLOAD_PRESET`
**Value:**
```
profile_photos
```

### 1️⃣7️⃣ VITE CLOUDINARY NOTES PRESET - `VITE_CLOUDINARY_NOTES_PRESET`
**Value:**
```
codingnexus_notes
```

---

### 1️⃣8️⃣ JUDGE0 URL - `JUDGE0_URL`
**Value:**
```
http://64.227.149.20:2358
```

### 1️⃣9️⃣ VITE JUDGE0 URL - `VITE_JUDGE0_URL`
**Value:**
```
http://64.227.149.20:2358
```

---

### 2️⃣0️⃣ BREVO API KEY - `BREVO_API_KEY`
**Get from:** [Brevo Dashboard](https://app.brevo.com/) → Settings → API Keys

**Example:**
```
xkeysib-1234567890abcdefghijklmnopqrstuvwxyz
```

### 2️⃣1️⃣ EMAIL FROM - `EMAIL_FROM`
**Value:**
```
noreply@202.179.85.68
```
*(Can be any email address, just needs to be valid format)*

### 2️⃣2️⃣ EMAIL FROM NAME - `EMAIL_FROM_NAME`
**Value:**
```
Coding Nexus
```

---

## 📋 Quick Checklist

- [ ] SERVER_HOST = 202.179.85.68
- [ ] SERVER_USER = apsit
- [ ] SSH_PRIVATE_KEY = [your private key]
- [ ] SERVER_PORT = 22
- [ ] APP_DIRECTORY = ~/codingnexus
- [ ] DEPLOYMENT_URL = http://202.179.85.68
- [ ] DATABASE_URL = postgresql://codingnexus_user:YOUR_PASSWORD@host.docker.internal:5432/codingnexus
- [ ] JWT_SECRET = [generate with openssl rand -base64 32]
- [ ] FRONTEND_URL = http://202.179.85.68
- [ ] VITE_API_URL = http://202.179.85.68
- [ ] VITE_API_BASE_URL = http://202.179.85.68
- [ ] CLOUDINARY_CLOUD_NAME = [from Cloudinary]
- [ ] CLOUDINARY_API_KEY = [from Cloudinary]
- [ ] CLOUDINARY_API_SECRET = [from Cloudinary]
- [ ] VITE_CLOUDINARY_CLOUD_NAME = [same as above]
- [ ] VITE_CLOUDINARY_UPLOAD_PRESET = profile_photos
- [ ] VITE_CLOUDINARY_NOTES_PRESET = codingnexus_notes
- [ ] JUDGE0_URL = http://64.227.149.20:2358
- [ ] VITE_JUDGE0_URL = http://64.227.149.20:2358
- [ ] BREVO_API_KEY = [from Brevo]
- [ ] EMAIL_FROM = noreply@202.179.85.68
- [ ] EMAIL_FROM_NAME = Coding Nexus

---

## ❓ Common Questions

**Q: What's the SSH private key?**
A: Your private SSH key used to connect to your server. Get it with:
```bash
cat ~/.ssh/id_rsa
```
Copy the ENTIRE content (including BEGIN and END lines).

**Q: Do I have Cloudinary account?**
A: If not, sign up here: https://cloudinary.com/users/register/free

**Q: Do I have Brevo account?**
A: If not, sign up here: https://www.brevo.com/

**Q: Can I use different database password?**
A: Yes, but use same password you created on server:
```bash
sudo -u postgres psql
CREATE USER codingnexus_user WITH PASSWORD 'YOUR_PASSWORD';
```

**Q: What if host.docker.internal doesn't work?**
A: Change DATABASE_URL to use server IP:
```
postgresql://codingnexus_user:password@202.179.85.68:5432/codingnexus
```

---

## ✅ After Adding All 22 Secrets

1. Go to GitHub → **Actions** tab
2. You should see **CD - Deploy with Docker** workflow
3. Commit your code:
   ```bash
   git add .
   git commit -m "Setup Docker CI/CD"
   git push origin main
   ```
4. Watch the workflow run
5. Check your server: `docker-compose ps`
6. Access: http://202.179.85.68

**Done!** 🎉
