#!/usr/bin/env bash
# Handoff Document Creator
# Usage: ./scripts/create-handoff.sh "Topic" "description" [ticket-id]
#
# Examples:
#   ./scripts/create-handoff.sh "Feature Implementation" "user-auth"
#   ./scripts/create-handoff.sh "Bug Fix" "login-error" "ENG-1234"

set -euo pipefail

# Source metadata
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

source scripts/spec_metadata.sh

# Parameters
TOPIC="${1:?Error: Topic is required. Usage: $0 \"Topic\" \"description\" [ticket-id]}"
DESCRIPTION="${2:?Error: Description is required. Usage: $0 \"Topic\" \"description\" [ticket-id]}"
TICKET="${3:-}"

# Validate inputs
if [[ -z "$TOPIC" ]] || [[ -z "$DESCRIPTION" ]]; then
  echo "Error: Both topic and description are required"
  echo "Usage: $0 \"Topic\" \"description\" [ticket-id]"
  exit 1
fi

# Build path
HANDOFF_DIR="thoughts/shared/handoffs"
if [ -n "$TICKET" ]; then
  TARGET_DIR="$HANDOFF_DIR/$TICKET"
  FILENAME="${FILENAME_TS}_${TICKET}_${DESCRIPTION}.md"
else
  TARGET_DIR="$HANDOFF_DIR/general"
  FILENAME="${FILENAME_TS}_${DESCRIPTION}.md"
fi

# Create directory
mkdir -p "$TARGET_DIR"

# Create handoff file
cat > "$TARGET_DIR/$FILENAME" <<EOF
---
date: $DATE_ISO
researcher: Claude Code (Session)
git_commit: $GIT_COMMIT
branch: $GIT_BRANCH
repository: $REPOSITORY
topic: "$TOPIC"
tags: [project-context, handoff]
status: complete
last_updated: $DATE_SHORT
last_updated_by: Claude Code
type: project_handoff
---

# Handoff: $TOPIC

## Task(s)

**Session Purpose**: $TOPIC

**Status**: Complete - Handoff document created.

## Critical References

1. **CLAUDE.md** (Project Root)
   - Complete project overview and guidelines

2. **docs/stories/STORIES-STATUS-REPORT.md**
   - Current status of all stories

## Recent Changes

**Git Status**:
- Commit: $GIT_COMMIT
- Branch: $GIT_BRANCH
- Date: $DATE_ISO

## Learnings

<!-- Document key learnings from this session -->

## Artifacts

**Documentation Created**:
- $TARGET_DIR/$FILENAME (this file)

**Modified Files**:
<!-- List files modified during this session -->

## Action Items & Next Steps

**For Next Session**:
1. Review this handoff document
2. Check CLAUDE.md for project context
3. Identify next task from STORIES-STATUS-REPORT.md

**Pending Work**:
<!-- List pending work items -->

## Other Notes

**Session Context**:
<!-- Additional context, environment info, etc -->

**To Resume This Session**:
Read the handoff document at:
$TARGET_DIR/$FILENAME
EOF

# Success message
echo "✅ Handoff document created:"
echo "   $TARGET_DIR/$FILENAME"
echo ""
echo "📋 Metadata:"
echo "   Commit: $GIT_COMMIT"
echo "   Branch: $GIT_BRANCH"
echo "   Date: $DATE_ISO"
echo ""
echo "💡 Next steps:"
echo "   1. Edit the handoff to add session details"
echo "   2. Update sections: Learnings, Artifacts, Action Items"
echo "   3. Sync if needed: humanlayer thoughts sync"
