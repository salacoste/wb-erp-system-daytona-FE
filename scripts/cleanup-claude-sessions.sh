#!/bin/bash
# Cleanup old Claude Code session files for frontend
# Keeps last 7 days of sessions, removes older ones

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🧹 Cleaning up Claude session files (frontend)..."

# Find and remove session files older than 7 days
find "$PROJECT_ROOT/.claude/sessions" -name "*.tmp" -mtime +7 -delete 2>/dev/null
find "$PROJECT_ROOT/.claude/state" -name "tool-count-*.txt" -mtime +30 -delete 2>/dev/null

echo "✅ Cleanup complete"
