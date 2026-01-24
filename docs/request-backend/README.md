# Frontend -> Backend Requests Index

Documentation of requests from frontend team to backend team and backend team responses.

**Last Updated**: 2026-01-21 | **Total Requests**: 70+ | **Active**: 1 | **Backlog**: 1 | **Resolved**: 69+

---

## Quick Navigation

| Shard | Content | Requests |
|-------|---------|----------|
| **[Shard 01: Recent Epics](./README-SHARD-01-recently-resolved-epics.md)** | Epic 33-36, Telegram, Advertising | #71, #73, #75-78, #85-90, #99 |
| **[Shard 02: Pending](./README-SHARD-02-pending-financial.md)** | WB Column Rename, retail_price | #58, #61 |
| **[Shard 03: Financial](./README-SHARD-03-resolved-financial.md)** | Per-SKU, Storage, WB Dashboard | #45-51, #56-59, #62, #64 |
| **[Shard 04: COGS & Analytics](./README-SHARD-04-cogs-analytics.md)** | Epic 5/6, COGS Management | #27-28, #31-33, #36, #40, #44 |
| **[Shard 05: Margin & Products](./README-SHARD-05-margin-products.md)** | Margin, Products API, #01-#21 | #01-21, #25-26 |
| **[Shard 06: Workflow & Guides](./README-SHARD-06-workflow-guides.md)** | Process, Integration Guides | Guide #24, #29, #30 |
| **[Shard 07: Status & Auth](./README-SHARD-07-status-auth.md)** | Epic Status, JWT Auth | Story 23.10 |

---

## Request Status Summary

### Active & Pending

| Request | Title | Priority | Shard |
|---------|-------|----------|-------|
| #61 | WB Column Rename (Dec 2024) | HIGH | [Shard 02](./README-SHARD-02-pending-financial.md) |
| #58 | retail_price_total Aggregation | HIGH | [Shard 02](./README-SHARD-02-pending-financial.md) |

### Latest Resolved (2025-12 to 2026-01)

| Request | Title | Status | Shard |
|---------|-------|--------|-------|
| #99 | Products Dimensions & Category API | DOCS UPDATED | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #90 | Telegram System Architecture | COMPLETE | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #89 | Telegram Integration Guide | COMPLETE | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #87 | imtId Field in SKU Mode | IMPLEMENTED | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #85 | Epic 36 Production Ready | COMPLETE | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #78 | Epic 35 Bugfix & SDK v2.4.0 | FIXED | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #76 | Efficiency Filter | RESOLVED | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #75 | Advertising Revenue Zero | FIXED | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #73 | Epic 34 Telegram Notifications | COMPLETE | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #71 | Epic 33 Advertising Analytics | COMPLETE | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) |
| #64 | Per-SKU Missing Expenses | IMPLEMENTED | [Shard 03](./README-SHARD-03-resolved-financial.md) |

---

## Integration Guides

| Guide | Purpose | Location |
|-------|---------|----------|
| **#24** | Margin & COGS Integration | [24-margin-cogs-integration-guide.md](./24-margin-cogs-integration-guide.md) |
| **#29** | COGS Temporal Versioning | [29-cogs-temporal-versioning-and-margin-calculation.md](./29-cogs-temporal-versioning-and-margin-calculation.md) |
| **#30** | SKU Analytics Architecture | [30-sku-analytics-data-architecture.md](./30-sku-analytics-data-architecture.md) |

---

## Epic Completion Status

| Epic | Name | Status | QA Score |
|------|------|--------|----------|
| Epic 5 | COGS History Management | COMPLETE | 90/100 |
| Epic 6 | Advanced Analytics | COMPLETE | 91.5/100 |
| Epic 6-FE | Frontend Analytics | COMPLETE | 94/100 |
| Epic 24 | Paid Storage Analytics | COMPLETE | - |
| Epic 26 | Operating Profit | COMPLETE | - |
| Epic 31 | SKU Financials | COMPLETE | - |
| Epic 33 | Advertising Analytics | COMPLETE | - |
| Epic 34 | Telegram Notifications | COMPLETE | - |
| Epic 35 | Total Sales & Organic | COMPLETE (bugfix) | - |
| Epic 36 | Product Card Linking | PRODUCTION READY | - |

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

### Related Documentation
- Backend docs: `docs/stories/`, `docs/architecture/`
- Frontend docs: `frontend/docs/stories/`, `frontend/docs/api-integration-guide.md`
- API Reference: `docs/API-PATHS-REFERENCE.md`
- Swagger: `http://localhost:3000/api`

---

## Complete Request List by Number

| Range | Shard | Topics |
|-------|-------|--------|
| #01-#21 | [Shard 05](./README-SHARD-05-margin-products.md) | Auth, CORS, Products, Margin, COGS basics |
| #25-#33 | [Shard 04](./README-SHARD-04-cogs-analytics.md) + [Shard 05](./README-SHARD-05-margin-products.md) | Historical margin, COGS versioning, Epic 5/6 |
| #36, #40, #44 | [Shard 04](./README-SHARD-04-cogs-analytics.md) | Epic 24 Storage, Epic 6-FE, Finance Summary |
| #45-#51 | [Shard 03](./README-SHARD-03-resolved-financial.md) | Cabinet Summary, Payout formula, Commission |
| #56-#64 | [Shard 03](./README-SHARD-03-resolved-financial.md) | WB Services, Loyalty, Per-SKU financials |
| #58, #61 | [Shard 02](./README-SHARD-02-pending-financial.md) | Pending: retail_price, WB Column Rename |
| #71-#99 | [Shard 01](./README-SHARD-01-recently-resolved-epics.md) | Epic 33-36, Telegram, SDK upgrade |

---

**[All Requests Summary](./23-all-requests-completed-summary.md)** - Comprehensive summary of all completed requests
