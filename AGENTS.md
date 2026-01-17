# Project Agents

**Full Content**: [`docs/AGENTS/index.md`](./docs/AGENTS/index.md) (124 sharded files)

---

## Development Guidelines

**CRITICAL: Context7 MCP Server**
- Context7 MCP server is ALWAYS available for code planning and implementation
- Use `mcp_context7_resolve-library-id` to find library IDs
- Use `mcp_context7_get-library-docs` for up-to-date documentation

---

## Agent Directory

| Agent | ID | Purpose |
|-------|-------|---------|
| UX Expert | `ux-expert` | UI/UX design, wireframes, prototypes |
| Scrum Master | `sm` | Story creation, epic management |
| Test Architect | `qa` | Test architecture, quality gates |
| Product Owner | `po` | Backlog, acceptance criteria |
| Product Manager | `pm` | PRDs, strategy, roadmap |
| Full Stack Developer | `dev` | Code implementation, debugging |
| BMad Orchestrator | `bmad-orchestrator` | Workflow coordination |
| BMad Master | `bmad-master` | Universal task executor |
| Architect | `architect` | System design, architecture |
| Business Analyst | `analyst` | Research, brainstorming, briefs |

---

## Key Tasks

| Task | Purpose |
|------|---------|
| `validate-next-story` | Validate story before implementation |
| `trace-requirements` | Map requirements to tests |
| `test-design` | Design test scenarios |
| `risk-profile` | Risk assessment matrix |
| `shard-doc` | Split large documents |
| `qa-gate` | Quality gate decisions |

---

## How To Use

**Codex CLI**: Run `codex` and reference agents naturally: `"As dev, implement ..."`
**Codex Web**: Open repo - Codex reads AGENTS.md
**Refresh**: `npx bmad-method install -f -i codex`

---

## BMad Framework

```
.bmad-core/
├── agents/      # Personas (ux-expert, sm, qa, po, pm, dev, etc.)
├── tasks/       # Reusable workflows
├── templates/   # Story/epic templates
├── checklists/  # Quality checklists
└── core-config.yaml  # Project config
```

---

*Sharded using `md-tree explode` - reduced from ~25K to ~1.5K tokens*
