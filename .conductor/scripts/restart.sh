#!/bin/bash
# Restart Dev Server - WB Repricer System Frontend
# Restarts the Next.js development server via PM2

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load shared utilities
source "$SCRIPT_DIR/lib/utils.sh"

cd "$PROJECT_ROOT"

print_header "🔄 Restarting Frontend Dev Server"

echo "Project root: $PROJECT_ROOT"
echo ""

# Check if PM2 is managing the frontend
if pm2_frontend_running; then
    log_info "PM2 is managing the frontend process"
    # Restart via PM2
    restart_pm2_frontend
else
    log_warning "PM2 is not managing the frontend"
    echo "💡 Start with: bash .conductor/scripts/run.sh"
    exit 0
fi

# Wait a bit for server to restart
sleep 3

# Verify
if dev_server_running; then
    log_success "Dev server restarted successfully"
    echo ""
    echo "🌐 Access your frontend at: http://localhost:3100"
    echo "📊 PM2 Status:"
    pm2 list 2>/dev/null | grep -E "wb-repricer-frontend(-dev)?"
else
    log_error "Dev server failed to restart"
    echo "💡 Check logs: pm2 logs $(get_pm2_frontend_name)"
    exit 1
fi
