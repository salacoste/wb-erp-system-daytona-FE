# Frontend -> Backend Requests Index

Documentation of requests from frontend team to backend team and backend team responses.

> **Canonical current status (2026-07-13):** use [AUDIT-2026-07-13.md](./AUDIT-2026-07-13.md) when a historical heading, shard, or counter conflicts with current code/evidence. The audit freezes and maps all 244 source Markdown basenames; this README remains part of that source set. Counters and “all resolved” statements below are historical snapshots, not precedence over the dated ledger.

**Last Updated**: 2026-06-09 | **Total Requests**: 211 | **Active**: 0 | **Pending**: 0 | **Resolved**: 211

---

## Quick Navigation

| Shard | Content | Requests |
|-------|---------|----------|
| **[Shard 01: Recent Epics](./README-SHARD-01-recently-resolved-epics.md)** | Epic 33-36, Telegram, Advertising | #71, #73, #75-78, #85-90, #99 |
| **[Shard 02: Financial Columns](./README-SHARD-02-pending-financial.md)** | WB Column Rename, retail_price (resolved) | #58, #61 |
| **[Shard 03: Financial](./README-SHARD-03-resolved-financial.md)** | Per-SKU, Storage, WB Dashboard | #45-51, #56-59, #62, #64 |
| **[Shard 04: COGS & Analytics](./README-SHARD-04-cogs-analytics.md)** | Epic 5/6, COGS Management | #27-28, #31-33, #36, #40, #44 |
| **[Shard 05: Margin & Products](./README-SHARD-05-margin-products.md)** | Margin, Products API, #01-#21 | #01-21, #25-26 |
| **[Shard 06: Workflow & Guides](./README-SHARD-06-workflow-guides.md)** | Process, Integration Guides | Guide #24, #29, #30 |
| **[Shard 07: Status & Auth](./README-SHARD-07-status-auth.md)** | Epic Status, JWT Auth | Story 23.10 |
| **[Shard 08: FBS & Warehouses](./README-SHARD-08-fbs-warehouses.md)** | Epic 51, 53, 60, Warehouses, Tariffs | #98, #101-102, #108-111, #130 |
| **[Shard 09: Margin Fixes](./README-SHARD-09-margin-fixes.md)** | Recent margin calculation fixes | #113-120 |

---

## Request Status Summary

### Active & Pending

None — all requests resolved.

### Latest Resolved (2026-06-09)

| Request | Title | Status | Epic |
|---------|-------|--------|------|
| **#210** | **Buyout Analytics Daily Granularity** | **DELIVERED** | Story 127.1 |
| **#211** | **Returns Analytics Daily Granularity** | **DELIVERED** | Story 127.2 |

### Previously Resolved (2026-05-04 to 2026-05-06)

| Request | Title | Status | Epic |
|---------|-------|--------|------|
| **#173** | **FE Validation Response (Epics 101-109)** | **RESPONDED** | Epics 107-109 |
| **#170** | **Backend Update Epics 107-109** | **CORRECTED** | Epics 107-109 |
| **#159** | **Preliminary Tax for Incomplete Weeks** | **IMPLEMENTED** | Story 108.6 + 109.3 |
| #153 | FBO Return Classification Gap | CLOSED | Epic 106 + Story 108.3 |
| #154 | Buyout/Return Data Mismatch | CLOSED | Story 108.3 (sdk.returns) |
| #148 | Fulfillment Returns Count=0 | FIXED | Epic 106 + Story 107.8 |
| #150 | Monitoring False Alarms | RESOLVED | Story 107.9 |
| #158 | Stale Documentation Shards | CLOSED | Story 108.4 |

### Previously Resolved (2026-04-30 to 2026-05-04)

| Request | Title | Status | Epic |
|---------|-------|--------|------|
| #157 | Daily Finance Breakdown | IMPLEMENTED | Epic 88 |
| #165 | Orders Price Inversion | CLOSED | Story 103.1 |
| #58 | retail_price_total | IMPLEMENTED | Epic 104 |
| #61 | WB Column Rename | DEPLOYED & STABLE | Dec 2024 |
| #113 | Margin Empty State | DOCUMENTED | Not a bug |

---

## Epic Completion Status

| Epic | Name | Status | QA Score |
|------|------|--------|----------|
| Epic 5 | COGS History Management | COMPLETE | 90/100 |
| Epic 6 | Advanced Analytics | COMPLETE | 91.5/100 |
| Epic 6-FE | Frontend Analytics | COMPLETE | 94/100 |
| Epic 20 | Auto Margin Recalculation | COMPLETE | - |
| Epic 24 | Paid Storage Analytics | COMPLETE | - |
| Epic 26 | Operating Profit | COMPLETE | - |
| Epic 31 | SKU Financials | COMPLETE | - |
| **Epic 33** | **Advertising Analytics** | **COMPLETE** | - |
| **Epic 34** | **Telegram Notifications** | **COMPLETE** | - |
| **Epic 35** | **Total Sales & Organic** | **COMPLETE (bugfix)** | - |
| **Epic 36** | **Product Card Linking** | **PRODUCTION READY** | - |
| **Epic 40** | **Orders FBS Integration** | **COMPLETE** | - |
| **Epic 51** | **FBS Historical Analytics** | **COMPLETE** | - |
| **Epic 53** | **FBS Supply Management** | **COMPLETE** | - |
| **Epic 56** | **Historical Inventory Import** | **COMPLETE** | - |
| **Epic 57** | **FBS Analytics Enhancement** | **COMPLETE** | - |
| **Epic 60** | **FBO/FBS Order Analytics** | **✅ COMPLETE** | 34 SP (6 stories) |
| **Epic 68** | **Marketing Funnel Analytics** | **COMPLETE** | - |
| **Epic 71** | **Return Classification** | **COMPLETE** | - |
| **Epic 80** | **SDK v3.4.0 Migration** | **COMPLETE** | - |
| **Epic 84** | **SDK v3.5.0 Migration** | **COMPLETE** | - |
| **Epic 86** | **Dev Workflow & Infrastructure** | **COMPLETE** | - |
| **Epic 87** | **Frontend Integration & Test Infra** | **COMPLETE** | - |
| **Epic 88** | **Daily Breakdown & Marketing Fixes** | **COMPLETE** | - |
| **Epic 91** | **SDK v3.8.1 Finance Reports v1** | **COMPLETE** | - |
| **Epic 92** | **Acquiring API & Monitor Dashboard** | **COMPLETE** | - |
| **Epic 94** | **ML Infrastructure Foundation** | **COMPLETE** | - |
| **Epic 95** | **Sales Forecasting Pipeline** | **COMPLETE** | - |
| **Epic 100** | **ML Admin, Monitoring & CI** | **COMPLETE** | - |
| **Epic 104** | **Frontend Requests & Tech Debt** | **COMPLETE** | - |
| **Epic 106** | **FBO Return Classification** | **COMPLETE** | - |
| **Epic 107** | **Frontend Response Fixes** | **COMPLETE** | - |
| **Epic 108** | **SDK Returns & Tech Debt Sweep** | **COMPLETE** | - |
| **Epic 109** | **SDK Integration Debt & Housekeeping** | **COMPLETE** | - |

---

## Integration Guides

| Guide | Purpose | Location |
|-------|---------|----------|
| **#24** | Margin & COGS Integration | [24-margin-cogs-integration-guide.md](./24-margin-cogs-integration-guide.md) |
| **#29** | COGS Temporal Versioning | [29-cogs-temporal-versioning-and-margin-calculation.md](./29-cogs-temporal-versioning-and-margin-calculation.md) |
| **#30** | SKU Analytics Architecture | [30-sku-analytics-data-architecture.md](./30-sku-analytics-data-architecture.md) |
| **#114** | Margin Calculation FrontEnd | [114-margin-calculation-frontend-guide.md](./114-margin-calculation-frontend-guide.md) |

---

## Topic Index

### FBS/FBO Analytics & Related
- **#93** [Epic 40 - Orders FBS Frontend Guide](./93-epic-40-orders-fbs-frontend-guide.md)
- **#109** [Epic 40 - WB Native Status History API](./109-epic-40-wb-native-status-history-api.md)
- **#110** [Epic 51 - FBS Historical Analytics API](./110-epic-51-fbs-historical-analytics-api.md) - Cross-API (OrdersFBS + Reports + Analytics)
- **#111** [Epic 53 - FBS Supply Management API](./111-epic-53-supply-management-api.md) - Supply lifecycle, stickers, documents
- **#130** [Epic 60 - Dashboard FBO Orders API](./130-DASHBOARD-FBO-ORDERS-API.md) - FBO/FBS separation, fulfillment analytics (COMPLETE)

### COGS & Margin Calculation
- **#07** [COGS/Margin Analytics includeCogs Parameter](./07-cogs-margin-analytics-includecogs-parameter.md)
- **#09** [Epic 18 - COGS Management API](./09-epic-18-cogs-management-api-backend.md)
- **#11** [Undefined Fields in COGS Assignment](./11-undefined-fields-in-cogs-assignment-response.md)
- **#12** [COGS Update Conflict 409 Error](./12-cogs-update-conflict-409-error.md)
- **#14** [Automatic Margin Recalculation on COGS Update](./14-automatic-margin-recalculation-on-cogs-update.md) - **FIXED (#120)**
- **#16** [COGS History and Margin Data Structure](./16-cogs-history-and-margin-data-structure.md)
- **#24** [Margin & COGS Integration Guide](./24-margin-cogs-integration-guide.md)
- **#29** [COGS Temporal Versioning and Margin Calculation](./29-cogs-temporal-versioning-and-margin-calculation.md)
- **#31** [COGS Display Improvement - Show Applicable COGS](./31-cogs-display-improvement-show-applicable-cogs.md)
- **#33** [COGS createCogs Not Closing Previous Versions](./33-cogs-createCogs-not-closing-previous-versions.md)
- **#113** [Margin Calculation Empty State Behavior](./113-margin-calculation-empty-state-behavior.md) - **DOCUMENTED (Not a Bug)**
- **#114** [Margin Calculation FrontEnd Quick Reference](./114-margin-calculation-frontend-guide.md)
- **#120** [Backend Fixes Completed](./120-backend-fixes-completed.md) - **FIXED**

### Warehouses & Tariffs
- **#98** [Warehouses & Tariffs Coefficients API](./98-warehouses-tariffs-coefficients-api.md)
- **#101** [Epic 52 - Tariff Settings Admin API](./101-epic-52-tariff-settings-admin-api.md)
- **#102** [Tariffs Base Rates - Frontend Guide](./102-tariffs-base-rates-frontend-guide.md)
- **#105** [Tariffs Storage Fallback Guide](./105-tariffs-storage-fallback-guide.md)
- **#106** [Tariffs Quick Reference](./106-tariffs-quick-reference.md)
- **#108** [Two Tariff Systems Guide](./108-two-tariff-systems-guide.md)

### Products & SKUs
- **#13** [Products Pagination WB SDK Issue](./13-products-pagination-wb-sdk-issue.md)
- **#15** [Add includeCogs to Product List Endpoint](./15-add-includecogs-to-product-list-endpoint.md)
- **#30** [SKU Analytics Data Architecture](./30-sku-analytics-data-architecture.md)
- **#34** [Historical Margin Not Showing for Product](./34-historical-margin-not-showing-for-product-173589742.md)
- **#46** [Product COGS Coverage Counting Bug](./46-product-cogs-coverage-counting-bug.md)
- **#86** [Epic 36 - SKU Mode imtId Field](./86-epic-36-sku-mode-imtid-field.md)
- **#87** [Backend Response - imtId Field in SKU Mode](./87-epic-36-backend-response-imtid-sku.md)
- **#99** [Products Dimensions & Category API](./99-products-dimensions-category-api.md)

### Advertising Analytics
- **#71** [Advertising Analytics - Epic 33](./71-advertising-analytics-epic-33.md) - **COMPLETE**
- **#72** [Advertising Sync Status 404 Error](./72-advertising-sync-status-404-error.md)
- **#74** [Advertising API Format Mismatch](./74-advertising-api-format-mismatch.md)
- **#75** [Advertising Revenue Always Zero](./75-advertising-revenue-zero.md) - **FIXED**
- **#76** [Efficiency Filter Not Implemented](./76-efficiency-filter-not-implemented.md) - **RESOLVED**
- **#77** [ROI Calculation Validation](./77-roi-calculation-validation.md)
- **#78** [Epic 35 Bugfix & SDK Upgrade](./78-epic-35-bugfix-sdk-upgrade.md) - **FIXED**
- **#115** [Advertising Date Filter Empty State Behavior](./115-advertising-date-filter-empty-state-behavior.md)
- **#116** [Advertising Date Range FrontEnd Guide](./116-advertising-date-range-frontend-guide.md)

### Orders & Reports
- **#40** [Epic 6-FE Deferred Items Backend Response](./40-epic-6-fe-deferred-items-backend-response.md)
- **#41** [Separate Sales & Returns Tracking](./41-separate-sales-returns-tracking.md)
- **#42** [Fix Duplicate Import Data](./42-fix-duplicate-import-data.md)
- **#54** [Supply Planning API Endpoint](./54-supply-planning-api-endpoint.md)
- **#55** [Liquidity API Endpoint](./55-liquidity-api-endpoint.md)
- **#109** [Epic 40 - WB Native Status History API](./109-epic-40-wb-native-status-history-api.md)

### Storage & Logistics
- **#36** [Epic 24 - Paid Storage Analytics API](./36-epic-24-paid-storage-analytics-api.md)
- **#37** [Epic 24 - Storage Endpoints Not Implemented](./37-epic-24-storage-endpoints-not-implemented.md)
- **#38** [Storage Analytics - Improve Empty Data Handling](./38-storage-analytics-improve-empty-data-handling.md)
- **#39** [Epic 24 - Storage Import JSON Fix](./39-epic-24-storage-import-json-fix.md)
- **#48** [Storage Multi-Brand Filter Bug](./48-storage-multi-brand-filter-bug.md)
- **#51** [Paid Storage Import Methods](./51-paid-storage-import-methods.md)
- **#52** [Storage SKU Breakdown for Weekly Reports](./52-storage-sku-breakdown-for-weekly-reports.md)
- **#62** [Storage Data Sources Comparison](./62-storage-data-sources-comparison.md)
- **#66** [Storage Source Unification](./66-storage-source-unification.md)
- **#67** [Storage Comparison UI](./67-storage-comparison-ui.md)

---

## Complete Request List by Number

| Range | Shard | Topics |
|-------|-------|--------|
| #01-#21 | [Shard 05](./README-SHARD-05-margin-products.md) | Auth, CORS, Products, Margin, COGS basics |
| #22-#26 | [Shard 05](./README-SHARD-05-margin-products.md) + [Shard 04](./README-SHARD-04-cogs-analytics.md) | Request summary, integration guides |
| #27-#44 | [Shard 04](./README-SHARD-04-cogs-analytics.md) | Historical margin, COGS versioning, Epic 5/6 |
| #45-#64 | [Shard 03](./README-SHARD-03-resolved-financial.md) | Financial metrics, WB Dashboard, Per-SKU |
| #71-#90 | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) | Epic 33-36, Telegram, SDK upgrade |
| #93, #98-120 | [Shard 08](./README-SHARD-08-fbs-warehouses.md) + [Shard 09](./README-SHARD-09-margin-fixes.md) | FBS, Warehouses, Tariffs, Margin fixes |
| #121-#211 | Individual files in this directory | Contract gaps, bug reports, daily trends (#210, #211) |

---

## Quick Reference

### Request Workflow
1. **Discovery** -> **Investigation** -> **Documentation** -> **Notification**
2. **Implementation** -> **Backend Response** -> **Testing** -> **Closure**

See [Shard 06](./README-SHARD-06-workflow-guides.md) for full workflow details.

### File Naming Convention
- Original requests: `XX-[kebab-case-title].md`
- Backend responses: `XX-[kebab-case-title]-backend.md`
- Summaries: `XX-[kebab-case-title]-[type].md`
- Epic documents: `epic-XX-[title].md`

### Related Documentation
- Backend docs: `docs/stories/`, `docs/architecture/`
- Frontend docs: `frontend/docs/stories/`, `frontend/docs/api-integration-guide.md`
- API Reference: `docs/API-PATHS-REFERENCE.md`
- Swagger: `http://localhost:3000/api`

---

## Recent Updates (2026-05-15)

### Validation Sweep — All 211 Files Confirmed Resolved
Full audit of all files in `docs/request-backend/`. Results: 197 resolved, 7 reference docs, 7 guides. Zero pending items.

- **#162**: FCU Aggregation Endpoint — confirmed RESOLVED (endpoint live at `GET /v1/shipment-cost/by-sku`)
- **#163**: DBW Order Test Seeding — confirmed RESOLVED (Stories 87.1 + 103.2)
- **#167**: Pipeline Health errorRate Out of Range — confirmed RESOLVED (commit `c9ba2187`, Story 93.1)
- **#171**: box_type Storage Tariff — IMPLEMENTED (pallet storage = 1.5x box at `price-calculator.service.ts`)
- **#112**: Epic 57 FBS Analytics — confirmed RESOLVED (REST API existed in `fbs-analytics.controller.ts`)
- **#160**: Marketing Analytics Audit — backend-side RESOLVED (all 4 bugs fixed)

### Previously Resolved (2026-05-04 to 2026-05-06)
- **#159**: Preliminary tax for incomplete weeks — **IMPLEMENTED** (Story 108.6 + 109.3, endpoint live)
- **#153**: FBO return classification gap — **CLOSED** (Epic 106.2 + Story 108.3)
- **#154**: Buyout/return data mismatch — **CLOSED** (Story 108.3 sdk.returns)
- **#148**: Fulfillment returns count — **FIXED** (Epic 106 + Story 107.8)
- **#150**: Monitoring false alarms — **RESOLVED** (Story 107.9)
- **#158**: Stale documentation shards — **CLOSED** (Story 108.4)
- **#170**: Backend update report Epics 107-109 — **INFO** (this document)

### Previously Resolved (Epics 101-108)
- **#157**: Daily finance breakdown — **IMPLEMENTED** (Epic 88)
- **#165**: Orders price inversion — **CLOSED** (Story 103.1)
- **#58**: retail_price_total — **IMPLEMENTED** (Epic 104, Story 104.1)
- **#61**: WB Column Rename — **DEPLOYED & STABLE** (Dec 2024)
- **#113**: Margin empty state — **DOCUMENTED** (not a bug)

### All Open Requests Closed
All 211 frontend requests are now resolved. New requests → `docs/request-backend/` starting from **#212**.

---

**[All Requests Summary](./23-all-requests-completed-summary.md)** - Comprehensive summary of all completed requests
