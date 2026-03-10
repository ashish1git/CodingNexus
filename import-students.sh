#!/bin/bash
docker cp ~/projects/codingnexus/Mcodingnexus/scripts/import-students-from-xml.js codingnexus-app:/app/import-students.js
docker cp ~/projects/codingnexus/Mcodingnexus/users.xlsx codingnexus-app:/app/users.xlsx
docker exec -it codingnexus-app node /app/import-students.js
