# ATDD Checklist — 168.9 SKU Analytics shadcn migration

| # | Check | Result |
|---|---|---|
| 1 | ROW_STYLES positive pin: `bg-financial-positive/10` + `border-financial-positive/30` + symbol/value `text-financial-positive` | PASS |
| 2 | ROW_STYLES negative pin: `financial-negative/10` + `/30`; neutral pin: `bg-muted border-border` + foreground value | PASS |
| 3 | Sign isolation: positive variant contains NO negative classes | PASS |
| 4 | Chip idiom `/15`: CashflowRow badge + PctBadge default (negative) / isRemaining (muted) / custom passthrough | PASS |
| 5 | GrossProfitRow: isPositive → `status-information/10` bg, `/30` border-2 kept, value+badge info; negative → `financial-negative` value + `/15` badge | PASS |
| 6 | NetProfitRow ± : `/10` bg + `/40` border (border-2 kept), `/15` badge, symbol & value financial | PASS |
| 7 | Cashflow card gradient: `from-status-information/10 to-status-warning/10` + `border-status-information/30` | PASS |
| 8 | ИТОГО row: `bg-status-warning/15` + `border-status-warning/40`; nested badge `/20` on `/15` row | PASS |
| 9 | Empty-state (sales_gross=0): `text-muted-foreground` honest state (no fabricated %) | PASS |
| 10 | DOM-guard: no raw blue/amber/gray/red/green/yellow palette classes in rendered cashflow card (incl. from-/to-) | PASS |
| 11 | Alerts: OperatingProfitInfoBanner + NmIdFilterAlert `status-information/30` + `/10` bg, icon token; clear button `text-status-information` + hover bg token | PASS |
| 12 | PeriodLabel: `bg-status-information/10` + muted text + info icon | PASS |
| 13 | TableSection: empty state `border-border bg-muted/50` + muted; HelpCard `status-information/30`+`/10`, foreground title | PASS |
| 14 | h1 scale: `text-2xl` + `text-foreground`, NOT `text-3xl`/`text-gray-900` — both SkuPageStates error states | PASS |
| 15 | Behavior-lock: labels/symbols/values/branching unchanged (BD-11 «ПРИБЫЛЬ ДО НАЛОГА», empty-state DEFECT 4, baseline suite green) | PASS |
| 16 | Shared untouched: SkuFinancialsTable / ExportDialog / DateRangePicker / ui/* not in diff | PASS |
| 17 | Raw-palette sweep over owned surface (excl. tests): 0 hits | PASS |
| 18 | Gates: targeted vitest 15→39 (8 files, 0 fail); lint 0 warnings; tsc exit 0; prettier pass | PASS |
| 19 | Tree: getValueColorClass contract — null/0→`text-muted-foreground`, +→`text-financial-positive`, −→`text-financial-negative` (exact) + no-legacy guard | PASS |
| 20 | Tree: missingCogs row `bg-status-warning/10` + `hover:bg-muted/50` exact classList, no gray-/yellow-50 leak | PASS |
| 21 | Tree: «Не назначена» cell `text-status-warning` exact | PASS |
| 22 | Tree: active sort icon `text-status-information`, no blue- leak | PASS |
| 23 | Tree: COGS footnote `text-status-warning` + footer `bg-muted/50` exact; legend tokens semantic (source-level, tooltip not DOM-rendered in jsdom) | PASS |
| 24 | Tree: raw-palette sweep over `src/components/custom/sku-financials` (excl. tests) → 0 hits | PASS |
| 25 | Tree gates: vitest 31→40 (0 fail), route 39 (0 fail), tsc 0, eslint 0, prettier pass | PASS |
