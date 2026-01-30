# Frontend Work Summary - Backend Integration Analysis

**Date**: 2026-01-30
**Analysis Scope**: 85+ backend documentation files
**Total Agents**: 4 (Margin, Advertising, Orders/Supply/Storage, General)
**Status**: ✅ Analysis Complete

---

## Executive Summary

**Backend Status**: ✅ 100% Complete - All endpoints production-ready
**Frontend Status**: 📋 Requires ~139 Story Points across 6 major areas

**Key Findings**:
1. ✅ **Epic 60-FE** - 100% complete with CogsMissingState and AdvertisingEmptyState
2. ⚠️ **Margin Module** - Polling optimization needed (5-8 hours)
3. ✅ **Advertising Module** - Production ready, minor UX improvements optional
4. 📋 **Orders/Supply/Storage** - 99 SP required (3 new epics)
5. ⚠️ **Telegram Notifications** - Backend ready, 4-6 hours frontend work
6. ⚠️ **Orders Integrity Dashboard** - Backend ready, 8-12 hours frontend work

---

## Priority 1: Critical Fixes (5-8 hours)

### 1.1 Margin Polling Optimization

**Current State**: ✅ CogsMissingState component implemented and working
**Required**: Optimize polling to use lightweight status endpoint

**Files to Modify**:
- `src/hooks/useMarginPolling.ts` - Add status endpoint polling
- `src/hooks/useSingleCogsAssignmentWithPolling.ts` - Use status endpoint
- `src/hooks/usePendingMarginProducts.ts` - Fix infinite loop issue

**Implementation**:
```typescript
// NEW FILE: src/hooks/useMarginStatusPolling.ts
export function useMarginStatusPolling(
  nmId: string,
  options: {
    enabled?: boolean;
    interval?: number;  // milliseconds (default: 2500)
    maxAttempts?: number;
    onSuccess?: () => void;
    onTimeout?: () => void;
    onError?: (error: string) => void;
  }
) {
  const [attempts, setAttempts] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['margin-status', nmId],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/products/${nmId}/margin-status`);
      return response.data;
    },
    refetchInterval: () => {
      if (!options.enabled) return false;
      if (attempts >= (options.maxAttempts ?? 20)) return false;
      return options.interval ?? 2500;
    },
    onSuccess: (data) => {
      if (data.status === 'completed') {
        options.onSuccess?.();
      } else if (data.status === 'failed') {
        options.onError?.(data.error ?? 'Unknown error');
      } else if (++attempts >= (options.maxAttempts ?? 20)) {
        options.onTimeout?.();
      }
    },
  });

  return { status: data?.status, isLoading, error };
}
```

**Fix for Infinite Loop**:
```typescript
// src/hooks/usePendingMarginProducts.ts
// Use deep comparison instead of reference comparison
const prevProductsRef = useRef<Product[]>([]);

useEffect(() => {
  if (!enabled) return;

  // Deep compare to prevent infinite loop
  const hasChanged = !deepEqual(prevProductsRef.current, products);
  if (!hasChanged) return;

  prevProductsRef.current = products;

  // ... rest of effect
}, [products, enabled]);
```

**Estimated Effort**: 5-8 hours

---

## Priority 2: Missing Features (12-18 hours)

### 2.1 Telegram Notifications UI (4-6 hours)

**Backend Status**: ✅ Complete (6 endpoints, bot operational)
**Frontend Status**: ❌ Not implemented

**Required Endpoints**:
```http
POST /v1/notifications/telegram/bind        // Generate binding code
GET  /v1/notifications/telegram/status      // Check binding status
DELETE /v1/notifications/telegram/unbind     // Unbind account
GET  /v1/notifications/preferences          // Get user settings
PATCH /v1/notifications/preferences         // Update settings
POST /v1/notifications/test                 // Send test notification
```

**Implementation Plan**:

1. **Create Telegram Settings Section** (1-2 hours)
   - Add to User Settings page
   - Show binding status badge

2. **Implement Binding Flow** (2-3 hours)
   - QR code display
   - Deep link to Telegram bot
   - Binding code display with expiration timer
   - Status polling every 3 seconds

3. **Add Preferences Form** (1 hour)
   - Toggle notifications on/off
   - Quiet hours input
   - Test notification button

**Files to Create**:
- `src/hooks/useTelegramBinding.ts`
- `src/hooks/useNotificationPreferences.ts`
- `src/components/custom/TelegramBindingPanel.tsx`
- `src/components/custom/TelegramBindingModal.tsx`

**Files to Modify**:
- `src/app/(dashboard)/settings/page.tsx` - Add Telegram section

---

### 2.2 Orders Integrity Dashboard (8-12 hours)

**Backend Status**: ✅ Complete (6 integrity checks, reconciliation API)
**Frontend Status**: ❌ Not implemented

**Required Endpoints**:
```http
GET /health/orders-integrity?cabinet_id={uuid}
GET /v1/orders/reconciliation?cabinet_id={uuid}&from={date}&to={date}
POST /v1/validation/:cabinetId/validate/:week
GET /v1/validation/:cabinetId/results/:week
GET /v1/validation/:cabinetId/summary
```

**6 Integrity Checks**:
1. `duplicates` - Duplicate order_id in orders_fbs
2. `orphans` - Records without linked cabinet
3. `missing_history` - Orders without status history
4. `duplicate_status_history` - Duplicate status records
5. `invalid_transitions` - Invalid status transitions
6. `sync_overlaps` - Conflicting parallel sync operations

**Implementation Plan**:

1. **Create Orders Integrity Page** (3-4 hours)
   - Route: `/orders/integrity`
   - Health status card (healthy/warning/unhealthy)
   - Integrity checks table with 6 checks

2. **Implement Reconciliation Panel** (2-3 hours)
   - WB Dashboard comparison
   - Variance calculation display
   - Breakdown by status/date

3. **Add Real-time Updates** (2-3 hours)
   - Polling every 5 minutes
   - Status indicators
   - Auto-refresh option

4. **Add Validation Status to Weekly Reports** (1-2 hours)
   - Validation badge on report cards
   - Click to show validation details

**Files to Create**:
- `src/app/(dashboard)/orders/integrity/page.tsx`
- `src/hooks/useOrdersIntegrity.ts`
- `src/hooks/useValidationStatus.ts`
- `src/components/custom/orders/IntegrityHealthCard.tsx`
- `src/components/custom/orders/IntegrityChecksTable.tsx`
- `src/components/custom/orders/ReconciliationPanel.tsx`

---

## Priority 3: Major Epics (99 SP)

### 3.1 Epic 40-FE: Orders Module (26 SP)

**Backend Status**: ✅ Complete (8 endpoints, 40+ WB status codes)
**Frontend Status**: ✅ Complete (2026-01-29)

**Already Delivered**:
- ✅ `/orders` route with OrdersTable
- ✅ OrderDetailsModal with 3 history tabs
- ✅ WB Native History (40+ status codes)
- ✅ Full merged timeline with source badges
- ✅ SLA compliance widget (color-coded)
- ✅ Velocity metrics widget
- ✅ At-risk orders tracking
- ✅ E2E tests passing

**No action required** - Epic 40-FE is complete and production-ready.

---

### 3.2 Epic 51-FE: FBS Historical Analytics (39 SP)

**Backend Status**: ✅ Complete (7 endpoints, 365-day analytics)
**Frontend Status**: 📋 Ready for Dev

**Key Features**:
- 365-day analytics (vs 30 days before)
- Tiered resolution: daily (0-90d) → weekly (91-365d)
- Seasonal patterns (monthly/weekly/quarterly)
- Period comparison (MoM, QoQ, YoY)

**Components Required** (12 components):
- `FbsTrendsChart` - Line chart with 3 metrics
- `SeasonalPatternsChart` - Bar charts (3 views)
- `PeriodComparisonTable` - Side-by-side comparison
- `DataSourceIndicator` - Source badges
- `AggregationToggle` - Day/Week/Month switcher
- `DateRangePickerExtended` - 365-day picker
- `SeasonalInsightsCard` - Peak/low insights
- `TrendsSummaryCards` - Total, avg, rates
- `FbsAnalyticsPage` - Main page
- Plus 3 more components...

**Estimated Effort**: 39 SP (~2-3 weeks)

**Dependencies**: None (backend complete)

---

### 3.3 Epic 53-FE: Supply Management (34 SP)

**Backend Status**: ✅ Complete (9 endpoints)
**Frontend Status**: 📋 Ready for Dev

**Key Features**:
- Full supply lifecycle (OPEN → CLOSED → DELIVERING → DELIVERED)
- Batch operations (add up to 1000 orders)
- Sticker generation (PNG/SVG/ZPL)
- Status tracking with automatic WB sync

**Components Required** (17 components):

**List Components** (7):
- `SuppliesTable` - Main table
- `SupplyStatusBadge` - Status indicator
- `SupplyFilters` - Filter controls
- `SupplyRow` - Table row
- `SuppliesEmptyState` - Empty prompt
- `SuppliesLoadingSkeleton` - Loading
- `CreateSupplyModal` - Create dialog

**Detail Components** (10):
- `SupplyHeader` - Info + status
- `SupplyStatusStepper` - Lifecycle progress
- `SupplyOrdersTable` - Orders in supply
- `SupplyDocumentsList` - Generated docs
- **`OrderPickerDrawer`** - Select orders (⚡ **Most Complex** - 8 SP)
- `OrderPickerTable` - Virtualized list (1000+ rows)
- `OrderPickerFilters` - Search/filter
- `CloseSupplyDialog` - Confirmation
- `StickerFormatSelector` - PNG/SVG/ZPL
- `StickerPreview` - Preview image

**Critical Dependencies**:
- Requires Epic 40.9-FE (useOrders hook for Order Picker)
- Requires `react-window` package for virtualization
- Requires blob handling for document downloads

**Estimated Effort**: 34 SP (~2-3 weeks)

---

### 3.4 Epic 24: Storage Analytics (5 SP)

**Backend Status**: ✅ Complete (5 endpoints)
**Frontend Status**: ⚠️ Partially implemented (requires fixes)

**Required Fixes**:

1. **Empty State Handling** (2 SP)
   - Use `has_data` field from backend
   - Show informational messages instead of errors

2. **Storage in Products List** (2 SP)
   - Add "Хранение" column to products table
   - Use `include_storage=true` parameter
   - Show `storage_cost_daily_avg`, `storage_cost_weekly`

3. **Manual Import UI** (1 SP)
   - Button to trigger POST /v1/imports/paid-storage
   - Progress tracking

**Files to Modify**:
- `src/app/(dashboard)/analytics/storage/page.tsx`
- `src/app/(dashboard)/products/page.tsx`
- `src/components/custom/products/ProductsTable.tsx`

**Estimated Effort**: 5 SP (~1 week)

---

## Priority 4: UX Improvements (3-5 hours)

### 4.1 Advertising Smart Date Picker (2-3 hours)

**Current**: Users can select any date range
**Improvement**: Disable unavailable dates in picker

**Implementation**:
```typescript
// NEW: src/components/custom/date/AdvertisingDatePicker.tsx
export function AdvertisingDatePicker() {
  const { data: syncStatus } = useAdvertisingSyncStatus();

  const minDate = syncStatus?.dataAvailableFrom
    ? new Date(syncStatus.dataAvailableFrom)  // 2025-12-01
    : undefined;

  const maxDate = syncStatus?.dataAvailableTo
    ? new Date(syncStatus.dataAvailableTo)    // 2026-01-28
    : undefined;

  return (
    <DatePicker
      minDate={minDate}
      maxDate={maxDate}
      disabledDates={(date) => {
        if (!minDate || !maxDate) return false;
        return date < minDate || date > maxDate;
      }}
      predefinedRanges={[
        { label: 'Последние 7 дней', days: 7 },
        { label: 'Последние 30 дней', days: 30 },
        { label: 'Весь период', range: { from: minDate, to: maxDate } }
      ]}
    />
  );
}
```

---

### 4.2 Cache Timestamps Display (1 hour)

**Current**: Analytics endpoints have `cachedAt` field
**Improvement**: Display "Data updated at {time}" in UI

**Implementation**:
```typescript
// Add to analytics pages
{data.cachedAt && (
  <div className="text-xs text-muted-foreground">
    Данные обновлены: {formatDistanceToNow(new Date(data.cachedAt), {
      addSuffix: true,
      locale: ru
    })}
  </div>
)}
```

---

### 4.3 Validation Status Badges (1 hour)

**Current**: Validation endpoints exist
**Improvement**: Show validation badge on weekly report cards

**Implementation**:
```typescript
// Add to weekly report list
<ValidationBadge
  week={week}
  status={validationStatus}
  onClick={() => showValidationDetails(week)}
/>
```

---

## Summary Table

| Priority | Task | Effort | Backend | Frontend | Status |
|----------|------|--------|---------|----------|--------|
| **P1** | Margin Polling Optimization | 5-8h | ✅ | ⚠️ | Required |
| **P2** | Telegram Notifications UI | 4-6h | ✅ | ❌ | Required |
| **P2** | Orders Integrity Dashboard | 8-12h | ✅ | ❌ | Required |
| **P3** | Epic 51-FE (FBS Analytics) | 39 SP | ✅ | 📋 | Ready for Dev |
| **P3** | Epic 53-FE (Supply Management) | 34 SP | ✅ | 📋 | Ready for Dev |
| **P3** | Epic 24 Fixes (Storage) | 5 SP | ✅ | ⚠️ | Required |
| **P4** | Advertising Smart Date Picker | 2-3h | ✅ | ❌ | Optional |
| **P4** | Cache Timestamps Display | 1h | ✅ | ❌ | Optional |
| **P4** | Validation Status Badges | 1h | ✅ | ❌ | Optional |

**Total Effort**:
- **Required**: ~79-99 SP + 17-26 hours
- **Optional**: 4-5 hours

---

## Sprint Recommendations

### Sprint 1 (Feb 3-14): Critical Fixes & Quick Wins
1. Margin polling optimization (5-8h)
2. Telegram notifications UI (4-6h)
3. Storage analytics fixes (5 SP)
4. Cache timestamps display (1h)
**Total**: ~15-20 hours

### Sprint 2 (Feb 17-28): Missing Features
1. Orders Integrity Dashboard (8-12h)
2. Validation status badges (1h)
3. Advertising smart date picker (2-3h)
**Total**: ~11-16 hours

### Sprint 3-4 (Mar 3-28): Supply Management
1. Epic 53-FE implementation (34 SP)
**Total**: 34 SP (~2-3 weeks)

### Sprint 5-6 (Mar 31 - Apr 25): FBS Analytics
1. Epic 51-FE implementation (39 SP)
**Total**: 39 SP (~2-3 weeks)

---

## Open Questions

1. **Orders Analytics Backend Endpoint**
   - Status: "To verify"
   - Required: Verify `GET /v1/orders` endpoint
   - Action: Check Swagger UI or test-api/14-orders.http

2. **WB Status Translations**
   - Question: Backend endpoint or frontend mapping?
   - Recommendation: Frontend mapping in `src/lib/wb-status-mapping.ts`
   - 40+ status codes with Russian labels

3. **Warehouse ID Mapping**
   - Different systems use different IDs
   - Action: Use `/acceptance/coefficients/all` for SUPPLY IDs
   - Document mapping in code comments

---

## Success Metrics

### Completion Criteria

**Margin Module**:
- [ ] Status endpoint polling implemented
- [ ] Infinite loop in usePendingMarginProducts fixed
- [ ] Empty states show correctly (already done ✅)

**Telegram Notifications**:
- [ ] `/settings` page has Telegram section
- [ ] Binding flow with QR code works
- [ ] Preferences form saves correctly
- [ ] Test notification sends successfully
- [ ] Unbind functionality works

**Orders Integrity**:
- [ ] `/orders/integrity` route accessible
- [ ] Health status card shows correct level
- [ ] All 6 integrity checks displayed
- [ ] Reconciliation panel works
- [ ] 5-minute polling updates status
- [ ] Validation badges on weekly reports

**Epic 51-FE (FBS Analytics)**:
- [ ] `/analytics/orders` route accessible
- [ ] 365-day date range picker works
- [ ] Trends chart shows 3 metrics
- [ ] Seasonal patterns display correctly
- [ ] Period comparison table works
- [ ] Data source badges show correct source
- [ ] Backfill admin page accessible (Owner only)

**Epic 53-FE (Supply Management)**:
- [ ] `/supplies` route accessible
- [ ] Supplies table shows correct statuses
- [ ] Create supply flow works
- [ ] Supply detail page displays correctly
- [ ] Order picker drawer with virtualization works
- [ ] Batch add/remove orders (1000 max) works
- [ ] Close supply dialog works
- [ ] Sticker generation (PNG/SVG/ZPL) works
- [ ] Document download (blob handling) works
- [ ] Status polling (30s intervals) works
- [ ] Manual sync button with rate limit works

**Epic 24 (Storage Analytics)**:
- [ ] Empty state handling using `has_data`
- [ ] Multi-brand filter works (Issue #48 verified)
- [ ] Storage column in products table
- [ ] Per-SKU storage breakdown in weekly reports
- [ ] Manual import trigger UI

---

## References

### Analysis Documents Created
- `docs/MARGIN-INTEGRATION-ANALYSIS.md` - 724 lines
- `docs/ADVERTISING-INTEGRATION-ANALYSIS.md` - 621 lines
- `docs/ORDERS-SUPPLY-STORAGE-INTEGRATION-ANALYSIS.md` - 575 lines
- `docs/GENERAL-FRONTEND-INTEGRATION-ANALYSIS.md` - 643 lines

### Backend Documentation
- `docs/request-backend/*.md` - 85+ files analyzed
- `docs/API-PATHS-REFERENCE.md` - Complete endpoint catalog
- Swagger UI: `http://localhost:3000/api`

### Frontend Documentation
- `docs/EPICS-AND-STORIES-TRACKER.md` - Epic/story tracking
- `docs/api-integration-guide.md` - API integration patterns
- `docs/front-end-spec.md` - UI/UX specification

---

**Analysis Complete**: 2026-01-30
**Next Step**: Review sprint recommendations and prioritize work
**Contact**: Backend Team via Swagger UI or test-api/*.http files
