#!/bin/bash
# System Status - WB Repricer System Frontend
# Shows the current status of the development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Simple inline colors (no sourcing to avoid issues)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

cd "$PROJECT_ROOT"

echo -e "${BOLD}${BLUE}📊 Frontend System Status${NC}"
echo "════════════════════════════════════════════════════════════"
echo "Project root: $PROJECT_ROOT"
echo ""

# System Status
echo -e "${BOLD}📊 System Status:${NC}"
echo "────────────────────────────────────────────────────────────"

# Dev server
echo -n "Dev Server: "
if curl -s http://localhost:3100 > /dev/null 2>&1; then
    pid=$(lsof -ti:3100 -sTCP:LISTEN -sUDP:CLOSE -t 2>/dev/null | grep node | head -n1)
    if [ -n "$pid" ]; then
        echo -e "${GREEN}Running on port 3100 (PID: $pid)${NC}"
    else
        echo -e "${GREEN}Running on port 3100${NC}"
    fi
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

echo ""
echo "📂 Project Structure:"
echo "────────────────────────────────────────────────────────────"

# Check key directories
for dir in src public .next node_modules; do
    echo -n "$dir: "
    if [ -d "$dir" ]; then
        count=$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')
        echo -e "${GREEN}Present ($count files)${NC}"
    else
        echo -e "${YELLOW}Not found${NC}"
    fi
done

echo ""
echo "📝 Package Scripts:"
echo "────────────────────────────────────────────────────────────"
echo "  npm run dev          - Start development server (port 3100)"
echo "  npm run build        - Create production build"
echo "  npm run start        - Start production server"
echo "  npm run lint        - Lint code"
echo "  npm run type-check  - TypeScript type checking"
echo "  npm run test        - Run unit tests (Vitest)"
echo "  npm run test:e2e    - Run E2E tests (Playwright)"

echo ""
echo "🔧 Process Status:"
echo "────────────────────────────────────────────────────────────"

# Dev server
echo -n "Dev Server (port 3100): "
if curl -s http://localhost:3100 > /dev/null 2>&1; then
    pid=$(lsof -ti:3100 -sTCP:LISTEN -sUDP:CLOSE -t 2>/dev/null | grep node | head -n1)
    if [ -n "$pid" ]; then
        echo -e "${GREEN}Running (PID: $pid)${NC}"
    else
        echo -e "${GREEN}Running${NC}"
    fi
else
    echo -e "${YELLOW}Not running${NC}"
fi

echo ""
echo "💡 Actions:"
echo "────────────────────────────────────────────────────────────"
echo "  bash .conductor/scripts/run.sh       - Start dev server"
echo "  bash .conductor/scripts/restart.sh - Restart dev server"
echo "  bash .conductor/scripts/stop.sh    - Stop dev server"
echo "  npm run dev                            - Direct start"
echo ""
