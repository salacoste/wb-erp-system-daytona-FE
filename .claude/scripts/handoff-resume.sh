#!/usr/bin/env bash
# /resume command implementation
# Usage: resume.sh [handoff-filename]

set -euo pipefail

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

HANDOFF_DIR="thoughts/shared/handoffs"

# Function to list available handoffs
list_handoffs() {
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "  📋 AVAILABLE HANDOFFS"
  echo "═══════════════════════════════════════════════════════════"
  echo ""

  # List general handoffs
  if [[ -d "$HANDOFF_DIR/general" ]]; then
    echo "📁 General:"
    find "$HANDOFF_DIR/general" -name "*.md" -type f 2>/dev/null | sort -r | head -5 | while read -r file; do
      local basename=$(basename "$file")
      local date=$(echo "$basename" | cut -d'_' -f1)
      local topic=$(grep '^topic:' "$file" 2>/dev/null | sed 's/topic: "//;s/"$//' || echo "Unknown")
      printf "  • %s\n    %s\n" "$basename" "$topic"
    done
  fi

  # List ticket handoffs
  find "$HANDOFF_DIR" -mindepth 1 -maxdepth 1 -type d ! -name "general" 2>/dev/null | while read -r ticket_dir; do
    local ticket=$(basename "$ticket_dir")
    echo ""
    echo "📁 $ticket:"
    find "$ticket_dir" -name "*.md" -type f 2>/dev/null | sort -r | head -3 | while read -r file; do
      local basename=$(basename "$file")
      local date=$(echo "$basename" | cut -d'_' -f1)
      local topic=$(grep '^topic:' "$file" 2>/dev/null | sed 's/topic: "//;s/"$//' || echo "Unknown")
      printf "  • %s\n    %s\n" "$basename" "$topic"
    done
  done

  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "💡 Usage: /resume \"filename\""
}

# Check if filename provided
if [[ $# -eq 0 ]]; then
  list_handoffs
  exit 0
fi

FILENAME="$1"
HANDOFF_FILE=""

# Find the handoff file
if [[ -f "$HANDOFF_DIR/general/$FILENAME" ]]; then
  HANDOFF_FILE="$HANDOFF_DIR/general/$FILENAME"
elif [[ -f "$FILENAME" ]]; then
  HANDOFF_FILE="$FILENAME"
else
  # Search in subdirectories
  HANDOFF_FILE=$(find "$HANDOFF_DIR" -name "$FILENAME" -type f 2>/dev/null | head -1)
fi

# Check if file was found
if [[ -z "$HANDOFF_FILE" ]]; then
  echo "❌ Handoff file not found: $FILENAME"
  echo ""
  list_handoffs
  exit 1
fi

# Read and display handoff
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🔄 RESUMING SESSION"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📄 File: $HANDOFF_FILE"
echo ""

# Extract key info
GIT_COMMIT=$(grep '^git_commit:' "$HANDOFF_FILE" | sed 's/git_commit: //')
TOPIC=$(grep '^topic:' "$HANDOFF_FILE" | sed 's/topic: "//;s/"$//')
DATE=$(grep '^date:' "$HANDOFF_FILE" | sed 's/date: //')

echo "📋 Session Info:"
echo "   Topic: $TOPIC"
echo "   Date: $DATE"
echo "   Commit: $GIT_COMMIT"
echo ""

# Check git status
if command -v git >/dev/null 2>&1 && [[ -n "$GIT_COMMIT" ]]; then
  CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  if [[ "$CURRENT_COMMIT" == "$GIT_COMMIT" ]]; then
    echo "✅ Git commit matches"
  else
    echo "⚠️  Git commit differs (current: $CURRENT_COMMIT)"
  fi
fi

echo ""
echo "───────────────────────────────────────────────────────────"
echo "📖 FULL HANDOFF CONTENT:"
echo "───────────────────────────────────────────────────────────"
echo ""

cat "$HANDOFF_FILE"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ SESSION RESUMED"
echo "═══════════════════════════════════════════════════════════"
