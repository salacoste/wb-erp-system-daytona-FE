# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

**WB Repricer System - Frontend** - Financial analytics dashboard for Wildberries marketplace sellers.

| Aspect | Details |
|--------|---------|
| Stack | Next.js 16 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui |
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
npm run dev              # Frontend: http://localhost:3100

# Local build smoke
npm run build && npm run start  # Frontend: http://localhost:3100

# Quality
npm run lint && npm run type-check && npm run format:check

# Testing
npm test                 # Unit (Vitest)
npm run test:e2e         # E2E (Playwright)
npm run check:privacy    # PII console guard
```

The verifier in `scripts/story-128-10/` is a historical Story 128.10 artifact
whose manifest is bound to
`feat/epic-128-10-frontend-verification-foundation`. Do not use it as the
current repository-wide validation command; use the commands above plus the
active story plan.

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

### Pre-flight source-trace verification (Story 105.2-FE)

**Rule**: Before implementing any story, grep the codebase for the story's AC nouns (file paths, endpoint URLs, type names, function/component names). If hits exist, READ those files and verify whether the AC is already satisfied. If ALL ACs are SHIPPED, close the story as no-op with verification evidence — skip implementation.

**Empirical wins**: Stories 103.1, 103.2, 103.3, 104.1, 104.3 all closed as no-op via this pattern — ~11 SP of duplicate work avoided in Epics 103-104 alone. The dev-story workflow Step 4.5 enforces this as a mandatory pre-flight step for fresh implementations (skipped for review-continuation flows).

**Why this works**: Backend coordination messages describe "what's available" not "what FE needs to do." Request files in `docs/request-backend/` often pre-date the FE work that incorporated them. Without verification, authors re-implement shipped features.

### Defensive Frontend Principle (Story 89.4-FE, from Epic 87-FE retro)

> **Full text**: [`CLAUDE-PATTERNS.md` § Defensive Frontend Principle](./CLAUDE-PATTERNS.md#defensive-frontend-principle-story-894-fe-from-epic-87-fe-retro)

**TL;DR**: Frontend never silently transforms data it doesn't own — it **indicates**. Detect anomaly → render warning + preserve raw value + file a backend ticket. Never swap fields, coerce nulls, or clamp values to "fix" backend bugs — that erases evidence.

Four anomaly categories: field inversion, null-where-number-expected, impossible negatives, missing/empty. Each has a "show an indicator" recipe + canonical example (orders price inversion → request #165 + `AlertTriangle`). Related: anti-pattern #8 (null-vs-zero), Boundary Normalizer Pattern, `PENDING BACKEND:` comment convention.

### Doc-citation validation (`npm run check:docs`)

`scripts/check-doc-citations.sh` (Story 89.3-FE) scans only Git-tracked `.md`/`.txt` files under `CLAUDE.md`, `CLAUDE-PATTERNS.md`, `CLAUDE-ANTI-PATTERNS.md`, `docs/`, `_bmad-output/`, `backlog/docs/`, and `backlog/tasks/`. Ignored/untracked scratch docs are excluded; modified tracked docs use current working-tree contents. Git enumeration failure is an error, never a recursive-filesystem fallback. Self-test: `bash scripts/check-doc-citations.sh --self-test`.

**Drift gate (Story 94.1-FE).** Validator set-diffs broken citations against `scripts/.check-docs-baseline.txt` and exits 0 only on exact match (emits `NEW`/`RESOLVED` enumeration). **Read the exit code, not the count.**

**Accepted baseline is derived, never hard-coded** — pre-existing historical refs in shipped docs/stories are recorded in `scripts/.check-docs-baseline.txt`. The committed file is the authoritative set; its non-comment, non-blank entry count is informational only. The validator exit code is the pass/fail signal. To accept legitimate churn: `bash scripts/check-doc-citations.sh --update-baseline`, review the set diff, then commit the baseline alongside the story.

**Exit-code caveat.** Bash pipes capture only the LAST command's exit code, so `npm run check:docs | tail` returns 0 even on failure. Check the gate via bare `npm run check:docs` (no pipe), `set -o pipefail`, or `bash scripts/check-doc-citations.sh` directly. Same for `--update-baseline` — invoke the script directly, not the `npm run` wrapper.

**Demonstrative-citation exclusions.** A spec embedding citation examples (baseline tables, validator self-test docs) goes in the script's `EXCLUDE_PATHS` (backtick-escaping doesn't work — see CITATION_REGEX header). Precedents: Stories 89.3-FE, 93.5-FE.

### ESLint rule-name validation (`npm run check:eslint-rules`)

`scripts/check-eslint-rules.sh` (Story 99.2-FE) validates every rule name in `.eslintrc.json` + `eslint.config.js` is recognized by ESLint (via `eslint --print-config`), catching silent disablement from typos (e.g. `max-lines-per-file` vs `max-lines`). Run after editing either config. Self-test: `bash scripts/check-eslint-rules.sh --self-test`.

### Next.js 16 App Router async-params validation (`npm run check:next-params`)

`scripts/check-next-async-params.sh` (Epic 119-FE retro A-1) flags any `params`/`searchParams` prop on an App Router `page.tsx`/`layout.tsx` that is NOT typed `Promise<...>`. Under the current Next.js 16 stack these props must remain Promises and be awaited — a synchronous type can pass `tsc --noEmit` but **fails `next build` route typegen** (the gate gap originally found in Story 119.2-FE). Run this for any story touching App Router page/layout signatures; `tsc` alone does not catch it. Escape hatch: `// next-async-params-allow: <reason>` on the line. Self-test: `bash scripts/check-next-async-params.sh --self-test`.

### Dot-locale percent ratchet (`npm run check:locale-percent`)

`scripts/check-locale-percent.sh` (iter-67) bans NEW dot-locale percent rendering. The Russian-locale rule requires `"15,5 %"` (comma + NBSP) but inline `` `${value.toFixed(N)}%` `` / `value.toFixed(N) + '%'` renders `"15.5%"`. Use **`formatPercentage`** (default 1-2 decimals) or **`formatPercentageInt`** (whole percents → `"75 %"`) from `@/lib/utils`. It's a **ratchet, not 0-tolerance**: ~108 pre-existing sites are allowed via a baseline COUNT (`scripts/.locale-percent-baseline.txt`); the gate fails only when the count INCREASES. When a story migrates sites the count drops — the gate prints "ratchet down" and you MUST lower the baseline in the same commit. Escape hatch: `// locale-percent-allow: <reason>` (recharts axis ticks, CSV-export numerics, aria spoken text). Self-test: `bash scripts/check-locale-percent.sh --self-test`. Full plan: `docs/process/dot-locale-percent-consolidation-proposal.md`.

### Accepted Baselines

Each story closes only when EVERY quality gate matches its baseline. Current accepted state:

| Gate | Command | Baseline |
|---|---|---|
| Doc citations | `bash scripts/check-doc-citations.sh` | exit code 0 when the current broken-citation set exactly matches `.check-docs-baseline.txt` |
| TypeScript | `npm run type-check` | 0 errors |
| ESLint rules | `bash scripts/check-eslint-rules.sh` | OK: all rule names valid in 2 files |
| Next.js async-params | `bash scripts/check-next-async-params.sh` | OK: all params/searchParams props Promise-typed (only required for App Router page/layout changes) |
| Dot-locale percent | `bash scripts/check-locale-percent.sh` | 4 (ratchet ↓; lower `.locale-percent-baseline.txt` when migrating OR exempting; started at ~108 in iter-67) |
| ESLint | `npm run lint` (from this frontend repository root) | 0 errors; 0 warnings (zero-warning policy, Story 164.4-FE) |
| Vitest | `npm test -- --run` | ≥ 19447 passing, 0 skipped, 0 failed (floor) |

**Drift rules.** check:docs — exit code is the gate (automated). type-check — count must equal 0. lint — errors must equal 0 and warnings must equal 0 (zero-warning policy enforced via `--max-warnings 0` in `lint` + `lint:fix`, Story 164.4-FE; lint-staged already `--max-warnings=0`); fix warnings rather than relaxing the budget. test — passing ≥ floor (additions OK, regressions not); 0 failed; skipped is informational. `max-lines` is enforced through `eslint.config.js` (cap 200 source / 800 test, `skipBlankLines` + `skipComments`); `next lint` is deprecated, so run `npm run lint` from this repository root. **When a story legitimately moves a baseline, update this table in the same PR.**

### Two-pass review discipline

**Rule (Story 94.3-FE).** Every story closes only after TWO adversarial code-review passes in FRESH contexts — both complete BEFORE flipping `Status: review → done` AND before any commit. 1st pass typically catches structural/correctness defects; 2nd catches narrative/factual/attestation drift. The passes find DIFFERENT defect classes; neither replaces the other. Enforced by `dev-story` Step 9 (HALT on single-pass commit) + a `<critical>` mandate in the `code-review` workflow.

**Why permanent (Story 97.4-FE).** Not a transient countermeasure — a structural property of human/LLM authoring: authors writing rules ABOUT defect prevention systematically miss occurrences when applying those rules to their own work (even explicit self-policing claims fail — Story 95.3). Empirically recurrent across 19+ findings spanning Epics 94-116. **Never trust author discipline alone for attestation-class invariants** (numeric counts, prose-state propagation, exact-quoted citations, file paths, line numbers, tracking-status). Always run both passes; never short-circuit. (HALT-vs-prose enforcement analysis: `docs/process/halt-vs-prose-investigation-2026-05.md`, Story 97.7-FE.)

**Marker convention.** Each pass produces one `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-heading under the story's Dev Agent Record. TWO such headings = both passes ran (verify before approving a `review` PR; if only one, request the 2nd pass).

**Lessons line (Story 94.4-FE).** The final close-row (Status → done) MUST carry a `**Lessons:**` sub-line: 1-3 single-sentence story-specific observations, each ≤120 chars, format `**Lessons:** (1) … (2) … (3) …`. Earlier rows don't need it. Validate via `bash scripts/check-lessons-length.sh`. Template: `_bmad/bmm/workflows/4-implementation/create-story/template.md` § Change Log.

**APPEND-ONLY closed rows (Story 111.1-FE F-2).** Later stories MAY add new dated rows to a closed story's Change Log; they MUST NOT edit prior rows — especially Lessons. If a closed lesson violates the cap, add a disclosure row; never trim in-place.

**Dual-attestation for N-of-N close-row counts (Story 118.1-FE).** A count attestation IN a close-row ("N lesson lines", "N-of-N record", "N total findings") is self-falsifying — the row's own `**Lessons:**` line ticks the scan count +1 the instant it's written. Recipe (pick one): (a) dual-attest "(N at write-time; N+1 after this Lessons line counts)"; (b) attest the post-write value + re-run the gate to verify; (c) accept + disclose via an APPEND-ONLY follow-up row. A deliberately-divergent heading (e.g. `**Lessons (NOT close-row)…**`) that doesn't match the validator's `**Lessons:**` regex is how a recipe-(c) row stays count-neutral.

**Scope (Epic 107-FE A-2).** 2-pass MANDATORY for behavior-changing source code (runtime behavior, type signatures, normalizer logic, API contracts, test assertions). Executor-with-inline-verify acceptable for trivial process-cleanup (doc-only, mechanical comment sweeps, test wrappers around existing validation, byte-identical helper extractions verified by the existing suite). Decision rule: if a reviewer reading the diff could plausibly miss a logic defect, run 2 fresh-context reviews.

### Multi-pass triggers (Story 113.1-FE)

The 2-pass floor escalates to ≥3 passes via four triggers (each evaluated after Nth-pass fixes, BEFORE Status flip; Trigger 1 at story-spec-author time):

- **Trigger 1 — Novel-pattern story → ≥3 passes by default.** Any story introducing a new design pattern (backend-pending UX, dual-role gate, new normalizer category, new state-machine recipe, new validator semantic, new APPEND-ONLY convention) defaults to ≥3 passes regardless of finding density.
- **Trigger 2 — Cumulative >12 findings → 3rd-pass MANDATORY.** If 1st+2nd-pass findings SUM to >12, a fresh-context 3rd pass is required (not optional).
- **Trigger 3 — High-density Nth-pass → (N+1)th MANDATORY.** If any Nth-pass surfaces >5 findings, an (N+1)th fresh-context pass is required; escalation continues until a pass surfaces ≤5.
- **Trigger 4 — Meta-claim escalation.** When an Nth-pass narrative contains self-referential meta-claims (recursive self-validation language, "all-N-triggers demonstrated", structural-property assertions about the story itself, finding-count attestations), an (N+1)th fresh-context pass evaluates the meta-claim — because a meta-claim added in pass N cannot be audited within the pass that generated it. **MANDATORY for discipline-codification stories** (primary deliverable = a rule/convention/pattern in `frontend/CLAUDE.md` / `CLAUDE-PATTERNS.md` / `CLAUDE-ANTI-PATTERNS.md`); **RECOMMENDED otherwise** — if declined, tag the claim "unaudited meta-claim".

**Disposition language is normative**: Triggers 1-3 + Trigger 4's MANDATORY branch are non-optional (coordinator MUST run the pass; reviewer MUST hunt at full intent). Trigger 4's RECOMMENDED branch (non-codification stories) is the sole judgment call; a declined escalation MUST carry the "unaudited meta-claim" qualifier.

**Default 4-pass schedule for codification stories (Story 116.1-FE A-5).** Empirically ~4 passes converge for discipline-codification stories (close-at-3 was reverted by a user-invoked post-close pass in Stories 114.1 + 115.1). Schedule 4 passes by default; do NOT close-at-3 unless an explicit empirical-bound deviation test is documented in the close-row. Non-codification default stays 2-pass + Triggers as fired.

### Empirical observations (Story 114.1-FE)

- **4-pass empirical bound** (observation, not law): recent novel-pattern / codification stories converge on ~4 review passes independent of finding density, via two complementary mechanisms — in-chain Trigger escalation, OR a user-invoked post-close pass that catches close-row drift. May not generalize to large multi-file source-code work.
- **Block-level blanket qualifier (Story 113.2-FE).** Open each Post-Nth-pass-review block with a single qualifier covering all its meta-claims ("…recursive-self-validation language; all such phrasings are unaudited meta-claims per Trigger 4") instead of in-line repetition. Adopt up-front for stories anticipating Trigger 4.
- **Recursive self-validation is structural.** Discipline-codification stories systematically self-demonstrate the rule they ship before close — expect it; Trigger 4 MANDATORY ensures the discipline doesn't depend on user intervention to catch it.

### User-invoked post-close review (Story 115.1-FE)

A `/code-review <story>` invocation AFTER Status → done — driven by user/coordinator practice, NOT rule firing. It reliably catches **close-row + sprint-status attestation drift** (line counts, N-of-N records, within-line YAML drift) that in-chain passes systematically miss, because the close-row narrative is written last and isn't re-reviewed in-chain. Complementary to Triggers 1-4 (not redundant): in-chain catches inter-pass propagation defects; post-close catches close-row drift. **Recommended routine practice for discipline-codification stories.** Fixes apply per APPEND-ONLY (Status stays `done`; disclose via a new dated row, or fix in-place only non-Change-Log meta-docs like File List / task checkboxes).

### Proactive blanket qualifier convention (Story 116.1-FE A-2)

Discipline-codification stories pre-write the `### Post-1st-pass-review fixes` block (with the blanket qualifier) at Tasks-1-4 commit time, BEFORE the 1st-pass review — shifting qualifier adoption from reactive to proactive so meta-claims in the story body / Completion Notes / Change Log row 2 are already covered when the reviewer reads. Reduces in-chain noise (1st-pass stops surfacing "unqualified meta-claim" findings; remaining findings are substantive-correctness defects in live prose).

**Template** (standardize across codification stories):

```markdown
### Post-1st-pass-review fixes (YYYY-MM-DD)

**Meta-claim blanket qualifier (Trigger 4 MANDATORY; pre-written per A-2).** This block + Completion Notes + Change Log row 2 + future Post-Nth-pass-review blocks + the sprint-status.yaml close-summary for this story use phrasings asserting structural properties, prior/predicted-pass outcomes, finding-count attestations, rule-applicability self-classification, self-demonstration, and similar recursive-self-validation language. All are **unaudited meta-claims** per Trigger 4, qualified collectively here.

_(1st-pass findings added below when the 1st-pass review runs.)_
```

**Date-substitution timing (Story 118.1-FE).** The `(YYYY-MM-DD)` in the pre-written heading is a LITERAL placeholder — substitute the actual date when that pass runs, NOT at pre-write time. (Applies to every `Post-Nth-pass-review fixes (YYYY-MM-DD)` heading.)

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
8. **`?? 0` on nullable money/ratio fields lies about the data** — preserve `null`, render `—`. Counts/pagination still allow `?? 0`. **ESLint enforced as of Story 105.1-FE** (`no-restricted-syntax` rule in `eslint.config.js`). New code cannot introduce new violations. Story 106-FE triaged 64 pre-existing allowlists: 1 was a real violation (fixed in Story 106.1, `daily/aggregation.ts:104` net_profit) and 63 are legitimate exceptions classified into 6 canonical patterns documented in **[`CLAUDE-PATTERNS.md` § Anti-Pattern #8 Exceptions](./CLAUDE-PATTERNS.md#anti-pattern-8-exceptions-story-1063-fe-from-epic-105-fe--106-fe)** (BACKEND-CONTRACT-NON-NULL / SEMANTIC-ZERO / AGGREGATION-REDUCE / DISPLAY-GUARD / DEBUG-LOG / TEST-ASSERTION). Allowlist comment format: `// eslint-disable-next-line no-restricted-syntax -- <PATTERN-NAME>: <specific rationale>`. Self-test: `bash scripts/test-anti-pattern-8-rule.sh`.
9. **`waitForLoadState('networkidle')` on background-polling pages** — never settles on dashboards; use `waitUntil: 'domcontentloaded'` + element-presence assertions.
10. **`formatNumber(opaqueId)` mangles search-key copy-paste** — use `String(id)` for opaque numeric IDs (nmId, productId). Canonical: Story 110.3-FE F-8.

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

### Visual Verification (Playwright)

Validate UI changes against the live app with Playwright (`playwright-cli open http://localhost:3100 --headed`, then `screenshot` / `reload` after each edit). Claude Chrome and browser-tools MCP are disabled by policy — Playwright is the only browser tool (see global `CLAUDE.md`).

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
E2E_TEST_PASSWORD=LocalTest123!               # Test user password
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
Password: LocalTest123!
```

---

## Comment Policy

**Test scripts**: Create temporary test scripts in `scripts/` folder, delete after testing.

**Doc-link validation**: Run `npm run check:docs` before committing doc updates — catches broken source citations of the form `` `src/path.ts:N` `` (Story 89.3-FE).

---

**Last Updated**: 2026-08-05

<!-- OPENWIKI:START -->

## OpenWiki

See [AGENTS.md](AGENTS.md) for OpenWiki agent instructions.

<!-- OPENWIKI:END -->
