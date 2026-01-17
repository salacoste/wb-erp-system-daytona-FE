# Handoff Document Creation Workflow

## Overview

This guide explains how to create handoff documents using the automated metadata collection script.

---

## Quick Reference

| Task | Command |
|------|---------|
| Collect metadata | `source scripts/spec_metadata.sh` |
| View metadata | `./scripts/spec_metadata.sh` |
| Create handoff | See template below |

---

## The Metadata Script

**Location**: `scripts/spec_metadata.sh`

**What it provides**:

```bash
# After sourcing the script, these variables are available:
$DATE_ISO        # 2026-01-17T18:08:18Z (for YAML date field)
$DATE_SHORT      # 2026-01-17 (for last_updated field)
$FILENAME_TS     # 2026-01-17_21-08-18 (for filename)
$GIT_COMMIT      # b6b7e2265291746240ab765720ec9540d99f8eb2
$GIT_BRANCH      # main
$REPOSITORY      # salacoste/wb-erp-system-daytona-FE
```

---

## Reading Data from the Script

### Method 1: Source in Bash Script

```bash
#!/usr/bin/env bash
cd /path/to/frontend
source scripts/spec_metadata.sh

echo "Creating handoff for commit $GIT_COMMIT"
echo "Filename timestamp: $FILENAME_TS"
```

### Method 2: Execute Directly

```bash
./scripts/spec_metadata.sh

# Output:
# Current Date/Time (ISO): 2026-01-17T18:14:24Z
# Current Date (Short): 2026-01-17
# Timestamp For Filename: 2026-01-17_21-14-24
# Current Git Commit: b6b7e2265291746240ab765720ec9540d99f8eb2
# Current Branch: main
# Repository: salacoste/wb-erp-system-daytona-FE
```

### Method 3: Parse Output in Other Languages

```python
import subprocess
import re

output = subprocess.check_output(['./scripts/spec_metadata.sh'], text=True)

metadata = {}
for line in output.split('\n'):
    if ':' in line:
        key, value = line.split(':', 1)
        metadata[key.strip().lower().replace(' ', '_')] = value.strip()

print(metadata['current_git_commit'])  # b6b7e2265291746240ab765720ec9540d99f8eb2
```

---

## Creating Handoff Documents

### File Naming Convention

```
thoughts/shared/handoffs/
├── general/                        # General project handoffs
│   └── YYYY-MM-DD_HH-MM-SS_description.md
└── ENG-XXXX/                       # Ticket-specific handoffs
    └── YYYY-MM-DD_HH-MM-SS_ENG-XXXX_description.md
```

### Handoff Template

```bash
#!/usr/bin/env bash
# Usage: ./scripts/create-handoff.sh "Topic" "description"

# Source metadata
source scripts/spec_metadata.sh

# Parameters
TOPIC="${1:-General Session}"
DESCRIPTION="${2:-handoff}"
TICKET="${3:-}"  # Optional: ENG-XXXX

# Build path
if [ -n "$TICKET" ]; then
  DIR="thoughts/shared/handoffs/$TICKET"
  FILENAME="${FILENAME_TS}_${TICKET}_${DESCRIPTION}.md"
else
  DIR="thoughts/shared/handoffs/general"
  FILENAME="${FILENAME_TS}_${DESCRIPTION}.md"
fi

# Create directory
mkdir -p "$DIR"

# Create file
cat > "$DIR/$FILENAME" <<EOF
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

1. **`CLAUDE.md`** (Project Root)
   - Complete project overview and guidelines

## Recent Changes

**Git Status**:
- Commit: \`$GIT_COMMIT\`
- Branch: \`$GIT_BRANCH\`

## Learnings

<!-- Document key learnings from this session -->

## Artifacts

**Documentation Created**:
- \`$DIR/$FILENAME\` (this file)

## Action Items & Next Steps

<!-- List actionable next steps -->

## Other Notes

<!-- Additional context and notes -->
EOF

echo "Created: $DIR/$FILENAME"
```

---

## Complete Workflow Example

### Step 1: Source Metadata

```bash
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
source scripts/spec_metadata.sh
```

### Step 2: Verify Variables

```bash
echo "Commit: $GIT_COMMIT"
echo "Branch: $GIT_BRANCH"
echo "Timestamp: $FILENAME_TS"
```

### Step 3: Create Handoff Directory

```bash
mkdir -p thoughts/shared/handoffs/general
```

### Step 4: Write Handoff Document

```bash
cat > "thoughts/shared/handoffs/general/${FILENAME_TS}_my-work.md" <<EOF
---
date: $DATE_ISO
researcher: Claude Code (Session)
git_commit: $GIT_COMMIT
branch: $GIT_BRANCH
repository: $REPOSITORY
topic: "My Work Session"
tags: [feature-implementation, nextjs]
status: complete
last_updated: $DATE_SHORT
last_updated_by: Claude Code
type: project_handoff
---

# Handoff: My Work Session

## Task(s)

Session description here...

## Critical References

References here...

## Recent Changes

Changes here...

## Learnings

Learnings here...

## Artifacts

Artifacts here...

## Action Items & Next Steps

Next steps here...

## Other Notes

Additional notes here...
EOF
```

### Step 5: Sync (Optional)

```bash
# If HumanLayer CLI is installed
humanlayer thoughts sync
```

---

## YAML Frontmatter Fields

| Field | Source | Format | Example |
|-------|--------|--------|---------|
| `date` | `$DATE_ISO` | ISO 8601 UTC | `2026-01-17T18:08:18Z` |
| `git_commit` | `$GIT_COMMIT` | Full SHA | `b6b7e2265291746240ab765720ec9540d99f8eb2` |
| `branch` | `$GIT_BRANCH` | Branch name | `main` |
| `repository` | `$REPOSITORY` | owner/name | `salacoste/wb-erp-system-daytona-FE` |
| `last_updated` | `$DATE_SHORT` | YYYY-MM-DD | `2026-01-17` |
| `filename_ts` | `$FILENAME_TS` | YYYY-MM-DD_HH-MM-SS | `2026-01-17_21-08-18` |

**Optional fields** (manual):
- `topic` - Session topic description
- `tags` - Array of relevant tags
- `status` - `pending`, `in_progress`, `complete`
- `type` - `project_handoff`, `feature_work`, `bugfix`, etc.

---

## Integration with AI Sessions

### For Claude Code Sessions

When creating a handoff during a session:

1. **At session start**: Source the script to get current metadata
2. **During session**: Document work in the handoff file
3. **At session end**: Update status to `complete`

### Resume Template

To resume a session from a handoff:

```markdown
To resume this session:
1. Read the handoff document
2. Check the git_commit: verify you're on the right commit or update as needed
3. Review Action Items for pending work
4. Continue from where left off
```

---

## Troubleshooting

### Script Not Found

```bash
# Make sure you're in the frontend directory
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend

# Verify script exists
ls -la scripts/spec_metadata.sh

# Make executable
chmod +x scripts/spec_metadata.sh
```

### Variables Not Set

```bash
# Must use 'source' or '.' to export variables to current shell
source scripts/spec_metadata.sh

# NOT:
./scripts/spec_metadata.sh  # This only prints, doesn't export
```

### Git Not Available

If not in a git repository, the script will still work but git-related variables will be empty:

```bash
GIT_COMMIT=""      # Empty
GIT_BRANCH=""      # Empty
REPOSITORY=""      # Empty

# Date variables will still work:
DATE_ISO="..."    # Still available
FILENAME_TS="..." # Still available
```

---

## Best Practices

1. **Always source the script** at the start of handoff creation
2. **Use UTC timestamps** (`$DATE_ISO`) for YAML `date` field
3. **Include git commit** for reproducibility
4. **Update `last_updated`** when modifying existing handoffs
5. **Use descriptive filenames** with the timestamp prefix
6. **Organize by ticket** (`ENG-XXXX/`) when applicable

---

**Last Updated**: 2026-01-17
**Related**: `scripts/spec_metadata.sh`, `thoughts/shared/handoffs/general/`
