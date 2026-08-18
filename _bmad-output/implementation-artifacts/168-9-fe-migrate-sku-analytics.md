# 168.9 FE — Migrate SKU Analytics (`/analytics/sku`) to shadcn tokens

- **Status**: Code-complete (uncommitted in worktree, per wave protocol)
- **Branch**: `cdx/epic-168-story-9-sku`
- **Base**: `64472bec` (origin/main)
- **Worktree**: `/private/tmp/wb-fe-168-9-migrate-sku-analytics`

## Acceptance (from plan `.omx/plans/168.9-migrate-sku-analytics.md`)

All 86 legacy palette sites across 8 owned files replaced with semantic tokens; behavior
locked (labels, values, symbols, branching, all `border-2` / `border-t-2` weight preserved);
shared components untouched; targeted vitest green; lint/type-check/prettier gates green.

## Changes (per file, with site counts)

| File | Sites | Change |
|---|---|---|
| `components/CashflowRowPrimitives.tsx` | 24 | `ROW_STYLES` → financial-pos/neg `/10` bg + `/30` border, labels → `text-foreground`; `PctBadge` default → `financial-negative/15` chip, isRemaining → `bg-muted text-muted-foreground`; `CashflowRow` badge → `financial-positive/15`; `GrossProfitRow` blue → `status-information/10` bg + `/30` border (border-2 kept), neg branch → financial-negative; `NetProfitRow` → `financial-*/10` bg + `/40` border (border-2 kept), `/15` badges. |
| `components/SkuCashflowSection.tsx` | 12 | Card gradient → `from-status-information/10 to-status-warning/10` + `border-status-information/30`; title/desc → foreground/muted; empty-state → muted; Net-Sales badge → `bg-muted`; amber divider/labels → `status-warning` (`border-t-2` kept); ИТОГО row → `status-warning/15` bg + `/40` border, nested badge **/20** (comment pinned). |
| `components/CashflowExpenseGrid.tsx` | 10 | Amber hierarchy 800>600>500 → `foreground > status-warning > status-warning/80`; cell `/10` bg + `/30` border; storage divergence state → `/20` bg + `/50` border (2 visual states preserved); report-comparison line → muted/border; diff-sign ± → financial-negative/positive. |
| `components/SkuTableSection.tsx` | 9 | Empty state → `border-border bg-muted/50` + muted text; HelpCard → `status-information/30` border + `/10` bg, title/body → foreground, paragraphs → muted. |
| `components/SkuPageAlerts.tsx` | 11 | Both Alerts → `status-information/30` + `/10` bg; icons → `text-status-information`; texts → foreground (body) / muted (hint); clear Button → `text-status-information hover:bg-status-information/10`; PeriodLabel → `bg-status-information/10` + muted text. |
| `components/SkuFilterSection.tsx` | 15 | gray scale → foreground/muted; TrendingUp → `financial-positive`; «С себестоимостью» → `status-success`; «Без себестоимости» → `status-warning`; «Охват» → `status-information`. |
| `page.tsx` | 3 | h1 → `text-2xl ... text-foreground` (168.1 hub scale, comment pinned); subtitle → muted; export-variant hint → muted. |
| `components/SkuPageStates.tsx` | 2 | Both error-state h1 → same `text-2xl text-foreground` scale (unified h1 across all page states). |

## Token mapping system applied

- **Waterfall rows**: `financial-positive|negative /10` bg + `/30` border (pale-tint look of green-100/red-50 preserved both themes); neutral → `bg-muted border-border`.
- **Chips/badges**: `/15` idiom (168.8); **nested badge `/20` on `/15` row** — ИТОГО row badge must stay visible on the tinted row (amber-200-on-amber-100 heritage), comment pinned in source.
- **Blue = informational subtotal accent**, NOT a money sign: `GrossProfitRow` positive branch = `status-information`, negative branch = `financial-negative` (sign semantics win in the red branch).
- **Amber hierarchy** (800>600>500) → `foreground` (key figure readability) > `status-warning` > `status-warning/80` (tertiary pct).
- **financial vs status semantics**: money sign → `financial-*`; data-completeness → `status-success` (has COGS) / `status-warning` (gap); informational % → `status-information`; storage diff ± → `financial-*` (money divergence).
- **h1 scale standardization** 3xl→2xl + `text-foreground` on page.tsx + both SkuPageStates error states (precedent: 168.2 "h1 to 168.1 scale").

## Raw-palette sweep proof

`grep -rEn "(text|bg|border|from|to|hover:bg|hover:text)-(gray|red|green|blue|amber|yellow)-[0-9]{2,3}" src/app/(dashboard)/analytics/sku` (excluding `__tests__`) → **0 hits**. Only remaining occurrences are negative-assertion strings inside the new tests.

## External consumers

- `SkuFinancialsTable` (components/custom/, shared/IMPORTED) — **untouched** (verified via git status: no changes outside owned surface).
- `ExportDialog`, `DateRangePicker`, `ui/*` — untouched.
- `src/lib/analytics-utils.ts` — untouched (comment mention only).

## Tests

- NEW `__tests__/CashflowRowPrimitives.test.tsx` — 12 it: ROW_STYLES 3 variants (+ sign-isolation negative assert), badge `/15`; PctBadge default/isRemaining/custom; GrossProfitRow ±; NetProfitRow ± (bg/symbol/badge/value, border-2).
- EXT `__tests__/SkuCashflowSection.test.tsx` — +4 it: gradient card pins, ИТОГО `/15`+nested `/20` badge, empty-state muted, raw-palette DOM-guard (widened regex incl. from-/to-).
- NEW `__tests__/SkuPageAlerts.test.tsx` — 4 it: banner, filter alert + button, PeriodLabel.
- NEW `__tests__/SkuTableSection.test.tsx` — 2 it: empty-state, HelpCard tints.
- NEW `__tests__/SkuPageStates.test.tsx` — 2 it: h1 scale pin on both error states.

## Gates (worktree)

1. Targeted vitest before: **15 passed / 0 failed**; after: **39 passed / 0 failed** (8 files).
2. `npm run lint` (max-warnings 0) — **pass, 0 warnings**.
3. `npx tsc --noEmit` — **exit 0**.
4. `npx prettier --check` on all touched files — **pass** (after one `--write` pass).

Not run (per scope): full vitest, build, e2e.

## Gaps / known-accept

- `/80` (warning pct) and `/15` chips have lower contrast than the raw 500/200 stops — **known-accept class** (wave-wide dark-contrast property, same as 168.8).
- Page-level h1 pin (page.tsx render path) was covered indirectly via SkuPageStates direct pins (page renders through state machine; SkuPageGroupBy suite untouched and still green).
- HelpCard paragraphs share one muted token (all four `text-blue-800` sites → `muted-foreground` per spec).

## Lessons

_(to be filled at wave retrospective)_

## Change Log

- 2026-08-18: initial implementation, 9 files modified + 4 test files added (160+/89− excluding new tests).

## Tree migration (pass-2 fix, 2026-08-18)

Pass-2 review blocker: the plan's Owned Surface includes the exclusive
`src/components/custom/sku-financials/**` tree, but it was not migrated (81 legacy sites in 7 files).
Fixed in this iteration. Only external importer is the barrel
`src/components/custom/SkuFinancialsTable.tsx` (re-export) — tree confirmed route-exclusive.

### Per-file site map (81 sites → semantic tokens)

| File | Sites | Mapping highlights |
|---|---|---|
| sku-table-formatters.ts | 1 (fn = 4 branches) | getValueColorClass: ±→`financial-positive/negative`, 0/null→`muted-foreground` |
| SkuRow.tsx | 13 | missingCogs tint `bg-yellow-50/30`→`bg-status-warning/10` + hover `bg-muted/50`; «Не назначена»→`text-status-warning` (data-gap); returnsQty→`financial-negative`; value `text-gray-700`→`text-foreground`; ×3 share-cells gray-600→muted |
| SummaryFooter.tsx | 10 | `bg-gray-50`→`bg-muted/50`; ×7 labels + 1 note→muted; COGS footnote `text-amber-700`→`text-status-warning` |
| SkuTableHeaders.tsx | 33 | sort hover ×3 →`hover:text-status-information`; HelpCircle ×4 `muted/foreground` hover; tooltip texts→muted; dark code-blocks ×2 `bg-gray-800`→`bg-muted` + sign rows semantic (`financial-positive/negative`, `status-warning`), `border-gray-700`→`border-border`; margin legend → `financial-positive` / `status-information` / `status-warning` / `status-error` / `financial-negative` |
| ParityMetricCells.tsx | 8 | all `text-gray-600` cells→muted (title attrs untouched) |
| SkuFinancialsTable.tsx | 7 | sort icons ArrowUpDown muted / ArrowUp+Down `text-status-information`; empty-state `border-border bg-muted/50` + muted; ×2 hover→`status-information` |
| ExpenseBreakdown.tsx | 5 | labels→muted |
| VisibilityTooltip.tsx | 4 | trigger `muted/foreground` hover; labels + note→muted |
| ProfitabilityBadge.tsx | 1 | tooltip note→muted |

Untouched per instruction: `sku-table-sorting.ts`, `HistoricalSppHeaders.tsx`, barrel wrapper, route files.

### Legend ↔ badge token sync (deviation note)

The margin tooltip legend now uses semantic status tokens. `ProfitabilityBadge` colors come from
`PROFITABILITY_COLORS` in shared `src/types/sku-financials/core.ts` (legacy solid `bg-{green,lime,yellow,orange,red}-500`,
plus sibling `PROFITABILITY_HEX` used by charts) — that file is OUTSIDE the owned tree and shared,
so it was NOT migrated (scope guard). Full legend↔badge token unification is deferred as a gap;
within the tree, the legend's 5-step scale (positive/information/warning/error/negative) mirrors the
badge's 5 statuses (excellent/good/warning/critical/loss) semantically.

### Tree sweep proof

`grep -rEn "(text|bg|border)-(gray|red|green|blue|yellow|orange|amber|lime)-[0-9]+" src/components/custom/sku-financials`
(excl. `__tests__`, excl. 168.9 comments) → **0 hits**.

### Tests (tree)

- EXT `sku-table-formatters.test.ts` +5 it: getValueColorClass exact pins (null/±/0) + no-legacy-leak guard.
- EXT `missing-cogs-display.test.tsx` +4 it: missingCogs row `bg-status-warning/10` + `hover:bg-muted/50` exact classList; «Не назначена» `text-status-warning`; active sort icon `text-status-information` (no blue leak); COGS footnote `text-status-warning` + footer `bg-muted/50`.

### Gates (tree, worktree)

1. Targeted tree vitest: before **31 passed / 0 failed** (5 files) → after **40 passed / 0 failed** (5 files).
2. Targeted route vitest (unchanged route set): **39 passed / 0 failed** (8 files).
3. `npx tsc --noEmit` — exit 0; `npx eslint src/components/custom/sku-financials --max-warnings=0` — pass; prettier — pass (after `--write` ×2).

### Updated totals

Route 86 + tree 81 = **167 migrated sites** (was 86).

### Gaps (updated)

- Pass-2 blocked on tree → migrated in fix-iteration (this section).
- `PROFITABILITY_COLORS`/`PROFITABILITY_HEX` (shared types/core.ts) remain legacy raw palette — out of owned surface; legend↔badge full token sync deferred (see deviation note above).
- Dark code-blocks in tooltips became `bg-muted` surface — intentional dark-mode improvement (previously fixed-dark in both themes).

## Change Log

- 2026-08-18 (pass-2 fix): tree migration, 9 tree files + 2 test files (222+/86− incl. tests).
