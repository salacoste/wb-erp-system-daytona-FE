#!/bin/bash
# Conductor Archive Script - WB Repricer System Frontend
# Archives Conductor session files (session-specific, not full code)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ARCHIVE_DIR="$PROJECT_ROOT/.conductor/archive"

# Load shared utilities for PM2 functions and logging
source "$SCRIPT_DIR/lib/utils.sh"

echo "📦 Archiving Conductor Session - WB Repricer System Frontend"
echo "Archive directory: $ARCHIVE_DIR"
echo ""

cd "$PROJECT_ROOT"

# =============================================================================
# PHASE 0: Stop PM2 Processes
# =============================================================================
echo "🛑 Checking for running PM2 processes..."

if pm2_installed; then
    if pm2_frontend_running; then
        FRONTEND_NAME=$(get_pm2_frontend_name)
        if [ -n "$FRONTEND_NAME" ]; then
            echo "📦 Stopping PM2 frontend ($FRONTEND_NAME) before archive..."
            stop_pm2_frontend
            log_success "PM2 frontend stopped, port 3100 freed"
            # Wait for OS to fully release the port and PM2 to clean up
            # This prevents potential race conditions in subsequent operations
            sleep 2
        fi
    else
        log_info "No PM2 frontend processes running"
    fi
else
    log_info "PM2 not installed, skipping PM2 shutdown"
fi

echo ""

# Create archive if it doesn't exist
mkdir -p "$ARCHIVE_DIR"

# Archive current session
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SESSION_ARCHIVE="$ARCHIVE_DIR/conductor-session-$TIMESTAMP.tar.gz"

echo "📋 Archiving session files..."

# Build list of files to archive (only existing ones)
ARCHIVE_FILES=""
[ -d ".context" ] && ARCHIVE_FILES="$ARCHIVE_FILES .context/"
[ -d "_bmad-output" ] && ARCHIVE_FILES="$ARCHIVE_FILES _bmad-output/"

if [ -z "$ARCHIVE_FILES" ]; then
    log_warning "No session files to archive"
    exit 0
fi

# Create archive from session-specific files only
# This includes .context/ (session workspace) and _bmad-output/ (agent outputs)
# Full code archives are created separately if needed
tar -czf "$SESSION_ARCHIVE" \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="coverage" \
    --exclude="test-results" \
    --exclude="logs/*.log" \
    $ARCHIVE_FILES 2>/dev/null

# Check if archive was created successfully
if [ -f "$SESSION_ARCHIVE" ]; then
    # Get file size (cross-platform)
    ARCHIVE_SIZE=0
    if command -v stat &>/dev/null; then
        if stat -c %s "$SESSION_ARCHIVE" &>/dev/null; then
            ARCHIVE_SIZE=$(stat -c %s "$SESSION_ARCHIVE" 2>/dev/null || echo "0")
        elif stat -f %z "$SESSION_ARCHIVE" &>/dev/null; then
            ARCHIVE_SIZE=$(stat -f %z "$SESSION_ARCHIVE" 2>/dev/null || echo "0")
        fi
    fi

    if [ "$ARCHIVE_SIZE" -gt 100 ]; then
        HUMAN_SIZE=$(du -h "$SESSION_ARCHIVE" 2>/dev/null | cut -f1)
        log_success "Session archive created: $SESSION_ARCHIVE ($HUMAN_SIZE)"
    else
        log_warning "Archive seems too small or empty ($ARCHIVE_SIZE bytes)"
    fi
else
    log_error "Archive file not created"
fi

# Clean up old archives (keep last 30 days)
echo ""
echo "🧹 Cleaning up old archives (keeping last 30 days)..."

if command -v find &>/dev/null; then
    find "$ARCHIVE_DIR" -name "conductor-session-*.tar.gz" -mtime +30 -delete 2>/dev/null || true

    # Count remaining archives
    ARCHIVE_COUNT=$(find "$ARCHIVE_DIR" -name "conductor-session-*.tar.gz" 2>/dev/null | wc -l | tr -d ' ')
    echo "📚 Session archives remaining: $ARCHIVE_COUNT"
else
    log_warning "find command not available, skipping cleanup"
fi

echo ""
echo "📚 Quick Reference:"
echo "  → DoR/DoD: docs/PM-AGENT-INSTRUCTION-BMM.md"
echo "  → ADRs: docs/adr/"
echo "  → Frontend PRD: docs/prd.md"
echo "  → Architecture: docs/front-end-architecture.md"
echo ""
log_success "Archive complete!"
