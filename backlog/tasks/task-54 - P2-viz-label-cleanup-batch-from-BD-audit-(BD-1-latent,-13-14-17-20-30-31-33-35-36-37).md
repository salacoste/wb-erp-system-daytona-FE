---
id: task-54
title: >-
  P2 viz/label cleanup batch from BD-audit (BD-1 latent,
  13/14/17/20/30/31/33/35/36/37)
status: Done
assignee: []
created_date: '2026-07-02 09:15'
labels:
  - frontend
  - ux-validation
  - polish
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Low-severity polish/hardening from frontend/.omc/ux-validation/business-data-audit-2026-07-02.md:
- BD-1 (latent): orders-cogs-helpers.ts:105,117-121 `cogs_total || 0` → gate the COGS block when cogs_total/gross_profit/margin_pct all null so the 100% fabrication can't return if backend regresses (live currently shows real 48,39%, so latent only)
- BD-13: MarginSummaryCards.tsx:80 color 'Общая прибыль' by sign (getValueColorClass), not hardcoded green
- BD-14: LiquidityDistributionCards.tsx:82 label the % as 'от стоимости запасов' (capital-share, not SKU-count)
- BD-17: SupplyDetailRightColumn.tsx:97 rename 'Горизонт планирования' → 'Срок покрытия страхового запаса (дней)'
- BD-20: MarginAggregatedTableRow.tsx:66-68 'Товаров (SKU)' fallback to '—' not qty
- BD-30: health-history-helpers.ts:34-41 parse date as local ('T00:00:00') to fix weekday off-by-one
- BD-31: GapsSummaryCards.tsx:57-63 default coverage card color to gray when !data (no red flash)
- BD-33: admin-models-helpers.ts:69-72 treat model-level MAPE 0 as un-evaluated → '—' (match model-list-helpers.ts:77-84)
- BD-35: ForecastMetrics.tsx:9-13,26 render '—' for avg confidence when all null
- BD-36: AccuracyMetricsCards.tsx:54-57 confirm MAE unit basis; drop hard '(шт)' or plumb a unit field
- BD-37: PricingSummaryCards.tsx:23-24,58 avgGapPct null when no gaps → '—'
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each listed BD-item addressed or explicitly deferred with rationale
- [x] #2 No new check:locale-percent / eslint / type-check regressions
- [x] #3 vitest passes at baseline
<!-- AC:END -->
