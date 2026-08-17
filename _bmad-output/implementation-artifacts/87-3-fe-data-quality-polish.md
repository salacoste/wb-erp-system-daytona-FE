# Story 87.3-FE: Data Quality Polish

Status: ready-for-dev

## Story

**As a** business owner reviewing orders and SKU-level margin analytics,
**I want** prices and COGS-derived metrics to be displayed truthfully (no swapped columns, no misleading "0 ₽" for unknown costs),
**So that** I don't misread a single row and draw the wrong conclusion about a product's profitability.

**Epic**: 87-FE Dashboard Data Quality & Enhancement
**Priority**: P3 (polish — caught during page-validation audit, not a user-reported incident)
**Estimate**: 3 story points (one defensive frontend fix + one backend request + test updates)

---

## Problem Statement

Two issues surfaced during the Epic 87 page-validation audit. They are unrelated in root cause but share the theme "the UI renders a number that doesn't mean what the user thinks it means."

### Issue 1: Orders page — `Цена` and `Цена продажи` appear inverted on specific orders

**Observation** (audit data):

| Order ID    | Цена (price) | Цена продажи (salePrice) | Ratio       |
|-------------|--------------|--------------------------|-------------|
| 4909080943  | 56,08 ₽      | 1 510,94 ₽               | 27x inversion |
| 4906470022  | 56,24 ₽      | 1 515,25 ₽               | 27x inversion |
| (normal)    | 1 462 ₽      | 1 462 ₽                  | 1:1         |

The contract between frontend and backend is unambiguous:

- `test-api/14-orders.http:283-284` — `"price": 1500.00, "salePrice": 1200.00`
- `test-api/14-orders.http:1045-1046` — `"price": "Original price (RUB)"`, `"salePrice": "Sale price after discount (RUB)"`
- `src/types/orders.ts:32-34` — matches backend exactly:
  ```ts
  /** Original price (RUB) */
  price: number
  /** Sale price after discount (RUB) */
  salePrice: number
  ```
- `src/components/custom/orders/OrdersTableRow.tsx:134-137` — renders `order.price` under "Цена" column and `order.salePrice` under "Цена продажи" column, which is correct per contract.

By contract, `salePrice` ≤ `price` should always hold (sale price is price after discount). The audit rows violate this by 27x, which is far too large to be explained by promo mechanics. The two anomalous orders also share a suspiciously round retail value (~1500 ₽) and near-identical low "Цена" (~56 ₽). This fingerprint is consistent with a backend field-mapping bug somewhere between the WB SDK response and the `orders` table — **not** a frontend presentation bug.

**Decision:** Frontend column mapping is correct and will **not** be changed. This is a backend data-quality issue to be tracked via a backend request doc. The frontend change in scope for this story is to add a **defensive anomaly indicator** (a small warning icon + tooltip) when `salePrice > price * 1.2` so future occurrences are visible to the user and to anyone triaging support tickets, without silently "correcting" data that the frontend doesn't own.

### Issue 2: SKU Analytics — 16 cells showing "0 ₽" for products without COGS

**Observation** (audit data): `/analytics/sku` shows 16 cells rendering `0 ₽` across 29 rows. COGS coverage for this cabinet is 75% (44/59 products), so roughly 15 products have no assigned COGS — lining up with the 16 misleading cells.

**Root cause** (confirmed by reading the transform + row components):

- `src/hooks/sku-financials-transform.ts:47-53` converts the backend response with `item.gross_profit ?? 0` and `item.operating_profit ?? 0`. When the backend omits these fields for missing-COGS rows, frontend collapses `null → 0`.
- `src/components/custom/sku-financials/SkuRow.tsx:63-67` correctly shows `"Не назначена"` for the `COGS` column when `item.missingCogs === true`, but the **other cost-derived columns** (`Расходы` via `ExpenseBreakdown`, `Опер. прибыль` via `formatCurrency(item.profit.operating)`, and the `Ср. маржа` summary) do not gate on `missingCogs` and therefore render the zero-fallback as `"0 ₽"`.
- `SummaryFooter.tsx:82-86` sums `item.costs.cogs ?? 0` across all rows, under-reporting total COGS when some rows are missing.

The user sees a row for an unpriced product showing `Прибыль: 0 ₽` — which reads as "broke even" but actually means "cost is unknown, profit undefined." This is a UX/data-integrity bug, not a backend bug.

**Fix:** When `item.missingCogs === true`, display `"—"` (em dash) in cost-derived columns with a tooltip "Нет COGS — прибыль не рассчитана" on hover. Use the existing `ProfitabilityBadge` pattern (`PROFITABILITY_LABELS.unknown = 'Нет COGS'`) for consistency. The row background stays `bg-yellow-50/30` as it is today to preserve the visual signal.

---

## Acceptance Criteria

### AC-1: Orders anomaly indicator (Issue 1 — defensive frontend, backend fix deferred)
- [ ] `OrdersTableRow.tsx` renders a small warning icon (lucide `AlertTriangle`, `text-amber-500`, 14px) next to `Цена продажи` cell when `order.salePrice > order.price * 1.2`.
- [ ] Hovering the icon shows a tooltip in Russian: `Аномалия: цена продажи выше оригинальной цены в N раз. Возможна ошибка данных на стороне WB.` (N = `Math.round(order.salePrice / order.price)`, rounded to 1 decimal).
- [ ] Normal orders (where `salePrice <= price * 1.2`) render exactly as today — no icon, no tooltip, no layout shift.
- [ ] Guard against `price <= 0` (no division by zero): indicator only fires when `price > 0 && salePrice > price * 1.2`.
- [ ] Icon has `aria-label` for screen readers describing the anomaly (same content as tooltip).

### AC-2: Backend request documented (Issue 1 — escalation)
- [ ] New backend-request doc created at `frontend/docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md`, following the existing format (Problem → Root Cause → Impact → Fix Scope → Reproduction → Resolution).
- [ ] Doc includes the two known anomalous order IDs (4909080943, 4906470022) and the observed price/salePrice values.
- [ ] Doc references `src/types/orders.ts:32-34` and `test-api/14-orders.http:1045-1046` to show the contract that backend should honor.

### AC-3: SKU table — replace misleading "0 ₽" with "—" for missing-COGS rows (Issue 2)
- [ ] `SkuRow.tsx` — when `item.missingCogs === true`:
  - `Расходы` column shows `—` (via new `renderMissingCogs()` helper), NOT the expense breakdown tooltip. _Rationale: expenses themselves (logistics, storage) ARE known — but "total operating expenses" implies a completeness the row doesn't have when COGS is missing. Show expenses on hover via a secondary tooltip if needed._
  - Actually, simpler and truer to data: **keep** `Расходы` showing real operating-expense sum (this data IS known from paid-storage + wb_finance), but **Опер. прибыль** cell shows `—` with a "help" cursor and tooltip "Нет COGS — прибыль не рассчитана."
- [ ] The `Опер. прибыль` cell uses the existing `text-gray-400` styling (matches `formatCurrency(null)` output for `—`).
- [ ] The `Маржа` cell (ProfitabilityBadge) already displays the label `"Нет COGS"` via `PROFITABILITY_LABELS.unknown` when `profitabilityStatus === 'unknown'` and `marginPct` is null — verify this path still works and only the `—` behavior for `Опер. прибыль` is added.
- [ ] `SummaryFooter.tsx` — when ANY row in `data` has `missingCogs: true`, append a small footnote under the totals row: `* COGS назначен для X из Y товаров. Прибыль посчитана только по товарам с COGS.` where X = rows with `!missingCogs` and Y = total rows.

### AC-4: SKU transform preserves nullability (Issue 2 — defense in depth)
- [ ] `src/hooks/sku-financials-transform.ts:47-50` — change `item.gross_profit ?? 0` and `item.operating_profit ?? 0` to preserve `null` when backend omits the value (or when `missingCogs` is true). Type `SkuFinancialProfit.gross|operating` in `src/types/sku-financials.ts:143-150` becomes `number | null`.
- [ ] Downstream consumers that read `item.profit.operating` (SummaryFooter totals, sort function) skip `null` rows or coerce via `?? 0` **at the callsite** with a comment explaining why zero is used only for aggregation, not for display.
- [ ] `sortSkuData` in `sku-table-sorting.ts` treats `null` profit as lowest in `desc` sort (or highest in `asc`) — i.e., missing-COGS rows pile at the bottom when sorting by profit, mirroring "unknown" sentinel behavior. Add a unit test.

### AC-5: Tests
- [ ] `OrdersTableRow.test.tsx` — add 3 tests:
  - Normal order (price=1500, salePrice=1200): no warning icon rendered (query by `aria-label` returns null).
  - Anomalous order (price=56, salePrice=1510): warning icon rendered with expected `aria-label` substring.
  - Edge case (price=0, salePrice=100): no warning icon (guard against div-by-zero).
- [ ] `SkuRow.test.tsx` (new if missing) or add to nearest sibling test:
  - Row with `missingCogs: true` renders `—` in Опер. прибыль column, NOT `"0 ₽"`.
  - Row with `missingCogs: false` and `profit.operating = 0` renders `"0 ₽"` (legitimate zero is preserved).
  - Tooltip content includes `"Нет COGS"` substring when warning indicator is hovered.
- [ ] `sku-financials-transform.test.ts` (or equivalent) — backend `gross_profit: null` + `cogs: null` → frontend `profit.gross: null`, `profit.operating: null`, `missingCogs: true`.
- [ ] `SummaryFooter.test.tsx` — when any row has `missingCogs: true`, the footnote `"COGS назначен для X из Y"` renders; when all rows have COGS, footnote is absent.
- [ ] `npm run lint && npm run type-check` pass.
- [ ] Manual verification in Chrome on `/orders` (find anomalous order or mock via DevTools) and `/analytics/sku` (select a week with known missing-COGS products) — take screenshots.

---

## Tasks / Subtasks

### Task 1: Issue 1 — Orders inversion indicator (defensive frontend)

**File:** `src/components/custom/orders/OrdersTableRow.tsx` (currently 192 lines — after this change ~210 lines, so **must extract**).

**Extract first:** Move the existing `ClientInfoCell` (lines 169-192) into a sibling file `src/components/custom/orders/ClientInfoCell.tsx` (it's already logically isolated — Story 86.2 added it). This keeps `OrdersTableRow.tsx` under the 200-line ceiling after adding the new indicator.

**Subtask 1.1 — Extract `ClientInfoCell`:**
- Create `src/components/custom/orders/ClientInfoCell.tsx` with the existing 22-line component.
- Update `OrdersTableRow.tsx:19` import to `import { ClientInfoCell } from './ClientInfoCell'`.
- Delete the inline `ClientInfoCell` function (lines 169-192) from `OrdersTableRow.tsx`.

**Subtask 1.2 — Add inversion helper:**
- In `src/components/custom/orders/OrdersTableRow.tsx` near the top (around line 42, next to `truncateText`), add a pure helper:
  ```ts
  /**
   * Detect anomalous salePrice > price inversion from WB data.
   * Threshold chosen at 1.2x — legitimate price adjustments (e.g., currency rounding,
   * promo stacking) stay under this; observed bad data (order 4909080943) was 27x.
   * See docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md for backend tracking.
   */
  function isPriceInverted(price: number, salePrice: number): boolean {
    return price > 0 && salePrice > price * 1.2
  }
  ```

**Subtask 1.3 — Render indicator in the salePrice cell:**
- Replace line 137 (`<TableCell className="text-right">{formatCurrency(order.salePrice)}</TableCell>`) with a cell that conditionally shows `AlertTriangle` + tooltip.
- Use `Tooltip` + `TooltipProvider` already imported at line 14.
- Icon: `import { AlertTriangle } from 'lucide-react'` (add to existing lucide imports if any, else fresh).

**File:** `src/components/custom/orders/__tests__/OrdersTableRow.test.tsx` (or OrdersTable.test.tsx if row tests live there — confirm during dev)
- Add 3 tests per AC-5.

### Task 2: Issue 1 — Backend request doc

**File (new):** `frontend/docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md`

Template to follow (match `164-META-VERSION-ENDPOINT-FOR-BUILD-VERIFICATION.md` structure):

1. **Problem** — Cite audit finding, orders 4909080943 + 4906470022 with exact observed values.
2. **Root Cause** — Unknown; backend owns the mapping. Two hypotheses to investigate: (a) WB API field swap at SDK boundary, (b) stale DB row from historical bad import.
3. **Impact** — Minority of rows (~2 observed out of ~dozens), but when it hits, users see a 27x inflated sale price.
4. **Reproduction** — `GET /v1/cabinets/:id/orders?nm_id=...&limit=100`; locate orders with `salePrice / price > 10` in the response.
5. **Fix Scope (backend)** — (i) audit the SDK → DB write path for `price` vs `salePrice` field assignment; (ii) add a sanity check in the writer that flags or rejects rows where `salePrice > price * 2`; (iii) one-time backfill to re-fetch and correct affected order IDs.
6. **Resolution** — Pending backend investigation.
7. **Frontend Mitigation** — Link to this story (87-3-FE) which adds a warning icon defensively.

### Task 3: Issue 2 — SKU transform preserves null (defense in depth)

**File:** `src/types/sku-financials.ts`
- **Line 143-150:** Change `SkuFinancialProfit.gross` and `.operating` from `number` to `number | null`. Add JSDoc: `/** Null when COGS is not assigned for this SKU. */`
- `operatingMarginPct` — also `number | null`.

**File:** `src/hooks/sku-financials-transform.ts`
- **Lines 47-51:** Change `?? 0` to `?? null`:
  ```ts
  profit: {
    gross: item.gross_profit ?? null,
    operating: item.operating_profit ?? null,
    operatingMarginPct: item.operating_margin_pct ?? null,
  },
  ```

**File:** `src/components/custom/sku-financials/sku-table-sorting.ts` (check file, update comparator for `operatingProfit` and `operatingMarginPct` to treat `null` as lowest for desc / highest for asc using `Number.NEGATIVE_INFINITY` or similar sentinel).

### Task 4: Issue 2 — SkuRow renders "—" for missing-COGS profit

**File:** `src/components/custom/sku-financials/SkuRow.tsx` (97 lines → ~108 after change, safe).

**Subtask 4.1 — Update Опер. прибыль cell (lines 76-80):**

```tsx
<TableCell className="text-right">
  {item.missingCogs || item.profit.operating === null ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-gray-400 cursor-help">—</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Нет COGS — прибыль не рассчитана</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className={cn('font-medium', getValueColorClass(item.profit.operating))}>
      {formatCurrency(item.profit.operating)}
    </span>
  )}
</TableCell>
```

**Subtask 4.2 — ProfitabilityBadge null handling (sanity check):**
- `ProfitabilityBadge.tsx:28-29` already handles `marginPct !== null ? ... : label` → when margin is null it shows label "Нет COGS" (via `PROFITABILITY_LABELS.unknown`).
- Confirm `profitabilityStatus === 'unknown'` is returned by backend when COGS is missing (spot-check network response). If not, add a defensive mapping in `transformBackendItem`: if `missingCogs && profitabilityStatus !== 'unknown'` → force to `'unknown'`.

### Task 5: Issue 2 — SummaryFooter footnote

**File:** `src/components/custom/sku-financials/SummaryFooter.tsx` (65 lines → ~80 lines, safe).

**Subtask 5.1 — Update `Totals` interface:**
Add `rowsWithCogs: number` and `totalRows: number` fields to the interface in `SummaryFooter.tsx:12-21`.

**Subtask 5.2 — Populate in parent aggregation:**

**File:** `src/components/custom/sku-financials/SkuFinancialsTable.tsx:78-99`:
```ts
const rowsWithCogs = data.filter(item => !item.missingCogs).length
const totalRows = data.length
// ... in the returned object:
return { count: data.length, /* ... */, rowsWithCogs, totalRows }
```

**Subtask 5.3 — Render footnote:**
In `SummaryFooter.tsx` after the totals div (line 62), conditionally render:
```tsx
{totals.rowsWithCogs < totals.totalRows && (
  <p className="text-xs text-amber-700 mt-2">
    ⚠ COGS назначен для {totals.rowsWithCogs} из {totals.totalRows} товаров.
    Прибыль посчитана только по товарам с COGS.
  </p>
)}
```

### Task 6: Tests

**Files:**
- `src/components/custom/orders/__tests__/OrdersTableRow.test.tsx` (or nearest existing test file for OrdersTableRow — verify location; if no dedicated file, add to `OrdersTable.test.tsx`).
- `src/components/custom/sku-financials/__tests__/SkuRow.test.tsx` (NEW file if none exists — check first).
- `src/components/custom/sku-financials/__tests__/SummaryFooter.test.tsx` (NEW if needed).
- `src/hooks/__tests__/sku-financials-transform.test.ts` (NEW or add cases to existing).

Tests per AC-5. Use existing fixtures (`src/test/fixtures/orders.ts` has `mockOrderFbsItem` etc. — extend with `mockOrderFbsItemInverted` if needed).

### Task 7: Manual verification

- [ ] `npm run dev` → visit `/orders`, find anomalous order (use DevTools to mock a response with inverted price if live data unavailable in test env).
- [ ] `/analytics/sku` → select a week with known missing-COGS products; verify `—` renders and footnote appears.
- [ ] Screenshot both fixes, paste into completion notes.

---

## Dev Notes

### Architecture context

**Why the indicator-not-fix approach for Issue 1:** Frontend must never silently transform data it doesn't own. If we swapped `price ↔ salePrice` conditionally on the frontend to "fix" the display, we would (a) break sorting by `sort_by=price` / `sort_by=sale_price` (backend-side), (b) create an inconsistency between list view and detail modal, (c) mask a systemic backend bug that may have corrupted the DB for months. The warning icon is the honest UX: "something is off about this order, and it's not this component's job to fix."

**Threshold choice (1.2x):** Observed bad data was 27x inverted. Legitimate commerce rarely pushes `salePrice` above `price` at all (that would be a markup, not a discount). A 20% buffer protects against rounding / currency edge cases without burying real anomalies.

**Why `null` is better than `0` for missing COGS:** The frontend codebase already treats `null` as "unknown" throughout `SkuFinancialCosts.cogs: number | null`, `formatCurrency(null) = "—"`, `PROFITABILITY_LABELS.unknown = 'Нет COGS'`. This story propagates that same null-as-unknown convention to the downstream profit fields that derive from COGS, closing an inconsistency where the type system lies about what the data means.

**Backend contract reference (SKU):** `frontend/docs/request-backend/64-per-sku-margin-missing-expenses-backend-response.md` documents the canonical Epic-31 response shape. Re-verify during implementation whether backend returns `gross_profit: null` or `gross_profit: 0` when COGS is missing — if it returns `0`, the frontend must gate on `missingCogs` (not on `=== null`) to show `—`. AC-3 and AC-4 together cover both cases (defense in depth).

### Known anti-patterns to avoid

From `.claude/projects/.../memory/MEMORY.md` + CLAUDE.md:

- ❌ No `as any` or `eslint-disable` when bridging types. Use `as unknown as T` if structurally needed.
- ❌ No `mockRejectedValue` — always `mockRejectedValueOnce`.
- ❌ No hard waits in E2E (`page.waitForTimeout`). This story does not add E2E — unit-level only.
- ❌ Don't break the 200-line file-size rule. `OrdersTableRow.tsx` is already at 192 — extract `ClientInfoCell` before adding the indicator (Task 1.1).
- ❌ Don't cast `null` fields with `!` — widen the type and gate at render.
- ✅ Use regex for locale assertions: e.g., `expect(cell).toMatch(/—/)` not exact-string equality when formatted strings are involved.

### File size budget

| File | Current | After change | Status |
|------|---------|--------------|--------|
| OrdersTableRow.tsx | 192 | ~175 (after extracting ClientInfoCell + adding indicator) | ✅ |
| ClientInfoCell.tsx (new) | 0 | ~30 | ✅ |
| SkuRow.tsx | 97 | ~108 | ✅ |
| SummaryFooter.tsx | 65 | ~82 | ✅ |
| sku-financials-transform.ts | 83 | ~85 | ✅ |
| sku-financials.ts | 220 | ~222 | ⚠ near limit — acceptable |
| OrdersTableRow.test.tsx | existing | +~40 lines | TBD |

### Data sources referenced

- Backend orders endpoint: `GET /v1/cabinets/:id/orders` — contract in `test-api/14-orders.http`.
- Backend SKU financials: `GET /v1/analytics/sku-financials` — contract in `frontend/docs/request-backend/64-per-sku-margin-missing-expenses-backend-response.md`.
- Profitability labels source of truth: `src/types/sku-financials.ts:86-93` (`PROFITABILITY_LABELS`).

### Out of scope

- Fixing the backend order price inversion (tracked via request #165, backend team owns).
- Adding an E2E test for the orders indicator (anomalous orders are rare; unit coverage is sufficient for P3).
- Changing the row background for missing-COGS rows — already `bg-yellow-50/30`, visually adequate.
- Changing `Расходы` column rendering for missing-COGS rows — the expenses are real data from paid_storage/wb_finance and should render as-is. Only the `Опер. прибыль` cell is misleading when COGS is unknown.

---

## References

### Code
- `src/components/custom/orders/OrdersTable.tsx` — column headers (`Цена`, `Цена продажи`) at lines 42-49
- `src/components/custom/orders/OrdersTableRow.tsx:134-137` — price/salePrice cell rendering
- `src/types/orders.ts:32-34` — `OrderFbsItem.price` and `.salePrice` contract
- `src/components/custom/sku-financials/SkuRow.tsx:63-80` — COGS / Опер. прибыль cell rendering
- `src/components/custom/sku-financials/sku-table-formatters.ts:9-17` — `formatCurrency(null) → "—"`
- `src/hooks/sku-financials-transform.ts:34-54` — backend → frontend mapping where nullability is currently lost
- `src/types/sku-financials.ts:86-93` — `PROFITABILITY_LABELS.unknown = 'Нет COGS'`
- `src/components/custom/sku-financials/ProfitabilityBadge.tsx:28-29` — existing null-margin handling

### Docs
- `frontend/docs/request-backend/64-per-sku-margin-missing-expenses-backend-response.md` — Epic 31 SKU response contract
- `test-api/14-orders.http:1036-1066` — GET /v1/orders response shape
- `frontend/docs/EPICS-AND-STORIES-TRACKER.md` — Epic 87 tracking
- `frontend/_bmad-output/implementation-artifacts/87-1-fe-dashboard-profit-hierarchy-funnel-limit.md` — sibling story, precedent for P1 fixes in this epic
- `frontend/_bmad-output/implementation-artifacts/87-2-fe-daily-breakdown-table-enhancement.md` — sibling story, precedent for data-quality-oriented AC format

### Backend request (new, created as part of this story)
- `frontend/docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md` — tracks the backend side of Issue 1

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List

### Change Log

### File List
