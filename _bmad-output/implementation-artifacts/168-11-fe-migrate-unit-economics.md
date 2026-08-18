# 168.11 FE — Migrate Unit Economics (`/analytics/unit-economics`) to shadcn tokens + shared profitability consolidation

- **Status**: Code-complete (uncommitted in worktree, per wave protocol)
- **Branch**: `cdx/epic-168-story-11-unit-economics`
- **Base**: `26508fa4` (origin/main)
- **Worktree**: `/private/tmp/wb-fe-168-11-migrate-unit-economics`

## Acceptance

Layer A: all legacy text sites across the route tree (widened sweep: TableRow 7 incl.
selected-row + delivery-link sites found by widened regex beyond the 4 in the token map,
table-utils 5, SummaryCards 11, Empty 3, Pagination 5 incl. `bg-gray-50` footer, MetricCard 2,
Loading 2) + waterfall sign hex (profit/loss) + recharts axis/reference attrs replaced with
semantic tokens. Layer B (main special duty): profitability badge tokens consolidated into the
SAME token set as the 168.9 legend (SkuTableHeaders) via /15-chip idiom — sku
`PROFITABILITY_COLORS`/`PROFITABILITY_HEX`, lib `PROFITABILITY_STATUS_CONFIG`, and the
UnitEconomics row Badge now share one set; `bgColor` hex field removed (no consumers);
behavior locked everywhere. Targeted vitest only grew (631 → 665); lint/tsc/prettier green.

## Classification

- **Money sign** (margin %, trend) → `financial-positive|negative`; neutral → `muted-foreground` (text) / `foreground` (headline value).
- **Cost thresholds** (CostCell high/med) → `status-error` / `status-warning` — cost overrun is a warning-state, not negative money (per token-map note; NOT a tier-collapse: null/≤med stays `muted-foreground`).
- **Icon chips (operational semantics, 168.8 recipe)** — see decisions table below.
- **Info-box / links / sort-icon** → `status-information` (sort = 168.9 precedent).
- **SVG axes** → `var(--color-border)`; zero reference line → `var(--color-chart-reference)` (168.10 idiom).
- **Waterfall sign** → `var(--color-chart-positive|negative)`.

## Changes (per file, was → became)

| File | Sites | Change |
|---|---|---|
| `types/sku-financials/core.ts` | 12 | `PROFITABILITY_COLORS` → /15-chip set (excellent `bg-financial-positive/15 text-financial-positive`, good `status-information`, warning `status-warning`, critical `status-error`, loss `financial-negative`, unknown `bg-muted text-muted-foreground`); `PROFITABILITY_HEX` → CSS var names. |
| `lib/unit-economics-config.ts` | 16 + del | `PROFITABILITY_STATUS_CONFIG`: color → var, bgClass → /15, textClass → token text; unknown → muted. `bgColor` hex-100 field DELETED everywhere (see decision 2). `icon` emojis kept (decision 3). COST_CATEGORIES 10 hex KEPT (see Gaps). |
| `types/unit-economics/unit-economics-cost-categories.ts` | −1 | `bgColor` removed from `ProfitabilityStatusConfig` interface (no remaining consumers). |
| `lib/unit-economics-utils.ts` | 2 | `transformToWaterfallData`: revenue bar `#22C55E` → `var(--color-chart-positive)` (decision 4); profit ternary → `var(--color-chart-positive|negative)`. Barrel re-exports untouched. |
| `components/UnitEconomicsTableRow.tsx` | 7 | margin `text-green-600`→`text-financial-positive`, `text-red-600`→`text-financial-negative` (mid/null untouched muted); selected row `bg-blue-50 border-l-blue-500` → `bg-status-information/10 border-l-status-information`; delivery link `text-cyan-600 decoration-cyan-300` → `text-status-information decoration-status-information/60` (widened-regex find, semantic: informational disclosure link); Badge → single `getProfitabilityBadgeClasses` /15-chip, **inline style-color REMOVED** (decision 1). |
| `components/unit-economics-table-utils.tsx` | 5 | TrendingUp/Down → `financial-positive|negative`; sort icon `text-blue-500` → `text-status-information` (168.9); CostCell `text-red-600 font-medium` → `text-status-error font-medium`, `text-orange-600` → `text-status-warning`. |
| `components/UnitEconomicsSummaryCards.tsx` | 11 | margin value pos/neg/neutral → `financial-positive|negative|foreground`; 8 iconColor chips per decision table below. |
| `components/UnitEconomicsEmpty.tsx` | 3 | info-box `bg-blue-50`→`bg-status-information/10`; heading `text-blue-900`→`text-status-information`; hints `text-blue-700`→`text-muted-foreground`. |
| `components/UnitEconomicsTablePagination.tsx` | 5 | footer `bg-gray-50`→`bg-muted/50`; `text-gray-500`×2 + `text-gray-600` + «Строк:» → `text-muted-foreground`. |
| `components/UnitEconomicsMetricCard.tsx` | 2 | trend up/down → `financial-positive|negative`. Icon `text-white` on chip kept (contrast on saturated bg). |
| `components/UnitEconomicsLoading.tsx` | 2 | skeleton header/footer `bg-gray-50` → `bg-muted/50`. |
| `components/waterfall-chart-config.ts` | 2 | `profit: #4CAF50` → `var(--color-chart-positive)`; `loss: #F44336` → `var(--color-chart-negative)`. 10 categorical hex KEPT (see Gaps). |
| `components/UnitEconomicsWaterfall.tsx` | 3 | XAxis/YAxis `axisLine stroke '#E5E7EB'` ×2 → `var(--color-border)`; ReferenceLine y=0 → `var(--color-chart-reference)`. |
| `components/UnitEconomicsHeader/Table/WaterfallTooltip`, page/state/config/csv/delivery-utils/useWaterfallData/waterfall-chart-utils | 0 | already clean — untouched. |
| `sku-financials/ProfitabilityBadge.tsx` | 0 | unchanged — auto-inherits /15 chip via `getProfitabilityBadgeClass` (= `PROFITABILITY_COLORS`). |

## Semantic decisions (iconColor chips, 168.8 operational recipe)

| Card | Was | Became | Rationale |
|---|---|---|---|
| Ваша цена | `bg-indigo-500` | `bg-status-information` | neutral informational |
| Выручка | `bg-red-500` | `bg-primary` | key brand metric; revenue NOT negative; legacy red arbitrary. Alt considered: `bg-status-information` — rejected: would make 4 of 8 chips identical. |
| COGS % | `bg-orange-500` | `bg-status-warning` | primary cost driver = cost-risk signal |
| Комиссии WB % | `bg-purple-500` | `bg-status-information` | neutral context class (avoids 2× adjacent warning; COGS keeps warning as THE cost-risk chip) |
| Ср. доставка | `bg-cyan-500` | `bg-status-information` | neutral operational |
| Маржа % | `bg-green-500` | `bg-financial-positive` | margin = money-sign semantics |
| Прибыльные | `bg-emerald-500` | `bg-status-success` | process-success (168.8 «Получено» precedent) |
| Убыточные | `bg-red-500` | `bg-status-error` | process-error; SKU counter, not a money sign (deliberately NOT financial-negative) |

## Key decisions

1. **Row Badge single token set**: replaced `getProfitabilityBgClass + inline style={{color: getProfitabilityColor}}` with `getProfitabilityBadgeClasses(status)` (= `/15` bg + token text). Inline style removed — pinned by a new test (`style === null`).
2. **`bgColor` field DELETED** from `ProfitabilityStatusConfig` (interface + all configs): grep found zero consumers outside `unit-economics-config.test.ts` (the wide `bgColor` grep hits are OTHER configs — supplies/orders/liquidity — untouched).
3. **`icon` emoji field KEPT**: no production consumers found (grep: no `.icon` reads on profitability config), but it is WCAG-positive redundancy data, cheap, and removing it was not authorized as clearly as bgColor — flagged as review-question.
4. **`transformToWaterfallData` revenue bar** `#22C55E` → `var(--color-chart-positive)`: legacy green was the "money-in" color; mapped to the positive chart token (same semantic slot, theme-aware). Note: this utils transform path colors revenue green while `waterfall-chart-config.WATERFALL_COLORS.revenue` is blue `#2196F3` — pre-existing inconsistency, not introduced here (see review-questions).
5. **Pagination/Loading `bg-gray-50`** → `bg-muted/50` (subtle footer surface; matches existing muted-idiom).

## Tests

- UPDATED pins (no weakening — exact-contains kept): `unit-economics-config.test.ts` (sentinel → `var(--color-muted-foreground)`, `bg-muted text-muted-foreground`), `unit-economics-utils.test.ts` (waterfall → exact var names), `unit-economics-table-utils.test.tsx` (5 → new token selectors), `UnitEconomicsSummaryCards.test.tsx` (margin 3-state → `financial-*|foreground`), `UnitEconomicsTableRow.test.tsx` (cyan → `text-status-information`).
- NEW `UnitEconomicsTableRow.test.tsx` describe: margin 2 thresholds + mid-neutral, Badge /15-chips ×3 statuses, no-inline-style pin.
- NEW `UnitEconomicsSummaryCards.test.tsx` describe: 8 icon-chip tokens (`it.each`).
- NEW `UnitEconomicsEmpty.test.tsx`: /10-surface + heading token + muted hints (+ negative legacy assertions).
- NEW `waterfall-chart-config.test.ts`: profit/loss exact var names + categorical-hex-remains guard (anti tier-collapse) + no-collision assertion.
- NEW `src/types/__tests__/sku-financials-profitability-tokens.test.ts`: all 6 statuses pinned for BOTH `PROFITABILITY_COLORS` and `PROFITABILITY_HEX` + no-raw-hex guard.
- `WaterfallTooltip.test.tsx` fixture `fill: '#22C55E'` left as-is: arbitrary tooltip input data, not a source color pin.

## Raw-palette sweep proof (widened)

Regex `(bg|text|border|ring|divide|fill|stroke|outline|from|to)-(red|yellow|blue|…|pink)(-[0-9]{3})?` over
`src/app/(dashboard)/analytics/unit-economics/` (incl. tests), `types/sku-financials/core.ts`,
`lib/unit-economics-config.ts`, `ProfitabilityBadge.tsx` → **0 real hits** (only 3 string-literal
mentions inside negative assertions `not.toContain('bg-blue-50')` in the new Empty test).
Hex sweep over the same + `lib/unit-economics-utils.ts`: only the 10 categorical waterfall
colors (`waterfall-chart-config.ts` lines 15-25) + 10 categorical `COST_CATEGORIES` colors
(`lib/unit-economics-config.ts:142-156`) — both intentional exceptions (see Gaps).

## Gaps / known-limitations

- **Waterfall categorical hex kept** (both `WATERFALL_COLORS` and lib `COST_CATEGORIES`): 13 series on 11 tokens = guaranteed collisions (profit↔advertising, loss↔penalties). Tier-collapse forbidden; hex = known-limitation until a categorical expansion of the chart palette. Pinned by the anti-collapse guard test.

## Post-pass-1 fixes (2026-08-18)

- **MEDIUM (fragile DOM lookup in margin test)**: `marginValueEl` navigated via
  `getByText('Хорошо').closest('td')` — coupled the margin assertion to the badge-status
  fixture. Fixed: column-index navigation `container.querySelectorAll('tbody tr td')[8]`
  (the costs cell renders 5 nested `<td>`s → 10 td total; margin = td[8], badge = td[9]),
  with a content guard (`tds[8].textContent` contains `%`) so a column reshuffle fails
  loudly. Verified 14/14 + prettier.
- LOW-2 (dead exports getProfitabilityColor/BgClass after Row migration) → registered for
  174.x sweep (ledger). LOW-3 (dark-mode visual check of the new warning chip pair) →
  covered by the Wave Contrast Ledger policy. LOW-4 (epic-artifact edit from a route
  story) → intentional wave practice, ownership line included (174.2).

## Post-pass-2 fixes (2026-08-18)

- **HIGH (live e2e pin)**: `e2e/unit-economics.spec.ts:280` selected-row pin
  `/bg-blue-50/` → `/bg-status-information\/10/` (the story changed the class; e2e-pin
  update is the wave-sanctioned surgical exception — one assertion, commented).
- **MEDIUM (dark icon contrast)**: `UnitEconomicsMetricCard` hardcoded `text-white` icon →
  new optional `iconTextColor` prop (default `text-white` preserved for other callers);
  all 8 SummaryCards chips now pass the paired `*-foreground` token
  (status-information/warning/error/success, primary). `bg-financial-positive` (Маржа %)
  has NO foreground pair in globals.css — paired with `text-primary-foreground`
  (white in light → 5.13; 12.9% near-black in dark → 8.00; both ≥3.0 graphical).
  Pass-2 math: legacy white-on-status-* icons in dark were 1.7–2.6 (fail); now all pass.
  Pinned by a NEW SummaryCards it.each block (7 bg + 7 fg + 1 Ваша цена + text-white negative;
  SVG class asserted via getAttribute — jsdom SVG className is SVGAnimatedString).
- **LOW-1 correction**: waterfall categorical hex count is **11** (revenue #2196F3 + 10
  costs), record previously said 10 — corrected here; COST_CATEGORIES = 10 stands.
- **Pass-2 false-negative noted**: atdd-checklist-168.11.md DOES exist at the canonical
  path (verified in worktree); pass-2 searched a wrong path (defect-pattern #22).

## Review-questions

1. `icon` emoji field in `PROFITABILITY_STATUS_CONFIG` — unconsumed in production; kept (WCAG-positive redundancy, removal ambiguous vs instructions). Delete in a later sweep?
2. Pre-existing inconsistency: `transformToWaterfallData` (utils) colors revenue green while `WATERFALL_COLORS.revenue` is blue. Kept respective semantics; not resolved here.
3. «Комиссии WB %» chosen `bg-status-information` (not warning) to avoid double-warning adjacency with COGS — per token-map resolution; confirm visually in dark theme.

## Gates (worktree)

1. Targeted vitest before: **631 passed / 0 failed** (31 files); after fix-iterations: **672 passed / 0 failed** (34 files) — only grew (+41: executor +34, pass-2 icon-pair block +7).
2. `npx eslint <21 changed files> --max-warnings 0` — **exit 0**.
3. `npx tsc --noEmit` — **exit 0**.
4. `npx prettier --check` — **pass** (after one `--write` pass on 3 files).

## External consumers

- `sku-financials/SkuTableHeaders` legend (168.9) — already semantic, now literally the same token set as badges (goal achieved).
- `ProfitabilityBadge.tsx` — unchanged code, inherits new chips automatically.
- e2e specs, `src/components/ui/**`, globals.css, other sku-financials components — untouched.
