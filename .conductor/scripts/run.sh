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

# Check if PM2 is available
if ! pm2_installed; then
    log_error "PM2 is not installed"
    echo ""
    echo "💡 Install PM2: npm install -g pm2"
    exit 1
fi

TARGET_APP="wb-repricer-frontend-dev"
OTHER_APP="wb-repricer-frontend"
TARGET_PORT=3100

# Check if our target service already exists in PM2 (online or stopped)
# Note: pm2_process_exists() and pm2_process_status() are from utils.sh
if pm2_process_exists "$TARGET_APP"; then
    # Get current status (returns: online, stopped, errored, launching, or empty)
    current_status=$(pm2_process_status "$TARGET_APP")

    case "$current_status" in
        online)
            log_info "Service $TARGET_APP is already running in PM2"
            log_info "Restarting service..."
            restart_pm2_frontend
            ;;
        stopped|"")
            # Process is stopped or status unknown - delete and start fresh
            log_info "Service $TARGET_APP is stopped, cleaning up and starting..."
            if pm2 delete "$TARGET_APP" 2>&1; then
                log_success "Removed stopped PM2 process"
            else
                log_warning "Failed to delete PM2 process (may not exist)"
            fi

            # Verify the process was actually removed and wait for port release
            if pm2_process_exists "$TARGET_APP"; then
                log_error "Failed to remove PM2 process $TARGET_APP"
                exit 1
            fi

            # Wait for port to be released using helper
            if ! wait_for_port_free "$TARGET_PORT" "PM2" 5; then
                log_error "Port $TARGET_PORT not released after PM2 delete"
                exit 1
            fi

            # Check if port is in use by non-PM2 process using helper
            if ! check_port_conflict "$TARGET_PORT" "$TARGET_APP"; then
                exit 1
            fi

            if start_pm2_frontend "development"; then
                log_success "Service started from stopped state"
            else
                log_error "Failed to start service"
                exit 1
            fi
            ;;
        errored)
            # Process is in errored state - needs special handling
            log_error "Service $TARGET_APP is in errored state"
            log_info "Deleting and recreating the process..."
            if pm2 delete "$TARGET_APP" 2>&1; then
                log_success "Removed errored PM2 process"
            else
                log_warning "Failed to delete PM2 process (may not exist)"
            fi

            # Verify the process was actually removed and wait for port release
            if pm2_process_exists "$TARGET_APP"; then
                log_error "Failed to remove PM2 process $TARGET_APP"
                exit 1
            fi

            # Wait for port to be released using helper
            if ! wait_for_port_free "$TARGET_PORT" "PM2" 5; then
                log_error "Port $TARGET_PORT not released after PM2 delete"
                exit 1
            fi

            # Check if port is in use by non-PM2 process using helper
            if ! check_port_conflict "$TARGET_PORT" "$TARGET_APP"; then
                exit 1
            fi

            if start_pm2_frontend "development"; then
                log_success "Service started from errored state"
            else
                log_error "Failed to start service"
                exit 1
            fi
            ;;
        *)
            # Unknown status (launching, etc.) - warn and exit
            log_warning "Service $TARGET_APP has unexpected status: $current_status"
            log_info "Waiting a few seconds and retrying..."
            sleep 3
            # Re-check status after waiting
            current_status=$(pm2_process_status "$TARGET_APP")
            if [ "$current_status" = "online" ]; then
                log_success "Service is now online"
            else
                log_error "Service still has status: $current_status"
                exit 1
            fi
            ;;
    esac
else
    # Check if the OTHER frontend service is running and stop it
    if pm2_process_exists "$OTHER_APP"; then
        other_status=$(pm2_process_status "$OTHER_APP")
        if [ "$other_status" = "online" ]; then
            log_info "Stopping $OTHER_APP to free port $TARGET_PORT..."
            pm2 stop "$OTHER_APP" >/dev/null 2>&1
            pm2 save --force >/dev/null 2>&1

            # Verify port was actually released
            if ! wait_for_port_free "$TARGET_PORT" "$OTHER_APP" 10; then
                log_error "Port $TARGET_PORT still in use after stopping $OTHER_APP"
                local port_pid
                port_pid=$(lsof -ti:"$TARGET_PORT" -sTCP:LISTEN 2>/dev/null | head -n1)
                if [ -n "$port_pid" ]; then
                    echo "💡 Kill it: kill $port_pid"
                fi
                exit 1
            fi
        fi
    fi

    # Check if port is in use by non-PM2 process using helper
    if ! check_port_conflict "$TARGET_PORT" "$TARGET_APP"; then
        exit 1
    fi

    # Start fresh
    log_info "Starting service via PM2..."
    if start_pm2_frontend "development"; then
        log_success "Service started successfully"
    else
        log_error "Failed to start service"
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
if curl -s "http://localhost:$TARGET_PORT" > /dev/null 2>&1; then
    log_success "Dev server is responding"
    echo ""
    echo "🌐 Access your frontend at:"
    echo "   → http://localhost:$TARGET_PORT"
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
