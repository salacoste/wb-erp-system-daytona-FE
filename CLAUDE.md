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
- **File size limit**: All source files MUST be under 200 lines (ESLint enforced)
- **TypeScript strict**: No `any` types (use `unknown`)
- **Path aliases**: Use `@/components` not `../../components`
- **Server Components**: Default (no `'use client'` unless needed)
- **shadcn/ui**: Never edit manually - use CLI to add components
- **No `as` casts**: Widen types with optional fields (`?:`) or add `?? fallback` guards
- **Error test pattern**: Always use `mockRejectedValueOnce` (not `mockRejectedValue`)
- **Extract at ~150 lines**: Proactively split components before hitting 200-line limit
- **Pure functions over hook mocking**: Export testable logic as pure functions from hooks
- **Run E2E against live app**: Verify Playwright specs against running app before marking complete
- **Regex for locale assertions**: Use `/₽/`, `/\d+/` patterns in tests, not exact formatted strings
- **Document same-name functions**: When two modules export identically-named functions, add a distinguishing comment
- **No `TODO` in production code**: Use `PENDING BACKEND:` for backend-blocked work (linked to a `docs/request-backend/*.md` file), `FUTURE:` for post-MVP enhancements, or a ticket link. The bare `TODO` marker should never remain in committed source — it implies "someone on this team should do this soon" and accumulates silently. Grep `src/ --include="*.ts" --include="*.tsx" | grep -v test` for `TODO|FIXME` should return zero lines.

### Defensive Frontend Principle (Story 89.4-FE, from Epic 87-FE retro)

**The principle:** Frontend never silently transforms data it doesn't own — it **indicates**. When an anomaly is detected in backend-sourced data, render a warning indicator, preserve the raw value, and file a backend ticket. Do NOT "fix" the display by swapping fields, coercing nulls, or clamping values — that erases evidence of the real bug.

**What counts as "data you don't own":**
- Any field from a backend API response.
- Any field computed server-side (e.g., `netProfit`, `totalOperatingProfit`, `operatingProfit`).
- Any field sourced from the WB SDK via the backend proxy.
- **Counterexample**: data the frontend itself computes (local aggregations, UI state, derived totals from already-normalized inputs) — you own that; transform it freely.

**Four anomaly categories you'll encounter:**

| Anomaly | ❌ Don't | ✅ Do |
|---|---|---|
| Field inversion / swap (e.g., `salePrice > price × 1.2` — threshold avoids false positives on legitimate adjustments) | Silently swap in the transform. | Render a warning icon + tooltip near the cell; keep raw values visible. |
| `null` where a number is expected (e.g., `cogs: null`) | `?? 0` in the transform. | Preserve null end-to-end, render `—`, add a footnote. *(See anti-pattern #8.)* |
| Impossible negative value (e.g., `organicSales: -1200`) | `Math.max(0, value)`. | Show the raw value + a warning. |
| Missing / empty response | Fall back to stale cache silently. | Render a distinct empty-state with a link to the related backend ticket. |

**Concrete illustration** (matches the `❌ BAD / ✅ GOOD` style of adjacent anti-patterns):

```typescript
// ❌ BAD — silently "fixes" the backend anomaly, evidence erased
function transform(raw: { price: number; salePrice: number }) {
  if (raw.salePrice > raw.price * 1.2) {
    return { price: raw.salePrice, salePrice: raw.price } // swapped
  }
  return raw
}

// ✅ GOOD — raw values preserved, anomaly surfaced via a flag consumers can render
function transform(raw: { price: number; salePrice: number }) {
  const anomalous = raw.salePrice > raw.price * 1.2
  return { ...raw, anomalous } // UI renders AlertTriangle + tooltip when anomalous
}
// Cite backend ticket in a comment near the detector:
// // PENDING BACKEND: request #165 — price/salePrice inversion
```

**"Show an indicator" recipe:**
- Icon: `lucide-react` `AlertTriangle` — amber for advisory, red for blocking.
- Tooltip: one sentence explaining the anomaly (template: `` `Аномалия: <what> в <ratio> раз. Возможна ошибка данных на стороне WB.` ``; real example lives in `src/components/custom/orders/OrdersTableRow.tsx`).
- Footnote: `<p className="text-xs text-amber-700 mt-2">…</p>` near tables.
- Link: include a code comment pointing to the ticket: `// PENDING BACKEND: request #NNN — <one-line>`.

**"File a backend ticket" recipe:**
- Create `docs/request-backend/NNN-SHORT-DESCRIPTION.md` (next sequential number — grep the folder first).
- Follow the existing format: Problem → Root Cause → Impact → Fix Scope → Reproduction → Resolution.
- Cross-reference the ticket in any PR or story that surfaces the anomaly.

**Canonical worked example — orders price inversion:**
Story 87.3-FE found backend occasionally returning `price < salePrice` (field inversion). Rather than swapping them in the API transform, the team rendered an `AlertTriangle` warning in the orders table and filed `docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md`. Raw values stayed visible; the bug is now traceable, and the backend fix will remove the indicator naturally. See also `DailyCogsGapFootnote` (Story 88.2-FE) for the null-COGS equivalent.

**Related CLAUDE.md references:**
- **Anti-pattern #8 (null-vs-zero)** — a specific case of this principle applied to nullable money/ratio fields.
- **Boundary Normalizer Pattern** — the shape-drift flavor: normalize at the boundary, preserve null, never paper over mismatches.
- **`PENDING BACKEND:` convention** — anomaly-indicator code should always carry a `// PENDING BACKEND: request #NNN` comment so the indicator and the ticket stay linked.

### Doc-citation validation (`npm run check:docs`)

**What it does.** `scripts/check-doc-citations.sh` — shipped in Story 89.3-FE — scans `CLAUDE.md`, `docs/`, `_bmad-output/`, `backlog/docs/`, and `backlog/tasks/` for backtick-wrapped source citations of the form `` `src/path.ts:N` `` or `` `src/path.ts:N-M` `` and fails if any don't resolve. Two failure modes: (1) file not found, (2) line number exceeds the file's line count. Run `bash scripts/check-doc-citations.sh --self-test` to validate the validator itself.

**How to read the output.** Canonical structure (exit 1 on broken, 0 on clean):

```
Scanned: CLAUDE.md, docs, _bmad-output, backlog/docs, backlog/tasks
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

### Accepted Baselines

Each story closes only when EVERY quality gate's output matches its documented baseline. This subsection enumerates the current accepted state for each gate so "is this a regression?" has a definitive answer instead of relying on retrospective recall. Numbers verified empirically on 2026-04-25.

| Quality gate | Command | Baseline | Source / location |
|---|---|---|---|
| Doc citations | `bash scripts/check-doc-citations.sh` | 13 broken | Source: `scripts/.check-docs-baseline.txt` (auto-validated, Story 94.1-FE). |
| TypeScript | `npm run type-check` | 20 errors, all in `src/lib/api/advertising-analytics-api.ts` | Source: this section (manual). Provenance: Story 91-era SDK type-drift workaround (destructuring `{}` cast). |
| ESLint | `npm run lint` | 0 errors, 0 warnings | Source: this section (manual). Notes: any error or warning is a regression. |
| Vitest | `npm test -- --run` | ≥ 7000 passing, 676 skipped, 0 failed (floor — see drift rule) | Source: this section (manual). Provenance: as of Epic 93 close + Story 94.1. |

**Drift discipline (manual for type-check / lint / test; automated for check:docs).** Each story closes only when EVERY quality gate's output matches its documented baseline. Comparison rules per gate:

- **check:docs**: automated set-diff against `scripts/.check-docs-baseline.txt` (Story 94.1-FE). Exit code is the gate.
- **type-check**: count must equal 20 AND the file scope must equal `src/lib/api/advertising-analytics-api.ts`. New errors anywhere else, or additional errors in that file beyond 20, are regressions. The 20 will drop when the SDK type drift is resolved (out of scope for now — see § "When to update").
- **lint**: count must equal 0. Any warning OR error is a regression.
- **test**: passing count must equal 7000 OR HIGHER (additions OK, regressions not). Failed count must equal 0. Skipped count is informational; substantial growth in skipped should be questioned but is not a hard gate.

**When to update.** When a story legitimately changes a baseline (e.g., the SDK drift is fixed → 20 type errors drop to 0; a new story adds 12 valid tests → 7000 passing becomes 7012), update this section in the same PR. Treat the section like Story 93.5's 13-citation table: source-of-truth (may temporarily lag reality between gate-affecting commits).

**Related.** `### Doc-citation validation` (above) — the automated counterpart for one of these gates. `### Known Anti-Patterns` (below) — citation-hygiene context for the citation-tracking gate.

### Two-pass review discipline

**Rule (Story 94.3-FE).** Every story closes only after TWO adversarial code-review passes in fresh contexts — once for the initial review, once in a new context for the second adversarial pass. **Both passes complete BEFORE flipping `Status: review → done` AND BEFORE any commit.** First pass typically catches structural/correctness defects; second pass typically catches narrative/factual/style drift. The two passes find DIFFERENT defect classes; neither replaces the other.

**Empirical evidence + enforcement.** Stories 93.4 / 94.1 / 94.2 each shipped 2nd-pass-found findings as POST-MERGE follow-up commits when the 2nd pass happened after-not-before commit. The follow-up commits resolved real attestation-class defects. The `dev-story` workflow Step 9 has a HALT condition for single-pass commits; the `code-review` workflow at `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` has a top-level `<critical>` mandate to run at-least-twice per story. Both are LLM-interpreted at run-time.

**Marker convention.** Each review pass produces one `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-heading under the story file's Dev Agent Record (e.g., `### Post-1st-pass-review fixes (2026-04-25)`, `### Post-2nd-pass-review fixes (2026-04-25)`). Two such sub-headings is the structural marker that both passes ran. **For human reviewers**: when reviewing a PR labelled `review`, verify the story file's Dev Agent Record contains TWO of these sub-headings before approving. If only one exists, request a 2nd-pass review.

**Story Change Log Lessons (Story 94.4-FE).** Every story's final Change Log row (flipping `Status: review → done`) must include a `**Lessons:**` sub-line with **1-3 single-sentence pattern observations**, each **≤120 chars**, specific to that story (not generic). Format: `**Lessons:** (1) <pattern>. (2) <pattern>. (3) <pattern>.`. Reference Story-NN.M-FE markers where natural. **For human reviewers**: verify the final row has `**Lessons:**` (each ≤120 chars, max 3) before approving. Earlier rows (creation, intermediate fixes, post-Nth-pass-review blocks) DO NOT require Lessons. Full template at `_bmad/bmm/workflows/4-implementation/create-story/template.md` § Change Log.

**Related.** `### Accepted Baselines` (above) — quality-gate baselines per gate. `### Doc-citation validation` (above) — automated counterpart for the citation gate.

### Known Anti-Patterns (Captured 2026-04-07 from Epic 86-FE retro)

These patterns were repeatedly hit across recent stories. Each one is a known footgun — recognize them on sight and refuse to write or merge them.

#### 1. `beforeEach(() => vi.clearAllMocks())` triggers TS2322

**Symptom:**
```
Type 'VitestUtils' is not assignable to type 'Awaitable<HookCleanupCallback>'
```

**Cause:** Arrow expression body returns `vi.clearAllMocks()`'s return value (`VitestUtils`), which Vitest's `beforeEach` callback contract rejects.

**Fix:** Use a block body so the return type is `void`:
```typescript
// ❌ BAD
beforeEach(() => vi.clearAllMocks())

// ✅ GOOD
beforeEach(() => {
  vi.clearAllMocks()
})
```

#### 2. Non-null assertion (`!`) inside async closures

When you have a hook that guards on a value via `enabled: ... cabinetId != null`, the `queryFn` closure still sees `cabinetId` as `string | null`. Using `cabinetId!` to bypass this is the same anti-pattern as `as` casts — it disables type safety for the sake of shorthand.

```typescript
// ❌ BAD — TypeScript can't see the enabled guard
queryFn: async () => {
  const response = await getClientInfo(cabinetId!, orderIds)
  return buildClientInfoMap([response])
},
enabled: isOwner && cabinetId != null && orderIds.length > 0,
```

**Fix:** Capture to a non-null local with a runtime guard at the top of the closure. The runtime check is unreachable in normal flow (because of `enabled`) but prevents future refactors from silently breaking the invariant:

```typescript
// ✅ GOOD
queryFn: async () => {
  if (!cabinetId) return {} // unreachable in normal flow, but defensive
  const safeCabinetId = cabinetId
  const response = await getClientInfo(safeCabinetId, orderIds)
  return buildClientInfoMap([response])
},
enabled: isOwner && cabinetId != null && orderIds.length > 0,
```

#### 3. Faking `ApiError` with `Object.assign(new Error(), { status })`

When mocking error responses in hook/API tests, do NOT shortcut with `Object.assign`. The result is a plain `Error` with a `status` property — code that does `if (err instanceof ApiError)` will not match it, so the mock doesn't exercise the real code path.

```typescript
// ❌ BAD
const rateLimitError = Object.assign(new Error('Rate limit exceeded'), { status: 503 })
vi.mocked(getClientInfo).mockRejectedValueOnce(rateLimitError)

// ✅ GOOD
import { ApiError } from '@/types/api'
const rateLimitError = new ApiError('Rate limit exceeded', 503)
vi.mocked(getClientInfo).mockRejectedValueOnce(rateLimitError)

// Bonus: lock down the constructor in the assertion
expect(result.current.error).toBeInstanceOf(ApiError)
```

#### 4. `as any` in mock helpers for complex library types

TanStack Query's `UseQueryResult` is a discriminated union with ~20 fields. Mocking it triggers the temptation to use `as any` + `eslint-disable-next-line`. Don't.

```typescript
// ❌ BAD
function mockHook(overrides: Partial<{ data: unknown; isLoading: boolean }>) {
  vi.mocked(useFeature).mockReturnValue({
    data: undefined,
    isLoading: false,
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

// ✅ GOOD — declare the subset the consumer actually reads, then bridge with `as unknown as`
type HookReturn = ReturnType<typeof useFeature>
interface MockHookOverrides {
  data?: FeatureResponse | undefined
  isLoading?: boolean
  isError?: boolean
}
function mockHook(overrides: MockHookOverrides) {
  const partial = { data: undefined, isLoading: false, isError: false, ...overrides }
  vi.mocked(useFeature).mockReturnValue(partial as unknown as HookReturn)
}
```

The `as unknown as HookReturn` is the standard TypeScript escape hatch for bridging structurally compatible subsets — it acknowledges the widening explicitly without disabling the type system. No `any`, no `eslint-disable`.

#### 5. Variable shadowing in Zustand selectors

When the outer scope has a `state` binding, naming the selector parameter `state` shadows it confusingly:

```typescript
// ❌ CONFUSING
function OrdersPage() {
  const state = useOrdersPageState() // outer "state"
  const userRole = useAuthStore(state => state.user?.role) // inner "state" shadows
  // ...
}

// ✅ GOOD
function OrdersPage() {
  const state = useOrdersPageState()
  const userRole = useAuthStore(auth => auth.user?.role)
  // ...
}
```

#### 6. Silent E2E test skips that pass green

Playwright tests that early-return when fixture data is missing pass as **green** in CI, hiding gaps:

```typescript
// ❌ BAD — silently passes even with no real coverage
test('should render phone link', async ({ page }) => {
  const linkCount = await page.getByRole('link').count()
  if (linkCount === 0) {
    test.info().annotations.push({ type: 'note', description: 'No data, skipping' })
    return // green pass with no assertion
  }
  // ... real assertions
})

// ✅ GOOD — visible yellow skip in CI report
test('should render phone link', async ({ page }) => {
  const linkCount = await page.getByRole('link').count()
  test.skip(linkCount === 0, 'No data in fixture — needs API seeding (request #NNN)')
  // ... real assertions
})
```

#### 7. Hard waits (`page.waitForTimeout(N)`) in E2E specs

Per the testarch test-quality framework:

```typescript
// ❌ BAD
await page.goto('/orders')
await page.waitForTimeout(2000) // arbitrary, slow, flaky

// ✅ GOOD — intercept BEFORE navigate, await AFTER
const responsePromise = page.waitForResponse(
  resp => /\/v1\/cabinets\/[^/]+\/orders\/client-info/.test(resp.url()) && resp.status() === 200,
  { timeout: 5000 }
)
await page.goto('/orders')
await responsePromise // deterministic wait
```

For navigation cycles use `waitForLoadState('networkidle')` instead of `waitForTimeout`.

#### 8. `?? 0` on nullable money/ratio fields lies about the data

When a backend field can legitimately be `null` (meaning "unknown" — e.g., ROAS when there is no ad spend, COGS when not yet assigned, profit when cost is unknown), do NOT collapse it to `0` in the transform layer. "Zero" and "unknown" have different user-facing meanings, and the user cannot recover the distinction from a rendered `0 ₽`.

**Bad** (Story 87.3 / 88.2 pattern — silently misleads the user):
```ts
// Transform layer — at the API → frontend boundary
profit: { operating: item.operating_profit ?? 0 } // type lies: number
revenue: item.revenue ?? 0                        // null becomes "no sales" instead of "no data"
overall_roas: backend.avgRoas ?? 0                // null (no spend) becomes "0.0x ROAS"
```

**Good** (null preserved through types; display layer renders `—`):
```ts
// Transform layer — preserve null, widen the type
profit: { operating: item.operating_profit ?? null } // type: number | null
revenue: item.revenue ?? null

// Display layer — formatter or explicit guard renders em dash
<span>{item.revenue == null ? '—' : formatCurrency(item.revenue)}</span>

// Aggregation callsites — coerce with comment so next dev doesn't "fix" it back upstream
const totalProfit = items.reduce(
  (sum, i) => sum + (i.profit.operating ?? 0), // aggregation — null treated as 0, intentional
  0
)
```

**Scope rule — when null matters vs when zero is fine:**
- ✅ Money values (`revenue`, `cogs`, `profit`, `spend`) — always "null means unknown."
- ✅ Ratios (`roas`, `roi`, `margin_pct`) — always "null means unknown" (division undefined).
- ✅ Per-unit metrics (unit cost, expected profit per unit) — same.
- ❌ Counts (`orderCount`, `salesCount`, `views`, `clicks`) — 0 is legitimate, `?? 0` is fine.
- ❌ Pagination (`total`, `limit`, `offset`) — 0 is legitimate.
- ❌ Accumulator seeds (`{ total: 0 }` at start of `reduce`) — 0 is legitimate.

**Escalation pattern** — when any row in an aggregate has null, disclose the gap to the user with a footnote:
```tsx
<p className="text-xs text-amber-700 mt-2">
  * COGS неизвестна для {N} дн. — теор. прибыль за эти дни рассчитана без учёта себестоимости.
</p>
```

See Story 87.3-FE (SKU profit) and Story 88.2-FE (ROAS, daily COGS) for the canonical fix pattern.

#### 9. `waitForLoadState('networkidle')` on background-polling pages

Dashboard / analytics pages run continuous background queries (margin polling, chart refetch intervals, TanStack Query focus-refetch, dev-mode telemetry, React DevTools heartbeat). `networkidle` requires **500ms of zero network activity** — a window that never opens within a 30s Playwright test budget. Tests hang to timeout, the real assertion never runs, and real regressions hide behind the timeout failure.

**Bad** (hits the 30s test timeout on any dashboard page):
```typescript
await page.goto('/dashboard')
await page.waitForLoadState('networkidle') // never settles — test hangs
await expect(metricsCard).toBeVisible()
```

**Good** (deterministic, <15s on same page):
```typescript
await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
await expect(metricsCard).toBeVisible({ timeout: 10000 })
```

**Why this works:** `domcontentloaded` fires once React has mounted and the previous page has unmounted. The `expect(landmark).toBeVisible()` then waits for the thing you actually want to test — a stable landmark like `[role="region"][aria-label="Основные метрики"]` — rather than for "the network to go quiet" (a proxy signal that's wrong on polling pages).

**When `waitForResponse` is the right tool** — for tests that assert "user action triggered this specific API call," observe the network directly:
```typescript
await Promise.all([
  page.waitForResponse(resp =>
    /\/v1\/analytics\/weekly\/finance/.test(resp.url()) && resp.status() === 200
  ),
  weekDropdown.click(),
])
```

**When `waitForTimeout(N)` IS acceptable** — short (≤300ms) CSS transitions where no DOM event exists. Always annotate: `// intentional animation delay — 300ms CSS transition, no DOM signal`. Never use `waitForTimeout` as a data-wait substitute.

See Story 86.2-FE (`e2e/orders-client-info.spec.ts:441-458`) and Story 88.3-FE for canonical migrations.

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

Every endpoint response that crosses the backend→frontend boundary MUST be transformed into a frontend-canonical shape at the API client layer. **Raw backend shapes never reach components or hooks.**

**Why this matters.** Backend and frontend evolve independently. Three separate bugs (Stories 84.1, 87.2, 87.3 / 88.2) each shipped because a transform was missing or silently collapsed a mismatch:

| Story | Drift | Silent collapse |
|---|---|---|
| 84.1 | Role case: backend `'owner'` vs frontend `'Owner'` | Role-gated features broke |
| 87.2 | Field naming: backend `cabinetId`/`reportsStatus` (camelCase) vs frontend `cabinet_id`/`status` (snake_case) | Backfill admin crashed on unknown `'not_started'` status |
| 87.3 / 88.2 | Nullability: backend `null` meaning "unknown" | `?? 0` in transform collapsed "unknown" into "zero" — misleading `0 ₽` / `0.0x ROAS` cells |

Each of these cost meaningful diagnostic cycles. The code looked correct, the types compiled, but the boundary silently papered over a mismatch.

**Naming conventions** (pick one consistently per module):
- `normalize<Name>Response(raw: unknown): <Name>Response` — preferred for top-level endpoint responses.
- `to<Type>(raw: unknown): <Type>` — preferred for scalar/enum coercion (e.g., `toBackfillStatus`, `toDataSource`).
- `normalize<Name>(raw: Raw<Name>): <Name>` — per-item normalization inside a list response.

**When to use** (checklist):
- ✅ Role/enum case mismatches (`'owner'` vs `'Owner'`)
- ✅ snake_case ↔ camelCase between contracts
- ✅ Nullability where backend `null` semantically means "unknown" (see anti-pattern #8)
- ✅ Date strings ↔ `Date` objects (never leave raw strings in `Date`-typed fields)
- ✅ Discriminated unions with new backend variants (fall through to a `'unknown'` sentinel)

**Canonical examples** (read these first when adding a new endpoint):

Example 1 — role-case bridging in a state store (`src/stores/authStore.ts:23-35`):
```typescript
const ROLE_CASE_MAP: Record<string, User['role']> = {
  owner: 'Owner', manager: 'Manager', analyst: 'Analyst', service: 'Service',
}

function normalizeUser(user: User): User {
  const incoming = user.role as unknown as string
  const canonical = ROLE_CASE_MAP[incoming.toLowerCase()] ?? user.role
  if (canonical === user.role) return user
  return { ...user, role: canonical }
}
// All entry points (setUser, login, refreshToken, persisted-state migration)
// route the user through normalizeUser — single source of truth.
```

Example 2 — inline transform with scalar coercers (`src/lib/api/backfill.ts:33-89`):
```typescript
function toBackfillStatus(raw: unknown): BackfillStatus {
  const s = String(raw ?? '')
  return VALID_STATUSES.has(s as BackfillStatus) ? (s as BackfillStatus) : 'not_started'
}
function toDataSource(raw: unknown): DataSource { /* same pattern */ }

export async function getBackfillStatus(): Promise<BackfillStatusResponse> {
  const raw = await apiClient.get<Record<string, unknown>[]>(`${BASE_URL}/status`, {
    skipDataUnwrap: true,
  })
  // Backend: camelCase (cabinetId, reportsStatus, overallProgress)
  // Frontend: snake_case (cabinet_id, status, progress). Normalize here.
  return (raw ?? []).map(item => ({
    // Dual-lookup (`item.cabinetId ?? item.cabinet_id`) is deliberate — it absorbs a
    // rolling backend rename without a breaking frontend change. When the backend
    // stabilizes on one casing, drop the fallback branch; until then the normalizer
    // is the hinge that keeps both contracts valid simultaneously.
    cabinet_id: (item.cabinetId ?? item.cabinet_id ?? '') as string,
    status: toBackfillStatus(item.reportsStatus ?? item.status),
    data_source: toDataSource(item.dataSource ?? item.data_source),
    // ...repeat dual-lookup for every field (full code at src/lib/api/backfill.ts:55-89)
  }))
}
```

**Anti-patterns to avoid:**
- ❌ `apiClient.get<BackendShape>(...)` followed by direct return — the TYPE lies; runtime shape is whatever the backend sent.
- ❌ `response as FrontendShape` cast to paper over a mismatch — use a normalizer, not an assertion.
- ❌ Duplicating normalization at multiple call sites — put it in the API module, one place.
- ❌ Conditional normalization (`if (response.cabinetId) { ... } else { ... }`) — always normalize unconditionally so the transform is proof, not a guess.

**Testing requirement.** Every normalizer MUST have at least 1 unit test exercising the nullability / case / variant edge cases. Reference: `src/stores/authStore.test.ts` for `normalizeUser`. Without the test, a silent regression can drop into the transform as easily as it can into a consumer.

**Cross-reference.** The three diagnostic case studies this pattern prevents: Story 84.1 (role case), Story 87.2 (backfill camelCase → snake_case), Story 87.3 + 88.2 (null vs zero). The Story 88.4 audit at `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-15.md` classifies every file in `src/lib/api/` by normalizer presence.

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

These 4 patterns emerged from Epic 92-FE's retrospective (`_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md`, Insights #2/#3/#6/#7) and were tribal knowledge scattered across 6 story files. Codifying them here makes them grep-and-cite-able at PR review time — the same standard as `### Boundary Normalizer Pattern`. The retro contains the full diagnostic history; this section contains the enforceable house rules.

(Insight #8 — the "mirrors X — keep in sync" middle-ground pattern for deferred rule-of-two extractions — is a tactical pattern already documented across retros; Story 93.1's extraction convention is the canonical example. Not re-documented here to avoid duplication.)

*Retro artifacts live under `_bmad-output/implementation-artifacts/` (gitignored — local to the author's filesystem; not distributed with the repo).*

#### Pattern 1: Parallel-hook + independent-state-machine orchestration

**When to use**: multi-source dashboards where partial failure should degrade gracefully — primary data loaded + 1-2 supplementary widgets can each fail independently without blanking the page.

**Canonical example**: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` — 3 hooks (`useMonitorSummary` primary, `useDailyMetrics` + `usePipelineGrid` supplementary), each rendered through its own skeleton/error/success state machine inside a shared `hasData` wrapper.

**Shape** (adapted from `MonitorPageContent.tsx`):
```typescript
export function MonitorPageContent() {
  const { data, isLoading, isError } = useMonitorSummary()
  // Memoize — prevents refetch storm on every render.
  const { weekFrom, weekTo } = useMemo(() => ({ weekFrom: format(subDays(new Date(), 6), 'yyyy-MM-dd'), weekTo: format(new Date(), 'yyyy-MM-dd') }), [])
  const dailyQuery = useDailyMetrics({ from: weekFrom, to: weekTo, mode: 'week' })
  const dailyData = dailyQuery.data ?? []  // ?? [] — empty array is valid; see Pattern 3 empty-fixture contract
  const { pipelineFrom, pipelineTo } = useMemo(() => { /* same memoization pattern */ }, [])
  const pipelineQuery = usePipelineGrid({ from: pipelineFrom, to: pipelineTo, resolution: 'day' })
  const hasData = !!data; const showSkeleton = isLoading && !hasData; const showFullError = isError && !isLoading && !hasData
  if (showSkeleton) return <Skeleton />
  if (showFullError) return <Alert>{/* error alert with retry */}</Alert>
  if (!hasData) return null
  return (
    <>
      {/* Primary blocks — render when hasData */}
      <MonitorKpiCards kpi={data.kpi} />
      <MonitorMetricsTable periods={data.periods} />
      {/* Supplementary — independent 3-branch: skeleton / error / data */}
      {dailyQuery.isLoading && !dailyQuery.data && <Skeleton />}
      {dailyQuery.isError  && !dailyQuery.data && <RetryButton onClick={dailyQuery.refetch} />}
      {dailyQuery.data && <MonitorWeeklyChart data={dailyData} />}
      {pipelineQuery.data && <MonitorPipelineHealth pipelines={pipelineQuery.data.pipelines} />}
    </>
  )
}
```

**Anti-pattern to avoid** (see also `### Known Anti-Patterns` for the tactical list):
```typescript
// ❌ BAD — full-page error when ANY hook fails; blanks KPI cards for a pipeline-health failure
const { data: summary } = useMonitorSummary()
const { data: pipeline } = usePipelineGrid(/* params */)
if (!summary || !pipeline) return <ErrorPage />  // one failure kills the whole page
```

**Cross-reference.** Story 92.4-FE (introduced pattern), Story 92.5-FE (copy with buyout gauge + pipeline), Story 92.6-FE (E2E coverage of graceful degradation per hook).

**Testing requirement**: E2E coverage MUST include graceful-degradation paths (primary success + supplementary failure, and vice versa). See `e2e/monitor.spec.ts` Error states describe block for canonical examples.

---

#### Pattern 2: Raw-SVG vs chart-library decision rule

Recharts lowers dev cost for complex interactive charts but raises test cost: jsdom doesn't render SVG sizes, so Recharts children (lines, axes) don't mount — unit tests require pre-planned `vi.mock` at the top of the test file. Raw SVG has more geometry upfront but is trivially testable — no mocking needed. Story 92.5-FE chose raw SVG for `MonitorBuyoutGauge` specifically to avoid Story 92.4-FE's recharts jsdom pain discovered mid-sprint. **Test-harness cost is load-bearing, not a dev-ergonomics-only choice.**

**Decision rule**:
- Semi-circular gauges, simple arcs, progress rings, small static shapes → **raw SVG**
- Line charts, bar charts, area charts, complex interactive (zoom / pan / brush / tooltip) → **recharts** + pre-plan jsdom mocks in the test file before writing any component code

**Canonical pairs**:
- Raw SVG: `src/app/(dashboard)/monitor/components/MonitorBuyoutGauge.tsx` (Epic 92 origin) + `src/app/(dashboard)/monitoring/components/HealthScoreWidget.tsx` (Epic 68 original precedent)
- Recharts: `src/app/(dashboard)/monitor/components/MonitorWeeklyChart.tsx` + `src/components/custom/dashboard/MonthlyPatternsChart.tsx`

**When you MUST use recharts** — pre-plan the jsdom mock strategy in the test file setup before writing the component. See Story 92.4-FE's retro for the `LineChart`/`Line`/`XAxis` mock template. Do not discover the mock requirement at test-writing time.

**Cross-reference.** Story 92.4-FE (recharts jsdom pain diagnosis), Story 92.5-FE (raw SVG chosen to avoid it).

---

#### Pattern 3: Story-1 fixture seeding for new domains

**The rule**: any new epic touching a new domain MUST create `src/test/fixtures/<domain>-empty.ts` alongside types + normalizer in Story 1 of the epic. Downstream stories' unit tests AND E2E fixture helpers reuse it.

**Why**: retroactive extraction (what Epic 92 did in Story 92.6-FE) forces every downstream story to re-implement empty-data inline until the extraction happens. Upfront cost in Story 1 is ~30 lines; retroactive refactor is ~100+ lines across N story test files.

**Canonical example**: `src/test/fixtures/monitor-empty.ts` — shared between unit tests (`src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx`) and E2E helpers (`e2e/fixtures/monitor-fixtures.ts`). The E2E file wraps the same factories with `page.route` handlers.

**Module shape** (adapted from `src/test/fixtures/monitor-empty.ts`):
```typescript
// Shared empty-fixture factories — consumed by unit tests AND e2e/fixtures/.
// Convention: money/ratio fields use null (CLAUDE.md anti-pattern #8); count fields use 0.
import type { MonitorSummaryResponse } from '@/app/(dashboard)/monitor/types/monitor-summary'
import type { PipelineHealthGrid } from '@/app/(dashboard)/monitoring/types/monitoring-grid'
import type { DailyMetrics } from '@/types/daily-metrics'

export function emptyMonitorSummary(): MonitorSummaryResponse { /* counts=0, money=null */ }
export function emptyPipelineGrid(): PipelineHealthGrid     { /* pipelines: [] */ }
export function emptyDailyMetrics(): DailyMetrics[]         { return [] }
```

**Checklist for Story 1 of any new-domain epic**:
1. Types defined in `src/types/<domain>.ts` or `src/app/(dashboard)/<domain>/types/`
2. Normalizer defined in `src/lib/api/<domain>.ts` (`normalize<Domain>Response`)
3. Shared-fixture module created at `src/test/fixtures/<domain>-empty.ts`
4. E2E fixture wrapper at `e2e/fixtures/<domain>-fixtures.ts` with `page.route` handlers (if E2E spec is planned)
5. At least one unit test in the first downstream test file imports from the shared-fixture module — proves the wiring before the module accumulates consumers

**Cross-reference.** Story 92.6-FE (retroactive extraction that motivated this rule), Epic 92 retro AI #5 (shared-fixture module should be seeded in Story 1 of any new-domain epic, not retroactively). Fixtures should consume the normalized types produced by the `### Boundary Normalizer Pattern` — never raw backend shapes.

**Testing requirement**: the shared-fixture module MUST have ≥1 test consuming it in the first downstream test file (proves the wiring). Without this, regressions slip silently into fixture factories.

---

#### Pattern 4: Spec-grep discipline for story handoff

**The rule**: story authors must grep every field name / function name / type name listed in the spec's `Data sources / fields consumed` section against the actual source file BEFORE marking the story `ready-for-dev`. Prevents ghost fields and stale references from reaching the executor.

**Case studies**:

- **Story 92.4-FE H-3 structural fix** — spec listed 3 chart lines sourced from `DailyMetrics.salesCount` / `DailyMetrics.returnsCount`. Those fields didn't exist on the `DailyMetrics` type (`src/types/daily-metrics.ts`) **at spec-handoff time** (they were added later as the H-3 structural fix). The primary dev silently adapted to 2 chart lines; review caught the structural drift and flagged it as a hard review issue → required upstream type extension + aggregation change to restore the intended 3-line chart. Had the spec author grepped `src/types/daily-metrics.ts` for `salesCount` / `returnsCount` before handoff, the structural work would have been scoped into Story 92.4-FE upfront and the review round-trip avoided.

- **Epic 91-FE Story 91.2-FE sent-but-not-consumed field** — spec added `operatingProfit: number` to `FinanceDailyResponseItem` (`src/lib/api/daily-analytics/api.ts:48`) on the premise that "backend already sends it since Epics 89-91." The field exists in multiple consumer locations (`src/types/daily-metrics.ts`, `src/components/custom/sku-financials/`), but no consumer actually mapped it in the PR. Review caught it; field kept with a comment documenting "received but unmapped" status. Grep-for-new-field-USAGE (not existence) is the discipline: `grep -rn 'operatingProfit' src/components/ src/hooks/` would have shown no NEW consumer in the PR diff.

**Handoff checklist** (run before marking `ready-for-dev`):
1. For every `<filename>.ts:<field>` citation in the spec, run `grep -n '<field>' <filename>.ts`.
2. Confirm: field exists, type matches spec's assumption, nullability matches spec's handling (`number | null` vs `number` — see `### Known Anti-Patterns` #8 for why nullability mismatches bite).
3. If any confirmation fails, fix the spec or file a structural-work task BEFORE handoff — do not leave discovery to the executor.
4. Cite the grep results in the spec's "Pre-flight" section so the executor knows verification happened.
5. For new field ADDITIONS, also grep consumer directories (`src/components/`, `src/hooks/`) for planned usage — no consumers = candidate sent-but-not-consumed duplication.

**Cross-reference.** Story 92.4-FE retro H-3 (spec cited chart lines sourced from `DailyMetrics.salesCount`/`returnsCount`, which didn't exist at handoff time; caught in review as a structural fix requiring upstream type extension + aggregation change), Epic 91-FE retro "What Didn't Go Well" #2, Story 93.3-FE (spec-grep surfaced that 2 of 3 target sites were already documented → downscoped the story before a single line of code was written — the rule working in the positive direction).

---

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
