# 169.4 FE — Migrate Buyout Analytics (`/analytics/buyout`) to shadcn tokens

- **Status**: done — (was: "Code-complete (uncommitted in worktree, per wave protocol)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch**: `cdx/epic-169-story-4-buyout-shadcn`
- **Base**: `538e48c8` (origin/main)
- **Worktree**: `/private/tmp/wb-repricer-fe-169-4-buyout-shadcn`

## Acceptance

Presentation-only token migration of the buyout analytics route (page orchestrator + summary
widget + daily trend chart + per-SKU table). Chart series moved to valence chart CSS vars,
axis/grid to `var(--color-border)`, tooltip to popover tokens, valence deltas to
financial-* idiom, return-reason triplet to status-* tokens across all three surfaces
(summary bar, table headers, ReasonCell). RTC additions: `TableCaption` naming the table,
`tabular-nums` on numeric value cells. Behavior locked: baseline 105 → **121 passed / 0
failed** (8 → 11 test files, it( only grew).

## Changes (per file, was → became)

| File | Sites | Change |
|---|---|---|
| `components/buyout-daily-trend-config.ts` | 3 | `BUYOUT_TREND_COLORS` hex → `var(--color-chart-positive / -negative / -1)` (valence semantics, single source for Line stroke, legend, tooltip markers); comments rewritten from color names to semantics. |
| `components/BuyoutTrendChart.tsx` | 5 | CartesianGrid stroke + 3× axisLine + XAxis tickLine `#EEEEEE` → `var(--color-border)` (168.11 waterfall precedent). Tick text fill `#757575` ×4 → `var(--color-chart-axis)` (see Gaps). |
| `components/BuyoutDailyTrendTooltip.tsx` | 4 | `border border-gray-200 bg-white` → `border bg-popover`; header `border-b border-gray-200 … text-gray-900` → `border-b … text-foreground`; label `text-gray-600` → `text-muted-foreground` (MarginTrendTooltip canon). Marker colors read from `BUYOUT_TREND_COLORS` — no hex duplication. |
| `components/BuyoutPageContent.tsx` | 1 | h1 `text-3xl … text-gray-900` → `text-2xl font-bold tracking-tight` (169.x canon, foreground inherited). |
| `components/buyout-comparison-utils.ts` | 2 | `getDeltaColor` `text-green-600`/`text-red-600` → `text-financial-positive`/`text-financial-negative` (inversion logic untouched); comment references Epic 169.4. |
| `components/BuyoutDeclinersList.tsx` | 2 | header `text-red-600` and inline delta `text-red-500` → `text-financial-negative`. |
| `components/BuyoutSummarySubComponents.tsx` | 7 | `REASON_COLORS` bg+text pairs → `status-information`/`status-warning`/`status-error` (triplet preserved, comment added); track `bg-gray-100` → `bg-muted`. |
| `components/BuyoutSummaryWidget.tsx` | 4 | bar track `bg-red-100` → `bg-status-error/15`, fill `bg-green-500` → `bg-status-success` (process metric = status, not financial); 2× `text-amber-700` warnings → `text-status-warning`. |
| `components/buyout-table-cells.tsx` | 4 | `TrendIndicator` `text-red-500`/`text-green-500` → financial tokens + `tabular-nums`; `ReasonCell` value cell + `tabular-nums`; ConfidenceBadge medium `bg-gray-100 text-gray-600` → `bg-muted text-muted-foreground`; low `bg-yellow-50 text-yellow-700` → `bg-status-warning/15 text-status-warning` (/15-chip, no border — source had none). |
| `components/buyout-table-columns.tsx` | 10 | 3 reason TableHeads + 3 ReasonCell props → status-triplet text tokens; search-position tiers `text-green-600`→`text-status-success`, `text-yellow-600`→`text-status-warning` (3 tiers preserved — NO tier-collapse); numeric cells (sales, returns, rate, search) `tabular-nums`. |
| `components/BuyoutTable.tsx` | 1 | added `<TableCaption>Выкупы по SKU за период {from} — {to}</TableCaption>` (RTC, 169.1 precedent). Sortable th already keyboard-OK (SortBtn is a native `<button>`, Enter/Space native). |
| `page.tsx`, `BuyoutTrendLegend.tsx` | 0 | untouched (already clean; legend reads colors from config). |

## Token mapping (before → after)

| Legacy | Token | Sites (source) |
|---|---|---|
| `#22C55E` / `#EF4444` / `#3B82F6` | `var(--color-chart-positive)` / `var(--color-chart-negative)` / `var(--color-chart-1)` | 3 (config; consumed by chart/legend/tooltip) |
| `#EEEEEE` (grid + axisLine ×3 + tickLine) | `var(--color-border)` | 5 |
| `border-gray-200 bg-white` (tooltip) | `border bg-popover` | 1 |
| `text-gray-900` / `text-gray-600` / `bg-gray-100` | `text-foreground` / `text-muted-foreground` / `bg-muted` | 5 |
| `text-3xl … text-gray-900` (h1) | `text-2xl font-bold tracking-tight` | 1 |
| `text-green-600` / `text-red-600` / `text-green-500` / `text-red-500` | `text-financial-positive` / `text-financial-negative` | 6 |
| `bg-blue-500 text-blue-600` / `bg-orange-500 text-orange-600` / `bg-red-500 text-red-600` | `bg-status-information text-status-information` / `…-warning` / `…-error` | 8 (REASON_COLORS 6 + TableHead 3 + ReasonCell props 3 = triplet ×3 surfaces) |
| `bg-red-100` / `bg-green-500` | `bg-status-error/15` / `bg-status-success` | 2 |
| `text-amber-700` | `text-status-warning` | 2 |
| `bg-yellow-50 text-yellow-700` | `bg-status-warning/15 text-status-warning` | 1 |
| `text-green-600` / `text-yellow-600` (search tiers) | `text-status-success` / `text-status-warning` | 2 |

Total legacy migration sites (grep-verified): **40** across 10 files.

Методика подсчёта sites: **site = изменённый className/style-экспрешн**; сырых literal-
вхождений legacy-токенов (grep по source-diff: `(text|bg|border)-(blue|orange|red|green|amber|yellow|gray)-[0-9]+`, `#EEEEEE`, `#757575`, chart-hex, `bg-white`) — **47** (≈46 по ревью); sites = 40 (один экспрешн может нести несколько literals, напр. `bg-blue-500 text-blue-600` = 1 site / 2 literals).
Post-migration legacy grep (`(text|bg|border)-(blue|orange|red|green|amber|yellow|gray)-[0-9]` and `#EEEEEE`/`bg-white`/`text-gray-`, excluding tests): **0 hits**.

## RTC additions

- `TableCaption` in `BuyoutTable` (period identity `{from} — {to}`).
- `tabular-nums`: sales/returns counts, buyout-rate cell, ReasonCell values, search-position cell, TrendIndicator delta. No date cells in table — C6 date-tabular sweep out of story scope.
- Sortable th: `aria-sort` already present (ariaSort helper); keyboard = native button (verified).
- null → '—' discipline untouched (AP#8).

## Test changes

- `buyout-comparison-utils.test.ts`: getDeltaColor pins updated to financial tokens (4 strings). 20 → 20 it(.
- `buyout-table-cells.test.tsx`: TrendIndicator up/down pins → financial tokens; ConfidenceBadge medium/low pins → muted / status-warning-15-chip; ReasonCell prop colors updated to token strings. 28 → 28 it(.
- `BuyoutSummaryWidget.test.tsx`: bar selector `.bg-green-500` → `.bg-status-success`; NEW status-token bar pin (fill + `bg-status-error/15` track). 15 → 16 it(.
- `BuyoutTable.test.tsx`: +3 it( — TableCaption presence + period identity; status-triplet header pins; tabular-nums cell count (exact pin 11, fix-итерация). 12 → 15 it(.
- NEW `buyout-daily-trend-config.test.ts` (5 it(): 3 var-name pins + no-hex guard + series-uses-config pin).
- NEW `BuyoutDailyTrendTooltip.test.tsx` (4 it(: inactive-null, bg-popover + no-bg-white dark-safety, text-foreground header, muted labels).
- NEW `BuyoutSummarySubComponents.test.tsx` (3 it(: triplet bg pins on segments, matching text tokens on legend labels, muted track pin).

Targeted suite: baseline 8 files / **105 passed / 0 failed** → 11 files / **121 passed / 0 failed**
(+16 it(, 0 dropped). All pins exact (`classList.contains` / `toHaveClass`); no `[class*=]` added.

Методика targeted-чисел: vitest-фильтр `"src/app/(dashboard)/analytics/buyout"` матчит и
sibling `buyout-reconciliation/**` (3 файла / 23 теста, НЕ изменялись) — поэтому 11 файлов /
121; owned-дерево buyout = 5 → 8 файлов, 82 → 98 тестов. Дельта +16 неизменна.

## Gaps

- tick fill `#757575` ×4 → `var(--color-chart-axis)` — первый консюмер токена (осознанное
  решение оркестратора; waterfall 168.11 fill не задаёт — прецедента не было).
- `BuyoutDeclinersList` header now uses `text-financial-negative` (was `text-red-600`) per
  valence mapping — the section is "declining buyout" = bad, consistent.
- Contrast (review P1): /15-chip `text-status-warning` на `bg-status-warning/15` — light = 3.97
  < AA 4.5 (dark 9.53 PASS) — KNOWN foundation-owned contrast-эскалация, консолидация в 174.2;
  остальные пары PASS в обеих темах (5.13–13.38), средний контраст улучшен против legacy.
- Caption-даты отформатированы `formatDate` (ru-RU, DD.MM.YYYY) по findingу P1-M1; `TableCaption`
  = волна-идиома RTC (169.1 precedent), не scope creep (ревью-вопрос решён оркестратором).

## Verification

- `npx vitest run "src/app/(dashboard)/analytics/buyout"` → 11 files / **121 passed / 0 failed**.
- Legacy grep (source, excl. tests): **0 hits**.
- eslint on the buyout tree: clean (0 problems). Source files ≤200 lines (max: BuyoutTrendChart 180).
- No `as any` added; no query-keys/URL/formatting/hooks/copy/sort/pagination/CSV changes.
- tsc-гейт MAIN-сессии поймал неполный mock-payload (DailyBuyoutPoint.requires returnsCount) — дополнен returnsCount: 26; targeted 121/0, tsc 0.
