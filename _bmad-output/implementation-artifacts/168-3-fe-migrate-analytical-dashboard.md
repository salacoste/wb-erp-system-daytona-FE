# Story 168.3 — Migrate Analytical Dashboard `/analytics/dashboard`

- **Status:** review (awaiting orchestrator commit/PR)
- **Branch / worktree:** `cdx/epic-168-story-3-analytics-dashboard` @ `/private/tmp/wb-fe-168-3-migrate-analytical-dashboard`
- **Base SHA:** `166e5451` (= FE origin/main)
- **Acceptance criterion:** Given complete, partial, pending, or failed sections when migrated to shadcn semantic tokens then metrics, periods, availability, top rankings, P&L, navigation, and recovery remain correct and one failed section does not hide valid evidence — only presentation tokens change.

## Behavior-Lock Inventory (pre-flight)

Targeted baselines (all green, pre-edit):

- `npx vitest run "src/app/(dashboard)/analytics/dashboard"` → **23 passed**
- `npx vitest run "src/components/custom/pnl-waterfall"` → **20 passed**
- `PnLWaterfall.zeroMargin + TopProductsTable + TopBrandsTable tests` → **61 passed**

Total baseline: **104 tests**. Locked (untouched semantics): `usePnLCalculations`, `pnl-formatters`, `dashboard-period-coverage`, all props/query contracts, Russian labels/section titles ('5. Ключевые метрики' etc.), formulas text, tooltip copy, section order, testids, table columns, h1 'Сводка по кабинету', period selector, Suspense/loading structure, month-coverage notice.

## Changes

| File | Change |
|---|---|
| `analytics/dashboard/page.tsx` | h1 `text-gray-900` → `text-foreground` (×3 branches — story said ×2, actual count is 3: error, empty, success; all migrated). |
| `analytics/dashboard/loading.tsx` | stat tiles `bg-gray-50` → `bg-muted` (theme-aware skeleton tiles). |
| `pnl-waterfall/PnLRow.tsx` | Total row `bg-slate-100 border-2 border-slate-300` → `bg-muted border-2 border-border`; subtotal `bg-slate-50 border-slate-200` → `bg-muted/50 border-border`; highlight bgs → `bg-financial-positive/10` / `bg-financial-negative/10` / `bg-status-warning/10`; value `text-red-600`/`text-green-600`/`-700` → `text-financial-negative`/`text-financial-positive`; labels `text-slate-900/700/600` → `text-foreground`/`text-muted-foreground`; tooltip formula chip `bg-slate-100` → `bg-muted`; positive pct `text-green-600` → `text-financial-positive`. |
| `pnl-waterfall/KeyMetricsSection.tsx` | ROI `blue-*` → `bg-status-information/10 border-status-information/20 text-status-information` (icon too); profit/unit `green-*` → `bg-financial-positive/10 border-financial-positive/20 text-financial-positive`; units `purple-*` → `bg-primary/10 border-primary/20 text-primary`; dormant `amber-*` → `status-warning` equivalents; 'Норма: >50%' `text-green-600` → `text-financial-positive`; formula chips → `bg-muted`. |
| `pnl-waterfall/GrossProfitSection.tsx` | Trend icons/values green/red/amber → `text-financial-positive`/`text-financial-negative`/`text-status-warning`; delta badge `bg-*-100 text-*-800` → `/15` tint + base token; margin indicator container `bg-slate-50` → `bg-muted/50`; COGS-coverage warning → `bg-status-warning/10 border-status-warning/20`, title/icon/pct `text-status-warning`, body `text-foreground`, track `bg-status-warning/20`, fill `bg-status-warning`. |
| `pnl-waterfall/PayoutSection.tsx` | Note `bg-blue-50` → `bg-status-information/10`, icon → `text-status-information`, strong `text-slate-700`/`text-green-700` → `text-foreground`/`text-financial-positive`. |
| `pnl-waterfall/PnLSectionHeader.tsx` | `border-slate-300` → `border-border`; title `text-slate-800` → `text-foreground`; calculator icon `text-blue-500 hover:text-blue-700` → `text-primary hover:text-primary/80`; formula chip → `bg-muted`. |
| `top-products/TopProductsTableRow.tsx` | Row hover `hover:bg-gray-50` → `hover:bg-muted/50`; profit `text-green-600/text-red-600` → `text-financial-positive/text-financial-negative`; **local semantic 4-tier `getMarginColor`** (null→`text-muted-foreground`, ≥30→`text-financial-positive`, ≥15→`text-status-warning`, ≥0→`text-status-warning/80`, <0→`text-financial-negative`; post-pass-1 fix) replaces the shared `top-table-utils.getMarginColor` import — thresholds unchanged. The shared util is legacy-palette AND consumed by `dashboard/MarginCard`/`GrossMarginCard` (172.1 surface) → not editable here; local mapping keeps this story's owned tree legacy-free without touching the forbidden shared file. |
| `top-brands/TopBrandsTableRow.tsx` | Same migration as the products row (hover, profit colors, local semantic `getMarginColor`). |
| `pnl-waterfall/__tests__/semantic-tokens.test.tsx` | NEW direct test file (no prior render coverage existed for these sections): 8 tests — PnLRow positive/negative/total tokens, PnLRow legacy-palette DOM guard (all row variants + tooltip), KeyMetrics ROI `bg-status-information/10` + `text-status-information`, KeyMetrics DOM guard (all four cards incl. dormant-SKU card), GrossProfit coverage-warning `bg-status-warning/10` + `text-status-warning`. 168.2 pin style: exact `classList.contains` only. |
| `__tests__/TopProductsTable.test.tsx` | +1 legacy-palette DOM guard; 3 legacy color-coding pins flipped to semantic tokens (`text-financial-positive`/`text-financial-negative`). |
| `__tests__/TopBrandsTable.test.tsx` | +1 legacy-palette DOM guard; 3 legacy color-coding pins flipped to semantic tokens. |

**Forbidden files untouched:** `src/app/(dashboard)/dashboard/**` (business route), `src/components/custom/dashboard/**`, `top-table-utils.ts` (shared, 172.1), hooks/lib/types/ui.

## Token mapping table (old → new)

| Legacy | Semantic |
|---|---|
| `text-gray-900` (h1) | `text-foreground` |
| `bg-gray-50` / `hover:bg-gray-50` | `bg-muted` / `hover:bg-muted/50` |
| `bg-slate-100`, `bg-slate-100 p-1 rounded` (chips) | `bg-muted` |
| `bg-slate-50` | `bg-muted/50` |
| `border-slate-300` / `border-slate-200` | `border-border` |
| `text-slate-900` / `text-slate-800` / `text-slate-700` | `text-foreground` |
| `text-slate-600` | `text-muted-foreground` |
| `bg-green-50` / `bg-red-50` / `bg-amber-50` (row highlight) | `bg-financial-positive/10` / `bg-financial-negative/10` / `bg-status-warning/10` |
| `text-green-600` / `text-green-700` | `text-financial-positive` |
| `text-red-600` / `text-red-700` | `text-financial-negative` |
| `text-amber-600` / `text-amber-700` / `text-amber-800` | `text-status-warning` (body copy → `text-foreground`) |
| `bg-green-100 text-green-800` (badge) | `bg-financial-positive/15 text-financial-positive` |
| `bg-amber-100 text-amber-800` | `bg-status-warning/15 text-status-warning` |
| `bg-red-100 text-red-800` | `bg-financial-negative/15 text-financial-negative` |
| `bg-amber-50 border-amber-200` (coverage warn) | `bg-status-warning/10 border-status-warning/20` |
| `bg-amber-200` (track) / `bg-amber-500` (fill) | `bg-status-warning/20` / `bg-status-warning` |
| `bg-blue-50 border-blue-100 text-blue-700/400` | `bg-status-information/10 border-status-information/20 text-status-information` |
| `text-blue-500 hover:text-blue-700` (calc icon) | `text-primary hover:text-primary/80` |
| `bg-purple-50 border-purple-100 text-purple-700` | `bg-primary/10 border-primary/20 text-primary` (purple has no status token — primary is the neutral-brand accent per plan) |
| margin tone: `text-gray-400/green-600/yellow-600/orange-500/red-600` | `text-muted-foreground` / `text-financial-positive` / `text-status-warning` (≥15) / `text-status-warning/80` (≥0, weaker-intensity tier; post-pass-1 4-tier fix) / `text-financial-negative` (<0) |

## Gates (worktree, Node 24.18.0)

- Targeted vitest (route + pnl-waterfall + top-products + top-brands + 3 root test files): **13 files / 135 passed / 0 failed** (baseline 104 → +31; count only grew) — pre-pass-1 count; post-pass-1-fix FINAL: **13 files / 180 passed / 0 failed** (main-session verified; includes +4 tier pins)
- `npm run lint` → exit 0 (0 errors 0 warnings)
- `npm run type-check` → exit 0
- `npm run check:max-lines` → OK (source 200, test 800)
- `npx prettier --check` on all touched files → all pass
- Full vitest / next build / e2e: intentionally NOT run (main session owns)

## Gaps / escalations

1. `top-table-utils.ts` `getMarginColor` remains legacy-palette (shared with `dashboard/MarginCard` + `GrossMarginCard` = 172.1's surface). Routed per plan: this story uses local semantic mappings in its owned rows; 172.1 should migrate the shared util and its dashboard consumers.
2. Story prompt said h1 `text-gray-900` ×2 — actual ×3 (error/empty/success branches); all three migrated.
3. `bg-status-warning/15` badge + `text-status-warning` on tint: warning token is a dark amber in light theme, reads as accent-on-tint (no dedicated warning-foreground text class used — matches 168.2 precedent of base-token-on-tint).

## Lessons

_(placeholder — filled at review)_

## Change Log

- **2026-08-18 — review pass-1 fixes (verdict APPROVE w/ findings)**: (1) MEDIUM — restored 4-tier margin semantics in both local `getMarginColor` copies (`top-products/TopProductsTableRow.tsx`, `top-brands/TopBrandsTableRow.tsx`): null→`text-muted-foreground`, ≥30→`text-financial-positive`, ≥15→`text-status-warning`, ≥0→`text-status-warning/80` (weaker-intensity same-hue tier), <0→`text-financial-negative`; comment block updated + `TODO(172.1)` cross-ref for shared-util migration/dedupe. (2) LOW — pinned the changed tiers in `__tests__/TopProductsTable.test.tsx` / `__tests__/TopBrandsTable.test.tsx`: new assertions for 20%→`text-status-warning`, 5% (new fixture rows)→`text-status-warning/80` (exact string verified in jsdom classList), and dedicated null-margin renders→`text-muted-foreground`. (3) LOW — PnLRow subtotal `bg-muted/50`→`bg-accent/50` (distinct from card bg in both themes; `--color-accent` verified in globals.css:16). Gates re-run: targeted vitest 9 files / 115 passed / 0 failed (subset of baseline scope incl. +4 new pins), lint 0/0, type-check 0, prettier all pass. The two `getMarginColor` copies are byte-identical (diff-verified).
