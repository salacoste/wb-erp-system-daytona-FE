# BMAD Framework for OpenCode

**Migrated from:** `_bmad/` (CloudCode)
**Version:** 6.0.0-alpha.22
**Date:** 2026-01-17

---

## Structure

```
.opencode/
├── agent/                    # Agent stub files (point to bmm/agents/)
├── command/                  # Command stub files (point to workflows)
├── bmm/                      # Main BMAD framework
│   ├── agents/              # 9 agent implementations
│   ├── workflows/           # 11 workflow categories
│   └── config.yaml          # Project configuration
└── core/                     # Core BMAD engine
    ├── agents/              # bmad-master
    ├── tasks/               # workflow.xml + task XMLs
    └── workflows/           # brainstorming, party-mode
```

---

## Agents (9 total)

| Agent | File | Role |
|-------|------|------|
| dev | `bmm/agents/dev.md` | Senior Frontend Developer + DoD Enforcer |
| pm | `bmm/agents/pm.md` | Product Manager |
| architect | `bmm/agents/architect.md` | System Architect |
| analyst | `bmm/agents/analyst.md` | Business Analyst |
| ux-designer | `bmm/agents/ux-designer.md` | UX/UI Expert |
| tech-writer | `bmm/agents/tech-writer.md` | Technical Documentation |
| tea | `bmm/agents/tea.md` | Test Engineering Architect |
| sm | `bmm/agents/sm.md` | Scrum Master |
| quick-flow-solo-dev | `bmm/agents/quick-flow-solo-dev.md` | Quick Development Flow |

---

## Workflows (11 categories)

### Phase 1: Analysis
- `1-analysis/research` - Conduct research across domains

### Phase 2: Plan
- `2-plan-workflows/prd` - Create Product Requirements Document
- `2-plan-workflows/create-architecture` - Architecture decisions
- `2-plan-workflows/create-ux-design` - UX design planning

### Phase 3: Solutioning
- `3-solutioning/create-epics-and-stories` - Break down requirements
- `3-solutioning/check-implementation-readiness` - Validate before dev
- `3-solutioning/generate-project-context` - Project context file

### Phase 4: Implementation
- `4-implementation/dev-story` - Execute stories
- `4-implementation/code-review` - Adversarial code review
- `4-implementation/correct-course` - Navigate changes

### Additional
- `bmad-quick-flow/quick-dev` - Flexible development
- `document-project` - Brownfield documentation
- `excalidraw-diagrams` - Diagram creation (flowchart, dataflow, wireframe)
- `testarch/` - Test architecture workflows
- `workflow-status/` - Sprint tracking

---

## Usage in OpenCode

### Activate Agent
```
Use agent: bmad-agent-bmm-dev
```

### Execute Workflow
```
Use workflow: bmad-bmm-dev-story
```

### Menu Commands (when in dev agent)
- `[MH]` - Redisplay Menu
- `[CH]` - Chat
- `[DS]` - Execute Dev Story workflow
- `[CR]` - Code Review
- `[DOD]` - Show Definition of Done
- `[PM]` - Party Mode
- `[DA]` - Dismiss Agent

---

## Configuration

**File:** `bmm/config.yaml`

```yaml
project_name: frontend
user_name: R2d2
communication_language: English
document_output_language: English
output_folder: "{project-root}/_bmad-output"
```

---

## Core Engine

**workflow.xml** - The CORE OS for executing all BMAD workflows

Located at: `core/tasks/workflow.xml`

All workflows follow this execution pattern:
1. Load workflow.yaml configuration
2. Resolve variables ({project-root}, {output_folder}, etc.)
3. Execute steps in numerical order
4. Save after each `template-output` tag

---

## Integration with Existing Development

### Project Documentation
- PRD: `{project-root}/docs/prd.md`
- Architecture: `{project-root}/docs/architecture/`
- Stories: `{project-root}/docs/stories/`

### Output Artifacts
- Planning: `{project-root}/_bmad-output/planning-artifacts`
- Implementation: `{project-root}/_bmad-output/implementation-artifacts`

---

## Maintenance

### Syncing with _bmad

To update `.opencode` with changes from `_bmad`:

```bash
# Sync agents
cp _bmad/bmm/agents/*.md .opencode/bmm/agents/

# Sync workflows
cp -r _bmad/bmm/workflows/* .opencode/bmm/workflows/

# Sync core
cp _bmad/core/tasks/*.xml .opencode/core/tasks/
cp -r _bmad/core/workflows/* .opencode/core/workflows/
```

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-17 | Initial migration from _bmad to .opencode |
| 2026-01-10 | BMAD v6.0.0-alpha.22 installed |

---

**Note:** This is a standalone copy of the BMAD framework for OpenCode use.
The source of truth remains in `_bmad/` for CloudCode compatibility.
