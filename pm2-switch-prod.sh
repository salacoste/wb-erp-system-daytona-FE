#!/bin/bash
# Switch to Production mode
# Stops Dev (if running), builds, and starts Production on port 3100

set -e

echo "🔄 Switching to Production mode..."

# Stop dev if running
if pm2 describe wb-repricer-frontend-dev >/dev/null 2>&1; then
    echo "⏹️  Stopping wb-repricer-frontend-dev (Development)..."
    pm2 stop wb-repricer-frontend-dev 2>/dev/null || true
fi

# Build production
echo "🔨 Building production bundle..."
npm run build

# Start production
echo "▶️  Starting wb-repricer-frontend (Production)..."
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production

echo ""
echo "📊 Current PM2 status:"
pm2 list | grep -E "wb-repricer-frontend|name"

echo ""
echo "✅ Production mode active on http://localhost:3100"
