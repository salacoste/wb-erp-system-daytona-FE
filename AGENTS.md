# Project Agents

**Full Content**: [`docs/AGENTS/index.md`](./docs/AGENTS/index.md) (124 sharded files)

---

## Development Guidelines

### Local validation and merge policy

- This project has no mandatory CI/CD merge gate. GitHub Actions are not a completion prerequisite.
- Before merge, run the relevant tests, lint, type-check, and production build locally with the pinned Node.js/npm versions and record concise evidence.
- After local validation passes, commit, push the feature branch, merge its PR into `main`, and remove completed local/remote feature branches and temporary worktrees.
- Do not enable or add a required `Quality Gates`/`CI` status check without an explicit owner decision.
- Local-only merge authority does not permit deploys, production operations, force-pushes, or direct pushes to `main`.

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

<!-- OPENWIKI:START -->

## OpenWiki

> **Temporary authoritative-source redirect (until Story 165.3):** generated
> `openwiki/**` content is stale and is not authoritative for local development
> or validation. Use this `AGENTS.md`, `README.md`, `SETUP.md`,
> `docs/VALIDATION-PLAN.md`, and `e2e/README.md` instead. Ignore any Tier-0,
> PM2, production-certification, or obsolete port/framework guidance found in
> OpenWiki until it is regenerated from corrected sources.

This repository uses OpenWiki for recurring code documentation. After Story 165.3 regenerates it, start with `openwiki/quickstart.md`, then follow its links to architecture, workflows, domain concepts, operations, integrations, testing guidance, and source maps.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->
