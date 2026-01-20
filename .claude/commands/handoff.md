---
description: Complete current session and create handoff document
---

# Session Handoff (Frontend Project)

Creates a handoff document for the current session to preserve context and work progress.

## What happens

1. Collects metadata (git commit, branch, timestamp)
2. **Saves MemoBrain session** (if active) to `frontend/` folder
3. Creates handoff document with session summary
4. Provides resume command for next session

## MemoBrain Integration

If you have an active memory session, handoff will:

```python
# 1. Create handoff summary (optional target agent)
memory_handoff(target_agent="{next}", focus_tags=["project:frontend", "decision"])

# 2. Save to frontend folder
memory_save(filename="frontend/{context}_{agent}.json")
# Saved to: _bmad-output/memory/frontend/
```

**Important**: Frontend sessions are isolated with `project:frontend` tag.

## Usage

```
/handoff "Session topic or description"
```

With target agent:
```
/handoff "Dashboard component" --to qa
```

## Examples

```
/handoff "Epic 5 Component Implementation"
/handoff "Price Calculator UI" --to qa
/handoff "State management refactor"
```

## Output

- Creates file: `thoughts/shared/handoffs/general/YYYY-MM-DD_HH-MM-SS_description.md`
- Saves memory: `_bmad-output/memory/frontend/{session}.json` (if active)
- Displays resume command
- Lists key files and next steps

## Session Naming

Pattern: `frontend_{phase}_{agent}_{context}`

Example: `frontend_implementation_dev_epic5`
