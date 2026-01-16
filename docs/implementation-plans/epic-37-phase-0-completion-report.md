# Epic 37: Phase 0 Completion Report

**Date**: 2025-12-29
**Status**: ✅ **COMPLETE**
**Duration**: 1.5 hours
**Next Phase**: Story 37.2 - MergedGroupTable Component

---

## 🎯 Phase 0 Summary

Phase 0 (Preparation) успешно завершён. Все инфраструктурные элементы для разработки Epic 37 подготовлены.

**Цель**: Подготовить mock данные и инфраструктуру для параллельной разработки frontend пока backend работает над Story 37.0 (Request #88).

---

## ✅ Completed Tasks

### Task 1: Create Mock Data Structure ✅

**File Created**: `src/mocks/data/epic-37-merged-groups.ts`

**Content**:
- ✅ **Test Group 1**: Normal merged group (6 products, imtId=328632)
  - Main product: ter-09 (spend > 0)
  - 5 child products (spend = 0)
  - Aggregate metrics validated (sum = 35,570₽)
  - Epic 35 fields included (totalSales, organicSales, organicContribution)

- ✅ **Test Group 2**: Small merged group (2 products, imtId=456789)
  - Main product: izo30white
  - 1 child product: izo30black
  - Minimum group size coverage

- ✅ **Test Group 3**: Standalone product (imtId=null)
  - Single product: izo30red
  - No merged group (individual display)

**Validation Utilities**:
- `validateAggregateIntegrity()` - ensures aggregate = SUM(products)
- `validateMainProduct()` - validates main product rules
- `validateSortOrder()` - validates sort within group

**Documentation**:
```typescript
/**
 * ⚠️ TEMPORARY DATA - REPLACE WHEN BACKEND READY
 *
 * 🔄 REPLACEMENT PROCESS (After Story 37.0 Complete):
 * 1. Backend team notifies: "Story 37.0 COMPLETE"
 * 2. Execute Story 37.1: API Validation
 * 3. If validation PASS:
 *    a. Set NEXT_PUBLIC_EPIC_37_USE_REAL_API=true in .env.local
 *    b. Test integration with real API
 *    c. Remove this mock file after successful testing
 * 4. Search codebase for: "epic-37-merged-groups" to find all usages
 */
```

---

### Task 2: Add Feature Flags ✅

**File Created**: `src/config/features.ts`

**Feature Flags**:
```typescript
export const epic37MergedGroups: Epic37FeatureConfig = {
  enabled: true,              // Enable Epic 37 feature
  useRealApi: false,          // ⚠️ DEFAULT: false (use mock data)
  debug: NODE_ENV === 'development',  // Console logging
}
```

**Environment Variables**:
```bash
# .env.local (development)
NEXT_PUBLIC_EPIC_37_MERGED_GROUPS_ENABLED=true
NEXT_PUBLIC_EPIC_37_USE_REAL_API=false  # Use mock data

# .env.production (after Story 37.0 complete)
NEXT_PUBLIC_EPIC_37_USE_REAL_API=true   # Use real backend API
```

**Usage Pattern**:
```typescript
import { features } from '@/config/features'

if (features.epic37MergedGroups.enabled) {
  // Render Epic 37 UI
}

if (features.epic37MergedGroups.useRealApi) {
  // Call real backend API
} else {
  // Use mock data
}
```

**Documentation**:
```typescript
/**
 * 🔄 REPLACEMENT PROCESS (After Story 37.0 Complete):
 * 1. Backend team completes Story 37.0 (Request #88)
 * 2. Execute Story 37.1: API Validation
 * 3. If validation PASS:
 *    a. Set NEXT_PUBLIC_EPIC_37_USE_REAL_API=true in .env.local
 *    b. Test integration with real backend API
 *    c. Verify all features work correctly
 *    d. Set default to true in this file
 * 4. If validation FAIL:
 *    a. Report issues to backend team
 *    b. Keep using mock data until fixes deployed
 *
 * 📍 MOCK DATA LOCATION (DELETE after real API ready):
 * - src/mocks/data/epic-37-merged-groups.ts
 * - Search codebase for: "epic-37-merged-groups" to find all usages
 */
```

---

### Task 3: Update TypeScript Types ✅

**File Updated**: `src/types/advertising-analytics.ts`

**New Types Added**:

1. **`MainProduct`** - Reference to main product in group
   ```typescript
   export interface MainProduct {
     nmId: number;
     vendorCode: string;
     name?: string;
   }
   ```

2. **`AggregateMetrics`** - Sum of all products in group
   ```typescript
   export interface AggregateMetrics {
     totalViews: number;
     totalClicks: number;
     totalOrders: number;
     totalSpend: number;
     totalRevenue: number;
     totalSales: number;    // Epic 35
     organicSales: number;  // Epic 35
     organicContribution: number;  // Epic 35
     roas: number | null;
     roi: number | null;
     ctr: number;
     cpc: number | null;
     conversionRate: number;
     profitAfterAds: number;
   }
   ```

3. **`MergedGroupProduct`** - Individual product with full metrics
   ```typescript
   export interface MergedGroupProduct {
     nmId: number;
     vendorCode: string;
     imtId: number;
     isMainProduct: boolean;  // true for main, false for children
     // Same fields as AggregateMetrics
     totalViews: number;
     totalClicks: number;
     // ...
   }
   ```

4. **`AdvertisingGroup`** - Complete group structure
   ```typescript
   export interface AdvertisingGroup {
     type: 'merged_group' | 'individual';
     imtId: number | null;
     mainProduct: MainProduct;
     productCount: number;
     aggregateMetrics: AggregateMetrics;
     products: MergedGroupProduct[];
   }
   ```

**Documentation**:
```typescript
/**
 * ⚠️ TEMPORARY TYPE - Uses mock data during development
 * 🔄 REPLACE with real API data after Story 37.0 complete (Request #88)
 *
 * @see Epic 37: Merged Group Table Display
 * @see docs/implementation-plans/epic-37-frontend-implementation-plan.md
 * @see Request #88: Backend API Enhancement
 */
```

---

## 📊 Deliverables

### Files Created
1. ✅ `src/mocks/data/epic-37-merged-groups.ts` (645 lines)
   - 3 test groups with complete metrics
   - Validation utilities
   - Comprehensive documentation

2. ✅ `src/config/features.ts` (189 lines)
   - Feature flag configuration
   - Environment variable integration
   - Replacement process documentation

3. ✅ `docs/implementation-plans/epic-37-frontend-implementation-plan.md` (existing)
   - Complete implementation plan
   - Timeline and dependencies

### Files Updated
1. ✅ `src/types/advertising-analytics.ts`
   - Added 4 new interfaces (158 lines added)
   - Epic 37 type definitions
   - JSDoc documentation

---

## 🔄 Mock Data → Real API Migration Path

### Current State (Development)
```
Frontend (Epic 37 UI)
    ↓
Feature Flag: useRealApi = false
    ↓
Mock Data (src/mocks/data/epic-37-merged-groups.ts)
    ↓
MergedGroupTable Component
```

### Future State (Production)
```
Frontend (Epic 37 UI)
    ↓
Feature Flag: useRealApi = true
    ↓
Real Backend API (Story 37.0 complete)
    ↓
/v1/analytics/advertising?group_by=imtId
    ↓
MergedGroupTable Component
```

### Migration Checklist
- [ ] Backend completes Story 37.0 (Request #88)
- [ ] Execute Story 37.1: API Validation
- [ ] Set `NEXT_PUBLIC_EPIC_37_USE_REAL_API=true`
- [ ] Test integration with real API
- [ ] Verify all 3 test scenarios work:
  - [ ] Normal group (6 products)
  - [ ] Small group (2 products)
  - [ ] Standalone product (imtId=null)
- [ ] **Delete mock data files**:
  - [ ] `src/mocks/data/epic-37-merged-groups.ts`
  - [ ] Search: `epic-37-merged-groups` (remove all imports)
- [ ] Update feature flag default: `useRealApi: true`

---

## 🎯 Next Steps

### Immediate (Day 1)
✅ **Story 37.2: MergedGroupTable Component** (3-4 hours)
- Create `<MergedGroupTable>` component
- Implement rowspan logic (3-tier structure)
- Handle standalone products (no rowspan)
- Unit tests with mock data

**Can start immediately** - uses mock data from Phase 0 ✅

### Parallel Track
⏳ **Backend Story 37.0** (11-17 hours) - In progress
- Backend team working on Request #88
- Expected completion: 2026-01-02

### After Story 37.0 Complete (Day 3)
⏳ **Story 37.1: API Validation** (1-2 hours)
- Test real backend API
- Validate response structure
- Switch feature flag to `useRealApi: true`

---

## 📚 Reference Links

### Documentation
- **Epic 37 Main**: `docs/epics/epic-37-merged-group-table-display.md`
- **Request #88**: `frontend/docs/request-backend/88-epic-37-individual-product-metrics.md`
- **Implementation Plan**: `docs/implementation-plans/epic-37-frontend-implementation-plan.md`

### Code Files
- **Mock Data**: `src/mocks/data/epic-37-merged-groups.ts`
- **Feature Flags**: `src/config/features.ts`
- **Types**: `src/types/advertising-analytics.ts`

### Stories
- **Story 37.1**: `docs/stories/epic-37/story-37.1-backend-api-validation.BMAD.md`
- **Story 37.2**: `docs/stories/epic-37/story-37.2-merged-group-table-component.BMAD.md`

---

## 🎉 Success Criteria

Phase 0 completion criteria: **ALL MET ✅**

- ✅ Mock data created with 3 test groups
- ✅ Feature flags configured for mock/real API switching
- ✅ TypeScript types match Request #88 structure
- ✅ Documentation includes replacement process
- ✅ All files include deletion reminders
- ✅ Mock data validates data integrity rules
- ✅ Ready for Story 37.2 development

---

**Phase 0 Status**: ✅ **COMPLETE**
**Next Phase**: 🚀 **Story 37.2 - MergedGroupTable Component** (Ready to start)
**Backend Dependency**: ⏳ **Story 37.0** (Expected: 2026-01-02)
