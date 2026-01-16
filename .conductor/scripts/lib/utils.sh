#!/bin/bash
# Shared utilities for Conductor scripts - Frontend
# Provides common functions for logging, validation, and system checks

# =============================================================================
# COLORS & FORMATTING
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BOLD='\033[1m'
DIM='\033[2m'

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================
log_info() {
    echo -e "${CYAN}ℹ️  $*${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $*${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $*${NC}"
}

log_error() {
    echo -e "${RED}❌ $*${NC}"
}

# =============================================================================
# SECTION HEADERS
# =============================================================================
print_header() {
    # Only clear if TERM is set (not in CI/non-interactive environments)
    [ -n "$TERM" ] && clear 2>/dev/null || true
    echo -e "${BOLD}${BLUE}$*${NC}"
    echo "════════════════════════════════════════════════════════════"
}

print_footer() {
    echo ""
    echo -e "${GREEN}$*${NC}"
    echo "════════════════════════════════════════════════════════════"
}

check_section() {
    echo ""
    echo -e "${BOLD}📋 $1${NC}"
    echo "────────────────────────────────────────────────────────────"
}

# =============================================================================
# COMMAND VERIFICATION
# =============================================================================
verify_command() {
    local cmd="$1"
    local display_name="${2:-$cmd}"

    if command -v "$cmd" &>/dev/null; then
        local version=$($cmd --version 2>/dev/null | head -n1 || echo "unknown")
        log_success "$display_name found: $version"
        return 0
    else
        log_error "$display_name not found"
        echo "💡 $(get_install_hint "$cmd")"
        return 1
    fi
}

# =============================================================================
# FILE VERIFICATION
# =============================================================================
verify_file() {
    local file="$1"
    local display_name="${2:-$file}"

    if [ -f "$file" ]; then
        log_success "$display_name found"
        return 0
    else
        log_error "$display_name not found at: $file"
        return 1
    fi
}

verify_dir() {
    local dir="$1"
    local display_name="${2:-$dir}"

    if [ -d "$dir" ]; then
        log_success "$display_name found"
        return 0
    else
        log_error "$display_name not found at: $dir"
        return 1
    fi
}

# =============================================================================
# PORT VERIFICATION
# =============================================================================
check_port() {
    local port="$1"
    local service_name="${2:-Service on port $port}"

    if lsof -ti:"$port" -sTCP:LISTEN -t &>/dev/null | head -n1 | grep -q .; then
        log_success "$service_name is running on port $port"
        return 0
    else
        return 1
    fi
}

wait_for_port() {
    local port="$1"
    local service_name="${2:-Service}"
    local timeout="${3:-30}"

    log_info "Waiting for $service_name on port $port..."
    local count=0
    while [ $count -lt "$timeout" ]; do
        if check_port "$port" "$service_name" 2>/dev/null; then
            log_success "$service_name is ready"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done

    log_warning "$service_name did not start within ${timeout}s"
    return 1
}

wait_for_port_free() {
    local port="$1"
    local service_name="${2:-Port}"
    local timeout="${3:-10}"

    log_info "Waiting for $service_name port $port to be released..."
    local count=0
    while [ $count -lt "$timeout" ]; do
        if ! lsof -ti:"$port" -sTCP:LISTEN &>/dev/null | head -n1 | grep -q .; then
            log_success "Port $port is now free"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done

    log_warning "Port $port did not become free within ${timeout}s"
    return 1
}

check_port_conflict() {
    local port="$1"
    local app_name="${2:-PM2 service}"

    # Check if port is in use by non-PM2 process
    local port_pid
    port_pid=$(lsof -ti:"$port" -sTCP:LISTEN &>/dev/null | head -n1)

    if [ -n "$port_pid" ]; then
        log_error "Port $port is in use by non-$app_name process (PID: $port_pid)"
        echo "💡 Kill it: kill $port_pid"
        return 1
    fi

    return 0
}

# =============================================================================
# PM2 FUNCTIONS
# =============================================================================

pm2_installed() {
    command -v pm2 &>/dev/null
}

pm2_frontend_running() {
    pm2_installed || return 1
    pm2 list 2>/dev/null | grep -E "wb-repricer-frontend(-dev)?\s.*online" > /dev/null 2>&1
}

get_pm2_frontend_name() {
    if ! pm2_installed; then
        return 1
    fi

    # Check for dev version first, then production
    if pm2 list 2>/dev/null | grep -q "wb-repricer-frontend-dev.*online"; then
        echo "wb-repricer-frontend-dev"
        return 0
    elif pm2 list 2>/dev/null | grep -q "wb-repricer-frontend.*online"; then
        echo "wb-repricer-frontend"
        return 0
    fi
    return 1
}

get_pm2_frontend_info() {
    local app_name=$(get_pm2_frontend_name)
    if [ -n "$app_name" ]; then
        pm2 describe "$app_name" 2>/dev/null
    fi
}

pm2_process_cwd() {
    local info=$(get_pm2_frontend_info)
    if [ -n "$info" ]; then
        # Extract the path from PM2 output using pipe as delimiter
        echo "$info" | grep "exec cwd" | awk -F'│' '{print $3}' | xargs
    fi
}

pm2_process_cwd_matches() {
    local pm2_cwd=$(pm2_process_cwd)
    if [ -z "$pm2_cwd" ]; then
        return 1
    fi
    [ "$pm2_cwd" = "$PROJECT_ROOT" ]
}

start_pm2_frontend() {
    local mode="${1:-development}"
    local app_name="wb-repricer-frontend"

    if [ "$mode" = "development" ]; then
        app_name="wb-repricer-frontend-dev"
    fi

    if ! [ -f "ecosystem.config.js" ]; then
        log_error "PM2 ecosystem config not found"
        return 1
    fi

    log_info "Starting frontend via PM2 ($app_name)..."

    # Create logs directory
    mkdir -p logs

    if pm2 start ecosystem.config.js --only "$app_name" 2>&1; then
        # Save PM2 process list
        pm2 save --force >/dev/null 2>&1

        # Wait for startup
        if wait_for_port 3100 "PM2 Frontend" 30; then
            log_success "Frontend started via PM2"
            return 0
        else
            log_error "PM2 process started but port 3100 not responding"
            return 1
        fi
    else
        log_error "Failed to start PM2 frontend"
        return 1
    fi
}

restart_pm2_frontend() {
    local app_name=$(get_pm2_frontend_name)

    if [ -z "$app_name" ]; then
        log_warning "No PM2 frontend process to restart"
        return 1
    fi

    log_info "Restarting PM2 frontend ($app_name)..."

    if pm2 restart "$app_name" 2>&1; then
        sleep 2
        log_success "PM2 frontend restarted"
        return 0
    else
        log_error "Failed to restart PM2 frontend"
        return 1
    fi
}

stop_pm2_frontend() {
    local app_name=$(get_pm2_frontend_name)

    if [ -z "$app_name" ]; then
        log_info "No PM2 frontend process to stop"
        return 0
    fi

    log_info "Stopping PM2 frontend ($app_name)..."

    if pm2 stop "$app_name" 2>&1; then
        pm2 save --force >/dev/null 2>&1
        log_success "PM2 frontend stopped"
        return 0
    else
        log_error "Failed to stop PM2 frontend"
        return 1
    fi
}

# =============================================================================
# DEV SERVER FUNCTIONS
# =============================================================================
dev_server_running() {
    # Check if Next.js dev server is running on default port
    if curl -s http://localhost:3100 > /dev/null 2>&1; then
        return 0
    fi

    # Also check if node process is listening on the port
    if lsof -ti:3100 -sTCP:LISTEN -sUDP:CLOSE -t &>/dev/null | grep -q node; then
        return 0
    fi

    return 1
}

get_dev_server_pid() {
    lsof -ti:3100 -sTCP:LISTEN -sUDP:CLOSE -t 2>/dev/null | grep node | head -n1
}

start_dev_server() {
    local mode="${1:-development}"
    local port="${2:-3100}"

    if dev_server_running; then
        log_info "Dev server is already running"
        return 0
    fi

    log_info "Starting Next.js dev server on port $port..."

    # Create logs directory
    mkdir -p logs

    # Start dev server in background
    if [ "$mode" = "production" ]; then
        # Build first for production mode
        log_info "Building for production..."
        if npm run build 2>&1 | tee -a logs/build.log; then
            log_success "Build completed"
            nohup npm run start > logs/dev-server.log 2>&1 &
        else
            log_error "Build failed"
            return 1
        fi
    else
        # Development mode - no build required
        nohup npm run dev > logs/dev-server.log 2>&1 &
    fi

    local pid=$!
    echo "$pid" > logs/dev-server.pid

    # Wait for server to start
    if wait_for_port "$port" "Next.js dev server" 30; then
        log_success "Dev server started (PID: $pid)"
        return 0
    else
        log_error "Dev server failed to start"
        return 1
    fi
}

stop_dev_server() {
    local pid_file="logs/dev-server.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping dev server (PID: $pid)..."
            kill "$pid" 2>/dev/null
            sleep 2

            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                log_warning "Force killing dev server..."
                kill -9 "$pid" 2>/dev/null
            fi

            log_success "Dev server stopped"
        fi
        rm -f "$pid_file"
    fi

    # Also kill any process on port 3100
    local port_pid=$(lsof -ti:3100 -sTCP:LISTEN -sUDP:CLOSE -t 2>/dev/null | grep -v $$ | head -n1)
    if [ -n "$port_pid" ]; then
        log_info "Killing process on port 3100 (PID: $port_pid)..."
        kill "$port_pid" 2>/dev/null || true
    fi
}

restart_dev_server() {
    log_info "Restarting dev server..."
    stop_dev_server
    sleep 2
    start_dev_server
}

# =============================================================================
# BUILD FUNCTIONS
# =============================================================================
ensure_build_fresh() {
    # Next.js doesn't require manual build for dev mode
    # But check if .next directory exists for production
    if [ ! -d ".next" ] && [ ! -d "src" ]; then
        log_warning "No build found and no src directory"
        return 1
    fi

    if [ -d ".next" ]; then
        local build_time=$(stat -c %y ".next" 2>/dev/null | cut -d'.' -f1)
        if [ -z "$build_time" ]; then
            build_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" ".next" 2>/dev/null || echo "unknown")
        fi
        log_success "Production build exists (built: $build_time)"
    else
        log_info "No production build found (use 'npm run build' for production)"
    fi

    return 0
}

build_frontend() {
    log_info "Building frontend..."

    # Clean first
    log_info "Cleaning .next directory..."
    rm -rf .next

    if npm run build 2>&1 | tee logs/build.log; then
        log_success "Build completed"

        # Show build size
        if [ -f ".next/BUILD_ID" ]; then
            log_info "Build ID: $(cat .next/BUILD_ID)"
        fi

        return 0
    else
        log_error "Build failed. Check logs/build.log for details"
        return 1
    fi
}

# =============================================================================
# SYSTEM STATUS
# =============================================================================
show_system_status() {
    echo ""
    echo -e "${BOLD}📊 System Status:${NC}"
    echo "────────────────────────────────────────────────────────────"

    # Dev server
    echo -n "Dev Server: "
    if dev_server_running; then
        local pid=$(get_dev_server_pid)
        echo -e "${GREEN}Running on port 3100 (PID: $pid)${NC}"
    else
        echo -e "${YELLOW}Not running${NC}"
    fi

    # Build
    echo -n "Production Build: "
    if [ -d ".next" ]; then
        echo -e "${GREEN}Present${NC}"
    else
        echo -e "${YELLOW}Not built${NC}"
    fi

    # Dependencies
    echo -n "Dependencies: "
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}Installed${NC}"
    else
        echo -e "${YELLOW}Not installed${NC}"
    fi
}

# =============================================================================
# QUICK REFERENCE
# =============================================================================
show_quick_reference() {
    echo ""
    echo -e "${BOLD}📖 Quick Reference:${NC}"
    echo "────────────────────────────────────────────────────────────"
    echo "🔧 Development:"
    echo "   bash .conductor/scripts/run.sh          - Start dev server"
    echo "   bash .conductor/scripts/restart.sh    - Restart dev server"
    echo "   npm run dev                              - Direct dev server start"
    echo ""
    echo "🔍 Diagnostics:"
    echo "   bash .conductor/scripts/status.sh       - Check system status"
    echo "   cat logs/dev-server.log                  - View dev server logs"
    echo ""
    echo "🛑 Stop:"
    echo "   bash .conductor/scripts/stop.sh        - Stop dev server"
    echo "   kill \$(lsof -ti:3100 -t)                    - Kill process on port 3100"
    echo ""
    echo "🏗️  Build:"
    echo "   npm run build                            - Production build"
    echo "   npm run clean                            - Clean .next directory"
    echo ""
    echo "🧪 Testing:"
    echo "   npm run test                              - Run unit tests"
    echo "   npm run test:e2e                          - Run E2E tests"
    echo "   npm run lint                              - Lint code"
    echo "   npm run type-check                        - TypeScript type check"
}

# =============================================================================
# INSTALLATION HINTS
# =============================================================================
get_install_hint() {
    local cmd="$1"
    case "$cmd" in
        node)
            echo "Install from https://nodejs.org/ or: brew install node"
            ;;
        npm)
            echo "Usually installed with Node.js"
            ;;
        npx)
            echo "Usually installed with Node.js (comes with npm 7+)"
            ;;
        *)
            echo "Install $cmd"
            ;;
    esac
}
