# BMaD Memory Protocol - Frontend Project

**Version**: 1.0
**Status**: Active
**Project**: Frontend (WB Repricer UI)
**Integration**: MemoBrain MCP Server (shared with backend)

---

## Overview

This protocol defines how Frontend BMaD agents interact with the shared MemoBrain MCP server while maintaining **project isolation** from the backend team.

### Key Principles

1. **Project Isolation**: All frontend sessions use `project:frontend` tag
2. **Shared Server**: Same MCP server, separate knowledge graphs
3. **Own Documentation**: Frontend creates/manages its own docs in `frontend/docs/`
4. **Cross-Project Queries**: Can query backend knowledge when needed (read-only)

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND MEMORY PROTOCOL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PROJECT ID:    frontend                                         │
│  SESSION ID:    frontend_{phase}_{agent}_{context}               │
│  STORAGE:       _bmad-output/memory/frontend/                    │
│                                                                  │
│  REQUIRED TAGS:                                                  │
│    project:frontend  phase:{phase}  agent:{name}                 │
│                                                                  │
│  ISOLATION:                                                      │
│    ✅ Own sessions, own tags, own storage folder                 │
│    ✅ Can read backend sessions (read-only)                      │
│    ❌ Never write to backend sessions                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Session Identification

### 1.1 Session ID Format

```
frontend_{phase}_{agent}_{context}
```

**Examples:**
```
frontend_planning_pm_requirements
frontend_solutioning_architect_component-design
frontend_implementation_dev_epic5
frontend_qa_tea_e2e-tests
frontend_implementation_ux-designer_dashboard
```

### 1.2 Session File Naming

```
frontend_{context}_{agent}.json

Storage: _bmad-output/memory/frontend/
```

**Examples:**
```
_bmad-output/memory/frontend/epic5_dev.json
_bmad-output/memory/frontend/sprint2_qa.json
_bmad-output/memory/frontend/planning_architect.json
```

---

## 2. Tagging Strategy

### 2.1 Required Tags (ALWAYS Include)

```yaml
mandatory_tags:
  - "project:frontend"          # Project isolation
  - "phase:{phase}"             # BMaD phase
  - "agent:{agent-name}"        # Your agent name
```

### 2.2 Context Tags

```yaml
context_tags:
  - "epic:{N}"                  # Epic number
  - "story:{N.M}"               # Story ID
  - "sprint:{N}"                # Sprint number
  - "component:{name}"          # UI component
  - "feature:{name}"            # Feature name
```

### 2.3 Frontend-Specific Tags

```yaml
frontend_tags:
  - "ui"                        # UI-related
  - "ux"                        # UX decisions
  - "component"                 # Component design
  - "state"                     # State management
  - "api-integration"           # Backend API usage
  - "styling"                   # CSS/styling
  - "accessibility"             # A11y considerations
  - "responsive"                # Responsive design
  - "performance"               # Frontend performance
```

---

## 3. Project Isolation

### 3.1 Storage Separation

```
_bmad-output/memory/
├── wb-repricer/              # Backend project (DO NOT WRITE)
│   ├── epic-42-dev.json
│   └── ...
├── frontend/                  # Frontend project (YOUR SPACE)
│   ├── epic-5-dev.json
│   ├── sprint-2-qa.json
│   └── ...
└── shared/                    # Cross-project (READ ONLY for frontend)
    └── api-contracts.json
```

### 3.2 Query Isolation

**Query your own project:**
```python
memory_query(tag="project:frontend")  # Only frontend knowledge
memory_query(tag="project:frontend", kind="decision")  # Frontend decisions
```

**Query backend (read-only, when needed):**
```python
# When you need to understand backend API
memory_query(tag="project:wb-repricer", tag="api")
# But NEVER store to backend sessions
```

### 3.3 Isolation Rules

| Action | Frontend Sessions | Backend Sessions | Shared |
|--------|-------------------|------------------|--------|
| Read | ✅ Yes | ✅ Yes (read-only) | ✅ Yes |
| Write | ✅ Yes | ❌ Never | ❌ Never |
| Create | ✅ Yes | ❌ Never | ❌ Never |
| Delete | ✅ Yes | ❌ Never | ❌ Never |

---

## 4. Agent Lifecycle

### 4.1 On Activation

```python
# 1. Check frontend sessions
memory_status(session_id="all")
# Look for: frontend_{*}_{your-agent}

# 2. Load or init
memory_load(filename="frontend_{context}_{agent}.json")
# OR
memory_init(
    task="{your task}",
    agent="{agent-name}",
    session_id="frontend_{phase}_{agent}_{context}"
)

# 3. Store initial context with project tag
memory_store(
    content="Session started: {context}",
    kind="evidence",
    tags=["project:frontend", "phase:{phase}", "agent:{name}", "session-start"]
)
```

### 4.2 During Work

```python
# Always include project:frontend tag!
memory_store(
    content="Decided to use React Query for server state",
    kind="decision",
    tags=["project:frontend", "agent:architect", "state", "decision"]
)
```

### 4.3 On Handoff

```python
# Create handoff for frontend agent
memory_handoff(
    target_agent="dev",  # Another frontend agent
    focus_tags=["project:frontend", "component", "decision"]
)

# Save to frontend folder
memory_save(filename="frontend/epic5_architect.json")
```

---

## 5. Cross-Project Communication

### 5.1 Reading Backend Context

When frontend needs to understand backend:

```python
# Query backend API decisions
backend_api = memory_query(tag="project:wb-repricer", tag="api")

# Store your understanding in YOUR session
memory_store(
    content=f"Backend API analysis: {summary}",
    kind="evidence",
    tags=["project:frontend", "api-integration", "backend-context"]
)
```

### 5.2 API Contract Sync

```python
# If shared API contracts exist
shared = memory_query(tag="shared", tag="api-contract")

# Reference in your decisions
memory_store(
    content="Using API endpoint from shared contract: /api/v1/reports",
    kind="evidence",
    tags=["project:frontend", "api-integration"]
)
```

---

## 6. Handoff Matrix (Frontend Team)

| From | To | Focus Tags |
|------|----|------------|
| PM | Architect | `requirements`, `ux`, `scope` |
| PM | UX-Designer | `user-needs`, `flows`, `personas` |
| Architect | Dev | `component`, `state`, `api-integration` |
| UX-Designer | Dev | `design`, `accessibility`, `responsive` |
| Dev | QA | `implementation`, `tests`, `edge-cases` |
| QA | Dev | `bugs`, `regression`, `accessibility` |
| QA | SM | `quality`, `coverage`, `release` |

---

## 7. Documentation Ownership

### 7.1 Frontend Documentation

Frontend team creates and maintains:
```
frontend/docs/
├── architecture/           # Frontend architecture
├── components/             # Component documentation
├── stories/                # User stories
├── design/                 # UX/UI specs
└── PROJECT-STATUS.md       # Frontend project status
```

### 7.2 Cross-Reference Protocol

**Memory → Docs:**
```python
memory_store(
    content="Component design documented. See doc://frontend/docs/components/dashboard.md",
    kind="decision",
    tags=["project:frontend", "component", "documented"]
)
```

**Docs → Memory:**
```markdown
## Dashboard Component

Design decisions tracked in memory:
- Session: `mem://frontend_solutioning_architect?tag=dashboard`
- Key decisions: `mem://frontend_solutioning_architect?kind=decision`
```

---

## 8. MCP Commands Reference

| Command | Frontend Usage |
|---------|---------------|
| `memory_init` | `memory_init(task, agent, session_id="frontend_...")` |
| `memory_store` | Always include `tags=["project:frontend", ...]` |
| `memory_query` | Filter: `tag="project:frontend"` for isolation |
| `memory_handoff` | Target frontend agents only |
| `memory_save` | Save to `frontend/{context}_{agent}.json` |
| `memory_load` | Load from `frontend/` folder |
| `memory_status` | View all sessions, filter by frontend |

---

## 9. Best Practices

### DO ✅
- Always tag with `project:frontend`
- Store UI/UX decisions with context
- Reference shared API contracts
- Save sessions to `frontend/` folder
- Document component decisions

### DON'T ❌
- Write to backend sessions
- Create sessions without project tag
- Store backend business logic (reference only)
- Skip handoff on agent switch
- Forget to save before deactivation

---

## Appendix: Example Session

```python
# Frontend Dev starting Epic 5 work

# 1. Init
memory_init(
    task="Implement Dashboard component for Epic 5",
    agent="dev",
    session_id="frontend_implementation_dev_epic5"
)

# 2. Check architect's decisions
arch_context = memory_query(tag="project:frontend", tag="epic:5", kind="decision")

# 3. Store implementation decision
memory_store(
    content="Using React Query + Zustand for Dashboard state. React Query for server state, Zustand for UI state.",
    kind="decision",
    tags=["project:frontend", "phase:implementation", "agent:dev", "epic:5", "state", "component:dashboard"]
)

# 4. Reference backend API
memory_store(
    content="Dashboard calls /api/v1/reports endpoint. See backend session for rate limits.",
    kind="evidence",
    tags=["project:frontend", "agent:dev", "api-integration", "epic:5"]
)

# 5. Save on completion
memory_save(filename="frontend/epic5_dev.json")
```

---

**Protocol Version**: 1.0
**Last Updated**: 2026-01-19
**Project**: Frontend (WB Repricer UI)
