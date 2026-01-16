#!/bin/bash
# Restart Dev Server - WB Repricer System Frontend
# Restarts the Next.js development server with clean cache

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load shared utilities
source "$SCRIPT_DIR/lib/utils.sh"

cd "$PROJECT_ROOT"

print_header "🔄 Restarting Frontend Dev Server"

echo "Project root: $PROJECT_ROOT"
echo ""

# Check if server is running
if ! dev_server_running; then
    log_warning "Dev server is not running"
    echo "💡 Start with: bash .conductor/scripts/run.sh"
    exit 0
fi

# Stop and restart
restart_dev_server

# Wait a bit for server to restart
sleep 3

# Verify
if dev_server_running; then
    log_success "Dev server restarted successfully"
    echo ""
    echo "🌐 Access your frontend at: http://localhost:3100"
else
    log_error "Dev server failed to restart"
    echo "💡 Check logs: tail -f logs/dev-server.log"
    exit 1
fi
