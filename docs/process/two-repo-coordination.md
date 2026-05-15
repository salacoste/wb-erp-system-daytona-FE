# Two-Repo Coordination — Parent Monorepo + Nested Frontend Repo

> **Source**: Epic 105-FE retro action item A-5; codified by Story 107.3-FE
> **Empirical impetus**: Story 105.1-FE required commits in BOTH repos (parent: ESLint rule, frontend: allowlists) — the dual-commit pattern surfaced the asymmetry that needed documentation

## Structure

```
/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/     ← Parent monorepo (backend)
├── .git/                                                        ← Backend repo
├── eslint.config.js                                             ← Shared lint config (both repos lint against this)
├── tsconfig.json                                                ← Shared TS config
├── src/                                                         ← Backend source
├── test-api/                                                    ← Backend API integration tests
├── docs/                                                        ← Backend + shared docs
└── frontend/                                                    ← Nested directory
    ├── .git/                                                    ← ⚡ INDEPENDENT git repo
    ├── src/                                                     ← Frontend source
    ├── _bmad-output/                                            ← BMAD artifacts (gitignored in frontend repo)
    ├── docs/process/                                            ← THIS file lives here
    └── CLAUDE.md                                                ← Frontend project instructions
```

**Two separate `.git` directories** = two separate repos. Each has its own remote, its own history, its own branch state.

### Remotes

**Parent repo** (`cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new`):
```
origin    https://github.com/salacoste/wb-erp-system-daytona.git       (backend monorepo)
frontend  https://github.com/salacoste/wb-erp-system-daytona-FE.git    (frontend mirror — second remote)
```

The parent's `frontend` remote allows pushing frontend-directory changes to the frontend repo URL directly from the parent. This is the bridge mechanism — but typically commits land in each repo separately.

**Nested frontend repo** (`cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`):
```
origin  https://github.com/salacoste/wb-erp-system-daytona-FE.git      (frontend only)
```

## When each repo gets commits

| Change scope | Which repo | Rationale |
|---|---|---|
| `frontend/src/**`, `frontend/components/**`, frontend tests | **Nested frontend repo** | Frontend code; owned by frontend |
| `frontend/CLAUDE.md`, `frontend/CLAUDE-*.md`, frontend docs | **Nested frontend repo** | Frontend project instructions |
| `frontend/_bmad-output/**` (BMAD artifacts) | **Nested frontend repo** (use `git add -f` — gitignored) | Story specs, sprint-status, retros |
| `frontend/scripts/**` | **Nested frontend repo** | Frontend tooling |
| `eslint.config.js` at parent root | **Parent repo** | Shared lint config; affects both frontend + backend lint |
| `tsconfig.json` at parent root | **Parent repo** | Shared TS config |
| `package.json` / `pnpm-workspace.yaml` at parent root | **Parent repo** | Workspace-level deps |
| Backend code (`src/**` in parent, `test-api/**`) | **Parent repo** | Backend domain |
| Shared docs (`docs/` at parent root) | **Parent repo** | Backend + shared docs |

**Rule of thumb**: paths INSIDE `frontend/` are frontend repo's domain (commit there); paths OUTSIDE `frontend/` (at parent root or in sibling dirs) are parent repo's domain.

## Cross-repo work — when one logical story spans both

A single Story (e.g., Story 105.1-FE) sometimes requires commits in BOTH repos:
- **Story 105.1-FE example**: ESLint rule lives in `eslint.config.js` at parent root (parent repo). Pre-existing violation allowlists live in `frontend/src/**` files (frontend repo). Both repos need commits for the story to be fully shipped.

### Recommended sequence

1. **Commit parent first** (foundational change — config, root-level tooling)
   ```bash
   cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new
   git add eslint.config.js
   git commit -m "feat(eslint): ..."
   ```

2. **Commit nested frontend repo** (dependent change — assumes parent's config exists)
   ```bash
   cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
   git add src/ scripts/ CLAUDE.md
   git add -f _bmad-output/  # gitignored — needs -f
   git commit -m "feat(eslint): ... (frontend allowlists)"
   ```

3. **Push both** (order: parent first, then frontend — same logic)
   ```bash
   cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new && git push origin main
   cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend && git push origin main
   ```

### Commit-message convention

Each repo's commit message should:
- Reference the OTHER repo's commit hash if it's a paired commit (e.g., "Pairs with parent repo commit `43c11001`")
- Clearly state the scope ("frontend half:", "parent half:")
- Survive being read independently — a reader of just the frontend repo should understand what changed in parent

## Common pitfalls

### Pitfall #1: Forgetting the parent commit

The most common failure mode. Author makes a frontend allowlist change assuming the parent's ESLint rule is in place. ESLint passes locally because the working tree has both changes. But after the frontend commit lands on origin without the parent commit, CI fails or other devs pulling the frontend can't replicate the lint state.

**Mitigation**: When a story modifies anything outside `frontend/`, double-check `cd .. && git status` to see if parent has uncommitted changes too.

### Pitfall #2: `_bmad-output/` is gitignored

The nested frontend repo's `.gitignore` excludes `_bmad-output/`. Any commit to BMAD artifacts (story specs, sprint-status.yaml, retros) needs `git add -f`:

```bash
git add -f _bmad-output/planning-artifacts/epics-NNN-fe.md
git add -f _bmad-output/implementation-artifacts/sprint-status.yaml
```

Without `-f`, `git add` silently skips these files.

### Pitfall #3: Frontend changes appearing in parent's working tree

The parent repo's `git status` shows changes inside `frontend/` because the parent tracks `frontend/` as a directory tree (not a git submodule). These are typically "phantom" mirrors of work already committed in the nested frontend repo.

Two strategies:
- **Ignore the parent's frontend-internal diffs**: most cross-team work happens in the parent's backend domain; the frontend mirror in parent isn't typically committed there
- **OR commit them in parent too**: if there's automation or convention that the parent should also track the frontend changes (e.g., for CI cohesion), commit them as `chore(frontend): mirror frontend Story NNN.N-FE changes`. The user (or automation) does this manually.

### Pitfall #4: Different remote names

The parent has `origin` AND `frontend` remotes — easy to push to the wrong one. Defaulting to `origin` (backend monorepo) is correct for parent-domain commits.

## Push coordination protocol

When asking "should I push?" for cross-repo work, the answer is usually:

| Scenario | Frontend repo push | Parent repo push |
|---|---|---|
| Pure frontend change (only files in `frontend/`) | Yes — automatic per session pattern | No — nothing to push |
| Pure parent change (ESLint config, backend) | No — nothing to push | Yes — coordinate with backend team if it affects them |
| Cross-repo paired commit (e.g., Story 105.1) | Yes — push parent FIRST, then frontend | Yes — push parent FIRST, then frontend |

### Confirmation required for parent push

Pushes to the parent repo affect BACKEND DEVELOPERS who pull from origin. Per CLAUDE.md commit policy ("never commit/push automatically"), confirm with user before parent pushes:

> "Parent commit `<hash>` ready to push to backend monorepo. This affects backend devs. Push now or coordinate with backend team first?"

Frontend repo pushes don't have this constraint (frontend team owns it).

## Canonical cross-repo story: Story 105.1-FE

The patterns documented here were discovered while shipping **Story 105.1-FE** (Anti-Pattern #8 ESLint rule).

- **Parent commit**: `43c11001 feat(eslint): Story 105.1-FE — Anti-Pattern #8 automated enforcement` — added rule to `eslint.config.js`
- **Frontend commit**: `2be4835 feat(eslint): Story 105.1-FE — Anti-Pattern #8 enforcement (frontend allowlists)` — added 66 allowlist comments + self-test script + CLAUDE.md cross-reference

Reading either commit message standalone makes the cross-repo dependency clear via the "pairs with" line.

## Known limitation: `[DELEGATION NOTICE]` hook false positives

The user-config tier (`~/.claude/hooks/`) includes a delegation-notice hook that fires on Bash commands matching a heuristic for "command may modify source files." The current heuristic produces false positives on common read-only operations: `grep`, `git log`, `git status`, `git diff`, `bash scripts/check-*.sh`, etc. Each false-positive fire bloats context with a system reminder.

**Status**: Carried forward as action item across Epic 104-FE, 105-FE, 106-FE, 107-FE retros. **Permanently deferred** to user-config tier (out of repo modification scope). Acknowledged as known overhead; not a project-side bug.

**Workaround**: Ignore the `[DELEGATION NOTICE]` system reminders for clearly read-only commands (grep, ls, cat, find, git read commands, bash check-* scripts). Operations proceed successfully despite the notice; the heuristic just over-fires.

## Related

- CLAUDE.md § Critical Development Rules (frontend repo) — referenced for commit protocol
- Story 105.1-FE implementation thread (Epic 105-FE retro lessons)
- Backend team coordination via `frontend/docs/request-backend/` (single-direction: frontend → backend)
