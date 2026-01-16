#!/bin/bash
# Switch to Development mode
# Stops Production (if running) and starts Dev on port 3100

set -e

# Check dependencies
if ! command -v jq &>/dev/null; then
    echo "❌ jq is required but not installed"
    echo "💡 Install: brew install jq"
    exit 1
fi

echo "🔄 Switching to Development mode..."

# Stop production if running
if pm2 describe wb-repricer-frontend >/dev/null 2>&1; then
    echo "⏹️  Stopping wb-repricer-frontend (Production)..."
    pm2 stop wb-repricer-frontend 2>/dev/null || true
fi

# Start dev if not already running
if ! pm2 describe wb-repricer-frontend-dev >/dev/null 2>&1; then
    echo "▶️  Starting wb-repricer-frontend-dev (Development)..."
    pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
else
    # Check status using jq, handle empty result
    dev_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name == "wb-repricer-frontend-dev") | .pm2_env.status' 2>/dev/null || echo "")

    case "$dev_status" in
        online)
            echo "✅ wb-repricer-frontend-dev already running"
            ;;
        stopped|"")
            # Process exists but is stopped - start it
            echo "▶️  Starting wb-repricer-frontend-dev (was stopped)..."
            pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
            ;;
        errored)
            # Process is in errored state - delete and restart
            echo "⚠️  wb-repricer-frontend-dev is in errored state"
            echo "🔄 Deleting and recreating process..."
            pm2 delete wb-repricer-frontend-dev 2>/dev/null || true
            echo "▶️  Starting wb-repricer-frontend-dev (Development)..."
            pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
            ;;
        *)
            # Unknown status (launching, etc.)
            echo "⚠️  wb-repricer-frontend-dev has unexpected status: $dev_status"
            echo "💡 Check with: pm2 logs wb-repricer-frontend-dev"
            ;;
    esac
fi

echo ""
echo "📊 Current PM2 status:"
pm2 list | grep -E "wb-repricer-frontend|name"

echo ""
echo "✅ Development mode active on http://localhost:3100"
