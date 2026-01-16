#!/bin/bash
# Conductor Setup Script - WB Repricer System Frontend
# Initializes the Conductor development environment for the frontend team

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load shared utilities if available
if [ -f "$SCRIPT_DIR/lib/utils.sh" ]; then
    source "$SCRIPT_DIR/lib/utils.sh"
else
    # Minimal logging if utils not available yet
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'

    log_success() { echo -e "${GREEN}✅ $*${NC}"; }
    log_warning() { echo -e "${YELLOW}⚠️  $*${NC}"; }
    log_error() { echo -e "${RED}❌ $*${NC}"; }
fi

cd "$PROJECT_ROOT"

echo "🚀 Setting up Conductor for WB Repricer System Frontend..."
echo "Project root: $PROJECT_ROOT"
echo ""

# =============================================================================
# Create necessary directories
# =============================================================================
echo "📁 Creating directories..."
mkdir -p ".conductor/archive"
mkdir -p "_bmad-output/conductor"
mkdir -p "logs"

log_success "Directories created"

# =============================================================================
# Check Node.js version
# =============================================================================
echo ""
echo "🔍 Checking Node.js version..."

if ! command -v node &>/dev/null; then
    log_error "Node.js not found"
    echo "💡 Install from https://nodejs.org/ or: brew install node"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "Found: $NODE_VERSION"

# =============================================================================
# Check npm version
# =============================================================================
echo "🔍 Checking npm version..."

if ! command -v npm &>/dev/null; then
    log_error "npm not found"
    echo "💡 Usually installed with Node.js"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "Found: npm $NPM_VERSION"

# =============================================================================
# Install dependencies
# =============================================================================
echo ""
echo "📦 Installing dependencies..."

if [ ! -f "package.json" ]; then
    log_error "package.json not found"
    exit 1
fi

if ! npm install --silent; then
    log_error "Failed to install dependencies"
    echo "💡 Try: npm install --verbose (to see errors)"
    exit 1
fi

log_success "Dependencies installed"

# =============================================================================
# PHASE 4: Auto-start PM2 Dev Server
# =============================================================================
echo ""
echo "🚀 Starting PM2 dev server..."

# Load PM2 utilities
if ! pm2_installed; then
    log_warning "PM2 is not installed - skipping auto-start"
    echo "💡 Install PM2: npm install -g pm2"
else
    # Check if already running
    if pm2_process_exists "wb-repricer-frontend-dev" && [ "$(pm2_process_status "wb-repricer-frontend-dev")" = "online" ]; then
        log_info "PM2 dev server is already running!"
        echo ""
        echo "📊 Current PM2 status:"
        pm2 list 2>/dev/null | grep -E "wb-repricer-frontend(-dev)?"
        echo ""
        echo "💡 Commands:"
        echo "   • Restart: bash .conductor/scripts/restart.sh"
        echo "   • Stop:    bash .conductor/scripts/stop.sh"
        echo "   • Logs:    pm2 logs wb-repricer-frontend-dev"
        echo ""
    else
        # Clean up any stopped PM2 processes
        if pm2_process_exists "wb-repricer-frontend-dev"; then
            pm2 delete "wb-repricer-frontend-dev" >/dev/null 2>&1

            # Wait for port to be released
            if ! wait_for_port_free 3100 "PM2" 5; then
                log_warning "Port 3100 not released after cleanup - skipping auto-start"
                echo "💡 Free the port and run: bash .conductor/scripts/run.sh"
            fi
        fi

        # Check port availability
        if ! check_port_conflict 3100 "PM2"; then
            log_warning "Port 3100 is in use - skipping auto-start"
            echo "💡 Free the port and run: bash .conductor/scripts/run.sh"
        else
            # Start PM2
            if start_pm2_frontend "development"; then
                log_success "PM2 dev server started automatically"
            else
                log_warning "Failed to start PM2 - manual start required"
                echo "💡 Run: bash .conductor/scripts/run.sh"
            fi
        fi
    fi
fi

# =============================================================================
# Display configuration summary
# =============================================================================
echo ""
echo "📝 Conductor configuration:"
echo "────────────────────────────────────"
echo "  Project: WB Repricer System Frontend"
echo "  Technology: Next.js 15, React 19, TypeScript"
echo "  State: Zustand"
echo "  Styling: Tailwind CSS"
echo "  Testing: Vitest + Playwright"
echo "  PM Instruction: docs/PM-AGENT-INSTRUCTION-BMM.md"
echo "  ADR: docs/adr/"
echo "  BMM Agents: _bmad/bmm/agents/"

echo ""
echo "📂 Frontend paths:"
echo "  - Components: src/components/"
echo "  - Hooks: src/hooks/"
echo "  - Lib: src/lib/"
echo "  - Stores: src/stores/"
echo "  - Types: src/types/"
echo "  - Utils: src/utils/"
echo "  - App: src/app/ (App Router)"

# =============================================================================
# Done
# =============================================================================
echo ""
log_success "Conductor setup complete!"
echo ""
echo "📖 Documentation:"
echo "  → DoR/DoD: docs/PM-AGENT-INSTRUCTION-BMM.md"
echo ""
echo "🎯 Quick Start:"
echo "  1. Frontend: http://localhost:3100"
echo "  2. PM2 logs: pm2 logs wb-repricer-frontend-dev"
echo "  3. Start coding with AI assistance"
echo ""
