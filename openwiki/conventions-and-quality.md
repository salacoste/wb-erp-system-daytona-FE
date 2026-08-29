---
type: "Engineering Standards"
title: "Conventions & Quality Gates"
description: "Coding standards and automated quality gates — file-size limits, TypeScript strictness, the Defensive Frontend Principle, ratchet baseline gates, and the two-pass review discipline."
sources:
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-a2371d6362e5db4bc834ad03
    resource: repo://CLAUDE.md
  - id: openwiki-source-276795f6d5ad19adb078c64e
    resource: repo://eslint.config.js
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-cf420d2a3bbc3f5b978f6bfe
    resource: repo://scripts/.check-docs-baseline.txt
  - id: openwiki-source-93be2452ba6015c243eb2277
    resource: repo://scripts/.locale-percent-baseline.txt
  - id: openwiki-source-7e46d883fe1bcda72cae11f8
    resource: repo://scripts/check-anti-pattern-8-normalizer.sh
  - id: openwiki-source-923e9b0f6880bb117fed18e3
    resource: repo://scripts/check-doc-citations.sh
  - id: openwiki-source-f1a63cd07f9c5e8ce68e5902
    resource: repo://scripts/check-e2e-bare-skips.mjs
  - id: openwiki-source-fe55be4cddefac27c4372aea
    resource: repo://scripts/check-e2e-bare-skips.test.mjs
  - id: openwiki-source-e3dffa80f0c12adcdd00840d
    resource: repo://scripts/check-e2e-fixed-waits.mjs
  - id: openwiki-source-2c0332dfeb73d3489e439b09
    resource: repo://scripts/check-e2e-vacuous-assertions.mjs
  - id: openwiki-source-d04f4722a3d19a2f20e7ee82
    resource: repo://scripts/check-eslint-rules.sh
  - id: openwiki-source-f8125e376025e8041a2c3f86
    resource: repo://scripts/check-next-async-params.sh
  - id: openwiki-source-a33125899c73194a4c9f0b33
    resource: repo://scripts/check-privacy-console.mjs
generated: { by: "openwiki/0.4.3", at: "2026-08-29T08:47:45.377Z" }
verified:
  - by: openwiki/0.4.3
    at: 2026-08-29T08:47:45.377Z
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
| Dot-locale percent | `npm run check:locale-percent` | Ratchet ↓ — current count 4 in `scripts/.locale-percent-baseline.txt` (started at ~108); lower the baseline when migrating |
| AP#8 normalizer | `npm run check:anti-pattern-8-normalizer` | Ratchet guard vs baseline (`scripts/.anti-pattern-8-normalizer-baseline.txt`) |
| ESLint | `npm run lint` | 0 errors, 0 warnings (zero-warning policy, `--max-warnings 0` in `lint` + `lint:fix`, Story 164.4) |
| Vitest | `npm test -- --run` | ≥ 19394 passing, 0 failed (floor; skipped informational) |
| E2E bare skips | `npm run check:e2e-bare-skips` + `scripts/check-e2e-bare-skips.test.mjs` | No bare `.skip` without reason in owned E2E specs |
| Max-lines cross-check | `npm run check:max-lines` | Matches the ESLint `max-lines` caps (200 source / 800 test) |
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
