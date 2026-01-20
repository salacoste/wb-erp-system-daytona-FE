---
description: Resume a previous session from handoff document
---

# Resume Session from Handoff (Frontend Project)

Restores session context from a previously created handoff document.

## Usage

```
/handoff-resume
```

Shows list of available handoff documents.

Then select one:
```
/handoff-resume "handoff-filename.md"
```

## What happens

1. Lists all available handoff documents
2. Reads the selected handoff
3. **Loads MemoBrain session** (if referenced) from `frontend/` folder
4. Loads session context (learnings, artifacts, action items)
5. Checks git commit to verify state
6. Displays pending work and next steps

## MemoBrain Integration

On resume, check for and load frontend memory sessions:

```python
# 1. Check available frontend sessions
memory_status(session_id="all")
# Look for: frontend_*

# 2. Load session from handoff reference
memory_load(filename="frontend/{session}.json", agent="{your-agent}")

# 3. Query handoff notes
memory_query(tag="project:frontend", tag="handoff")

# 4. Get key decisions
memory_query(tag="project:frontend", kind="decision")
```

## Session Discovery

Frontend sessions stored in: `_bmad-output/memory/frontend/`

```bash
ls _bmad-output/memory/frontend/*.json
```

## Resume with Memory

```
/handoff-resume "handoff-file.md"
```

Auto-loads from `frontend/` folder:
- Previous agent's decisions
- UI/UX context
- Component decisions
- Open blockers
