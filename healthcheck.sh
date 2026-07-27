#!/bin/bash
# Coding Nexus — Quick Health Check
# Run: bash healthcheck.sh

echo "═══════════════════════════════════════"
echo "  Coding Nexus Health Check"
echo "  $(date '+%Y-%m-%d %H:%M:%S IST')"
echo "═══════════════════════════════════════"
echo ""

PASS=0
FAIL=0

check() {
  if [ $? -eq 0 ] || echo "$2" | grep -q "$3"; then
    echo "  ✅ $1"
    ((PASS++))
  else
    echo "  ❌ $1"
    ((FAIL++))
  fi
}

# 1. Containers
echo "📦 CONTAINERS"
APP=$(docker inspect codingnexus-app --format '{{.State.Health.Status}}' 2>/dev/null)
NGINX=$(docker inspect codingnexus-nginx --format '{{.State.Running}}' 2>/dev/null)
RESTARTS=$(docker inspect codingnexus-nginx --format '{{.RestartCount}}' 2>/dev/null)
if [ "$APP" = "healthy" ]; then echo "  ✅ App: healthy"; ((PASS++)); else echo "  ❌ App: $APP"; ((FAIL++)); fi
if [ "$NGINX" = "true" ]; then echo "  ✅ Nginx: running"; ((PASS++)); else echo "  ❌ Nginx: not running"; ((FAIL++)); fi
echo "     Nginx restarts (since fix): $RESTARTS"

# 2. Ports
echo ""
echo "🌐 PORTS"
curl -s -o /dev/null -w "" http://localhost:3000/api/health && echo "  ✅ Port 3000 (app direct)" && ((PASS++)) || { echo "  ❌ Port 3000 dead"; ((FAIL++)); }
curl -s -o /dev/null -w "" http://localhost/api/health && echo "  ✅ Port 80 (nginx)" && ((PASS++)) || { echo "  ❌ Port 80 dead"; ((FAIL++)); }

# 3. Judge0
echo ""
echo "⚙️  JUDGE0"
J0=$(curl -s http://localhost:2358/about 2>/dev/null)
echo "$J0" | grep -q "version" && echo "  ✅ Judge0: $(echo $J0 | python3 -c 'import json,sys;print(json.load(sys.stdin)["version"])' 2>/dev/null)" && ((PASS++)) || { echo "  ❌ Judge0: not responding"; ((FAIL++)); }

J0_APP=$(curl -s http://localhost:3000/api/code/health 2>/dev/null)
echo "$J0_APP" | grep -q "connected" && echo "  ✅ App→Judge0: connected" && ((PASS++)) || { echo "  ❌ App→Judge0: DISCONNECTED"; ((FAIL++)); }

# 4. Code execution
echo ""
echo "💻 CODE EXECUTION"
RESULT=$(curl -s -X POST http://localhost:3000/api/code/submit -H "Content-Type: application/json" -d '{"source_code":"print(\"healthcheck\")","language_id":71,"stdin":""}' 2>/dev/null)
echo "$RESULT" | grep -q '"success":true' && echo "  ✅ Python: OK" && ((PASS++)) || { echo "  ❌ Python: FAILED"; ((FAIL++)); }

# 5. Email
echo ""
echo "📧 EMAIL"
PKEY=$(docker exec codingnexus-app printenv BREVO_API_KEY 2>/dev/null | head -c 10)
SKEY=$(docker exec codingnexus-app printenv BREVO_API_KEY_SECONDARY 2>/dev/null | head -c 10)
FROM=$(docker exec codingnexus-app printenv EMAIL_FROM 2>/dev/null)
FROM2=$(docker exec codingnexus-app printenv EMAIL_FROM_SECONDARY 2>/dev/null)
[ -n "$PKEY" ] && echo "  ✅ Primary key: ${PKEY}..." && ((PASS++)) || { echo "  ❌ Primary key: MISSING"; ((FAIL++)); }
[ -n "$SKEY" ] && echo "  ✅ Fallback key: ${SKEY}..." && ((PASS++)) || { echo "  ❌ Fallback key: MISSING"; ((FAIL++)); }
echo "     Primary sender:  $FROM"
echo "     Fallback sender: $FROM2"

# 6. Cloudinary
echo ""
echo "🖼️  CLOUDINARY"
CNAME=$(docker exec codingnexus-app printenv CLOUDINARY_CLOUD_NAME 2>/dev/null)
CKEY=$(docker exec codingnexus-app printenv CLOUDINARY_API_KEY 2>/dev/null)
[ -n "$CNAME" ] && echo "  ✅ Cloud name: $CNAME" && ((PASS++)) || { echo "  ❌ Cloud name: MISSING"; ((FAIL++)); }
[ "${#CKEY}" -gt 10 ] && echo "  ✅ API key: set" && ((PASS++)) || { echo "  ❌ API key: INVALID"; ((FAIL++)); }

# Summary
echo ""
echo "═══════════════════════════════════════"
echo "  PASS: $PASS | FAIL: $FAIL"
echo "═══════════════════════════════════════"
[ $FAIL -eq 0 ] && echo "  🟢 ALL SYSTEMS OPERATIONAL" || echo "  🔴 $FAIL issues need attention"



# Run the healthcheck (one command, checks everything)
    # bash /home/apsit/projects/codingnexus/Mcodingnexus/healthcheck.sh