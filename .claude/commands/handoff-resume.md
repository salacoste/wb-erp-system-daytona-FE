---
description: Resume a previous session from handoff document
---

# Resume Session from Handoff

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
3. Loads session context (learnings, artifacts, action items)
4. Checks git commit to verify state
5. Displays pending work and next steps
