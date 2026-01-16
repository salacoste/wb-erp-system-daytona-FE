#!/bin/bash
# PM2 Safe Restart Script for WB Repricer Frontend
# Prevents port conflicts and restart loops

set -e

APP_NAME="wb-repricer-frontend-dev"
PORT=3100

echo "🔍 Checking for existing processes on port $PORT..."
EXISTING_PID=$(lsof -ti :$PORT 2>/dev/null || echo "")

if [ -n "$EXISTING_PID" ]; then
  echo "⚠️  Found process $EXISTING_PID using port $PORT"
  echo "🔪 Killing process..."
  kill -9 $EXISTING_PID 2>/dev/null || true
  sleep 2
fi

echo "🧹 Cleaning PM2 process..."
pm2 delete $APP_NAME 2>/dev/null || echo "No existing PM2 process found"
pm2 save --force

echo "🚀 Starting fresh PM2 process..."
cd "$(dirname "$0")"
pm2 start ecosystem.config.js --only $APP_NAME

echo "✅ Done! Checking status..."
pm2 list
pm2 logs $APP_NAME --lines 20 --nostream

echo ""
echo "📊 Monitor logs with: pm2 logs $APP_NAME"
echo "🛑 Stop with: pm2 stop $APP_NAME"
echo "📈 Monitor with: pm2 monit"
