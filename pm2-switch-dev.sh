#!/bin/bash
# Switch to Development mode
# Stops Production (if running) and starts Dev on port 3100

set -e

echo "🔄 Switching to Development mode..."

# Stop production if running
if pm2 describe wb-repricer-frontend >/dev/null 2>&1; then
    echo "⏹️  Stopping wb-repricer-frontend (Production)..."
    pm2 stop wb-repricer-frontend 2>/dev/null || true
fi

# Start dev if not already running
if ! pm2 describe wb-repricer-frontend-dev >/dev/null 2>&1 || \
   [ "$(pm2 jlist | jq -r '.[] | select(.name == "wb-repricer-frontend-dev") | .pm2_env.status')" != "online" ]; then
    echo "▶️  Starting wb-repricer-frontend-dev (Development)..."
    pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
else
    echo "✅ wb-repricer-frontend-dev already running"
fi

echo ""
echo "📊 Current PM2 status:"
pm2 list | grep -E "wb-repricer-frontend|name"

echo ""
echo "✅ Development mode active on http://localhost:3100"
