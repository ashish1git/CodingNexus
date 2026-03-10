#!/bin/bash
docker cp ~/projects/codingnexus/Mcodingnexus/scripts/create-admin.js codingnexus-app:/app/create-admin.js
docker exec -it codingnexus-app node /app/create-admin.js
