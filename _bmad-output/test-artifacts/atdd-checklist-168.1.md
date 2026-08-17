# ATDD Checklist — Story 168.1 (Migrate Analytics Hub /analytics + Own Analytics-Shared UI)

Acceptance criterion: Given hub, financial, marketing, period, availability, and error states when migrated then data/query/formatting/navigation behavior remains unchanged AND every ≥2-route analytics component has this or another already-merged explicit owner.

| # | Invariant | Evidence | Result |
|---|---|---|---|
| 1 | Hub h1 «Аналитика» + per-viewMode subtitle copy byte-identical | `components/__tests__/AnalyticsPageHeader.test.tsx` (new, 5 tests) | PASS |
| 2 | View-mode toggle labels (Несколько периодов/Сравнить периоды/Один период) unchanged | same test | PASS |
| 3 | Four nav group h2 headings byte-identical | `AnalyticsNavigation.test.tsx` + e2e | PASS |
| 4 | All 24 navigation cards link to exact ROUTES.ANALYTICS hrefs | unit (24 links, per-href query) + e2e per-href count 1 | PASS |
| 5 | Badge copies Важно / Новое / ML unchanged | unit + e2e | PASS |
| 6 | No runtime-interpolated hue classes on nav cards (Tailwind v4 JIT never generated them) | unit class regex + e2e DOM scan = 0 legacy | PASS |
| 7 | Query contract: available-weeks + finance-summary paths/params unchanged | pre-existing e2e (`financial-summary.spec.ts` story-162-6 block) still green | PASS |
| 8 | Comparison controls expose mounted state (Период 1/2 comboboxes) | pre-existing e2e still green | PASS |
| 9 | `useAnalyticsPageState` data-flow untouched | hook file unmodified in diff | PASS |
| 10 | Marketing widgets: graceful degradation (null on error), no-fabricated-zero | pre-existing `AnalyticsMarketingWidgets`/`MarketingKpiCard` tests still green | PASS |
| 11 | Sparkline uses theme chart token (was hardcoded `#3B82F6`) | `SearchPerformanceWidget.tsx` diff — `var(--color-chart-1)` | PASS |
| 12 | VariantTable: label/nmId-raw/null-dash/⚠️ markers/empty/loading behavior | pre-existing `VariantTable.test.tsx` still green (only color-class pin updated to token) | PASS |
| 13 | VariantTable negative profit still signalled (token class) | same test — `.text-financial-negative` | PASS |
| 14 | ExportDialog form contract (labels, COGS checkbox, createError copy) | `export-dialog/__tests__` 9/9 still green | PASS |
| 15 | analytics/shared: divergence tolerance + no fabricated 0 ₽ | pre-existing `StorageComparisonCard.test.tsx` 3/3 still green | PASS |
| 16 | MarginMissingCogsBanner count logic untouched | pre-existing test still green; file unmodified | PASS |
| 17 | Russian copy unchanged across all migrated files | manual diff review — only class attributes changed | PASS |
| 18 | Ownership: every ≥2-route analytics component has explicit owner | ownership map in story record; 1 escalation (ResponsiveChartFrame) | PASS w/ ESCALATION |

Gaps: see story record (docs-gate baseline red on clean main; ResponsiveChartFrame owner).
