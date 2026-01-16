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
echo "  1. Start Conductor: bash .conductor/scripts/run.sh"
echo "  2. Access frontend: http://localhost:3100"
echo "  3. Start coding with AI assistance"
echo ""
