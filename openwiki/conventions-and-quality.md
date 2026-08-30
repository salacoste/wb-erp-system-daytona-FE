---
type: "Engineering Standards"
title: "Conventions & Quality Gates"
description: "Coding standards and automated quality gates — file-size limits, TypeScript strictness, the Defensive Frontend Principle, the presentation-source-contract test pattern, ratchet baseline gates, and the two-pass review discipline."
tags: [conventions, quality-gates, testing, eslint, review-discipline, presentation-contracts]
verified:
  - by: openwiki/0.4.3
    at: 2026-08-30T08:47:56.434Z
sources:
  - id: openwiki-source-a2371d6362e5db4bc834ad03
    resource: repo://CLAUDE.md
generated: { by: "openwiki/0.4.3", at: "2026-08-30T08:47:56.434Z" }
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

Enforced via `eslint.config.js` flat config. `next lint` is deprecated and does NOT load this — enforcement is exclusively via `npm run lint` / `npx eslint`, plus the `npm run check:max-lines` cross-check script.

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

## Presentation-Source-Contract Test Pattern

The Epic 173 settings/shipments migration established a two-layer test contract that now appears across every migrated page: a **page-level source-contract test** colocated in the route's `__tests__/` directory, plus **component-level behavior/state contracts** for the migrated forms.

### Layer 1 — Page source contracts

Each migrated route owns a `*-presentation-source-contracts.test.ts` (Vitest, no DOM) that reads production source with `node:fs` and asserts four families of invariants. The pattern appears for settings/backfill (Story 173.2), settings/cabinet (173.3), settings/notifications (173.5), settings/tariffs (173.6), settings/tax (173.7), the shipments list (173.8), and shipment detail (173.9), as well as earlier analytics/cogs/monitor routes (40+ such suites total):

1. **Pinned production catalog** — the test enumerates every production file the route owns (either recursively discovering non-test `.ts/.tsx` files under the route directory, as backfill does, or via an explicit `OWNED_PRODUCTION_FILES` array cross-checked against directory discovery, as shipments and cabinet do) and asserts the exact expected list. Adding or removing a file in a migrated route fails the suite until the catalog is consciously updated.
2. **No legacy palette or contextual hex** — every owned file must not match `LEGACY_PALETTE` (Tailwind palette classes like `text-yellow-600`, `bg-blue-500`, etc. across ~20 color families and shades 50–950) nor `CONTEXTUAL_HEX` (inline hex literals like `'#3B82F6'` in strings or Tailwind arbitrary values `bg-[#...]`). Colors must come from semantic design-system tokens instead of raw palettes.
3. **Merged semantic compositions** — pages must use the shared design-system compositions (`PageHeader`, `ContextBar`, `PageState`, `ResponsiveTable`/`TableState`, `FilterToolbar`, `StatusBadge`) and must NOT reintroduce `min-h-screen` layout; tables must use accessibility affordances like `kind: 'horizontal-scroll'` with Russian `regionLabel` and `caption` strings.
4. **Raw-palette helpers banished** — legacy helper functions such as `getStatusConfig`/`getProgressColorClass` and raw `<button>` elements in migrated render trees are asserted absent by name.

### Layer 2 — Component behavior/state contracts

The migrated forms keep their behavior suites and gain story-scoped contracts:

- `TaxSettingsForm.test.tsx` holds the Story 66.3-FE behavior regression suite (tax-system radios, VAT checkbox, conditional manual-rate fields) with mocked TanStack hooks, while `TaxSettingsForm.story-173-7.test.tsx` pins the migration state contract: named loading state (`role="status"` with `aria-busy`), recoverable query-error state (`role="alert"` + "Повторить загрузку" retry button wired to `refetch`), and out-of-range percentage rejection without issuing a request.
- `TariffSettingsForm.test.tsx` holds the Story 52-FE.2 field-rendering contract (all 21 editable fields grouped by category, accessible Russian labels), while `TariffSettingsForm.story-173-6.test.tsx` adds the Story 173.6 form state and accessibility contract.

The net effect: a migrated page cannot silently regress to raw palette classes, ad-hoc layout, or unnamed loading/error states, because the contract tests fail on source text itself, independent of rendered output.

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

Each story closes only when every quality gate matches its accepted baseline (the CLAUDE.md "Accepted Baselines" table); when a story legitimately moves a baseline, that table is updated in the same PR.

| Gate | Command | Baseline |
|------|---------|----------|
| Doc citations | `npm run check:docs` | Auto set-diff vs `.check-docs-baseline.txt` (exit code is the gate) |
| TypeScript | `npm run type-check` | 0 errors |
| ESLint rules valid | `npm run check:eslint-rules` | All rule names recognized |
| Next.js async-params | `npm run check:next-params` | All params Promise-typed |
| Dot-locale percent | `npm run check:locale-percent` | Ratchet ↓ — current count 4 in `scripts/.locale-percent-baseline.txt` (started at ~108); lower the baseline when migrating |
| AP#8 normalizer | `npm run check:anti-pattern-8-normalizer` | Ratchet guard vs baseline (`scripts/.anti-pattern-8-normalizer-baseline.txt`) |
| ESLint | `npm run lint` | 0 errors, 0 warnings (zero-warning policy, `--max-warnings 0` in `lint` + `lint:fix`, Story 164.4) |
| Vitest | `npm test -- --run` | ≥ 19615 passing, 0 failed (floor; additions OK, regressions not; skipped informational) |
| E2E bare skips | `npm run check:e2e-bare-skips` + `scripts/check-e2e-bare-skips.test.mjs` | No bare `.skip` without reason in owned E2E specs |
| Max-lines cross-check | `npm run check:max-lines` | Matches the ESLint `max-lines` caps (200 source / 800 test) |
| Privacy console guard | `npm run check:privacy` | 0 forbidden `console.*` calls in PII-adjacent files (see [Testing & Operations](testing-and-ops.md#privacy-console-check)) |
| Privacy + diagnostic-capture unit tests | `npm run test:privacy` | Console guard + diagnostic-capture-policy tests pass (see [Testing & Operations](testing-and-ops.md#diagnostic-capture-policy)) |
| Outbound network guards | focused vitest run + `e2e/outbound-network-guard.spec.ts` | All non-local test network attempts denied (see [Testing & Operations](testing-and-ops.md#outbound-network-guards)) |
| Playwright static boundary | `npx vitest run src/test/playwright-static-boundary.test.ts` | No raw `@playwright/test` imports / dynamic code outside approved modules |
| E2E vacuous assertions (AP#6) | `npm run check:e2e-assertions` + `src/test/e2e-vacuous-assertions.test.ts` | AST scanner finds tautological assertions (`>= 0`, `\|\| true`, always-true) in owned E2E specs; self-test under `npm test` |
| E2E fixed waits (AP#7) | `npm run check:e2e-waits` + `src/test/e2e-fixed-waits.test.ts` | AST scanner finds `waitForTimeout`, raw `setTimeout`, and arbitrary wait helpers (`sleep`/`delay`/`pause`) in owned E2E specs; self-test under `npm test` |

### Ratchet gate behavior

Ratchet gates (check:docs, check:locale-percent, check:anti-pattern-8-normalizer) are **not zero-tolerance** — they fail only when the violation count *increases* above a stored baseline. When a story legitimately reduces violations, the baseline file must be lowered in the same commit.

**Exit-code caveat**: Bash pipes capture only the last command's exit code — `npm run check:docs | tail` returns 0 even on failure. Always run the bare `npm run check:docs` or invoke the script directly.

### Toolchain pinning

`package.json` `engines` pins Node `24.18.0` and npm `11.11.0`. Vitest and `@vitest/coverage-v8` are pinned to exact `4.1.10`. These versions are enforced via local validation on the pinned toolchain (see [Local Validation and Merge Authority](#local-validation-and-merge-authority)); the project no longer has a CI workflow that asserts them at job start.

## Two-Pass Review Discipline

Every story closes only after **two adversarial code-review passes** in fresh contexts, both completed before flipping `Status: review → done` and before any commit.

- **1st pass** typically catches structural/correctness defects
- **2nd pass** catches narrative/factual/attestation drift
- The passes find **different** defect classes; neither replaces the other

**Escalation triggers** (from Story 113.1-FE):
1. Novel-pattern story → ≥3 passes by default
2. Cumulative >12 findings → 3rd pass mandatory
3. High-density Nth pass (>5 findings) → (N+1)th mandatory
4. Meta-claim escalation → (N+1)th evaluates self-referential claims — MANDATORY for discipline-codification stories (default 4-pass schedule), RECOMMENDED otherwise; a declined escalation must carry the "unaudited meta-claim" qualifier

**Marker convention**: Each pass produces a `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-heading in the story's Dev Agent Record; two such headings prove both passes ran before approving a `review` PR.

**Lessons line (Story 94.4-FE)**: the final close-row (Status → done) MUST carry a `**Lessons:**` sub-line — 1-3 single-sentence story-specific observations, each ≤120 chars, format `**Lessons:** (1) … (2) … (3) …`. Earlier rows don't need it. Validate via `npm run check:lessons` (`scripts/check-lessons-length.sh`).

**APPEND-ONLY closed rows (Story 111.1-FE F-2)**: later stories MAY append new dated rows to a closed story's Change Log but MUST NOT edit prior rows — especially Lessons. If a closed lesson violates the cap, add a disclosure row; never trim in-place.

**Dual-attestation for N-of-N close-row counts (Story 118.1-FE)**: a count attestation inside a close-row ("N lesson lines", "N-of-N record") is self-falsifying — the row's own `**Lessons:**` line ticks the scan count +1 the instant it is written. Recipe (pick one): (a) dual-attest "(N at write-time; N+1 after this Lessons line counts)"; (b) attest the post-write value and re-run the gate; (c) accept + disclose via an APPEND-ONLY follow-up row (a deliberately-divergent heading like `**Lessons (NOT close-row)…**` keeps the row count-neutral against the validator regex).

**Scope (Epic 107-FE A-2)**: 2-pass is MANDATORY for behavior-changing source code (runtime behavior, type signatures, normalizer logic, API contracts, test assertions); executor-with-inline-verify is acceptable for trivial process-cleanup. Decision rule: if a reviewer reading the diff could plausibly miss a logic defect, run 2 fresh-context reviews.

## Local Validation and Merge Authority

> Codified in `AGENTS.md` § Local validation and merge policy

This project has **no mandatory CI/CD merge gate** — there is currently no required GitHub Actions status check. Merge authority is local:

- Before merge, run the relevant tests, lint, type-check, and production build locally **with the pinned Node.js/npm versions** and record concise evidence. The current authoritative command set is the `README.md` **Local validation** section together with the active story plan. The historical Story 128.10 [Frontend Verification Orchestrator](testing-and-ops.md#frontend-verification-orchestrator-historical-story-12810) (`scripts/story-128-10/verify-frontend.mjs`) and its manifest are **immutable, branch-bound evidence** on the former `feat/epic-128-10-frontend-verification-foundation` branch — they are not the current project-wide validation entry point.
- After local validation passes, commit, push the feature branch, merge its PR into `main`, and remove completed local/remote feature branches and temporary worktrees.
- Do **not** enable or add a required `Quality Gates`/`CI` status check without an explicit owner decision.
- Local-only merge authority does **not** permit deploys, production operations, force-pushes, or direct pushes to `main`.

This complements the [Two-Pass Review Discipline](#two-pass-review-discipline): the two passes establish story-level correctness, and local validation establishes that the merged tree still builds and passes gates on the pinned toolchain.

`scripts/check-doc-citations.sh` scans Git-tracked `.md`/`.txt` files under `CLAUDE.md`, `CLAUDE-PATTERNS.md`, `CLAUDE-ANTI-PATTERNS.md`, `docs/`, `_bmad-output/`, `backlog/docs/`, and `backlog/tasks/` for backtick-wrapped citations and set-diffs the broken set against `scripts/.check-docs-baseline.txt` — the exit code is the gate. When legitimate churn occurs, update the baseline via `bash scripts/check-doc-citations.sh --update-baseline` and commit it with the story.

## Other Development Rules

- **Pre-flight source-trace verification** — Before implementing a story, grep for the story's AC nouns. If all ACs are already shipped, close as no-op with evidence
- **Pure functions over hook mocking** — Export testable logic as pure functions from hooks
- **Error test pattern** — Always use `mockRejectedValueOnce` (not `mockRejectedValue`)
- **Regex for locale assertions** — Use `/₽/`, `/\d+/` patterns in tests, not exact formatted strings
