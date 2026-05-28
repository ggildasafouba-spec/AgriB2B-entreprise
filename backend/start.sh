#!/bin/sh
echo 'Running migrations...'
npx prisma migrate deploy 2>&1 || echo 'Migration warning'
echo 'Starting server...'
exec node dist/main.js
