# ATDD Checklist — 169.6-FE Enhanced FBS Analytics token migration

| # | Acceptance criterion | Test | Status |
|---|---|---|---|
| 1 | h1 = 169.x canon `text-2xl font-bold tracking-tight` (foreground inherited, no `text-gray-900`) | Covered by behavior-lock (no pre-existing h1 pin; per map not mandatory) — source-verified | ✅ |
| 2 | Stale-data banner = /15+30 matched-pair warning (`border-status-warning/30` + `bg-status-warning/15` + `text-status-warning`) | `FbsEnhancedPageContent.test.tsx` — NEW banner test, triple exact `classList.contains` pin + retry button present | ✅ |
| 3 | Regional Bar fill = `var(--color-chart-1)` (single source, `CHART_COLORS` import removed) | `FbsRegionalDataSection.test.tsx` — recharts Bar mock captures `fill`, exact `data-fill` pin | ✅ |
| 4 | XAxis/YAxis tick fill = `var(--color-chart-axis)`; axisLine/tickLine stay `={false}` | `FbsRegionalDataSection.test.tsx` — XAxis+YAxis mock capture, exact `data-tick-fill` pins ×2; `={false}` preserved in source | ✅ |
| 5 | CartesianGrid stroke = `var(--color-border)` | `FbsRegionalDataSection.test.tsx` — exact `data-stroke` pin | ✅ |
| 6 | Tooltip container = `rounded-lg border bg-popover p-3 shadow-lg` (no `bg-white` dark defect); label `text-foreground` semibold | Source-verified (169.4 BuyoutDailyTrendTooltip canon); adapter fallback pinned (see #8) | ✅ |
| 7 | Adapter fallback color `'#000'` → `var(--color-foreground)` | `RegionalTooltip.test.tsx` — NEW guard: `color: 123` → exact style-attribute pin `color: var(--color-foreground)` | ✅ |
| 8 | A11y data-alternative: sr-only per-region summary (formatted %, null → «нет данных») | `FbsRegionalDataSection.test.tsx` — 2 NEW tests: `class="sr-only"` exact + formatted values via same formatter; null → «нет данных» | ✅ |
| 9 | Numeric KPI values `tabular-nums` (4 KPI sections + «Средний чек» footer) | Source-verified class addition (5 sites); behavior-lock tests (null → '—', formatters) still pass | ✅ |
| 10 | No raw hex color literals in owned component sources (comments exempt) | `FbsRegionalDataSection.test.tsx` — NEW fs-based no-hex guard over `components/*.tsx` | ✅ |
| 11 | Behavior lock: baseline 37 still pass, it( only grew | Full targeted run **46 passed / 0 failed** (7 files, 37 → 46; 0 baseline tests dropped) | ✅ |
| 12 | Exact pins only (no `[class*=]`), no `as any` added | Review of new assertions — `classList.contains` / `getAttribute` / data-attribute captures only | ✅ |
| 13 | Fixture hex inputs (`'#E53935'`, `'#000'` in payloads) are data, kept | Verified present in tests as inputs; no-hex guard scans sources only | ✅ |
| 14 | Owned surface only | `git status --short` — 10 owned files (7 source + 3 tests) + 2 artifacts | ✅ |

Validation: vitest targeted 46/0 (7 files) · tsc exit 0 · eslint clean (--max-warnings 0) ·
prettier clean · max-lines OK (200/800). Not run (MAIN-session scope): full vitest, next
build, e2e.
