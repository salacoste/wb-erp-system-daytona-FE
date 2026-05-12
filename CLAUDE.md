# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

**WB Repricer System - Frontend** - Financial analytics dashboard for Wildberries marketplace sellers.

| Aspect | Details |
|--------|---------|
| Stack | Next.js 15 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui |
| State | TanStack Query v5 (server) + Zustand (client) |
| Testing | Vitest (unit) + Playwright (E2E) |
| Backend | REST API on `localhost:3000` (configurable via `NEXT_PUBLIC_API_URL`) |

**Core Features**: Weekly financial analytics, COGS management with versioning, margin analysis, storage/advertising metrics, price calculator, Telegram notifications, dashboard business logic (sales/orders metrics, expense structure, period comparison).

---

## Quick Reference

| Resource | Location | Contains |
|----------|----------|----------|
| **Epics & Stories** | [`docs/EPICS-AND-STORIES-TRACKER.md`](docs/EPICS-AND-STORIES-TRACKER.md) | **Single source of truth** - all statuses, sprints, routes |
| **API Reference** | [`docs/api-integration-guide.md`](docs/api-integration-guide.md) | **Full endpoint catalog**, HTTP files, integration patterns |
| **UI/UX Spec** | [`docs/front-end-spec.md`](docs/front-end-spec.md) | **Design System**, User Personas, WCAG, Accessibility |
| **Architecture** | `docs/front-end-architecture.md` | Technical architecture |
| **Routes Code** | `src/lib/routes.ts` | Centralized route constants |
| **Backend Swagger** | `http://localhost:3000/api` | Live API documentation |
| **Test API Examples** | [`../test-api/`](../test-api/) | **HTTP request examples** - actual backend API tests |
| **Backend API Docs** | [`../docs/API-PATHS-REFERENCE.md`](../docs/API-PATHS-REFERENCE.md) | **Complete backend endpoint reference** |

---

## Development Commands

```bash
# Development
npm run dev              # Port 3000

# Production (PM2)
npm run build && pm2 start ecosystem.config.js --only wb-repricer-frontend  # Port 3100

# Quality
npm run lint && npm run type-check && npm run format:check

# Testing
npm test                 # Unit (Vitest)
npm run test:e2e         # E2E (Playwright)
```

---

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (dashboard)/     # Protected routes (sidebar layout)
│   ├── (auth)/          # Public auth routes
│   └── (onboarding)/    # Onboarding flow
├── components/
│   ├── ui/              # shadcn/ui (DO NOT EDIT - use npx shadcn@latest add)
│   └── custom/          # Feature components (70+)
├── lib/
│   ├── api/             # API modules by domain
│   ├── api-client.ts    # HTTP client with auth injection
│   └── *-utils.ts       # Business logic helpers
├── hooks/               # TanStack Query hooks (45+)
├── stores/              # Zustand stores (auth, margin-polling)
├── types/               # TypeScript definitions (13 files)
└── config/              # Features, routes configuration
```

---

## Critical Development Rules

### Mandatory
- **File size limit**: All source files MUST be under 200 lines (ESLint enforced via `max-lines` rule with `skipBlankLines` + `skipComments` in root `eslint.config.js`, tightened in Story 99.1-FE). Test files, fixtures, and mock handlers may be up to 800 lines. Target ~150 lines for proactive extraction.
- **TypeScript strict**: No `any` types (use `unknown`)
- **Path aliases**: Use `@/components` not `../../components`
- **Server Components**: Default (no `'use client'` unless needed)
- **shadcn/ui**: Never edit manually - use CLI to add components
- **No `as` casts**: Widen types with optional fields (`?:`) or add `?? fallback` guards
- **Error test pattern**: Always use `mockRejectedValueOnce` (not `mockRejectedValue`)
- **Extract at ~150 lines**: Proactively split components well before hitting the 200-line ESLint cap — 150 lines is the ergonomic target, not the enforcement ceiling
- **Pure functions over hook mocking**: Export testable logic as pure functions from hooks
- **Run E2E against live app**: Verify Playwright specs against running app before marking complete
- **Regex for locale assertions**: Use `/₽/`, `/\d+/` patterns in tests, not exact formatted strings
- **Document same-name functions**: When two modules export identically-named functions, add a distinguishing comment
- **No `TODO` in production code**: Use `PENDING BACKEND:` for backend-blocked work (linked to a `docs/request-backend/*.md` file), `FUTURE:` for post-MVP enhancements, or a ticket link. The bare `TODO` marker should never remain in committed source — it implies "someone on this team should do this soon" and accumulates silently. Grep `src/ --include="*.ts" --include="*.tsx" | grep -v test` for `TODO|FIXME` should return zero lines.

### Defensive Frontend Principle (Story 89.4-FE, from Epic 87-FE retro)

> **Full text**: [`CLAUDE-PATTERNS.md` § Defensive Frontend Principle](./CLAUDE-PATTERNS.md#defensive-frontend-principle-story-894-fe-from-epic-87-fe-retro)

**TL;DR**: Frontend never silently transforms data it doesn't own — it **indicates**. Detect anomaly → render warning + preserve raw value + file a backend ticket. Never swap fields, coerce nulls, or clamp values to "fix" backend bugs — that erases evidence.

Four anomaly categories: field inversion, null-where-number-expected, impossible negatives, missing/empty. Each has a "show an indicator" recipe + canonical example (orders price inversion → request #165 + `AlertTriangle`). Related: anti-pattern #8 (null-vs-zero), Boundary Normalizer Pattern, `PENDING BACKEND:` comment convention.

### Doc-citation validation (`npm run check:docs`)

**What it does.** `scripts/check-doc-citations.sh` — shipped in Story 89.3-FE; coverage extended to root-level `CLAUDE-*.md` shards after the CLAUDE.md size split — scans `CLAUDE.md`, `CLAUDE-PATTERNS.md`, `CLAUDE-ANTI-PATTERNS.md`, `docs/`, `_bmad-output/`, `backlog/docs/`, and `backlog/tasks/` for backtick-wrapped source citations of the form `` `src/path.ts:N` `` or `` `src/path.ts:N-M` `` and fails if any don't resolve. Two failure modes: (1) file not found, (2) line number exceeds the file's line count. Run `bash scripts/check-doc-citations.sh --self-test` to validate the validator itself.

**How to read the output.** Canonical structure (exit 1 on broken, 0 on clean):

```
Scanned: CLAUDE.md, CLAUDE-PATTERNS.md, CLAUDE-ANTI-PATTERNS.md, docs, _bmad-output, backlog/docs, backlog/tasks
Total citations: <N>
Broken: <M>
FAIL: <M> broken citation(s).      # or: OK: all citations resolve.
```

`Total` is a point-in-time count — not a diff between runs. `Broken` is the subset that failed to resolve. Per-broken-citation detail is emitted **before** the summary block — read from the top to find each offending citation, its location, and its reason.

**Drift discipline (automated since Story 94.1-FE).** The validator now compares
broken citations against `scripts/.check-docs-baseline.txt` and exits 0 only on
exact match. Mismatch emits explicit `NEW broken citations (N)` and `RESOLVED
broken citations (M)` enumeration so you immediately see what changed. **Read
the exit code, not the count** — the count is always reported but no longer the
gate.

**Updating the baseline.** When legitimate citation churn lands (e.g., a story
restores a previously-missing file or removes a stale doc), run
`bash scripts/check-doc-citations.sh --update-baseline` to regenerate
`scripts/.check-docs-baseline.txt` with the new accepted state. Commit the
updated baseline file alongside the story's other changes. **Note**: invoke via
bash directly, not `npm run check:docs -- --update-baseline` — see exit-code
caveat below.

**Exit-code caveat (H-2 review fix).** Bash pipes — any pipe, whether
through `npm run`-wrapped or invoked bare — capture only the LAST command's
exit code by default. So `npm run check:docs | tail -10` returns 0 even if
the validator returned 1; the bug is the pipe, not the npm wrapper. To check
the gate reliably:
- Run bare: `npm run check:docs` (no pipe).
- Or pipefail-aware: `set -o pipefail; npm run check:docs | tail -10`.
- Or invoke the script directly: `bash scripts/check-doc-citations.sh`.
The same caveat applies to `npm run check:docs -- --update-baseline` — prefer
`bash scripts/check-doc-citations.sh --update-baseline` for the flag invocation.

> **Demonstrative bad-citation exclusions.** When a story's own spec needs to embed citation
> examples (e.g., a 13-row baseline table or a doc-link validator's own self-test
> documentation), add the spec file to `scripts/check-doc-citations.sh` EXCLUDE_PATHS rather
> than trying to escape the citations with backtick wrappers (which doesn't work — see the
> script's CITATION_REGEX header comment). Precedents in the EXCLUDE_PATHS list are
> Story 89-3-FE and Story 93-5-FE.

**Accepted baseline: 13 broken citations.** All 13 are pre-existing historical references in already-shipped docs/stories. Rewriting the historical docs would require re-opening closed stories — not actionable. Citations in the table below are plain text (no backticks) so the validator does not re-scan them.

> **Source of truth**: `scripts/.check-docs-baseline.txt`. The table below is
> a snapshot for reading convenience and may lag after baseline updates. Run
> `cat scripts/.check-docs-baseline.txt` for the current authoritative list.

| # | Citation (plain text — no backticks to prevent re-scan) | Cited in | Reason |
|---|---|---|---|
| 1 | src/hooks/useExpenses.ts:116-122 | docs/BACKEND-CHANGES-COMPATIBILITY-REPORT.md:226 | line 122 > file has 111 lines |
| 2 | src/hooks-v1/useMarginTrends.ts:70 | docs/VALIDATION-PLAN.md:189 | file not found (hooks-v1 legacy) |
| 3 | src/hooks/useFinancialSummary.ts:72 | docs/stories/epic-60/INTEGRATION-ACCEPTANCE-CHECKLIST.md:232 | line 72 > file has 30 lines |
| 4 | src/components/notifications/TelegramBindingModal.tsx:216 | docs/DEV-HANDOFF-EPIC-34-FE.md:184 | line 216 > file has 95 lines |
| 5 | src/analytics/weekly-analytics.service.ts:357-399 | docs/BUG-FIX-MARGIN-NOT-DISPLAYED.md:244 | file not found |
| 6 | src/products/products.service.ts:210-259 | docs/BUG-FIX-MARGIN-NOT-DISPLAYED.md:307 | file not found |
| 7 | src/products/products.service.ts:83-182 | docs/BUG-FIX-MARGIN-NOT-DISPLAYED.md:308 | file not found |
| 8 | src/app/(dashboard)/settings/notifications/page.tsx:160 | _bmad-output/implementation-artifacts/71.3-fe-requirejam-gating-component.md:88 | line 160 > file has 144 lines |
| 9 | src/app/(dashboard)/settings/notifications/page.tsx:160 | _bmad-output/implementation-artifacts/71.3-fe-requirejam-gating-component.md:198 | line 160 > file has 144 lines |
| 10 | src/hooks-v1/use-search-analytics.ts:44-54 | _bmad-output/implementation-artifacts/71.5-fe-search-orders-tab.md:80 | file not found (hooks-v1 legacy) |
| 11 | src/types/search-analytics.ts:115-120 | _bmad-output/implementation-artifacts/71.5-fe-search-orders-tab.md:81 | line 120 > file has 118 lines |
| 12 | src/hooks-v1/use-search-analytics.ts:44-54 | _bmad-output/implementation-artifacts/71.5-fe-search-orders-tab.md:239 | file not found (hooks-v1 legacy) |
| 13 | src/types/search-analytics.ts:87-120 | _bmad-output/implementation-artifacts/71.5-fe-search-orders-tab.md:240 | line 120 > file has 118 lines |

**Related.** `### Accepted Baselines` (immediately below) — per-gate baseline state for type-check, lint, test, and check:docs. `### Known Anti-Patterns` (below) for citation hygiene in code review; `### Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)` (below) § Pattern 4 for spec-grep discipline at story-author handoff time — the same "search before assuming" habit applied to source citations.

### ESLint rule-name validation (`npm run check:eslint-rules`)

**What it does.** `scripts/check-eslint-rules.sh` — shipped in Story 99.2-FE — validates that all rule names declared in `.eslintrc.json` and `eslint.config.js` are recognized by ESLint. Catches silent disablement from typos (e.g., `max-lines-per-file` instead of `max-lines` — the Class 5 defect from Story 97.7 investigation). Uses `eslint --print-config` to get the effective rule registry (including `@typescript-eslint` plugin rules), then cross-references against declared rules in both config files. Run `bash scripts/check-eslint-rules.sh --self-test` for 4 built-in self-tests.

**When to run.** After modifying either `.eslintrc.json` or `eslint.config.js`. CI integration is optional — the script is lightweight and can be added to the quality gate pipeline.

### Accepted Baselines

Each story closes only when EVERY quality gate's output matches its documented baseline. This subsection enumerates the current accepted state for each gate so "is this a regression?" has a definitive answer instead of relying on retrospective recall. Numbers verified empirically on 2026-04-25.

| Quality gate | Command | Baseline | Source / location |
|---|---|---|---|
| Doc citations | `bash scripts/check-doc-citations.sh` | 13 broken | Source: `scripts/.check-docs-baseline.txt` (auto-validated, Story 94.1-FE). |
| TypeScript | `npm run type-check` | 20 errors, all in `src/lib/api/advertising-analytics-api.ts` | Source: this section (manual). Provenance: Story 91-era SDK type-drift workaround (destructuring `{}` cast). |
| ESLint rules | `bash scripts/check-eslint-rules.sh` | OK: all rule names valid in 2 files | Source: this section (manual). Story 99.2-FE. |
| ESLint | `npx eslint 'frontend/src/**/*.ts' 'frontend/src/**/*.tsx'` | 0 errors, 114 warnings (all `no-explicit-any`) | Source: this section (manual). Notes: any ERROR is a regression. Warnings are pre-existing `no-explicit-any` surfaced by Story 98.1-FE enforcement fix. `max-lines` rule enforced via root `eslint.config.js` (flat config) at cap 200 for source files, 800 for test files, with `skipBlankLines` + `skipComments` (Stories 98.1-FE, 99.1-FE). `next lint` is deprecated and does NOT load `frontend/.eslintrc.json` — enforcement is exclusively through `npx eslint` from monorepo root. |
| Vitest | `npm test -- --run` | ≥ 7244 passing, 676 skipped, 0 failed (floor — see drift rule) | Source: this section (manual). Provenance: as of Epic 93 close + Story 94.1; ratcheted +2 by Story 96.2-FE (`view_by` type-safety tests); ratcheted +12 by Story 96.1-FE (6 `usePreliminaryTax` hook + 6 `tax-analytics` API client tests); ratcheted +5 by Story 96.3-FE (`transformToWaterfallData` categoryOrder tests); ratcheted +4 by Story 96.9-FE (acquiring 503-banner + Pattern 3 fixture tests); ratcheted +6 by Story 96.9-FE review fixes (6 direct unit tests for `getAcquiringRateLimit`); ratcheted +16 by Story 96.9-FE 3rd-pass review fixes (12 api-client Retry-After validation tests + 4 fixture consumer wiring tests); ratcheted +7 by Story 96.10-FE (3 × 10-category invariant tests + 4 × FCU/DCU per-row rendering tests); ratcheted +2 by Story 96.10-FE 1st-pass review fixes (L-1 mixed-null fixture + L-2 null-DCU merge early-return coverage); ratcheted +1 by Story 96.10-FE 2nd-pass review fixes (M2-2 merge early-return propagation test); ratcheted +30 by Story 96.11-FE (FBS stock breakdown views — boundary normalizer + Pattern 3 fixtures + 3 section components); ratcheted +1 by Story 96.11-FE 1st-pass review fixes (H-1 shareOfTotalPct null-preservation test); ratcheted +7 by Story 96.11-FE 2nd-pass review fixes (H2-1 cabinet-isolation tests ×6 + L2-1 future-date clock-skew test ×1); ratcheted +35 by Story 96.12-FE (FBS export normalizer + polling hook + button component + Pattern 3 fixture tests + cabinet-isolation tests); ratcheted +5 by Story 96.12-FE 1st-pass review fixes (M-2 string-retryAfter body-fallback tests ×4 + H-2 ready-with-null-url defensive-frontend test ×1); ratcheted +2 by Story 96.12-FE 2nd-pass review fixes (H2-1 retry-cycle test + M2-2 cabinet-switch test); ratcheted +24 by Story 96.13-FE (FBS enhanced normalizer + 5 section components + Pattern 3 fixtures); ratcheted +5 by Story 96.13-FE 1st-pass review fixes (H-1 scale + M-1 returnRate card + M-2 funnel inversion + M-3 RegionalTooltip direct + L-1 funnel a11y + e2e TIMEOUTS.api fix); ratcheted +8 by Story 96.13-FE 2nd-pass review fixes (H2-1 formatPercentage integration test + H2-2 funnel threshold near-miss + no-dash design-intent + M2-3 exact-count uniform across section tests + M2-5 hook cabinet-isolation tests ×4); ratcheted +30 by Story 96.14-FE (buyout reconciliation normalizer + AnomalyIndicator + ReconciliationTable + page orchestrator + Pattern 3 fixtures); ratcheted +7 by Story 96.14-FE 1st-pass review fixes (H-1 cabinet-switch + M-2 hook cabinet-isolation tests + M-3 unknown-source indicator + M-1 nmId=0 validation + M-4 header full-form + L-1 scoped button assertion + L-2 React.memo); ratcheted +6 by Story 96.14-FE 2nd-pass review fixes (H2-1 real hook tests with renderHook + QueryClient wrapper replacing fake factory-only tests + L2-2 stale-banner parity test for no-anomalies branch); ratcheted +18 by Story 96.15-FE (BuyoutSource widening + SourceBadge component + fixture extension + ReconciliationTable SourceBadge integration); ratcheted +4 by Story 96.15-FE 1st-pass review fixes (H-1 "Комбинированный" label unification + M-3 'unknown' source variant + L-1 scoped testid tests); ratcheted +2 by Story 96.15-FE 2nd-pass review fixes (H2-1 BuyoutSummaryWidget 'unknown' footnote test × 2 new assertions); ratcheted +1 by Story 96.16-FE (NaN-guard regression test for `isPriceInverted` after #165 closure-citation comment swap); ratcheted +3 by Story 96.16-FE 1st-pass review fixes (L-1 symmetric salePrice-NaN guard + Number.POSITIVE_INFINITY guard + exact-1.2x boundary `>` predicate test) — floor bumped 7239 → 7243 per H-2 review fix; ratcheted +1 by Story 96.16-FE 2nd-pass review fixes (H2-2 positive-side just-above-1.2× boundary companion test pinning both sides of the strict inequality) — floor bumped 7243 → 7244 per H2-2 review fix. |

**Drift discipline (manual for type-check / lint / test; automated for check:docs).** Each story closes only when EVERY quality gate's output matches its documented baseline. Comparison rules per gate:

- **check:docs**: automated set-diff against `scripts/.check-docs-baseline.txt` (Story 94.1-FE). Exit code is the gate.
- **type-check**: count must equal 20 AND the file scope must equal `src/lib/api/advertising-analytics-api.ts`. New errors anywhere else, or additional errors in that file beyond 20, are regressions. The 20 will drop when the SDK type drift is resolved (out of scope for now — see § "When to update").
- **lint**: count must equal 0. Any warning OR error is a regression.
- **test**: passing count must equal 7244 OR HIGHER (additions OK, regressions not). Failed count must equal 0. Skipped count is informational; substantial growth in skipped should be questioned but is not a hard gate.

**When to update.** When a story legitimately changes a baseline (e.g., the SDK drift is fixed → 20 type errors drop to 0; a new story adds 12 valid tests → 7000 passing becomes 7012), update this section in the same PR. Treat the section like Story 93.5's 13-citation table: source-of-truth (may temporarily lag reality between gate-affecting commits).

**Related.** `### Doc-citation validation` (above) — the automated counterpart for one of these gates. `### Known Anti-Patterns` (below) — citation-hygiene context for the citation-tracking gate.

### Two-pass review discipline

**Rule (Story 94.3-FE).** Every story closes only after TWO adversarial code-review passes in fresh contexts — once for the initial review, once in a new context for the second adversarial pass. **Both passes complete BEFORE flipping `Status: review → done` AND BEFORE any commit.** First pass typically catches structural/correctness defects; second pass typically catches narrative/factual/style drift. The two passes find DIFFERENT defect classes; neither replaces the other.

**Empirical evidence + enforcement.** Stories 93.4 / 94.1 / 94.2 each shipped 2nd-pass-found findings as POST-MERGE follow-up commits when the 2nd pass happened after-not-before commit. The follow-up commits resolved real attestation-class defects. The `dev-story` workflow Step 9 has a HALT condition for single-pass commits; the `code-review` workflow at `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` has a top-level `<critical>` mandate to run at-least-twice per story. Both are LLM-interpreted at run-time.

**Why this is structurally permanent (Story 97.4-FE, Epic 97-FE A-4 codification).** The 2-pass discipline is not a transient countermeasure to be retired once authors "get better" — it is a structural property of human/LLM authoring. **Empirical chain length**: 13+ documented recurrences across 16+ stories of Epics 94-96 (canonical breakdown via authoritative source method `grep -n "Fix-block propagation discipline" CLAUDE-PATTERNS.md` → L289: 11+ table rows in Pattern 4 § Fix-block propagation discipline empirical-evidence table + 2 self-referential manifestations from Story 97.1-FE = 13+; extended further by Story 97.2-FE's 2 self-referential manifestations to **15+ at this codification**). Per-story drilldown: Story 97.1-FE itself produced 16 findings (9 1st-pass + 7 2nd-pass — see `_bmad-output/implementation-artifacts/97-1-fe-pattern-4-fix-block-propagation-discipline.md` Post-Nth-pass-review fixes); Story 97.2-FE produced 12 findings (6 + 6 — see `_bmad-output/implementation-artifacts/97-2-fe-pattern-4-authoritative-source-citation-discipline.md`). **Disambiguation note**: per-pass instances count once per chain regardless of finding count; "+2 per story" in the recurrence-count math means "1st-pass instance + 2nd-pass instance = 2", NOT the 16 / 12 finding totals — those are finding-density measures. Empirically verified via `grep -c "^### Post-1st-pass-review fixes\|^### Post-2nd-pass-review fixes"` on each story file → 2 headings each ⇒ 2 instances each ⇒ +4 total chain-extension across 97.1 + 97.2. **Disambiguation** (per Story 97.1-FE 1st-pass M-4 finding): the *recurrence count* (defect-class observations, 13+ as cited above) is distinct from the **25-consecutive-story validation streak** (consecutive stories with 2-pass discipline applied without breakdown — 24 reported in Epic 96-FE retro § S-1 + 1 from Story 97.1-FE = 25; extended further by Story 97.2-FE to 26, and again by Story 97.4-FE itself — the very story shipping this paragraph held the streak through both review passes — to **27 at codification close**). Both metrics confirm the discipline is operating; conflating them is itself a propagation defect. **Why the chain has never broken**: the rule catches the rule's own violation on first attempt — by design, not failure. Authors writing rules ABOUT defect prevention systematically miss occurrences when applying those rules to their own work; multi-pass adversarial review with FRESH context is the only reliable countermeasure (see Story 95.3's "I proactively re-scanned" empirical case in CLAUDE-PATTERNS.md Pattern 4 § Fix-block propagation discipline — even explicit author claim of self-policing failed). **Action implication**: never trust author discipline alone for attestation-class invariants (numerical counts, prose-state propagation, exact-quoted citations, file paths, line numbers, tracking-status assumptions). Always run the 2-pass discipline; never short-circuit. Stories 97.1-FE + 97.2-FE — both purpose-built to codify these very disciplines — together produced 28 attestation-class findings across 4 review passes (2 stories × 2 passes each), validating the meta-pattern at compounded scale. Cross-references: Epic 94-FE retro § A-4 (origin); Epic 95-FE retro § A-4 (1st carry-forward); Epic 96-FE retro § A-4 (2nd carry-forward — escalated to mandatory).

> **HALT vs prose investigation** (Story 97.7-FE): see [`docs/process/halt-vs-prose-investigation-2026-05.md`](docs/process/halt-vs-prose-investigation-2026-05.md) for evidence-based analysis of scripted vs prose-only enforcement. Recommends 2 scripts for immediate implementation (ESLint rule-name validator + workflow integration of `check-fix-propagation.sh`) and confirms attestation drift remains a human-judgment gate requiring the 2-pass discipline.

**Marker convention.** Each review pass produces one `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-heading under the story file's Dev Agent Record (e.g., `### Post-1st-pass-review fixes (2026-04-25)`, `### Post-2nd-pass-review fixes (2026-04-25)`). Two such sub-headings is the structural marker that both passes ran. **For human reviewers**: when reviewing a PR labelled `review`, verify the story file's Dev Agent Record contains TWO of these sub-headings before approving. If only one exists, request a 2nd-pass review.

**Story Change Log Lessons (Story 94.4-FE).** Every story's final Change Log row (flipping `Status: review → done`) must include a `**Lessons:**` sub-line with **1-3 single-sentence pattern observations**, each **≤120 chars**, specific to that story (not generic). Format: `**Lessons:** (1) <pattern>. (2) <pattern>. (3) <pattern>.`. Reference Story-NN.M-FE markers where natural. **For human reviewers**: verify the final row has `**Lessons:**` (each ≤120 chars, max 3) before approving. Earlier rows (creation, intermediate fixes, post-Nth-pass-review blocks) DO NOT require Lessons. Full template at `_bmad/bmm/workflows/4-implementation/create-story/template.md` § Change Log.

**Related.** `### Accepted Baselines` (above) — quality-gate baselines per gate. `### Doc-citation validation` (above) — automated counterpart for the citation gate.

### Known Anti-Patterns (Captured 2026-04-07 from Epic 86-FE retro)

> **Full text + code examples**: [`CLAUDE-ANTI-PATTERNS.md`](./CLAUDE-ANTI-PATTERNS.md)

Recognize on sight, refuse to write or merge. Numbered list (referenced as "anti-pattern #N" elsewhere in this file):

1. **`beforeEach(() => vi.clearAllMocks())` triggers TS2322** — use block body, not arrow expression.
2. **Non-null assertion (`!`) inside async closures** — capture to a non-null local with a runtime guard at top of `queryFn`.
3. **Faking `ApiError` with `Object.assign(new Error(), { status })`** — use real `ApiError` constructor, otherwise `instanceof` checks miss the mock.
4. **`as any` in mock helpers for complex library types** — declare a subset interface, bridge with `as unknown as <ReturnType>`.
5. **Variable shadowing in Zustand selectors** — name selector params after the store (`auth =>`), not the outer `state` binding.
6. **Silent E2E test skips that pass green** — use `test.skip(condition, reason)`, not early `return`.
7. **Hard waits (`page.waitForTimeout(N)`) in E2E specs** — intercept with `waitForResponse` before navigate.
8. **`?? 0` on nullable money/ratio fields lies about the data** — preserve `null`, render `—`. Counts/pagination still allow `?? 0`.
9. **`waitForLoadState('networkidle')` on background-polling pages** — never settles on dashboards; use `waitUntil: 'domcontentloaded'` + element-presence assertions.

Open `CLAUDE-ANTI-PATTERNS.md` for ❌ BAD / ✅ GOOD code blocks, scope rules, and canonical Story references.


### MCP-Assisted Development
**Context7 MCP** for design patterns and examples:
- `/creativetimofficial/ui` - Design patterns (DO NOT INSTALL, use for inspiration)
- `/llmstxt/ui_shadcn_llms_txt` - shadcn/ui implementation examples

**Workflow**: Query Context7 → Extract design ideas → Apply to shadcn/ui components → Follow project conventions (Russian locale, red primary #E53935, WCAG 2.1 AA)

---

## Key Architecture Patterns

### API Client (`src/lib/api-client.ts`)
Auto-injects `Authorization: Bearer {token}` and `X-Cabinet-Id: {cabinetId}`. Auto-unwraps `{ data: ... }` responses.

### Boundary Normalizer Pattern

> **Full text + canonical examples**: [`CLAUDE-PATTERNS.md` § Boundary Normalizer Pattern](./CLAUDE-PATTERNS.md#boundary-normalizer-pattern)

**TL;DR**: Every backend response MUST be transformed into a frontend-canonical shape at the API client layer. **Raw backend shapes never reach components or hooks.** Three real-incident drift classes this prevents: role case (`'owner'` vs `'Owner'`, Story 84.1), snake_case ↔ camelCase (Story 87.2), nullability collapse (`?? 0` on money/ratio fields, Stories 87.3 / 88.2).

Naming: `normalize<Name>Response` for endpoint responses, `to<Type>` for scalar/enum coercion, `normalize<Name>` for per-item.

**Anti-patterns**: typed `apiClient.get<BackendShape>(...)` without transform (TYPE lies); `as FrontendShape` cast; duplicating normalization at multiple call sites; conditional normalization. Every normalizer needs ≥1 unit test for nullability/case/variant edges. Reference: `src/stores/authStore.test.ts` for `normalizeUser`.

### TanStack Query (`src/hooks/`)
```typescript
// Standard hook pattern
export function useFeature(params) {
  return useQuery({
    queryKey: featureQueryKeys.byId(params),
    queryFn: () => getFeature(params),
    enabled: !!params,
  })
}
```
Config: staleTime=60s, gcTime=5min, retry=1

### Zustand (`src/stores/`)
- `authStore.ts` - Authentication with localStorage persistence
- `marginPollingStore.ts` - COGS→Margin calculation tracking

### Polling Pattern (COGS → Margin)
After COGS assignment, poll for margin calculation:
```typescript
getPollingStrategy(validFrom, isBulk) -> { interval: 3000-5000ms, maxAttempts: 10-20 }
```
Files: `src/lib/margin-helpers.ts`, `src/hooks/*-polling.ts`

### Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)

> **Full text + canonical examples**: [`CLAUDE-PATTERNS.md` § Multi-Source Orchestration](./CLAUDE-PATTERNS.md#multi-source-orchestration--visualization-patterns-epic-92-fe)

Four enforceable house rules from Epic 92-FE retro:

1. **Parallel-hook + independent-state-machine orchestration** — multi-source dashboards: each hook gets its own skeleton/error/data branch inside a shared `hasData` wrapper. One supplementary failure must NOT blank the page. Canonical: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`.
2. **Raw-SVG vs chart-library decision rule** — gauges/arcs/rings → raw SVG (trivially testable); line/bar/area/interactive charts → recharts + pre-planned `vi.mock` setup (jsdom doesn't render SVG sizes). Test-harness cost is load-bearing.
3. **Story-1 fixture seeding for new domains** — every new-domain epic MUST create `src/test/fixtures/<domain>-empty.ts` in Story 1, alongside types + normalizer. Retroactive extraction (Story 92.6-FE) costs ~3-4× more than upfront.
4. **Spec-grep discipline for story handoff** — story authors grep every cited field/function/type against the actual source file BEFORE marking `ready-for-dev`. Catches ghost fields (Story 92.4-FE H-3) and sent-but-not-consumed duplications (Story 91.2-FE). Includes documentation-prose verification (Story 94.5-FE), constraint precedent-grep for "no X" ACs (Story 94.7-FE), **fix-block propagation discipline** (Story 97.1-FE — after applying any fix, grep the EXACT phrase modified across all story-related files; 11+ recurrence chain across Epics 94-96 proved author intuition systematically underestimates the parallel-locations search space), and **authoritative-source-citation discipline** (Story 97.2-FE — when claiming numerical/date/state facts, prefer git-canonical sources over filesystem metadata over author memory; cite source method inline; avoids 3-instance 'weak-proxy-cited-as-canonical' chain across Epics 95-96), and **multi-tenant cabinet-isolation discipline** (Story 97.5-FE — for any new TanStack Query hook in cabinet-switching contexts, scope `queryKey` by `cabinetId` and add a 4-cabinet × cache-collision isolation suite as part of Story 1 of any new-domain epic; avoids the 4-instance Epic 96 cabinet-isolation defect class).

E2E coverage MUST exercise graceful-degradation paths (primary-success + supplementary-failure, and vice versa). See `e2e/monitor.spec.ts` Error states block.

## Critical Business Rules

### Week Definition
- **Format**: ISO week `YYYY-Www` (e.g., "2025-W49")
- **Timezone**: `Europe/Moscow`
- **Week starts**: Monday
- **Last completed week**: Mon/Tue before 12:00 → W-2, Tue after 12:00 → W-1

### Key Formulas
```
margin_pct = ((revenue - cogs) / revenue) * 100
roas = revenue / spend (where spend > 0)
```

### COGS Temporal Logic
- **Midpoint rule**: Thursday determines which COGS version applies
- `valid_from` after last completed week → Warning + manual recalc button

---

## Business Logic Locations

| Domain | File | Key Functions |
|--------|------|---------------|
| Week/COGS | `src/lib/margin-helpers.ts` | `getLastCompletedWeek()`, `calculateAffectedWeeks()` |
| Unit Economics | `src/lib/unit-economics-utils.ts` | Profitability status, health score |
| Liquidity | `src/lib/liquidity-utils.ts` | Turnover categories, liquidation scenarios |
| Supply Planning | `src/lib/supply-planning-utils.ts` | Stockout risk, reorder values |
| Advertising | `src/lib/campaign-utils.ts`, `efficiency-utils.ts` | Campaign status, ROAS categorization |

### Formatters (Russian Locale)
```typescript
formatCurrency(1234567.89)  // "1 234 567,89 ₽"
formatPercentage(15.5)      // "15,5 %"
formatDate(date)            // "20.01.2025"
formatIsoWeek(date)         // "2025-W03"
```

---

## API Integration

> **Full Reference**: [`docs/api-integration-guide.md`](docs/api-integration-guide.md) - Complete endpoint catalog, HTTP files, integration patterns

### Backend API Test Files (test-api/)

> **Location**: [`../test-api/`](../test-api/) (root of monorepo)

This folder contains **actual HTTP request examples** for all backend API endpoints. These are the most reliable source of information about available backend methods.

**What it contains**:
- **27 `.http` files** with ready-to-use API requests
- Each file covers a specific domain (auth, products, analytics, orders, etc.)
- Real request/response examples with headers and payloads
- Tests for all CRUD operations, edge cases, and error scenarios

**How to use**:
1. Open any `.http` file in VS Code (with REST Client extension)
2. Click "Send Request" above any HTTP request
3. View actual response from backend API
4. Copy request patterns for frontend integration

**Key test files**:
| File | Domain | Endpoints |
|------|--------|-----------|
| `01-auth.http` | Authentication | Login, register, refresh token |
| `03-products.http` | Products | List, details, search, dimensions |
| `04-imports.http` | Data Import | Excel, paid storage, **historical stocks** |
| `06-analytics.http` | Analytics | Weekly summary, by-SKU/brand/category |
| `07-cogs.http` | COGS | Single/bulk assignment, history |
| `08-tariffs.http` | Tariffs | Categories, warehouses, acceptance |
| `14-orders.http` | FBS Orders | Orders list, history, status |
| `15-analytics-fbs.http` | FBS Analytics | Trends, seasonal, backfill |

**Backend API Reference**: [`../docs/API-PATHS-REFERENCE.md`](../docs/API-PATHS-REFERENCE.md) - Complete endpoint documentation with examples

### Authentication Headers (Auto-Added)
```http
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

### Key Endpoints Summary
| Domain | Endpoints | Notes |
|--------|-----------|-------|
| Auth | `/v1/auth/login`, `register`, `logout` | JWT tokens |
| Cabinets | `/v1/cabinets/*` | CRUD + WB token |
| Products | `/v1/products` | `include_cogs=true` for margin data |
| Analytics | `/v1/analytics/weekly/*` | Finance summary, by-sku/brand/category |
| Tasks | `/v1/tasks/enqueue` | Manager+ role required |

### Role-Based Access
| Role | Task Enqueue | Analytics |
|------|--------------|-----------|
| Owner/Manager/Service | ✅ | ✅ |
| Analyst | ❌ (403) | ✅ |

---

## Component Patterns

### Organization
1. **Page → Container → Presenters**: Page orchestrates, containers manage state, presenters render
2. **Hook-Driven**: Components consume hooks for all data/mutations
3. **Compound Components**: Parent with sub-components (e.g., Form with Field)

### Key Custom Components
| Category | Location | Examples |
|----------|----------|----------|
| Auth/Onboarding | `custom/auth/`, `custom/onboarding/` | LoginForm, WbTokenForm |
| Products/COGS | `custom/products/`, `custom/cogs/` | ProductList, SingleCogsForm |
| Analytics | `custom/analytics/` | FinancialSummaryTable, ExpenseChart |
| Date Selection | `custom/date/` | WeekSelector, DateRangePicker |

---

## Design System

> **Full Reference**: [`docs/front-end-spec.md`](docs/front-end-spec.md) - Complete design system, typography, spacing, components

### Color Palette
| Element | Color | Usage |
|---------|-------|-------|
| Primary Red | `#E53935` | Main brand, buttons, links |
| Primary Dark | `#D32F2F` | Hover states |
| Primary Light | `#FFCDD2` | Hover backgrounds |
| White | `#FFFFFF` | Backgrounds |
| Gray Scale | `#F5F5F5` (light), `#EEEEEE` (borders), `#757575` (text) | UI elements |

### Semantic Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Green | `#22C55E` | Positive values, profitable margins |
| Red | `#EF4444` | Negative values, losses, high expenses |
| Blue | `#3B82F6` | Primary metrics, information |
| Purple | `#7C4DFF` | Storage analytics (Epic 24) |
| Yellow | `#F59E0B` | Warnings, medium severity |

### Typography
| Element | Size/Weight | Usage |
|---------|------------|-------|
| H1 | 32px, bold | Page titles |
| H2 | 24px, semi-bold | Section headers |
| Body | 14-16px, regular | Content |
| Metric Values | 32-48px, bold | Dashboard metrics |

---

## User Personas

> **Full Reference**: [`docs/front-end-spec.md`](docs/front-end-spec.md) - Detailed personas, goals, pain points

### Primary: Business Owner / Entrepreneur
- 50-5000 SKUs, 500K-50M RUB/month revenue
- **Goals**: Quick profit insight, reduce manual work by 75%, optimize pricing
- **Pain points**: Manual spreadsheets, no real-time visibility, COGS tracking difficulty

### Secondary: Financial Director / CFO
- 1000+ SKUs, financial professional
- **Goals**: Accurate reporting, strategic decisions, trend analysis
- **Pain points**: Need comprehensive overviews, multi-dimensional analysis

---

## WCAG 2.1 AA Accessibility (Mandatory)

> **Full Reference**: [`docs/front-end-spec.md`](docs/front-end-spec.md) - Complete accessibility guidelines, testing checklist

### Key Requirements
- **Color contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard navigation**: All interactive elements must be keyboard-navigable
- **Images**: All images must have alt text
- **Forms**: All form inputs must have associated labels
- **ARIA**: Use ARIA labels where semantic HTML is insufficient
- **Focus indicators**: Visible focus states for all interactive elements

### Testing Tools
- `@axe-core/playwright` - Automated accessibility testing in E2E
- Lighthouse accessibility audit
- Manual keyboard navigation testing

---

## Testing Strategy

> **Playwright Config**: `_bmad/bmm/testarch/knowledge/playwright-config.md`

### Structure
| Type | Location | Coverage Goal |
|------|----------|---------------|
| Unit | `src/**/*.test.tsx` | 60%+ |
| Integration | `src/lib/api/__tests__/` | 30%+ |
| E2E | `e2e/**/*.spec.ts` | 10%+ |

### Test Utilities
- **Location**: `src/test/utils/test-utils.tsx`
- `renderWithProviders()` - Custom render with providers
- `createTestQueryClient()` - Fresh TanStack Query client
- **Fixtures**: `src/test/fixtures/` - Mock data for each domain

### Visual Verification with Chrome

After implementing UI changes:
- Use **Claude Chrome** (browser tool) to verify the functionality works as expected
- Take screenshots to confirm visual appearance matches requirements
- Test interactive elements (buttons, forms, navigation)
- Verify responsive behavior at different viewport sizes
- Check that animations and transitions work correctly

---

## Environment Variables

### Development
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000  # Default
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot
```

### E2E Testing (Playwright)
```bash
# .env.e2e (for Playwright end-to-end tests)
E2E_BASE_URL=http://localhost:3100        # Frontend dev server
E2E_API_URL=http://localhost:3000         # Backend API URL
E2E_TEST_EMAIL=test@test.com              # Test user credentials
E2E_TEST_PASSWORD=Russia23!               # Test user password
E2E_REQUEST_TIMEOUT=30000                 # Request timeout (ms)
E2E_SCREENSHOT_DIR=test-results/screenshots  # Screenshot directory
E2E_DEBUG=false                           # Debug mode
```

**Note**: `.env.e2e` is excluded from version control. Test credentials match the seeded database user.

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Initial page load | < 3s |
| Time to interactive | < 5s |
| Dashboard data load | < 2s |
| API response (p95) | < 500ms |
| Error rate | < 1% |

---

## Documentation Index

### Core Documentation
| Document | Purpose |
|----------|---------|
| [`docs/EPICS-AND-STORIES-TRACKER.md`](docs/EPICS-AND-STORIES-TRACKER.md) | **Epic/story tracking, routes, sprint planning** |
| [`docs/api-integration-guide.md`](docs/api-integration-guide.md) | **Full API reference** (40+ endpoints, HTTP files) |
| [`docs/front-end-spec.md`](docs/front-end-spec.md) | **UI/UX specification** (design system, personas, WCAG) |
| `docs/front-end-architecture.md` | Technical architecture |
| `docs/MARGIN-COGS-BACKEND-INTEGRATION.md` | COGS temporal logic |

### Backend API Documentation (Root Level)
| Resource | Location | Purpose |
|----------|----------|---------|
| **Test API Files** | [`../test-api/`](../test-api/) | **HTTP request examples** - 27 files with actual backend tests |
| **API Paths Reference** | [`../docs/API-PATHS-REFERENCE.md`](../docs/API-PATHS-REFERENCE.md) | Complete backend endpoint documentation |
| **Business Logic** | [`../docs/BUSINESS-LOGIC-REFERENCE.md`](../docs/BUSINESS-LOGIC-REFERENCE.md) | Formulas, calculations, examples |
| **User Guide** | [`../docs/USER-GUIDE.md`](../docs/USER-GUIDE.md) | Complete API usage guide |

### Epic & Story Documentation
| Resource | Location |
|----------|----------|
| Epic specs | `docs/epics/epic-{N}-*.md` |
| Story files | `docs/stories/epic-{N}/story-*.md` |
| Sprint planning | `docs/sprint-planning/` |
| Backend requests | `docs/request-backend/` |

### UI/UX & Testing References
| Resource | Location |
|----------|----------|
| Wireframes | `docs/wireframes/` |
| User guides | `docs/user-guide/` |
| Playwright config | `_bmad/bmm/testarch/knowledge/playwright-config.md` |

---

## Git Workflow

```bash
git checkout -b feature/story-{ID}.{NUM}
npm run lint && npm run type-check
git commit -m "feat: implement story X.Y"
```

---

## Test Credentials

```
Email: test@test.com
Password: Russia23!
```

---

## Comment Policy

**Test scripts**: Create temporary test scripts in `scripts/` folder, delete after testing.

**Doc-link validation**: Run `npm run check:docs` before committing doc updates — catches broken source citations of the form `` `src/path.ts:N` `` (Story 89.3-FE).

---

**Last Updated**: 2026-01-31
