# 169.6 FE — Migrate Enhanced FBS Analytics (`/analytics/fbs-enhanced`) to shadcn tokens

- **Status**: Code-complete (uncommitted in worktree, per wave protocol)
- **Story**: 169.6-FE Migrate Enhanced FBS Analytics
- **Route**: `/analytics/fbs-enhanced`
- **Branch**: `cdx/epic-169-story-6-fbs-enhanced-shadcn`
- **Base**: `1e5b9b80` (origin/main)
- **Worktree**: `/private/tmp/wb-repricer-fe-169-6-fbs-enhanced-shadcn`

## Acceptance

Presentation-only token migration of the enhanced FBS analytics route (page orchestrator +
5 sections: order stats KPI, stock KPI, regional bar chart, calculated-metrics KPI, funnel).
Chart surface moved to CSS vars (`--color-chart-1`, `--color-border`, `--color-chart-axis`),
tooltip to popover tokens, stale-banner to the 169.5 matched-pair warning idiom, h1 to the
169.x canon. A11y: sr-only per-region data summary (non-hover access to tooltip data).
RTC: `tabular-nums` on all numeric KPI values. Behavior locked: baseline 37 →
**46 passed / 0 failed** (7 files, it( only grew).

## Changes (per file, was → became)

| File | Sites | Change |
|---|---|---|
| `FbsEnhancedPageContent.tsx` | 2 | h1 `text-3xl … text-gray-900` → `text-2xl font-bold tracking-tight` (169.x canon); stale-banner `border-amber-200 bg-amber-50 text-amber-800` → `border-status-warning/30 bg-status-warning/15 text-status-warning` (169.5 matched-pair /15+30 idiom). Text, buttons, state machine untouched. |
| `FbsRegionalDataSection.tsx` | 5 | CartesianGrid `stroke="#E5E7EB"` → `var(--color-border)`; XAxis+YAxis tick `{fontSize:11}` → `{fontSize:11, fill:'var(--color-chart-axis)'}` (axisLine/tickLine stay `={false}`); Bar `fill={CHART_COLORS.primaryRed}` → local `REGIONAL_BAR_COLOR = 'var(--color-chart-1)'` (169.4 single-source precedent); `CHART_COLORS` import removed (sole use). NEW: `<p className="sr-only">` before ResponsiveContainer with per-region summary (`{region} — formatPercentage(_percentageRaw)`, null → «нет данных»). |
| `RegionalTooltip.tsx` | 3 | Container `rounded-md border bg-white p-3 shadow-sm` → `rounded-lg border bg-popover p-3 shadow-lg` (169.4 BuyoutDailyTrendTooltip canon; bg-white = dark defect); label `font-medium mb-1` → `mb-1 text-sm font-semibold text-foreground`; toEntry fallback color `'#000'` → `'var(--color-foreground)'`. Adapter/toEntry/`_percentageRaw`/name-drop logic untouched. |
| `FbsOrderStatsSection.tsx` | 2 | KpiCard value div + `tabular-nums`; «Средний чек» footer span + `tabular-nums`. |
| `FbsStockAnalyticsSection.tsx` | 1 | KpiCard value div + `tabular-nums`. |
| `FbsCalculatedMetricsSection.tsx` | 1 | KpiCard value div + `tabular-nums`. |
| `FbsFunnelSection.tsx` | 1 | KpiCard value div + `tabular-nums`. |
| `page.tsx`, `FbsFunnelChart.tsx` | 0 | untouched (clean; hex grep over owned surface = 0). |

## Token mapping

| Legacy | Token | Sites |
|---|---|---|
| `#E5E7EB` (grid) | `var(--color-border)` | 1 |
| tick fill (unset/default) | `var(--color-chart-axis)` | 2 (XAxis+YAxis) |
| `CHART_COLORS.primaryRed` (`#E53935`) | `var(--color-chart-1)` via `REGIONAL_BAR_COLOR` | 1 |
| `bg-white` tooltip | `bg-popover` (+ `rounded-lg`/`shadow-lg` canon) | 1 |
| `#000` fallback | `var(--color-foreground)` | 1 |
| `text-amber-200/50/800` banner | `border-status-warning/30 bg-status-warning/15 text-status-warning` | 1 |
| `text-3xl … text-gray-900` h1 | `text-2xl font-bold tracking-tight` | 1 |

Post-migration legacy grep (`(text|bg|border)-(amber|gray)-[0-9]`, `#E5E7EB`, `#000`, `bg-white`,
hex literals in owned sources): **0 hits** (enforced by a new fs-based no-hex guard test).

## Test changes (7 files, 37 → 46 it(, 0 dropped)

- `FbsRegionalDataSection.test.tsx`: recharts mock upgraded — Bar/XAxis/YAxis/CartesianGrid now
  capture their color props via data-attributes. +8 it(: 4 exact var-name pins (Bar fill
  `var(--color-chart-1)`, both tick fills `var(--color-chart-axis)`, grid stroke
  `var(--color-border)`), 2 sr-only summary tests (formatted values; null → «нет данных»),
  1 fs-based no-hex guard over all owned component sources (comment lines exempt; 169.4 had
  no fs precedent — its mechanism was constant-level, not applicable to a non-exported local
  constant, so the fs scan was implemented per the story map).
- `RegionalTooltip.test.tsx`: +1 it( — non-string entry color (123) → adapter fallback
  `var(--color-foreground)`, exact style-attribute pin.
- `FbsEnhancedPageContent.test.tsx`: +1 it( — stale-banner (isError + cached data) exact
  class pins `border-status-warning/30` / `bg-status-warning/15` / `text-status-warning`.
- Fixture hex inputs (`'#E53935'`, `'#000'` in test payloads) deliberately kept — they are
  data inputs, not component colors.

## Gaps

- Contrast of `text-status-warning` on `bg-status-warning/15` — known foundation-owned
  /15-chip contrast escalation (same as 169.4/169.5), consolidated in 174.2. Not re-measured here.
- No h1 class pin added (per map: optional; no pre-existing h1 assertion existed).
- The no-hex guard covers `components/*.tsx` (8 files) + `page.tsx` (routeDir-loop scan);
  coverage confirmed in review pass-2.
- sr-only summary text («Данные по регионам: …») is new copy — the prefix is de-duplicated
  from the visible h2 per review pass-2; not reviewed by a human yet.

## Carry-outs

None — the full owned surface map was implemented.

## Verification

- `npx vitest run "src/app/(dashboard)/analytics/fbs-enhanced"` → 7 files / **46 passed /
  0 failed** (baseline 37, +9, 0 dropped). exit 0.
- `npm run lint` → exit 0 (zero-warning).
- `npm run type-check` → exit 0.
- `npm run check:max-lines` → OK (source 200 / test 800).
- `npx prettier --check 'src/app/(dashboard)/analytics/fbs-enhanced'` → clean (after --write
  pass on 3 files).
- Owned grep `it(`: 3+5+4+6+4+14+10 = **46** test declarations (raw grep prints 47 in the
  regional file — one match is `split('\n')` containing the substring `it(`, a grep
  false-positive; declaration-level count = 14). Matches vitest 46 exactly.
- No `as any` added; no query-keys/formatters/testids/aria-labels/state-machine changes;
  nothing committed (worktree left dirty per wave protocol).
