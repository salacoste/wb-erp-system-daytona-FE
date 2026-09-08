# Epic 36-FE: Product Card Linking - Frontend Integration

## Overview

Frontend implementation for Epic 36 - Product Card Linking (Склейки). Backend API is **100% complete** and ready for integration.

**Business Value**: Sellers can view advertising metrics grouped by WB merged product cards (склейки), solving the "spend=0 but revenue>0" problem and providing accurate ROAS/ROI calculations for products that share the same imtId.

**Problem Solved**: Currently, products like "ter-09" and "ter-10" show "🔵 Нет данных" status because they have revenue but no direct spend (WB attributes advertising budget to the main merged card). Epic 36 groups all products with the same `imtId` to show correct aggregated metrics.

## Backend Status

✅ **100% Complete** (Story 36.6 done 2025-12-27)

- Database: `products.imt_id` column populated via daily sync
- API: `GET /v1/analytics/advertising?group_by=imtId` parameter supported
- Aggregation: Merged groups with correct ROAS/ROI calculations
- Testing: 96.63% coverage, all E2E tests passing
- Observability: Prometheus metrics, Grafana dashboard

📖 **Documentation**:

- API Contract: `docs/request-backend/83-epic-36-api-contract.md`
- Implementation Plan: `docs/implementation-plans/epic-36-frontend-integration.md`
- UI Mockup: `docs/wireframes/epic-36-ui-mockup.md`

## Stories

### MVP Stories (✅ COMPLETE)

| Story                                              | Title                        | Priority | Points | Status  | Sprint |
| -------------------------------------------------- | ---------------------------- | -------- | ------ | ------- | ------ |
| [36.1-fe](story-36.1-fe-types-update.md)           | TypeScript Types Update      | High     | 3      | ✅ Done | 1      |
| [36.2-fe](story-36.2-fe-api-client-hooks.md)       | API Client & Hooks Update    | High     | 2      | ✅ Done | 1      |
| [36.3-fe](story-36.3-fe-merged-badge-component.md) | MergedProductBadge Component | High     | 3      | ✅ Done | 1      |
| [36.4-fe](story-36.4-fe-page-layout-toggle.md)     | Page Layout & Toggle UI      | High     | 5      | ✅ Done | 1      |
| [36.5-fe](story-36.5-fe-testing-documentation.md)  | Testing & Documentation      | Medium   | 3      | ✅ Done | 1      |

**MVP Points**: 16 | **Status**: ✅ **COMPLETE** (2025-12-28)
**Test Coverage**: 91 tests (5 E2E + 21 Integration + 65 Unit)

## Sprint Plan (Proposed)

| Sprint   | Stories                      | Points | Focus                    |
| -------- | ---------------------------- | ------ | ------------------------ |
| Sprint 1 | 36.1, 36.2, 36.3, 36.4, 36.5 | 16     | Full Epic 36 integration |

**Rationale**: All stories are tightly coupled (single feature). Backend is ready, no blockers.

## Dependencies

- **Backend**: ✅ Epic 36 complete (Story 36.6 done)
- **Frontend Baseline**: ✅ Epic 33 (Advertising Analytics page exists)
- **API Documentation**: `docs/request-backend/83-epic-36-api-contract.md`
- **Existing Components**: Badge, Tooltip (shadcn/ui)

---

## Example: Before vs After

### Before Epic 36 (Current - Individual SKUs)

```
Артикул    Затраты   Выручка   ROAS    Статус
------------------------------------------------------
ter-09     0₽        1,105₽    —       🔵 Нет данных
ter-10     0₽        1,489₽    —       🔵 Нет данных
ter-13-1   11,337₽   31,464₽   2.8x    ✅ Рентабельно
```

**Problem**: ter-09 and ter-10 show "unknown" status despite having revenue.

### After Epic 36 (Grouped by imtId)

```
Группа                      Затраты   Выручка   ROAS   Статус
--------------------------------------------------------------
🔗 Склейка (3) #328632      11,337₽   34,058₽   3.0x   ✅ Рентабельно
   ├─ ter-09
   ├─ ter-10
   └─ ter-13-1

Индивидуальный товар       5,000₽    7,500₽    1.5x   ✅ Рентабельно
```

**Solution**: Correct ROAS/ROI for merged groups, all products show proper status.

---

## UI Design Reference

### Toggle (Epic 36 - NEW)

```
+-----------------------------------------------------------------------+
| Рекламная аналитика                                   [Sync: Healthy] |
| Главная > Аналитика > Реклама                                         |
+-----------------------------------------------------------------------+
| Период: [2025-12-08] - [2025-12-21]                                   |
|                                                                        |
| Группировка: [По артикулам] [По склейкам] ← NEW TOGGLE                |
+-----------------------------------------------------------------------+
```

### Merged Group Badge (Epic 36 - NEW)

```
+-----------------------------------------------------------------------+
| Эффективность рекламы                      Sort: [Затраты ▼]          |
| +----------+---------+--------+--------+------+------+----------+     |
| | Товар    | Затраты | Выручка| ROAS   | ROI  | Закз | Статус   |     |
| +----------+---------+--------+--------+------+------+----------+     |
| | Группа   | 11,337₽ | 34,058₽| 3.0x   | +46% | 13   | [Хорошо] |     |
| | #328632  |         |        |        |      |      |          |     |
| | 🔗 Склейка (3) ⓘ ← BADGE with TOOLTIP                           |     |
| +----------+---------+--------+--------+------+------+----------+     |
```

**Tooltip Content** (on hover):

```
┌─────────────────────────────────────┐
│ Объединённая карточка #328632       │
│                                     │
│ Товары в группе:                    │
│ • ter-09 (#173588306)               │
│ • ter-10 (#173589306)               │
│ • ter-13-1 (#270937054)             │
│                                     │
│ 💡 Рекламные затраты основной       │
│    карточки распределены между      │
│    всеми товарами группы            │
└─────────────────────────────────────┘
```

---

## Technical Approach

### API Changes (Epic 36)

**Endpoint**: `GET /v1/analytics/advertising` (UNCHANGED)

**NEW Parameter**: `group_by: 'sku' | 'imtId'` (default: 'sku')

**NEW Response Fields** (when `group_by=imtId`):

```typescript
interface AdvertisingItem {
  // NEW Epic 36 fields:
  type?: 'merged_group' | 'individual'
  imtId?: number | null
  mergedProducts?: MergedProduct[]

  // Existing fields...
}
```

**Backward Compatibility**: ✅ Full (default `group_by=sku` returns Epic 33 format)

### Component Structure

**New Components**:

1. `MergedProductBadge.tsx` - Badge with tooltip showing merged products
2. `MergedProductBadge.test.tsx` - Unit tests

**Modified Components**:

1. `AdvertisingAnalyticsPage` - Add toggle state and UI
2. `PerformanceMetricsTable` - Render merged group rows
3. `AdvertisingFilters` (optional) - Add group_by filter

**Modified Types**:

1. `advertising-analytics.ts` - Add GroupByMode, MergedProduct, extend AdvertisingItem

**Modified API Client**:

1. `advertising-analytics.ts` - Support group_by parameter

**Modified Hooks**:

1. `useAdvertisingAnalytics.ts` - Add useAdvertisingMergedGroups hook

---

## Acceptance Criteria (Epic Level) ✅ ALL COMPLETE

Epic 36 frontend integration is **COMPLETE**:

- [x] TypeScript types updated (GroupByMode, MergedProduct, extended AdvertisingItem)
- [x] API client sends `group_by` parameter
- [x] React Query hook supports `group_by=imtId`
- [x] UI displays "По артикулам" / "По склейкам" toggle
- [x] Merged group badge renders with correct product count
- [x] Tooltip shows all products in merged group
- [x] ROAS/ROI display correctly for merged groups (no NULL or "unknown")
- [x] Single product with imtId displays as individual (no badge)
- [x] Network errors handled gracefully
- [x] Unit tests pass for MergedProductBadge (40 tests)
- [x] Integration tests pass for grouping toggle (21 tests)
- [x] E2E tests pass for full workflow (5 scenarios)
- [x] No regressions in existing Epic 33 functionality
- [x] Code review approved
- [x] Documentation updated in `frontend/README.md`

---

## PO Questions for Verification

### Question 1: Toggle Placement

**Where should "По артикулам" / "По склейкам" toggle be placed?**

- Option A: In filters panel (alongside View By mode)
- Option B: Above table (separate toggle bar)
- Option C: In page header (next to date range)

**Recommendation**: Option A (filters panel) - consistent with existing View By toggle

### Question 2: Default Mode

**What should be the default grouping mode?**

- Option A: "По артикулам" (current behavior, familiar to users)
- Option B: "По склейкам" (show merged groups by default)

**Recommendation**: Option A (SKU) - less disruptive, users opt-in to new feature

### Question 3: Badge Style

**How should merged group badge look?**

- Option A: `🔗 Склейка (3)` (with link emoji)
- Option B: `Склейка (3 товара)` (without emoji)
- Option C: `3 товара` (minimal)

**Recommendation**: Option A - visual indicator, compact, matches WB terminology

### Question 4: Tooltip Content

**What information should the tooltip show?**

- Option A: Just product list (nmId + vendorCode)
- Option B: Product list + explanation about merged cards
- Option C: Product list + individual metrics for each

**Recommendation**: Option B - helps users understand the feature

### Question 5: Mobile Behavior

**How should toggle work on mobile?**

- Option A: Same toggle (two buttons)
- Option B: Dropdown select
- Option C: Hide toggle on mobile (SKU only)

**Recommendation**: Option A - consistent across devices, touch-friendly buttons

---

## Risk Assessment

| Risk                    | Probability | Impact | Mitigation                                         |
| ----------------------- | ----------- | ------ | -------------------------------------------------- |
| Backend API changes     | Low         | High   | Backend is stable, no changes planned              |
| Performance degradation | Low         | Medium | mergedProducts adds ~2KB per group (acceptable)    |
| User confusion          | Medium      | Low    | Tooltip explanation + clear UI labels              |
| Regression in Epic 33   | Low         | High   | Full backward compatibility, comprehensive testing |
| Scope creep             | Medium      | Medium | PO approval required for all stories               |

---

## Definition of Done (Epic Level) ✅ ALL COMPLETE

- [x] All 5 stories completed and QA approved
- [x] Backend integration verified (E2E tests)
- [x] No regressions in Epic 33 functionality
- [x] UI matches approved wireframes
- [x] Russian localization complete
- [x] Mobile responsive (tested on 3 devices)
- [x] Code review approved by senior developer
- [x] Documentation updated:
  - [x] `frontend/README.md` - Epic 36 section added
  - [x] API integration guide updated
  - [x] Component usage examples added
- [x] PO acceptance sign-off

---

## Related Documentation

### Backend Documentation

- **Epic 36 Main**: `/docs/stories/epic-36/` (backend stories)
- **API Contract**: `docs/request-backend/83-epic-36-api-contract.md`
- **Implementation Plan**: `docs/implementation-plans/epic-36-frontend-integration.md`
- **UI Mockup**: `docs/wireframes/epic-36-ui-mockup.md`
- **Request #82**: Card Linking Investigation (problem context)

### Frontend Documentation

- **Epic 33**: `docs/stories/epic-33/` (baseline advertising analytics)
- **README**: `frontend/README.md` (project overview)

---

**Document Version**: 1.2
**Created**: 2025-12-28
**Last Updated**: 2026-01-02
**Status**: ✅ **COMPLETE** (2025-12-28)
**Test Coverage**: 91 tests (5 E2E + 21 Integration + 65 Unit)
**Completion**: All 5 stories implemented, 100% backward compatible with Epic 33
