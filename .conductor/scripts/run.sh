#!/bin/bash
# Conductor Runner - WB Repricer System Frontend
# Smart orchestration runner for development environment
# Starts Next.js dev server, validates environment, builds project

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load shared utilities
source "$SCRIPT_DIR/lib/utils.sh"

# Change to project root
cd "$PROJECT_ROOT"

# =============================================================================
# MAIN EXECUTION
# =============================================================================

print_header "🤖 Conductor Runner - WB Repricer System Frontend"

echo "Project root: $PROJECT_ROOT"
echo "Workspace: ${PWD##*/}"
echo ""

# =============================================================================
# PHASE 1: Environment Validation
# =============================================================================
check_section "Phase 1: Environment Validation"

# Check required commands
verify_command "node" "Node.js"
verify_command "npm" "npm"

# Check package.json
verify_file "package.json" "Project configuration"

# =============================================================================
# PHASE 2: Dependencies
# =============================================================================
check_section "Phase 2: Dependencies"

if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    if npm install --silent; then
        log_success "Dependencies installed"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
else
    log_success "Dependencies already installed"
fi

# =============================================================================
# PHASE 3: Dev Server
# =============================================================================
check_section "Phase 3: Dev Server"

if dev_server_running; then
    log_info "Dev server is already running"
    log_info "To restart, run: bash .conductor/scripts/restart.sh"
else
    log_info "Starting dev server..."
    if start_dev_server "development" 3100; then
        log_success "Dev server started successfully"
    else
        log_error "Failed to start dev server"
        exit 1
    fi
fi

# =============================================================================
# PHASE 4: Verification
# =============================================================================
check_section "Phase 4: Verification"

show_system_status

# Wait a bit for server to be fully ready
sleep 2

# Try to access the server
if curl -s http://localhost:3100 > /dev/null 2>&1; then
    log_success "Dev server is responding"
    echo ""
    echo "🌐 Access your frontend at:"
    echo "   → http://localhost:3100"
else
    log_warning "Dev server not yet responding (may still be starting)"
    echo "💡 Check logs: tail -f logs/dev-server.log"
fi

# =============================================================================
# DONE
# =============================================================================
print_footer "✅ System Ready!"

show_quick_reference

# Additional notes
echo ""
echo "💡 Development Tips:"
echo "   - Hot reload is enabled (no manual restart needed for code changes)"
echo "   - Build not required for development (Next.js compiles on-demand)"
echo "   - For production build: npm run build"
echo "   - To stop server: bash .conductor/scripts/stop.sh"
echo ""
