# MemoBrain Integration Guide (Frontend Team)

**Version**: 1.0
**Status**: Active
**Last Updated**: 2026-01-20

---

## Overview

This project uses MemoBrain MCP server for AI agent memory persistence. MemoBrain enables:

- **Session Persistence**: Maintain context across AI agent sessions
- **Knowledge Accumulation**: Store decisions, insights, and evidence
- **Agent Handoffs**: Transfer context between agents (PM → Dev → QA)
- **Team Isolation**: Frontend memory is separate from backend team

---

## Quick Start

### 1. Verify Configuration

MCP configuration is in `.mcp.json`:

```json
{
  "mcpServers": {
    "memobrain": {
      "env": {
        "MEMOBRAIN_STORAGE_PATH": "...frontend/_bmad-output/memory"
      }
    }
  }
}
```

### 2. Check Memory Status

In Claude Code session:
```
memory_status(session_id="all")
```

### 3. Start Working

```python
# Initialize session for your work
memory_init(
    task="Implement Epic 44 Price Calculator UI",
    agent="dev"
)

# Store important decisions
memory_store(
    content="Using shadcn/ui Slider for margin input",
    kind="decision",
    tags=["epic:44", "component", "ui"]
)
```

---

## Storage Location

**Frontend memory**: `frontend/_bmad-output/memory/`

This is **separate** from backend memory to avoid conflicts between teams.

```
frontend/
└── _bmad-output/
    └── memory/
        ├── epic-44-dev.json
        ├── story-37.5-qa.json
        └── ...
```

---

## MCP Tools Reference

### Core Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `memory_init` | Start new session | `memory_init(task="...", agent="dev")` |
| `memory_store` | Save knowledge | `memory_store(content="...", kind="decision")` |
| `memory_query` | Find knowledge | `memory_query(tag="epic:44")` |
| `memory_recall` | Get compressed context | `memory_recall()` |
| `memory_save` | Persist to file | `memory_save("epic-44-dev.json")` |
| `memory_load` | Restore session | `memory_load("epic-44-dev.json")` |
| `memory_status` | Check sessions | `memory_status("all")` |
| `memory_handoff` | Create handoff | `memory_handoff("qa")` |

### Node Kinds

| Kind | Purpose | Example |
|------|---------|---------|
| `evidence` | Facts, findings | "Found existing component in..." |
| `decision` | Choices made | "Using TanStack Query for state" |
| `insight` | Conclusions | "Pattern works better for mobile" |
| `subtask` | Progress markers | "Completed: form validation" |

---

## Session Naming Convention

```
{project}_{context}_{agent}
```

**Examples for Frontend**:
- `frontend_epic44_dev` - Epic 44 development
- `frontend_story-37.5_qa` - Story testing
- `frontend_ui-components_architect` - Architecture work

---

## Workflow Examples

### Starting Epic Work

```python
# 1. Check for existing sessions
memory_status(session_id="all")

# 2. Load previous context or start new
memory_load("frontend_epic44_dev.json", agent="dev")
# OR
memory_init(task="Epic 44: Price Calculator UI", agent="dev")

# 3. Query previous decisions
memory_query(tag="epic:44", kind="decision")
```

### During Development

```python
# Store component decisions
memory_store(
    content="PriceCalculatorForm uses react-hook-form with zod validation",
    kind="decision",
    tags=["epic:44", "form", "validation"]
)

# Store findings
memory_store(
    content="Backend API expects POST /v1/products/price-calculator",
    kind="evidence",
    tags=["epic:44", "api", "integration"]
)

# Mark progress
memory_store(
    content="Completed: MarginSlider component with 0-100% range",
    kind="subtask",
    tags=["epic:44", "progress"]
)
```

### Handoff to QA

```python
# Create handoff summary
memory_handoff(
    target_agent="qa",
    focus_tags=["epic:44", "edge-cases", "validation"]
)

# Save session
memory_save("frontend_epic44_dev.json")
```

---

## Tagging Strategy

### Required Tags

Always include:
- `project:frontend` - Project identifier
- `agent:{name}` - Your agent role

### Context Tags

Add when relevant:
- `epic:{N}` - Epic number (e.g., `epic:44`)
- `story:{N.M}` - Story ID (e.g., `story:37.5`)
- `component:{name}` - Component being worked on

### Semantic Tags

Based on content:
- `decision` - Choice made
- `blocker` - Blocking issue
- `api` - Backend integration
- `ui` - User interface
- `validation` - Form validation
- `accessibility` - WCAG compliance

---

## Best Practices

### DO

- Always include required tags
- Store decisions with rationale
- Create handoff before switching agents
- Save session before ending work
- Use semantic tags for retrieval

### DON'T

- Store large code blocks (reference files instead)
- Skip tagging
- Forget to save before handoff
- Mix backend decisions in frontend memory

---

## Troubleshooting

### No Sessions Found

```python
# Check storage path is correct
memory_status(session_id="all")

# Verify files exist
# Check: frontend/_bmad-output/memory/
```

### Session Not Loading

```python
# Use absolute path if needed
memory_load("/full/path/to/session.json", agent="dev")

# Or check filename
memory_status(session_id="all")
```

### Memory Not Persisting

1. Check `MEMOBRAIN_STORAGE_PATH` in `.mcp.json`
2. Verify directory exists: `frontend/_bmad-output/memory/`
3. Call `memory_save()` before ending session

---

## Integration with BMaD

For BMaD agent workflows, the memory protocol follows:

1. **On Activation**: Check existing sessions, load or init
2. **During Work**: Store decisions, evidence, insights
3. **On Handoff**: Create summary, save session
4. **On Deactivation**: Always save

See `_bmad/core/MEMORY-PROTOCOL.md` for full protocol.

---

## Security Notes

- Memory files may contain project-specific information
- Don't share session files with external parties
- `.mcp.json` is in `.gitignore` (contains paths)

---

## See Also

- [BMaD Framework](./BMAD-QUICK-START.md) - Agent framework guide
- [API Integration](./api-integration-guide.md) - Backend API reference
- [Project CLAUDE.md](../CLAUDE.md) - Main project context
