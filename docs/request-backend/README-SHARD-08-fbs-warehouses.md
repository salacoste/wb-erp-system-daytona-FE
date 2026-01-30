# FBS & Warehouses - Epics 51, 52, 53, Warehouses & Tariffs

[< Back to Index](./README.md) | [< Previous: Recent Epics](./README-SHARD-01-recently-resolved-epics.md) | [Next: Margin Fixes >](./README-SHARD-09-margin-fixes.md)

---

This shard contains requests related to FBS (Fulfillment by Seller) orders, warehouse management, and tariff configurations.

---

## Epic Status: FBS & Warehouses

| Epic | Name | Status | Stories |
|------|------|--------|---------|
| **Epic 40** | Orders FBS Integration | COMPLETE | - |
| **Epic 51** | FBS Historical Analytics | COMPLETE | 5 stories (25 SP) |
| **Epic 52** | Tariff Settings Admin | COMPLETE | - |
| **Epic 53** | FBS Supply Management | COMPLETE | 6 stories (26 SP) |

---

## Request #111: Epic 53 - FBS Supply Management API

**Date**: 2026-01-29
**Priority**: NEW FEATURE
**Status**: COMPLETE - Full supply lifecycle management
**Component**: Backend API - Supplies Module
**Epic**: Epic 53 - FBS Supply Management

**Summary**: Complete API for managing FBS supplies from creation to delivery.

**Key Features**:
- 9 API endpoints for full supply lifecycle
- Supply statuses: OPEN, CLOSED, DELIVERING, DELIVERED, CANCELLED
- Add/remove orders (up to 1000 per request)
- Generate stickers in PNG/SVG/ZPL formats
- Download documents (stickers, barcodes)
- Automatic status sync with Wildberries

**API Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/supplies` | List supplies with filters |
| POST | `/v1/supplies` | Create new supply |
| GET | `/v1/supplies/:id` | Get supply details |
| POST | `/v1/supplies/:id/orders` | Add orders to supply |
| DELETE | `/v1/supplies/:id/orders` | Remove orders from supply |
| POST | `/v1/supplies/:id/close` | Close supply |
| POST | `/v1/supplies/:id/stickers` | Generate stickers |
| GET | `/v1/supplies/:id/documents/:docType` | Download document |
| POST | `/v1/supplies/sync` | Manual status sync |

**Documentation**:
- **[111-epic-53-supply-management-api.md](./111-epic-53-supply-management-api.md)** - COMPLETE API SPEC (830 lines)
  - TypeScript interfaces
  - Request/response examples
  - Error handling
  - React Query hooks
  - Component implementation patterns

**FrontEnd TODO**:
- [ ] Create `/supplies` page with table
- [ ] Implement drag & drop for orders
- [ ] Add sticker generation UI
- [ ] Build document download functionality
- [ ] Status timeline visualization

---

## Request #110: Epic 51 - FBS Historical Analytics API

**Date**: 2026-01-29
**Priority**: NEW FEATURE
**Status**: COMPLETE - 365-day analytics
**Component**: Backend API - Historical Analytics
**Epic**: Epic 51 - FBS Historical Analytics

**Summary**: Cross-API historical analytics (0-30 days OrdersFBS + 31-90 days Reports + 91-365 days Analytics).

**Data Sources**:
| Period | Source | Update |
|--------|--------|--------|
| 0-30 days | OrdersFBS API | Real-time |
| 31-90 days | Reports API | Daily 04:00 MSK |
| 91-365 days | Analytics API | Weekly |

**API Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/analytics/orders/trends` | Historical trends (365 days) |
| GET | `/v1/analytics/orders/seasonal` | Seasonal patterns (weekly/monthly/quarterly) |
| GET | `/v1/analytics/orders/compare` | Period comparison (MoM/QoQ/YoY) |
| POST | `/v1/admin/backfill/start` | Start historical import (Owner) |
| GET | `/v1/admin/backfill/status` | Backfill status (Owner) |
| POST | `/v1/admin/backfill/pause` | Pause import (Owner) |
| POST | `/v1/admin/backfill/resume` | Resume import (Owner) |

**Aggregation Levels**: `day`, `week`, `month`

**Documentation**:
- **[110-epic-51-fbs-historical-analytics-api.md](./110-epic-51-fbs-historical-analytics-api.md)** - COMPLETE API SPEC (762 lines)
  - TypeScript interfaces for all endpoints
  - Seasonal pattern analysis
  - Period comparison metrics
  - Backfill admin operations
  - Rate limits and caching

**FrontEnd TODO**:
- [ ] Extend date range picker to 365 days
- [ ] Add aggregation level switcher
- [ ] Create seasonal patterns view
- [ ] Build period comparison UI
- [ ] Admin backfill panel (Owner only)

---

## Request #109: Epic 40 - WB Native Status History API

**Date**: 2026-01-29
**Priority**: NEW FEATURE
**Status**: COMPLETE
**Component**: Backend API - Orders FBS Module
**Epic**: Epic 40 - Orders FBS Integration

**Summary**: Native Wildberries status history for FBS orders.

**Key Features**:
- WB native status tracking
- Status transition history
- Timestamp for each status change
- Integration with existing orders_fbs table

**Documentation**:
- **[109-epic-40-wb-native-status-history-api.md](./109-epic-40-wb-native-status-history-api.md)**

---

## Request #108: Two Tariff Systems Guide

**Date**: 2026-01-28
**Priority**: DOCUMENTATION
**Status**: COMPLETE - Architecture guide
**Component**: Documentation - Tariff System
**Related**: Request #98, #101-102

**Summary**: Complete guide explaining the two-tier tariff system architecture.

**Architecture**:
| Level | Table | Purpose |
|-------|-------|---------|
| **Base Tariffs** | `warehouse_tariff_base_rates` | WB default rates by warehouse |
| **Actual Tariffs** | `warehouse_tariff_actual` | Applied rates with coefficients |

**Coefficient Types**:
- Storage coefficients
- Acceptance coefficients
- Logistics coefficients

**Documentation**:
- **[108-two-tariff-systems-guide.md](./108-two-tariff-systems-guide.md)** - ARCHITECTURE GUIDE

---

## Request #106: Tariffs Quick Reference

**Date**: 2026-01-28
**Priority**: DOCUMENTATION
**Status**: COMPLETE - Quick reference card
**Component**: Documentation - Tariff System

**Summary**: Quick reference for tariff-related API endpoints and concepts.

**Key Endpoints**:
| Endpoint | Purpose |
|----------|---------|
| `GET /v1/tariffs/warehouses` | List warehouses with tariffs |
| `GET /v1/tariffs/coefficients` | Get tariff coefficients |
| `PUT /v1/tariffs/coefficients` | Update coefficients (Owner) |

**Documentation**:
- **[106-tariffs-quick-reference.md](./106-tariffs-quick-reference.md)**

---

## Request #105: Tariffs Storage Fallback Guide

**Date**: 2026-01-28
**Priority**: DOCUMENTATION
**Status**: COMPLETE - Fallback strategy
**Component**: Documentation - Tariff System

**Summary**: How the system handles missing storage tariffs with fallback logic.

**Fallback Hierarchy**:
1. Actual tariff for warehouse
2. Base tariff for warehouse
3. Default rate for tariff type

**Documentation**:
- **[105-tariffs-storage-fallback-guide.md](./105-tariffs-storage-fallback-guide.md)**

---

## Request #102: Tariffs Base Rates - Frontend Guide

**Date**: 2026-01-27
**Priority**: DOCUMENTATION
**Status**: COMPLETE - Frontend integration
**Component**: Documentation - Tariff System
**Related**: Epic 52

**Summary**: Frontend guide for displaying base tariffs and warehouse information.

**Key Concepts**:
- Warehouse directory (ID, name, address)
- Base rate types (storage, acceptance, logistics)
- Rate units (per m3/day, per item, etc.)

**Documentation**:
- **[102-tariffs-base-rates-frontend-guide.md](./102-tariffs-base-rates-frontend-guide.md)**

---

## Request #101: Epic 52 - Tariff Settings Admin API

**Date**: 2026-01-27
**Priority**: NEW FEATURE
**Status**: COMPLETE - Admin API
**Component**: Backend API - Tariff Module
**Epic**: Epic 52 - Tariff Settings Admin

**Summary**: Admin API for managing tariff coefficients and overrides.

**Key Features**:
- CRUD for tariff coefficients
- Warehouse-specific overrides
- Effective date ranges
- Audit trail

**Documentation**:
- **[101-epic-52-tariff-settings-admin-api.md](./101-epic-52-tariff-settings-admin-api.md)**

---

## Request #98: Warehouses & Tariffs Coefficients API

**Date**: 2026-01-26
**Priority**: NEW FEATURE
**Status**: COMPLETE - Backend response
**Component**: Backend API - Warehouses & Tariffs
**Related**: Backend response in [98-warehouses-tariffs-BACKEND-RESPONSE.md](./98-warehouses-tariffs-BACKEND-RESPONSE.md)

**Summary**: API for retrieving warehouse information and tariff coefficients.

**Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/warehouses` | List all warehouses |
| GET | `/v1/warehouses/:id` | Warehouse details |
| GET | `/v1/tariffs/warehouses` | Warehouses with tariffs |
| GET | `/v1/tariffs/coefficients` | Tariff coefficients |
| PUT | `/v1/tariffs/coefficients` | Update coefficients |

**Documentation**:
- **[98-warehouses-tariffs-coefficients-api.md](./98-warehouses-tariffs-coefficients-api.md)** - API SPEC
- **[98-warehouses-tariffs-BACKEND-RESPONSE.md](./98-warehouses-tariffs-BACKEND-RESPONSE.md)** - BACKEND RESPONSE

---

## Request #93: Epic 40 - Orders FBS Frontend Guide

**Date**: 2026-01-25
**Priority**: DOCUMENTATION
**Status**: COMPLETE - Frontend integration guide
**Component**: Frontend Documentation - Epic 40
**Epic**: Epic 40 - Orders FBS Integration

**Summary**: Complete frontend integration guide for FBS orders module.

**Key Features**:
- Orders list with filters
- Order details view
- Status tracking
- Native status history (Request #109)
- Supply management integration (Epic 53)

**Documentation**:
- **[93-epic-40-orders-fbs-frontend-guide.md](./93-epic-40-orders-fbs-frontend-guide.md)**

---

## Tariff Documentation Summary

| Document | Purpose | Status |
|----------|---------|--------|
| **#107** | Tariffs Documentation Update Summary | COMPLETE |
| **#108** | Two Tariff Systems Guide | COMPLETE |
| **#106** | Tariffs Quick Reference | COMPLETE |
| **#105** | Tariffs Storage Fallback Guide | COMPLETE |
| **#104** | Tariffs Formulas Validation | COMPLETE |
| **#103** | Documentation Validation Report | COMPLETE |
| **#102** | Tariffs Base Rates Frontend Guide | COMPLETE |

---

## Rate Limits & Performance

| Endpoint | Rate Limit | Cache TTL |
|----------|------------|-----------|
| `/v1/analytics/orders/*` | 60 req/min | 5 min |
| `/v1/supplies` | 30 req/min | 1 min |
| `/v1/supplies/:id` | 60 req/min | 2 min |
| `/v1/admin/backfill/*` | 10 req/min | - |
| `/v1/tariffs/*` | 60 req/min | 10 min |
| `/v1/warehouses` | 60 req/min | 1 hour |

---

[< Back to Index](./README.md) | [< Previous: Recent Epics](./README-SHARD-01-recently-resolved-epics.md) | [Next: Margin Fixes >](./README-SHARD-09-margin-fixes.md)
