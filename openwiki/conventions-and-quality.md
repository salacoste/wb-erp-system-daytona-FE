---
type: "Engineering Standards"
title: "Conventions & Quality Gates"
description: "Coding standards and automated quality gates — file-size limits, TypeScript strictness, the Defensive Frontend Principle, ratchet baseline gates, and the two-pass review discipline."
---
# Conventions & Quality Gates

The project enforces a rigorous set of coding standards and automated quality gates. These are load-bearing for every PR — not optional guidelines.

## Source Material

The canonical references for conventions are:
- **`CLAUDE.md`** — Main development rules, accepted baselines, two-pass review discipline
- **`CLAUDE-PATTERNS.md`** — Boundary Normalizer Pattern, Defensive Frontend Principle, Multi-Source Orchestration, Radix UI test patterns
- **`CLAUDE-ANTI-PATTERNS.md`** — 10 numbered anti-patterns with ❌ BAD / ✅ GOOD code blocks

## File Size Limits

| Category | Limit | Target |
|----------|-------|--------|
| Source files | 200 lines (ESLint `max-lines`, `skipBlankLines` + `skipComments`) | ~150 lines (proactive extraction) |
| Test files, fixtures, mock handlers | 800 lines | — |

Enforced via `eslint.config.js` flat config. `next lint` is deprecated and does NOT load this — enforcement is exclusively via `npx eslint`.

## TypeScript Rules

- **Strict mode** — no `any` types (use `unknown`)
- **No `as` casts** — widen types with optional fields (`?:`) or add `?? fallback` guards
- **Path aliases** — use `@/components` not `../../components`
- **Next.js 16 async params** — `params`/`searchParams` on page/layout must be typed `Promise<...>` (validated by `check:next-params`)

## Key Anti-Patterns

Referenced as "AP#N" throughout the codebase:

| # | Anti-Pattern | Enforcement |
|---|-------------|-------------|
| 1 | `beforeEach(() => vi.clearAllMocks())` triggers TS2322 | Convention |
| 2 | Non-null assertion (`!`) inside async closures | Convention |
| 3 | Faking `ApiError` with `Object.assign` | Convention |
| 4 | `as any` in mock helpers | Convention |
| 5 | Variable shadowing in Zustand selectors | Convention |
| 6 | Silent E2E test skips that pass green | AST scanner (`check:e2e-assertions`) + Vitest self-test |
| 7 | Hard `waitForTimeout` in E2E specs | AST scanner (`check:e2e-waits`) + Vitest self-test |
| **8** | **`?? 0` on nullable money/ratio fields** | **ESLint `no-restricted-syntax` + ratchet guard** |
| 9 | `waitForLoadState('networkidle')` on polling pages | Convention |
| 10 | `formatNumber(opaqueId)` mangles search-key copy-paste | Convention |

See [API Layer & Normalizers](api-and-normalizers.md) for AP#8 details.

## Defensive Frontend Principle

> Full text: `CLAUDE-PATTERNS.md` § Defensive Frontend Principle

**The principle**: Frontend never silently transforms data it doesn't own — it **indicates**. When a backend anomaly is detected, render a warning indicator, preserve the raw value, and file a backend ticket. Do NOT "fix" the display by swapping fields, coercing nulls, or clamping values.

**Four anomaly categories**:
| Anomaly | Action |
|---------|--------|
| Field inversion (e.g., `salePrice > price × 1.2`) | Warning icon + tooltip, keep raw values |
| `null` where number expected | Preserve null, render `—`, add footnote |
| Impossible negative value | Show raw value + warning |
| Missing/empty response | Distinct empty-state with backend ticket link |

**Comment convention**: Use `// PENDING BACKEND: request #NNN — <description>` for backend-blocked work. Bare `TODO` must never appear in committed source.

## Quality Gates (Ratchet Scripts)

Each gate has an accepted baseline. Stories close only when all gates match their baselines.

| Gate | Command | Baseline |
|------|---------|----------|
| Doc citations | `npm run check:docs` | Auto set-diff vs `.check-docs-baseline.txt` (exit code is the gate) |
| TypeScript | `npm run type-check` | 0 errors |
| ESLint rules valid | `npm run check:eslint-rules` | All rule names recognized |
| Next.js async-params | `npm run check:next-params` | All params Promise-typed |
| Dot-locale percent | `npm run check:locale-percent` | Ratchet ↓ (lower baseline when migrating; started at ~108) |
| AP#8 normalizer | `npm run check:anti-pattern-8-normalizer` | Ratchet guard vs baseline (`scripts/.anti-pattern-8-normalizer-baseline.txt`) |
| ESLint | `npm run lint` | 0 errors, 0 warnings (zero-warning policy, `--max-warnings 0` in `lint` + `lint:fix`, Story 164.4) |
| Vitest | `npm test -- --run` | ≥ 17900 passing, 0 failed |
| Privacy console guard | `npm run check:privacy` | 0 forbidden `console.*` calls in PII-adjacent files (see [Testing & Operations](testing-and-ops.md#privacy-console-check)) |
| Privacy + diagnostic-capture unit tests | `npm run test:privacy` | Console guard + diagnostic-capture-policy tests pass (see [Testing & Operations](testing-and-ops.md#diagnostic-capture-policy)) |
| Outbound network guards | focused vitest run + `e2e/outbound-network-guard.spec.ts` | All non-local test network attempts denied (see [Testing & Operations](testing-and-ops.md#outbound-network-guards)) |
| Playwright static boundary | `npx vitest run src/test/playwright-static-boundary.test.ts` | No raw `@playwright/test` imports / dynamic code outside approved modules |
| E2E vacuous assertions (AP#6) | `npm run check:e2e-assertions` + `src/test/e2e-vacuous-assertions.test.ts` | AST scanner finds tautological assertions (`>= 0`, `|| true`, always-true) in owned E2E specs; self-test under `npm test` |
| E2E fixed waits (AP#7) | `npm run check:e2e-waits` + `src/test/e2e-fixed-waits.test.ts` | AST scanner finds `waitForTimeout`, raw `setTimeout`, and arbitrary wait helpers (`sleep`/`delay`/`pause`) in owned E2E specs; self-test under `npm test` |

### Ratchet gate behavior

Ratchet gates (check:docs, check:locale-percent, check:anti-pattern-8-normalizer) are **not zero-tolerance** — they fail only when the violation count *increases* above a stored baseline. When a story legitimately reduces violations, the baseline file must be lowered in the same commit.

**Exit-code caveat**: Bash pipes capture only the last command's exit code — `npm run check:docs | tail` returns 0 even on failure. Always run the bare `npm run check:docs` or invoke the script directly.

### Toolchain pinning

`package.json` `engines` pins Node `24.18.0` and npm `11.11.0`. Vitest and `@vitest/coverage-v8` are pinned to exact `4.1.10`. These versions are enforced via local validation on the pinned toolchain (see [Local Validation and Merge Authority](#local-validation-and-merge-authority)); the project no longer has a CI workflow that asserts them at job start.

## Two-Pass Review Discipline

Every story closes only after **two adversarial code-review passes** in fresh contexts, both completed before flipping `Status: review → done`.

- **1st pass** typically catches structural/correctness defects
- **2nd pass** catches narrative/factual/attestation drift
- The passes find **different** defect classes; neither replaces the other

**Escalation triggers** (from Story 113.1-FE):
1. Novel-pattern story → ≥3 passes by default
2. Cumulative >12 findings → 3rd pass mandatory
3. High-density Nth pass (>5 findings) → (N+1)th mandatory
4. Meta-claim escalation → (N+1)th evaluates self-referential claims

**Marker convention**: Each pass produces a `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-heading in the story's Dev Agent Record.

## Local Validation and Merge Authority

> Codified in `AGENTS.md` § Local validation and merge policy

This project has **no mandatory CI/CD merge gate** — there is currently no required GitHub Actions status check. Merge authority is local:

- Before merge, run the relevant tests, lint, type-check, and production build locally **with the pinned Node.js/npm versions** and record concise evidence. The current authoritative command set is the `README.md` **Local validation** section together with the active story plan. The historical Story 128.10 [Frontend Verification Orchestrator](testing-and-ops.md#frontend-verification-orchestrator-historical-story-12810) (`scripts/story-128-10/verify-frontend.mjs`) and its manifest are **immutable, branch-bound evidence** on the former `feat/epic-128-10-frontend-verification-foundation` branch — they are not the current project-wide validation entry point.
- After local validation passes, commit, push the feature branch, merge its PR into `main`, and remove completed local/remote feature branches and temporary worktrees.
- Do **not** enable or add a required `Quality Gates`/`CI` status check without an explicit owner decision.
- Local-only merge authority does **not** permit deploys, production operations, force-pushes, or direct pushes to `main`.

This complements the [Two-Pass Review Discipline](#two-pass-review-discipline): the two passes establish story-level correctness, and local validation establishes that the merged tree still builds and passes gates on the pinned toolchain.

## Doc-Citation Validation

`scripts/check-doc-citations.sh` scans `CLAUDE.md`, `CLAUDE-PATTERNS.md`, `CLAUDE-ANTI-PATTERNS.md`, `docs/`, `backlog/` for backtick-wrapped citations `` `src/path.ts:N` `` and fails if any don't resolve (file not found or line > file length). Uses a baseline diff — exit code is the gate.

## Other Development Rules

- **No `TODO` in production code** — use `PENDING BACKEND:` (linked to `docs/request-backend/*.md`), `FUTURE:`, or a ticket link
- **Pre-flight source-trace verification** — Before implementing a story, grep for the story's AC nouns. If all ACs are already shipped, close as no-op with evidence
- **Pure functions over hook mocking** — Export testable logic as pure functions from hooks
- **Error test pattern** — Always use `mockRejectedValueOnce` (not `mockRejectedValue`)
- **Regex for locale assertions** — Use `/₽/`, `/\d+/` patterns in tests, not exact formatted strings
