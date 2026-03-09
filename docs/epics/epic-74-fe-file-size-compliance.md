# Epic 74-FE: File Size Compliance & Code Splitting

**Priority**: P2 (Technical Debt)
**Total Story Points**: 34 SP
**Files Affected**: 131 files exceeding 200-line ESLint limit
**Goal**: Bring all production source files under the 200-line ESLint-enforced limit through systematic extraction of column definitions, table configs, sub-components, utility functions, and hook logic.

---

## Context

The 200-line file size limit is enforced by ESLint (`max-lines`) and documented in CLAUDE.md as mandatory. Over time, 131 source files have grown beyond this limit, with the worst offenders exceeding 1000 lines. This epic addresses the debt systematically, domain by domain, with zero functional changes.

### Principles
- **Extract, don't rewrite** — move code to new files, don't refactor logic
- **Zero functional changes** — all tests must continue passing
- **Common patterns**: extract table column definitions, chart configs, sub-components, type definitions, utility helpers, API endpoint groups
- **Each story is independently shippable** — no cross-story dependencies

---

## Story Overview

| Story | Title | SP | Files | Lines Over |
|-------|-------|----|-------|------------|
| 74.1-FE | Split mega components (>500 lines) | 5 | 7 | ~4,305 |
| 74.2-FE | Split analytics page files (400-500 lines) | 5 | 8 | ~2,180 |
| 74.3-FE | Split analytics components (300-400 lines) | 3 | 8 | ~1,220 |
| 74.4-FE | Split hooks (>300 lines) | 5 | 10 | ~2,500 |
| 74.5-FE | Split lib utilities (>300 lines) | 5 | 8 | ~2,260 |
| 74.6-FE | Split components/custom Tier 2 (250-350 lines) | 3 | 16 | ~1,480 |
| 74.7-FE | Split analytics sub-components (250-320 lines) | 3 | 10 | ~750 |
| 74.8-FE | Split remaining files (200-250 lines) | 3 | 48 | ~1,440 |
| 74.9-FE | Validation & cleanup sweep | 2 | 0 | 0 |

**Total**: 34 SP across 9 stories covering 131 files

---

## Stories

### 74.1-FE: Split Mega Components (>500 lines)
**SP**: 5 | **Priority**: P0 — Highest impact, worst violators

**Target Files** (7 files, all >500 lines):

| File | Lines | Extraction Strategy |
|------|-------|-------------------|
| `components/custom/FinancialSummaryTable.tsx` | 1153 | Extract column defs, formatters, sub-row components, summary footer |
| `components/custom/PnLWaterfall.tsx` | 876 | Extract chart config, waterfall-bar component, tooltip, legend |
| `analytics/sku/page.tsx` | 795 | Extract tab content components, filter section, state management |
| `components/custom/BulkCogsForm.tsx` | 741 | Extract validation logic, file parser, preview table, confirmation dialog |
| `analytics/advertising/components/PerformanceMetricsTable.tsx` | 706 | Extract column definitions, cell renderers, pagination controls |
| `components/custom/SkuFinancialsTable.tsx` | 652 | Extract column defs, formatters, expandable row |
| `components/custom/price-calculator/PriceCalculatorForm.tsx` | 586 | Extract form sections, calculation display, result panel |

**Acceptance Criteria**:
- [ ] All 7 files reduced to ≤200 lines
- [ ] Extracted code in co-located files (same directory or `/extracted/` subfolder)
- [ ] All existing tests pass without modification
- [ ] No functional changes — pure structural extraction
- [ ] TypeScript type-check clean

---

### 74.2-FE: Split Analytics Page Files (400-500 lines)
**SP**: 5 | **Priority**: P0

**Target Files** (8 files):

| File | Lines | Extraction Strategy |
|------|-------|-------------------|
| `analytics/page.tsx` (main dashboard) | 573 | Extract week selector logic, tab content, summary cards orchestration |
| `analytics/advertising/page.tsx` | 552 | Extract URL param logic, filter state, data transformation |
| `analytics/supply-planning/components/SupplyPlanningTable.tsx` | 492 | Extract column definitions, risk indicators, row expansion |
| `analytics/category/page.tsx` | 466 | Extract comparison logic, export handler, filter state |
| `analytics/brand/page.tsx` | 459 | Extract comparison logic, export handler, filter state |
| `analytics/supply-planning/components/SupplyPlanningDetail.tsx` | 448 | Extract metric cards, detail sections, chart config |
| `analytics/advertising/components/CampaignSelector.tsx` | 364 | Extract CampaignItem sub-component, popover logic |
| `analytics/storage/page.tsx` | 345 | Extract filter orchestration, chart click handler |

**Acceptance Criteria**:
- [ ] All 8 files reduced to ≤200 lines
- [ ] Page files extract state/logic into custom hooks or config files
- [ ] All existing tests pass without modification
- [ ] TypeScript type-check clean

---

### 74.3-FE: Split Analytics Components (300-400 lines)
**SP**: 3 | **Priority**: P1

**Target Files** (8 files):

| File | Lines |
|------|-------|
| `analytics/unit-economics/components/UnitEconomicsWaterfall.tsx` | 397 |
| `analytics/storage/components/StorageBySkuTable.tsx` | 368 |
| `analytics/advertising/components/MergedGroupTable.tsx` | 327 |
| `analytics/unit-economics/components/UnitEconomicsTable.tsx` | 322 |
| `analytics/supply-planning/components/SupplyPlanningRow.tsx` | 320 |
| `analytics/storage/components/PaidStorageImportDialog.tsx` | 305 |
| `monitoring/components/DataCompletenessTable.tsx` | 301 |
| `analytics/advertising/components/CampaignStatusBadge.tsx` | 293 |

**Acceptance Criteria**:
- [ ] All 8 files reduced to ≤200 lines
- [ ] Table components extract column definitions to `*-columns.tsx` files
- [ ] All existing tests pass without modification

---

### 74.4-FE: Split Hooks (>300 lines)
**SP**: 5 | **Priority**: P1

**Target Files** (10 hooks):

| File | Lines | Extraction Strategy |
|------|-------|-------------------|
| `hooks-v1/useMarginAnalytics.ts` | 698 | Split by view: sku/brand/category hooks + shared query keys |
| `hooks-v1/useMarginPollingWithQuery.ts` | 446 | Extract polling logic, state machine, retry config |
| `hooks-v1/useSingleCogsAssignmentWithPolling.ts` | 405 | Extract validation, polling config, mutation builders |
| `hooks-v1/useStorageAnalytics.ts` | 369 | Split by endpoint: bySku/topConsumers/trends hooks |
| `hooks-v1/useSupplyTariffs.ts` | 366 | Extract tariff calculation utils, query builders |
| `hooks-v1/useSupplyPolling.ts` | 333 | Extract polling state, interval config |
| `hooks-v1/useWarehouseCoefficients.ts` | 332 | Extract data transformation, query config |
| `hooks-v1/useSkuFinancials.ts` | 331 | Extract formatters, query key factory |
| `hooks-v1/useOrdersCogs.ts` | 329 | Extract enrichment logic, merge functions |
| `hooks-v1/financial/hooks.ts` | 324 | Split into individual hook files |

**Acceptance Criteria**:
- [ ] All 10 files reduced to ≤200 lines
- [ ] Query key factories extracted to shared `query-keys.ts` files
- [ ] Hook public APIs unchanged — consumers don't need updates
- [ ] All existing tests pass

---

### 74.5-FE: Split Lib Utilities (>300 lines)
**SP**: 5 | **Priority**: P1

**Target Files** (8 files):

| File | Lines | Extraction Strategy |
|------|-------|-------------------|
| `lib/liquidity-utils.ts` | 612 | Split: turnover categories, liquidation scenarios, risk calculations |
| `lib/analytics-utils.ts` | 579 | Split: formatters, aggregation, comparison helpers, fill-missing |
| `lib/api/storage-analytics.ts` | 500 | Split by endpoint group: bySku, trends, topConsumers, import |
| `lib/wb-status-mapping.ts` | 455 | Extract status maps to JSON/const files, keep lookup functions |
| `lib/unit-economics-utils.ts` | 388 | Split: profitability calcs, health scoring, waterfall data |
| `lib/supply-planning-utils.ts` | 387 | Split: stockout risk, reorder calc, demand forecasting |
| `lib/api/advertising-analytics.ts` | 382 | Split by endpoint group: summary, daily, campaigns, sync |
| `lib/api/liquidity.ts` | 359 | Split by endpoint: turnover, liquidation, scenarios |

**Acceptance Criteria**:
- [ ] All 8 files reduced to ≤200 lines
- [ ] API client files split by endpoint group
- [ ] Utility files split by functional domain
- [ ] All imports across codebase updated
- [ ] All existing tests pass

---

### 74.6-FE: Split Components/Custom Tier 2 (250-350 lines)
**SP**: 3 | **Priority**: P2

**Target Files** (16 files):

| File | Lines |
|------|-------|
| `components/custom/MarginBySkuTable.tsx` | 502 |
| `components/custom/MarginByCategoryTable.tsx` | 485 |
| `components/custom/MarginByBrandTable.tsx` | 483 |
| `components/custom/SingleCogsForm.tsx` | 431 |
| `components/custom/price-calculator/DeliveryDatePicker.tsx` | 430 |
| `components/custom/AdvertisingDashboardWidget.tsx` | 373 |
| `components/custom/DateRangePicker.tsx` | 371 |
| `components/custom/ProductMarginCell.tsx` | 358 |
| `components/custom/MarginTrendChart.tsx` | 334 |
| `components/custom/tariffs-admin/TariffSettingsForm.tsx` | 326 |
| `components/custom/dashboard/index.ts` | 331 |
| `components/custom/supplies/OrderPickerDrawer.tsx` | 312 |
| `components/custom/ExportDialog.tsx` | 310 |
| `components/custom/ComparisonPeriodSelector.tsx` | 299 |
| `components/custom/TopProductsTable.tsx` | 291 |
| `components/custom/TopBrandsTable.tsx` | 266 |

**Acceptance Criteria**:
- [ ] All 16 files reduced to ≤200 lines
- [ ] Margin*Table components share extracted column patterns
- [ ] Form components extract validation and section sub-components
- [ ] All existing tests pass

---

### 74.7-FE: Split Analytics Sub-Components & Remaining Pages (250-320 lines)
**SP**: 3 | **Priority**: P2

**Target Files** (10 files):

| File | Lines |
|------|-------|
| `analytics/storage/components/StorageTrendsChart.tsx` | 286 |
| `analytics/liquidity/components/LiquidityTable.tsx` | 276 |
| `analytics/unit-economics/page.tsx` | 263 |
| `analytics/storage/components/TopConsumersWidget.tsx` | 256 |
| `analytics/supply-planning/components/SupplyRiskCards.tsx` | 219 |
| `orders/page.tsx` (dashboard) | 299 |
| `supplies/[id]/page.tsx` | 258 |
| `settings/notifications/page.tsx` | 257 |
| `cogs/history/page.tsx` | 254 |
| `supplies/page.tsx` | 224 |

**Acceptance Criteria**:
- [ ] All 10 files reduced to ≤200 lines
- [ ] Chart components extract config objects and tooltip components
- [ ] Page files extract orchestration into hooks
- [ ] All existing tests pass

---

### 74.8-FE: Split Remaining Files (200-250 lines)
**SP**: 3 | **Priority**: P3 — Lowest severity, closest to limit

**Target Files** (48 files, 201-250 lines each):

Includes remaining hooks (`useLiquidity`, `usePendingMarginProducts`, `useSanityCheck`, `useCogsEdit`, `useExpenses`, `useExportAnalytics`, `useBulkCogsAssignment*`, `useProducts`, `useSupplyPlanning`, `useDashboardMetricsWithPeriod`, `useAcceptanceCoefficients`, `useSingleCogsAssignment`), lib files (`tariff-system-utils`, `two-level-pricing`, `return-logistics-utils`, `fbs-analytics-utils`, `margin-helpers`, `storage-cost-utils`, `acceptance-status-utils`, `efficiency-utils`, `period-helpers`, `logistics-tariff`, `box-type-utils`, `acceptance-cost-utils`, `api-client`, `api.ts`, various `api/*.ts`), components (`WbTokenForm`, `MultiWeekSelector`, `CogsMissingState`, `DashboardPeriodSelector`, `AdvertisingEmptyState`, `MetricCardEnhanced`, `ExpenseChart`, `DeltaIndicator`, `CogsHistoryTable`, `CogsEditDialog`, `DateRangePickerExtended`, `MultiSelectDropdown`, price-calculator sub-components, dashboard sub-components, `orders/LocalHistoryTab`, `AuditLogTable`, `ScheduleVersionForm`), and `monitoring/types/monitoring.ts`.

**Acceptance Criteria**:
- [ ] All 48 files reduced to ≤200 lines
- [ ] Minimal extractions (most need only 20-50 lines moved)
- [ ] All existing tests pass

---

### 74.9-FE: Validation & Cleanup Sweep
**SP**: 2 | **Priority**: P1 — Must run last

**Tasks**:
- [ ] Run `find src/ -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -rn` to verify zero files >200 lines
- [ ] Run full test suite — all tests must pass
- [ ] Run `npm run lint` — zero file-size ESLint violations
- [ ] Run `npm run type-check` — clean
- [ ] Verify no broken imports across codebase
- [ ] Update any stale comments referencing old file locations
- [ ] Document extraction patterns used (for future reference)

**Acceptance Criteria**:
- [ ] Zero source files >200 lines (excluding test files, types/, ui/)
- [ ] Full test suite passing
- [ ] ESLint clean
- [ ] TypeScript clean

---

## Technical Notes

### Common Extraction Patterns

1. **Table Column Definitions** → `*-columns.tsx` (proven in Epic 72 BuyoutTable refactor)
2. **Chart Configurations** → `*-config.ts` (proven in Epic 72 DailyTrendChart)
3. **Page State Logic** → `use*PageState.ts` custom hook
4. **Form Sections** → individual section components
5. **API Endpoint Groups** → split by domain (e.g., `storage-bySku.ts`, `storage-trends.ts`)
6. **Utility Function Groups** → split by subdomain (e.g., `liquidity-turnover.ts`, `liquidity-scenarios.ts`)
7. **Sub-Components** → co-located files in same directory
8. **Type Re-exports** → barrel `index.ts` to maintain public API

### Risk Mitigation
- Run tests after each file split, not just at story end
- Use `git diff --stat` to verify no accidental deletions
- Keep old file as thin orchestrator importing from extracted files
- Maintain backward-compatible exports where other modules import from the file

### Dependencies
- No cross-story dependencies (each story can be done independently)
- 74.9 must run after all other stories
- Stories can be parallelized across developers
