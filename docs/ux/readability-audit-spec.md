# Spec — Readability Audit (prioritized, no code)

> **Status: DRAFT — for approval. No code.** Cross-page readability refinement.
> Grounded in the 17-cycle UX-validation sweep + the dashboard inventory
> (`docs/ux/persona-dashboard-rework-spec.md` covers the dashboard in depth; **this doc is the app-wide read**).
>
**Convention:** P0 = cross-cutting / high-impact · P1 = page-specific / significant · P2 = polish. Each item: *problem → fix → where*.

---

## P0 — cross-cutting (do these first, they lift every page)

### P0-1 · Banner stacking buries content
**Problem:** dashboards/settings pages stack multiple conditional alerts vertically before any data. Dashboard can show up to **8** banners (`DashboardContent.tsx:69-85`); `/settings/cabinet` stacks token/subscription/rating alerts.
**Fix:** single expandable "status strip" (1 line + count + expand) per page. Dashboard version is Story 2 of the persona spec; generalise the pattern to settings.
**Where:** dashboard, `/settings/cabinet`.

### P0-2 · Metric-card density & duplication
**Problem:** pages dump 15–30 metric cards with no hierarchy (dashboard ~31 incl. COGS×3, profit-chain×6). Violates *Progressive Disclosure* (`front-end-spec.md:64`).
**Fix:** per page, designate **one hero metric** (largest), group related cards into expandable "families" (profit waterfall, sales-by-price-level, expense breakdown), remove duplicates.
**Where:** dashboard (primary), `/analytics/unit-economics`, `/analytics/forecast-accuracy`, `/analytics/liquidity`.

### P0-3 · Sub-12px text in dense components (FE-7 residue)
**Problem:** 12 sites remain at `text-[10px]`/`text-[11px]` in tight badges (`h-4 px-1 py-0`), heatmap cells, calendar grid cells, chart axis labels, `DataAvailabilityBadge` sm-variant (`monitoring`, `price-calculator`, `ProductTableRow`). Below the 12px readability floor for body-adjacent text.
**Fix:** per-site visual verify — promote standalone annotations to `text-xs`; for fixed-height badges, either widen (`h-5`) or keep small **but add a tooltip** so the value is readable on hover. Don't blanket-promote (breaks dense layouts).
**Where:** `monitoring/components/{HealthHistoryChart,PipelineHeatmap,HealthReportSheetBody}`, `price-calculator/{WarehouseTariffsByBoxType,CoefficientCalendarCells}`, `SidebarCabinetInfo`, `ProductTableRow`, `DataAvailabilityBadge`.

### P0-4 · Heading hierarchy inconsistent across analytics pages
**Problem:** mixed `h1` + `CardTitle`-as-div + `*PageHeader` patterns; some pages had `h1→h3`/`h1→h5` skips (FE-4/5 fixed the worst, but the **pattern isn't uniform**). Screen-reader outline varies page-to-page.
**Fix:** adopt **one** page-heading convention: `h1` (page title, exactly 1) → `h2` (section, sr-only ok if a visible CardTitle exists) → no `h3` unless a real sub-section. Audit each analytics page against it.
**Where:** all `/analytics/*` pages — standardise.

---

## P1 — page-specific, significant

### P1-1 · Wide tables: sticky + scroll done, but no column-priority
**Problem:** FE-6 added `overflow-x-auto` + sticky-first-column to ~20 tables, so they no longer clip. But **all columns are equal weight** — a 12-col advertising table forces horizontal scrolling past low-value columns to reach ROAS/profit.
**Fix:** define a "primary columns" set per wide table (identifier + 3–4 key metrics) that stay visible; secondary columns collapse on narrow viewports (CSS `nth-child` hide below breakpoint) instead of forcing scroll. Persona spec §4 Change A applies the same idea.
**Where:** `/analytics/advertising` (12-col), `/analytics/unit-economics` (10-col), `/analytics/sku` (9-col).

### P1-2 · `/analytics/forecast-accuracy` lead metric
**Problem:** MAPE can explode to thousands of % near zero; the page historically led with it (alarming). BE-7 added `mapeValid` + `avgMAE`; FE-9 (AccuracyMetricsCards) now promotes MAE — verify MAPE is **demoted/gated** when `mapeValid === false`.
**Fix:** confirm: when `mapeValid=false`, MAPE card renders muted + a "contaminated by small-actual SKUs" note; avgMAE is the headline. (May already be done — verify, don't assume.)
**Where:** `/analytics/forecast-accuracy` (`AccuracyMetricsCards.tsx`).

### P1-3 · `/analytics/liquidity` category headlines misleading at zero
**Problem:** category heroes showed "0,0 %" turnover headlines when a category had stock but no sales — reads as "0% performance" rather than "no sales yet". (BE-3 fixed frozen-capital=0; the **headline framing** wasn't touched.)
**Fix:** when a category has stock but zero sales in-period, headline should read "Нет продаж за период" (neutral) not "0,0 %".
**Where:** `/analytics/liquidity`.

### P1-4 · Settings pages: sparse + inconsistent breadcrumbs
**Problem:** `/settings/*` pages are thin (255–571 chars) with inconsistent breadcrumb/header patterns; `/settings/cabinet` info is fragmented across alerts.
**Fix:** unify settings under a consistent 2-column layout (nav rail + content), consolidate cabinet alerts (ties to P0-1).
**Where:** `/settings/*`.

### P1-5 · Empty-states read as errors
**Problem:** several pages render near-empty states (`/shipments/box-types` «Нет типов коробок», `/cogs/history` «Не указан ID», `/analytics/cross-reference`, `/analytics/search`) that read like load failures to a user who can't tell empty-data from broken.
**Fix:** distinguish **"no data yet"** (neutral empty-state + CTA to add/import) from **"failed to load"** (error styling + retry). Consistent empty-state component.
**Where:** `/shipments/*`, `/cogs/history`, `/analytics/{search,cross-reference,gaps,alerts}`.

---

## P2 — polish

### P2-1 · Number formatting density in tables
Long currency columns (`1 234 567,89 ₽`) in tight tables reduce scannability. Consider compact mode (`1,23 М ₽`) for summary views, full precision on hover/detail.

### P2-2 · Color-as-sole-indicator
Some tables signal profit/loss only by text color (green/red). Add an icon or `+`/`−` sign prefix for color-blind accessibility (WCAG 1.4.1). Check `MarginBy*Table`, `SkuFinancialsTable`.

### P2-3 · Tooltip reliance for disambiguation
Cards distinguishable only by tooltip (the 4 pricing-scale cards, efficiency badges) signal weak hierarchy. Prefer inline micro-labels; tooltip as supplement.

### P2-4 · Loading skeletons vs spinners
Mixed loading patterns: some sections use skeletons, others the bottom-right ad-loading toast. Standardise on skeletons for above-the-fold, toast only for background refresh.

---

## Prioritisation summary

| Priority | Items | Persona most served | Effort |
|---|---|---|---|
| **P0** | 1 banner-strip, 2 card-density, 3 sub-12px, 4 headings | All (esp. Owner readability) | M–L |
| **P1** | 5 page-specific | Ops (tables/empty-states), CFO (forecast/liquidity) | S–M each |
| **P2** | 4 polish | Accessibility / consistency | S each |

**Suggested start:** P0-1 (banner strip) + P0-3 (sub-12px verify) — both ship fast, lift every page, and P0-1 is already Story 2 of the dashboard spec. Then P1-1 (column priority) for the wide-table personas (Ops/CFO).

## Non-goals
- **Not** a visual redesign / rebrand — uses existing design tokens (`front-end-spec.md` color/typography).
- **Not** touching the data layer; every fix is presentation/structure.
- Dashboard-specific depth lives in the persona spec; this doc references but doesn't duplicate it.
