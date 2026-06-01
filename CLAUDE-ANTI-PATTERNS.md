# CLAUDE-ANTI-PATTERNS.md

Known frontend anti-patterns — extracted from `CLAUDE.md` for size hygiene. Each one is a known footgun: recognize on sight, refuse to write or merge.

> Source pointer in main file: `CLAUDE.md` § "Known Anti-Patterns" (short list of titles + link back here).

---

## Known Anti-Patterns (Captured 2026-04-07 from Epic 86-FE retro)

These patterns were repeatedly hit across recent stories. Each one is a known footgun — recognize them on sight and refuse to write or merge them.

### 1. `beforeEach(() => vi.clearAllMocks())` triggers TS2322

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

### 2. Non-null assertion (`!`) inside async closures

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

### 3. Faking `ApiError` with `Object.assign(new Error(), { status })`

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

### 4. `as any` in mock helpers for complex library types

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

### 5. Variable shadowing in Zustand selectors

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

### 6. Silent E2E test skips that pass green

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

### 7. Hard waits (`page.waitForTimeout(N)`) in E2E specs

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

For navigation cycles use `waitForLoadState('networkidle')` instead of `waitForTimeout` — but see #9 below for the dashboard exception.

### 8. `?? 0` on nullable money/ratio fields lies about the data

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

### 9. `waitForLoadState('networkidle')` on background-polling pages

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

### 10. `formatNumber(opaqueId)` mangles search-key copy-paste

Passing an opaque numeric identifier (nmId, productId, forecastId-as-number, modelId-as-number) through `formatNumber()` inserts Russian-locale non-breaking spaces (` `) as digit-group separators. The rendered string `12 345` looks correct but is NOT copy-paste safe — pasting it into a WB search box or filter field returns no results because the field expects the raw digits `12345`.

```tsx
// ❌ BAD — formatNumber inserts non-breaking spaces; rendered as "12 345"
<TableCell>{formatNumber(entry.nmId)}</TableCell>

// ❌ BAD — same defect via explicit locale option
<TableCell>{entry.nmId.toLocaleString('ru-RU')}</TableCell>
```

```tsx
// ✅ GOOD — String(id) preserves raw digits; rendered as "12345", safe for search-key copy-paste
<TableCell>{String(entry.nmId)}</TableCell>

// ✅ GOOD — alternative explicit conversion
<TableCell>{`${entry.nmId}`}</TableCell>
```

**Scope rule — opaque IDs vs counts/quantities/money:**
- ✅ Opaque numeric identifiers (nmId, productId, forecastId-as-number, modelId-as-number) — always use `String(id)`.
- ✅ Any field described as "article", "WB ID", or "SKU code" in the data model — always `String(id)`.
- ❌ Quantities and counts (`orderCount`, `salesCount`, `units`) — `formatNumber()` is correct.
- ❌ Money values (`revenue`, `profit`, `spend`) — `formatCurrency()` is correct.
- ❌ Percentage / ratio metrics — `formatPercentage()` is correct.

The key diagnostic question: "Would inserting this value into a WB search field (or URL param) be broken by a space character?" If yes → `String(id)`.

See Story 110.3-FE F-8 (canonical finding: nmId column in SearchAnalyticsTable); propagated to Story 110.2-FE EvaluationsTable + Story 110.5-FE CSV export helpers per Story 97.1-FE fix-block propagation discipline.
