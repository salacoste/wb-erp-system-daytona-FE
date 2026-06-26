# Implementation ТЗ — UX Rework (consolidated work-order)

> **Single source of truth for the implementation loop.** Approved 2026-06-26.
> Merges [`persona-dashboard-rework-spec.md`](./persona-dashboard-rework-spec.md) (7 stories)
> + [`readability-audit-spec.md`](./readability-audit-spec.md) (P0/P1/P2) into one ordered, executable backlog.
> **Loop protocol:** each fire → pick the lowest-ID `[ ]` item whose deps are `[x]` → implement → gate → merge → mark `[x]`.
>
**Status legend:** `[ ]` pending · `[~]` in-progress · `[x]` shipped · `[⛔]` blocked (see Progress log)

---

## Global constraints (every item — from `frontend/CLAUDE.md`)

- **Files <200 lines** (extract at ~150). Test/fixture ≤800.
- **No `any`, no `as` casts** — widen types with `?:` / `?? fallback`.
- **Boundary normalizers** for any backend data; raw backend shapes never reach components.
- **`formatPercentage`** for all `%` rendering (Russian locale: `15,5 %`); dot-locale gate baseline = 4.
- **Two-pass fresh-context code-review** for behavior-changing code (runtime logic, normalizers, contracts, test assertions).
- **Gates (all must pass baseline before merge):**
  - `npm run type-check` → 0 errors
  - `npx eslint 'src/**/*.{ts,tsx}'` → 0 errors, 0 warnings
  - `npm test -- --run` → ≥ **16788** passing, 0 failed
  - `bash scripts/check-locale-percent.sh` → 4 (== baseline)
  - `bash scripts/check-doc-citations.sh` → exit 0 (100 broken == baseline)
  - `bash scripts/check-eslint-rules.sh` → OK
- **Git:** one item = one branch `fix/tz-<ID>-<slug>` → commit → `merge --no-ff` to `main` → `push origin main`. No bundling.
- **Visual-verify** via `playwright-cli -s=wb-repricer` (reopen `http://localhost:3100/login --persistent` + login `test@test.com`/`Russia23!` if closed).
- **No `TODO`** in shipped code; `PENDING BACKEND:` with a `docs/request-backend/*.md` link if backend-blocked.

---

## Phase 0 — Prerequisite

### `[x]` TZ-0 · Add Operations Manager persona to the spec
- **Scope:** document the 3rd persona (approved) in `docs/front-end-spec.md:19-49` — profile, goals, pain points, usage pattern (operational: stock/fulfillment/returns/storage; daily).
- **AC:** `front-end-spec.md` lists 3 personas (Owner primary, CFO secondary, **Operations Manager**); roles mapping note added (Ops persona ↔ operational dashboards).
- **Files:** `docs/front-end-spec.md`.
- **Gates:** docs citation gate still exit 0.

---

## Phase 1 — Dashboard rework (persona spec)

> Reference for depth: `persona-dashboard-rework-spec.md` (§4 changes, §5 wireframes, §6 section→tier map).
> Render tree: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` (lines 47-168); data: `useDashboardData.ts`.

### `[ ]` TZ-1 · Status strip — 8 banners → 1 expandable  〔Story 2 · lowest risk · DO FIRST〕
- **Depends:** none.
- **Scope:** new `DashboardStatusStrip` component. Collects the active alerts from `DashboardContent.tsx:69-85` (`IncompleteWeekBanner`, `ReportPendingBanner`, `ProcessingAlert`, `FailedAlert`, `DataGapsAlert`, `ErrorAlert`, `TaxWarningBanner`, `MissingCogsAlert`) → renders ONE slim line: severity icon + count ("⚠ N items need attention") + expand toggle. Expanded: each active alert's message + its CTA. **Preserve `MissingCogsAlert`'s Assign-COGS CTA + `canManageOperationalData` gate.** Severity order: Failed > Error > Processing > DataGaps > MissingCogs > Tax > IncompleteWeek > ReportPending.
- **AC:** dashboard shows ≤1 status line above the hero when multiple alerts active; all alert CTAs reachable via expand; no alert content lost; keyboard-operable expand.
- **Files:** new `DashboardStatusStrip.tsx` (+extract sub-components if >200 lines); edit `DashboardContent.tsx`.
- **Gates:** full + a11y (expand button keyboard-operable, `aria-expanded`).

### `[ ]` TZ-2 · Profit-waterfall card — 6 profit cards → 1  〔Story 3〕
- **Depends:** none (independent density win).
- **Scope:** merge `NetProfitCard` + `GrossProfitCard` + `OperatingProfitCard` + `GrossMarginCard` + `MarginCard` + `TaxCard` (`DashboardMetricsGridCards`/`DashboardProfitDetailCards`) into ONE expandable `ProfitWaterfallCard`: collapsed = lead metric (Net profit, large); expanded = chain `Revenue → −COGS → Gross → −Logistics/Storage/Commissions → Operating → −Tax → Net`. Preserve the existing net-profit anomaly indicator (amber `AlertTriangle` when inconsistent — `isNetProfitConsistent()`).
- **AC:** 6 cards → 1 (expandable); chain renders with correct signs; anomaly indicator preserved; no metric lost (all 6 values reachable).
- **Files:** new `ProfitWaterfallCard.tsx`; edit `DashboardMetricsGridCards.tsx`; retire the 6 individual cards from the grid.
- **Gates:** full + unit tests for the waterfall math (revenue→net chain).

### `[ ]` TZ-3 · Sales-by-price-level card — 4 cards → 1  〔Story 4〕
- **Depends:** none.
- **Scope:** group the 4 near-identical cards (`Заказы РРЦ`, `Заказы со скидкой`, `Выкупы`, `Продажи розница` — `simpleCardConfigs.ts`) into one `SalesByPriceLevelCard` with labelled sub-rows. Each sub-row keeps its distinct meaning (see the pricing-scale note `simpleCardConfigs.ts:1-9` — `saleGross ≠ wbSalesGross − wbReturnsGross`).
- **AC:** 4 cards → 1; each price level labelled inline (no tooltip needed to distinguish); values correct.
- **Files:** new `SalesByPriceLevelCard.tsx`; edit `simpleCardConfigs.ts` / `DashboardMetricsGridCards.tsx`.
- **Gates:** full.

### `[ ]` TZ-4 · Persona context — role→preset + persisted override  〔Story 1 · keystone〕
- **Depends:** none (enabling infra; visible payoff in TZ-5).
- **Scope:** extend `useDashboardWidgetsStore` (the existing 14-widget visibility model) with **persona presets** (Owner/Ops/CFO), each = a visibility+ordering config. Default from role: `Owner|Manager→Owner`, `Analyst→CFO`, `Service→CFO`; user-overridable via a persona selector in the header; persisted (localStorage, like the existing widget store). No visual metric change yet (wiring only).
- **AC:** selecting a persona changes the widget-visibility preset; persisted across reload; role default applied on first load.
- **Files:** `dashboardWidgetsStore.ts`; new persona-preset module; header persona selector component.
- **Gates:** full + store unit tests (preset application, persistence, role default).

### `[ ]` TZ-5 · Hero declutter + persona KPI sets  〔Story 5 · the visible payoff〕
- **Depends:** TZ-1, TZ-2, TZ-3, TZ-4.
- **Scope:** restructure `DashboardMetricsGrid` into the 3-tier layout (hero/operational/analytical) with persona KPI sets from the spec §4C table (Owner: NetProfit+Revenue+Margin+Orders+COGS%; Ops: StockHealth+Orders+Fulfillment+Returns+Storage; CFO: NetProfit+Operating+GrossMargin+Revenue+Payout). Hero ≤6 KPIs, lead metric largest.
- **AC:** each persona shows ≤6 hero KPIs with its lead metric largest; Tier-2/3 sections in correct order; hero visible above fold with no banner stack (TZ-1).
- **Files:** `DashboardContent.tsx`, `DashboardMetricsGrid.tsx`, `DashboardMetricsGridCards.tsx`.
- **Gates:** full + visual-verify per persona (3 screenshots).

### `[ ]` TZ-6 · Tier-3 collapsible analytical + COGS de-dup  〔Story 6〕
- **Depends:** TZ-5.
- **Scope:** (a) collapse `ExpenseChart`, `ExpenseStructurePieChart`, `UnitEconomicsSection`, `OrdersSeasonalPatterns`, `TrendGraph`, `HistoricalTrendsSection` into a Tier-3 "Analytical" disclosure (lazy, collapsed by default; CFO preset may open some). (b) COGS de-dup: `CogsCoverageMetricCard` = single canonical indicator; fold `MissingCogsAlert` CTA into it; **remove** standalone `InitialDataSummary` (duplicate).
- **AC:** Tier-3 sections collapsed+lazy by default; COGS coverage shown in exactly 1 place; `InitialDataSummary` removed.
- **Files:** `DashboardContent.tsx`; extract a `AnalyticalDisclosure.tsx`.
- **Gates:** full + visual (collapsed default, expand works).

### `[ ]` TZ-7 · Dashboard visual + a11y pass  〔Story 7〕
- **Depends:** TZ-1..TZ-6.
- **Scope:** final pass — consistent spacing, heading outline (`h1`→`h2` per section), focus states, persona-selector a11y, color contrast (WCAG AA). Fix anything the rework surfaced.
- **AC:** axe-core 0 violations on `/dashboard`; keyboard-navigable; 3 persona screenshots in the Progress log.
- **Files:** dashboard components as needed.
- **Gates:** full + axe.

---

## Phase 2 — Readability P0 (cross-cutting)

### `[ ]` TZ-8 · Sub-12px text — per-site verify + promote  〔P0-3〕
- **Depends:** none.
- **Scope:** 12 remaining `text-[10px]`/`text-[11px]` sites — per-site visual verify; promote standalone annotations → `text-xs`; for fixed-height badges (`h-4`) widen to `h-5` **or** keep small + add hover tooltip. Do NOT blanket-promote (breaks dense layouts).
- **Sites:** `monitoring/components/{HealthHistoryChart,PipelineHeatmap,HealthReportSheetBody}`, `price-calculator/{WarehouseTariffsByBoxType,CoefficientCalendarCells}`, `SidebarCabinetInfo`, `ProductTableRow`, `DataAvailabilityBadge`.
- **AC:** no body-adjacent text <12px without a tooltip; no layout break (visual-verify each).
- **Gates:** full + per-site visual.

### `[ ]` TZ-9 · Heading-hierarchy standardization across analytics pages  〔P0-4〕
- **Depends:** none.
- **Scope:** adopt one convention — `h1` (page title, exactly 1) → `h2` (section; sr-only ok if a visible CardTitle exists) → `h3` only for real sub-sections. Audit each `/analytics/*` page; fix skips/levels. (FE-4/5 fixed the worst; standardize the rest.)
- **AC:** every analytics page passes a heading-order audit (no skips h1→h3+); consistent pattern.
- **Files:** per-page `*PageHeader`/containers.
- **Gates:** full.

---

## Phase 3 — Readability P1 (page-specific)

### `[ ]` TZ-10 · Wide-table column-priority  〔P1-1〕
- **Depends:** none (FE-6 scroll/sticky already shipped).
- **Scope:** per wide table, define primary columns (identifier + 3–4 key metrics) that stay visible; secondary columns hide below a breakpoint (CSS `nth-child` responsive) instead of forcing horizontal scroll. `/analytics/advertising` (12-col), `/unit-economics` (10-col), `/sku` (9-col).
- **AC:** on narrow viewports, key columns visible without scroll; secondary columns accessible via scroll/expand.
- **Gates:** full + responsive visual.

### `[ ]` TZ-11 · forecast-accuracy MAPE gating — verify  〔P1-2〕
- **Depends:** none.
- **Scope:** verify `/analytics/forecast-accuracy` (`AccuracyMetricsCards.tsx`): when `mapeValid === false`, MAPE card renders muted + "contaminated by small-actual SKUs" note; avgMAE is the headline. If already correct (BE-7+FE-9), close as no-op with evidence.
- **AC:** MAPE demoted/gated when `mapeValid=false`; avgMAE leads. (No-op if already correct — verify, don't assume.)
- **Gates:** full.

### `[ ]` TZ-12 · liquidity "0,0 %" misframe  〔P1-3〕
- **Depends:** none.
- **Scope:** `/analytics/liquidity` — when a category has stock but zero sales in-period, hero headline should read "Нет продаж за период" (neutral), not "0,0 %". (Distinguish "no sales yet" from "0% performance".)
- **AC:** zero-sale categories show neutral framing, not alarming 0%.
- **Files:** liquidity category hero component.
- **Gates:** full.

### `[ ]` TZ-13 · Settings layout consistency  〔P1-4〕
- **Depends:** TZ-1 (status-strip pattern).
- **Scope:** unify `/settings/*` under a consistent layout (2-col nav rail + content); consolidate `/settings/cabinet` alerts via the status-strip pattern.
- **AC:** settings pages share one layout shell; cabinet alerts consolidated.
- **Gates:** full + visual.

### `[ ]` TZ-14 · Empty-states vs errors distinction  〔P1-5〕
- **Depends:** none.
- **Scope:** distinguish "no data yet" (neutral empty-state + CTA) from "failed to load" (error styling + retry). Consistent empty-state component. `/shipments/*`, `/cogs/history`, `/analytics/{search,cross-reference,gaps,alerts}`.
- **AC:** empty-data renders neutral+CTA; failures render error+retry; no empty-state reads as an error.
- **Gates:** full.

---

## Phase 4 — Readability P2 (polish)

### `[ ]` TZ-15 · Compact number mode  〔P2-1〕
- Summary currency columns: compact (`1,23 М ₽`) in summary views, full precision on hover/detail.

### `[ ]` TZ-16 · Color-as-sole-indicator → sign/icon  〔P2-2 · WCAG 1.4.1〕
- Profit/loss tables signal by color only → add `+`/`−` sign or icon. `MarginBy*Table`, `SkuFinancialsTable`.

### `[ ]` TZ-17 · Tooltip-reliance → inline micro-labels  〔P2-3〕
- Cards distinguishable only by tooltip → inline micro-labels; tooltip as supplement.

### `[ ]` TZ-18 · Loading-pattern consistency  〔P2-4〕
- Standardise skeletons (above-fold) vs toast (background refresh); remove mixed patterns.

(P2 items: brief scope — expand into full AC when picked up.)

---

## Progress log

_(loop appends one dated line per shipped item: `TZ-N — what shipped · gates result · commit hash`)_

- **2026-06-26** — ТЗ created (approved direction). All Phase 0-4 items `[ ]`. Prior FE work (16 findings + polish round 2 + FE-16 fix + sticky-columns) already on `main`.
- **2026-06-26** — **TZ-0 shipped.** Added Operations Manager (3rd persona) + role→persona mapping note to `docs/front-end-spec.md` (personas section + Document Change Log v1.1). Docs-only. Gates: `check-doc-citations` exit 0 (broken 100 == baseline, unchanged). Commit `de08ef88` + merge `6dd282ba` on `main`; pushed `origin/main`.
