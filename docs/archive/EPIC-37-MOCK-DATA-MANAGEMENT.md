# Epic 37: Mock Data Management & Cleanup Plan

**Date Created**: 2025-12-29
**Status**: 🔄 **ACTIVE** - Using mock data during development
**Backend Story**: Story 37.0 (Request #88) - IN PROGRESS
**Cleanup Target**: After frontend + backend integration validation

---

## 🎯 Purpose

Epic 37 frontend разрабатывается **параллельно с backend** (Story 37.0). Используем **временные mock данные** для разработки UI компонентов пока backend API не готов.

**Критично**: Все mock данные **ОБЯЗАТЕЛЬНЫ к удалению** после успешной интеграции с backend API.

---

## 📋 Mock Data Files Inventory

### 1. Mock Data Source (PRIMARY)

**File**: `src/mocks/data/epic-37-merged-groups.ts`

**Purpose**: Основной источник mock данных для разработки и тестирования

**Contents**:

- `mockMergedGroup1` - Нормальная группа (6 products, imtId=328632)
- `mockMergedGroup2` - Минимальная группа (2 products, imtId=456789)
- `mockStandaloneProduct` - Одиночный товар (imtId=null)
- `mockMergedGroups[]` - Массив всех групп для экспорта
- Validation utilities: `validateAggregateIntegrity()`, `validateMainProduct()`, `validateSortOrder()`

**Size**: ~645 lines

**Usage Locations**:

- MSW handlers (development/testing)
- Component tests
- Storybook stories (if added)

**🗑️ DELETE WHEN**: Backend Story 37.0 complete + integration validated

---

### 2. Feature Flags Configuration

**File**: `src/config/features.ts`

**Purpose**: Переключение между mock данными и real API

**Mock-Related Code**:

```typescript
export const epic37MergedGroups: Epic37FeatureConfig = {
  enabled: true,
  useRealApi: false,  // ⚠️ CURRENTLY: false (mock data)
  debug: true
}
```

**Environment Variables**:

```bash
# Development (NOW)
NEXT_PUBLIC_EPIC_37_USE_REAL_API=false

# Production (AFTER Story 37.0)
NEXT_PUBLIC_EPIC_37_USE_REAL_API=true
```

**🔧 UPDATE WHEN**: Backend Story 37.0 complete

- Change default `useRealApi: false` → `useRealApi: true`
- Remove mock data imports
- Keep feature flag for emergency fallback

**⚠️ DO NOT DELETE**: Feature flag file stays (for toggle capability)

---

### 3. MSW Handler (Development)

**File**: `src/mocks/handlers/advertising.ts` (to be updated)

**Mock-Related Code** (will be added):

```typescript
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'

// Epic 37: Merged groups handler (TEMPORARY - using mock data)
http.get(`${API_BASE_URL}/v1/analytics/advertising`, ({ request }) => {
  const url = new URL(request.url)
  const groupBy = url.searchParams.get('group_by')

  if (groupBy === 'imtId') {
    // ⚠️ MOCK DATA - Replace with real API after Story 37.0
    return HttpResponse.json({
      data: mockMergedGroups,
      meta: { total: mockMergedGroups.length, limit: 100, offset: 0 }
    })
  }

  // ... existing SKU mode handler
})
```

**🗑️ DELETE WHEN**: Backend Story 37.0 complete

- Remove import of `epic-37-merged-groups`
- Remove `if (groupBy === 'imtId')` mock handler block
- Let request fall through to real API

---

### 4. Component Implementation (Uses Mock)

**File**: `src/components/advertising/MergedGroupTable.tsx` (to be created)

**Mock-Related Code**:

```typescript
// ⚠️ DEVELOPMENT ONLY - Remove after backend integration
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'
import { features } from '@/config/features'

export function MergedGroupTable({ groups }: MergedGroupTableProps) {
  // TEMPORARY: Use mock data in development
  const displayGroups = features.epic37MergedGroups.useRealApi
    ? groups
    : mockMergedGroups

  // ... component implementation
}
```

**🗑️ DELETE WHEN**: Backend integration validated

- Remove `mockMergedGroups` import
- Remove conditional `displayGroups` logic
- Use `groups` prop directly

---

### 5. Page Integration (API Call)

**File**: `src/app/(dashboard)/analytics/advertising/page.tsx` (to be updated)

**Mock-Related Code**:

```typescript
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'
import { features } from '@/config/features'

async function fetchAdvertisingData(params: AdvertisingAnalyticsParams) {
  // ⚠️ TEMPORARY: Use mock data while backend Story 37.0 in progress
  if (!features.epic37MergedGroups.useRealApi && params.group_by === 'imtId') {
    console.warn('[EPIC-37] Using MOCK data - backend not ready yet')
    return {
      data: mockMergedGroups,
      meta: { total: mockMergedGroups.length, limit: 100, offset: 0 }
    }
  }

  // Real API call
  const response = await fetch(`/api/v1/analytics/advertising?${queryString}`)
  return response.json()
}
```

**🗑️ DELETE WHEN**: Backend Story 37.0 complete

- Remove `mockMergedGroups` import
- Remove conditional mock data logic
- Use only real API calls

---

## 🔄 Replacement Process (Step-by-Step)

### Phase 1: Backend Completion Notification

**Trigger**: Backend team notifies "Story 37.0 COMPLETE"

**Actions**:

1. ✅ Backend confirms Request #88 implemented
2. ✅ Backend provides test endpoint URL
3. ✅ Backend shares sample response for validation

---

### Phase 2: API Validation (Story 37.1)

**Duration**: 1-2 hours

**Actions**:

1. **Execute API Request**:

   ```bash
   curl -X GET "http://localhost:3000/v1/analytics/advertising?group_by=imtId&from=2025-12-01&to=2025-12-21" \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Cabinet-Id: $CABINET_ID"
   ```

2. **Validate Response Structure**:
   - [ ] Check `mainProduct` object exists
   - [ ] Check `productCount` field exists
   - [ ] Check `aggregateMetrics` nested object exists
   - [ ] Check `products[]` array exists with full metrics
   - [ ] Verify Epic 35 fields (totalSales, organicSales, organicContribution)
   - [ ] Validate data integrity (aggregate = SUM(products))

3. **Document Results**:
   - Save response to `docs/stories/epic-37/api-response-sample-PRODUCTION.json`
   - Update `docs/stories/epic-37/api-validation-report-37.1.md` with PASS/FAIL

**Success Criteria**: All 15 acceptance criteria PASS ✅

**If FAIL**: Report to backend team, stay on mock data until fixed

---

### Phase 3: Enable Real API (Integration)

**Duration**: 30 minutes

**Actions**:

1. **Update Environment Variables**:

   ```bash
   # .env.local
   NEXT_PUBLIC_EPIC_37_USE_REAL_API=true
   ```

2. **Test Integration Locally**:

   ```bash
   npm run dev
   # Navigate to Advertising Analytics page
   # Switch to "По склейкам" view
   # Verify data displays correctly
   ```

3. **Verify All Test Scenarios**:
   - [ ] Normal merged group (6 products) displays correctly
   - [ ] Small merged group (2 products) displays correctly
   - [ ] Standalone product (imtId=null) displays correctly
   - [ ] Aggregate metrics match API response
   - [ ] Individual product metrics match API response
   - [ ] Crown icon (👑) on main product only
   - [ ] ROAS null for child products (spend=0)

**Success Criteria**: All scenarios work with real API ✅

---

### Phase 4: Code Cleanup (DELETE Mock Data)

**Duration**: 30 minutes

**Actions**:

#### 4.1 Delete Mock Data File

```bash
# DELETE primary mock data source
rm src/mocks/data/epic-37-merged-groups.ts
```

**Verify**: File deleted ✅

---

#### 4.2 Remove Imports from MSW Handler

**File**: `src/mocks/handlers/advertising.ts`

**BEFORE**:

```typescript
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'

// ... handler code using mockMergedGroups
```

**AFTER**:

```typescript
// REMOVED: import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'

// ... handler code removed, falls through to real API
```

**Verify**: No `epic-37-merged-groups` imports ✅

---

#### 4.3 Remove Mock Logic from Page

**File**: `src/app/(dashboard)/analytics/advertising/page.tsx`

**BEFORE**:

```typescript
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'

if (!features.epic37MergedGroups.useRealApi && params.group_by === 'imtId') {
  return { data: mockMergedGroups, ... }
}
```

**AFTER**:

```typescript
// REMOVED: mock data import and conditional logic
// Always use real API
const response = await fetch(`/api/v1/analytics/advertising?${queryString}`)
return response.json()
```

**Verify**: Only real API calls ✅

---

#### 4.4 Remove Mock Logic from Component

**File**: `src/components/advertising/MergedGroupTable.tsx`

**BEFORE**:

```typescript
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'

const displayGroups = features.epic37MergedGroups.useRealApi ? groups : mockMergedGroups
```

**AFTER**:

```typescript
// REMOVED: mock data import and conditional logic
// Always use props
const displayGroups = groups
```

**Verify**: Uses `groups` prop directly ✅

---

#### 4.5 Update Feature Flag Default

**File**: `src/config/features.ts`

**BEFORE**:

```typescript
export const epic37MergedGroups: Epic37FeatureConfig = {
  enabled: true,
  useRealApi: false,  // ⚠️ DEFAULT: false (mock data)
  debug: true
}
```

**AFTER**:

```typescript
export const epic37MergedGroups: Epic37FeatureConfig = {
  enabled: true,
  useRealApi: true,  // ✅ DEFAULT: true (real API)
  debug: false       // Production: no debug logs
}
```

**Verify**: Default is `useRealApi: true` ✅

---

#### 4.6 Search for Remaining References

```bash
# Search entire codebase for mock data references
grep -r "epic-37-merged-groups" src/
grep -r "mockMergedGroup" src/
grep -r "MOCK DATA" src/

# Expected: No results (all cleaned up)
```

**Verify**: No remaining references ✅

---

#### 4.7 Update Tests

**File**: `src/components/advertising/__tests__/MergedGroupTable.test.tsx`

**BEFORE**:

```typescript
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'

it('renders merged groups', () => {
  render(<MergedGroupTable groups={mockMergedGroups} />)
})
```

**AFTER**:

```typescript
// Use inline test fixtures instead of mock data file
const testGroups: AdvertisingGroup[] = [
  {
    type: 'merged_group',
    imtId: 328632,
    mainProduct: { nmId: 270937054, vendorCode: 'ter-09' },
    productCount: 2,
    aggregateMetrics: { /* ... */ },
    products: [ /* ... */ ]
  }
]

it('renders merged groups', () => {
  render(<MergedGroupTable groups={testGroups} />)
})
```

**Verify**: Tests use inline fixtures ✅

---

### Phase 5: Verification & Documentation

**Duration**: 15 minutes

**Actions**:

1. **Run All Tests**:

   ```bash
   npm run test
   npm run test:e2e
   npm run lint
   npm run type-check
   ```

   **Verify**: All tests pass ✅

2. **Manual QA Checklist**:
   - [ ] Page loads without errors
   - [ ] Data displays correctly from real API
   - [ ] Aggregate metrics calculate correctly
   - [ ] Individual products render correctly
   - [ ] No console warnings about mock data
   - [ ] Performance acceptable (<200ms render)

3. **Update Documentation**:
   - [ ] Mark this document as **ARCHIVED**
   - [ ] Update `docs/implementation-plans/epic-37-frontend-implementation-plan.md` status to **COMPLETE**
   - [ ] Add note in `CHANGELOG-EPIC-37-FE.md` about mock data removal

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat(epic-37): Remove mock data, switch to real backend API

   - Delete src/mocks/data/epic-37-merged-groups.ts
   - Remove mock data imports from handlers, page, components
   - Update feature flag default: useRealApi=true
   - Update tests to use inline fixtures
   - Verify integration with backend Story 37.0

   🔗 Backend: Request #88 (Story 37.0) COMPLETE
   ✅ All Epic 37 stories validated with real API

   🤖 Generated with Claude Code
   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

---

## 📊 Cleanup Checklist (Summary)

### Files to DELETE

- [ ] `src/mocks/data/epic-37-merged-groups.ts` (primary mock data file)

### Code Sections to REMOVE

- [ ] `src/mocks/handlers/advertising.ts` - Mock handler for group_by=imtId
- [ ] `src/app/(dashboard)/analytics/advertising/page.tsx` - Mock data import and conditional logic
- [ ] `src/components/advertising/MergedGroupTable.tsx` - Mock data import and conditional logic
- [ ] Test files using mock data imports (replace with inline fixtures)

### Settings to UPDATE

- [ ] `src/config/features.ts` - Change default `useRealApi: false` → `true`
- [ ] `.env.local` - Set `NEXT_PUBLIC_EPIC_37_USE_REAL_API=true`
- [ ] `.env.production` - Set `NEXT_PUBLIC_EPIC_37_USE_REAL_API=true`

### Verification Steps

- [ ] Search codebase: `grep -r "epic-37-merged-groups" src/` (expect: no results)
- [ ] Search codebase: `grep -r "mockMergedGroup" src/` (expect: no results)
- [ ] All tests pass with real API
- [ ] Manual QA complete
- [ ] Performance benchmarks met (<200ms render)

---

## 🚨 Important Warnings

### ⚠️ DO NOT DELETE Feature Flag File

**Keep**: `src/config/features.ts`

**Reason**: Feature flag allows emergency fallback if backend issues occur in production. Only update the default value.

### ⚠️ DO NOT Delete Before Validation

**Critical**: Mock data can only be deleted AFTER successful integration validation (Story 37.1 PASS + integration testing complete).

**If validation fails**: Keep mock data, report issues to backend team, continue development with mocks.

### ⚠️ Coordinate with Backend Team

**Before cleanup**: Confirm with backend team:

- Story 37.0 is **COMPLETE** and **DEPLOYED** to staging
- API endpoint is accessible and stable
- Response structure matches Request #88 specification

---

## 📅 Timeline

| Phase                              | Duration | Trigger                    | Output                        |
| ---------------------------------- | -------- | -------------------------- | ----------------------------- |
| **1. Backend Notification**        | 0h       | Backend team notification  | Confirmation email/Slack      |
| **2. API Validation (Story 37.1)** | 1-2h     | Phase 1 complete           | Validation report (PASS/FAIL) |
| **3. Enable Real API**             | 0.5h     | Story 37.1 PASS            | `.env.local` updated          |
| **4. Code Cleanup**                | 0.5h     | Phase 3 complete           | Mock files deleted            |
| **5. Verification**                | 0.25h    | Phase 4 complete           | QA checklist ✅               |
| **Total**                          | ~2.5h    | Backend ready → Production | Epic 37 COMPLETE              |

---

## 📚 Related Documentation

- **Epic 37 Main**: `docs/epics/epic-37-merged-group-table-display.md`
- **Implementation Plan**: `docs/implementation-plans/epic-37-frontend-implementation-plan.md`
- **Story 37.1 (Validation)**: `docs/stories/epic-37/story-37.1-backend-api-validation.BMAD.md`
- **Request #88 (Backend)**: `frontend/docs/request-backend/88-epic-37-individual-product-metrics.md`
- **Phase 0 Report**: `docs/implementation-plans/epic-37-phase-0-completion-report.md`

---

**Document Status**: 🔄 **ACTIVE** - Mock data currently in use
**Next Review**: After Backend Story 37.0 completion notification
**Cleanup Target**: 2026-01-06 (estimated, depends on backend progress)
