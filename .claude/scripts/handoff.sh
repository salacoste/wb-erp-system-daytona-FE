#!/usr/bin/env bash
# /handoff command implementation
# Usage: handoff.sh "Session topic"

set -euo pipefail

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Get topic from argument
TOPIC="${1:-Session $(date '+%Y-%m-%d')}"

# Create slug from topic
DESCRIPTION=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]+/-/g' | sed 's/^-//;s/-$//')

# Run the create-handoff script
./scripts/create-handoff.sh "$TOPIC" "$DESCRIPTION"

# Get the created file info
source scripts/spec_metadata.sh
HANDOFF_FILE="thoughts/shared/handoffs/general/${FILENAME_TS}_${DESCRIPTION}.md"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ SESSION HANDOFF CREATED"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📄 Handoff file: $HANDOFF_FILE"
echo ""
echo "🔄 TO RESUME THIS SESSION:"
echo "   /resume \"${FILENAME_TS}_${DESCRIPTION}.md\""
echo ""
echo "   Or in new session:"
echo "   Read: $HANDOFF_FILE"
echo ""
echo "═══════════════════════════════════════════════════════════"
