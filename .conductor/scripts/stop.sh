#!/bin/bash
# Stop Dev Server - WB Repricer System Frontend
# Gracefully stops the Next.js development server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load shared utilities
source "$SCRIPT_DIR/lib/utils.sh"

cd "$PROJECT_ROOT"

echo "🛑 Stopping Frontend Dev Server..."
echo "Project root: $PROJECT_ROOT"
echo ""

stop_dev_server

echo ""
log_success "Dev server stopped"
echo ""
echo "💡 To start again: bash .conductor/scripts/run.sh"
