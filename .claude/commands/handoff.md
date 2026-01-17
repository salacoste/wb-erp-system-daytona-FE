---
description: Complete current session and create handoff document
---

# Session Handoff

Creates a handoff document for the current session to preserve context and work progress.

## What happens

1. Collects metadata (git commit, branch, timestamp)
2. Creates handoff document with session summary
3. Provides resume command for next session

## Usage

```
/handoff "Session topic or description"
```

## Examples

```
/handoff "Epic 44 Price Calculator Implementation"
/handoff "Bug fix for login flow"
/handoff "Daily work session"
```

## Output

- Creates file: `thoughts/shared/handoffs/general/YYYY-MM-DD_HH-MM-SS_description.md`
- Displays resume command
- Lists key files and next steps
