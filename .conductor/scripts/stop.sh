#!/bin/bash
# Stop Dev Server - WB Repricer System Frontend
# Gracefully stops the Next.js development server via PM2

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load shared utilities
source "$SCRIPT_DIR/lib/utils.sh"

cd "$PROJECT_ROOT"

echo "🛑 Stopping Frontend Dev Server..."
echo "Project root: $PROJECT_ROOT"
echo ""

# Check if PM2 is managing the frontend
if pm2_frontend_running; then
    stop_pm2_frontend
else
    # Try to stop any process on port 3100
    local pid=$(lsof -ti:3100 -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$pid" ]; then
        log_info "Stopping process on port 3100 (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        sleep 2
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    else
        log_info "No dev server found running"
    fi
fi

echo ""
log_success "Dev server stopped"
echo ""
echo "💡 To start again: bash .conductor/scripts/run.sh"
