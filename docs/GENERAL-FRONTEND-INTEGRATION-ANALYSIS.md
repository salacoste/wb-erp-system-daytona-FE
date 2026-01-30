# General/Frontend Integration Analysis

**Date**: 2026-01-30
**Author**: Backend Integration Analyst
**Status**: Comprehensive Analysis Complete
**Scope**: General backend documentation review with frontend integration focus

---

## Executive Summary

This analysis consolidates findings from 16 backend documentation files, focusing on general frontend integration opportunities, API contracts, validation endpoints, and Telegram notifications.

**Key Findings**:
- ✅ All major backend epics are production-ready
- ✅ No critical pending tasks from previous requests (#91-92)
- ✅ Complete API contracts available for integration
- ⚠️ Some features require frontend implementation (Telegram, Orders Integrity)
- 📊 Clear API response formats documented

---

## Critical Priority Items

### 1. Telegram Notifications Integration (Epic 34) ⚠️ PENDING FRONTEND

**Status**: Backend Complete ✅ | Frontend Pending ⏳

**What's Done**:
- ✅ 6 Telegram endpoints implemented
- ✅ Bot service operational (@Kernel_crypto_bot)
- ✅ Notification templates with task-specific metrics
- ✅ User preferences API (enable/disable, quiet hours)
- ✅ Rich metrics for all task types (products_sync, adv_sync, etc.)

**Frontend Work Required** (Estimated 4-6 hours):
```typescript
// Required endpoints:
POST /v1/notifications/telegram/bind        // Generate binding code
GET  /v1/notifications/telegram/status      // Check binding status
DELETE /v1/notifications/telegram/unbind     // Unbind account
GET  /v1/notifications/preferences          // Get user settings
PATCH /v1/notifications/preferences         // Update settings
POST /v1/notifications/test                 // Send test notification
```

**Implementation Priority**: High
**Impact**: Users get real-time task notifications
**Documentation**: Request #89, #90

---

### 2. Orders FBS Integrity Dashboard (Epic 48) ⚠️ PENDING FRONTEND

**Status**: Backend Complete ✅ | Frontend Pending ⏳

**What's Done**:
- ✅ Data validation API (4 checks: row_balance, alternative_reconstruction, storno_control, transport_exclusion)
- ✅ Orders integrity health check (6 checks: duplicates, orphans, missing_history, invalid_transitions, sync_overlaps)
- ✅ Reconciliation endpoint for WB Dashboard comparison
- ✅ Complete TypeScript interfaces documented

**Frontend Work Required**:
- UI for health status monitoring (healthy/warning/unhealthy indicators)
- Integrity checks table with 6 checks
- Reconciliation panel for WB Dashboard comparison
- Polling every 5 minutes for real-time status

**Required Endpoints**:
```http
GET /health/orders-integrity?cabinet_id={uuid}
GET /v1/orders/reconciliation?cabinet_id={uuid}&from={date}&to={date}
POST /v1/validation/:cabinetId/validate/:week
GET /v1/validation/:cabinetId/results/:week
GET /v1/validation/:cabinetId/summary
```

**Implementation Priority**: Medium (Data quality monitoring)
**Documentation**: Request #96, #97

---

### 3. Price Calculator Enhancement - Two Tariff Systems ℹ️ INFORMATION

**Status**: Backend Complete ✅ | Frontend Awareness Required

**Critical Discovery**: Wildberries has TWO tariff systems:

| System | Purpose | Endpoint | Use Case |
|--------|---------|----------|----------|
| **Inventory** | Actual storage costs today | `GET /v1/tariffs/warehouses-with-tariffs` | Calculate current expenses, margin reports |
| **Supply** | Planning 14 days ahead | `GET /v1/tariffs/acceptance/coefficients` | Plan future shipments, check warehouse availability |

**Key Point**: Rate differences between Marketplace and API are NORMAL (10-15% variance):
- Marketplace shows Supply rates (planning, usually higher)
- API returns Inventory rates (actual costs, usually lower)

**Frontend Action Required**:
- Use `/warehouses-with-tariffs` for Price Calculator default (actual costs)
- Use `/acceptance/coefficients` only when planning future shipments
- Add UI tooltip explaining the difference to users

**Documentation**: Request #108, #102

---

## Deferred Items Analysis (Request #91)

### Summary: All Tasks Already Complete ✅

**Original Status Update (2026-01-02)**:
Document #91 was created with outdated data. After code review, all listed tasks were already complete:

| Task | Original Status | Actual Status | Evidence |
|------|-----------------|---------------|----------|
| Epic 36-FE (Product Card Linking) | "Pending" | ✅ Complete | 91 tests, full implementation |
| Epic 37-FE (Merged Group Table) | "Pending" | ✅ Done | Quality score 89.4/100 |
| Epic 37 Grafana Dashboards | "Pending" | ✅ Completed | 61 panels across 5 dashboards |
| Epic 39 (Dashboard Bugfixes) | Complete | ✅ Complete | Verified |

**Current Frontend Status**:
- 40/40 stories completed across 7 epics
- 145+ story points delivered
- No pending tasks from this request

---

## API Contracts Documentation

### Epic 36: Product Card Linking (sku-mode & imtid-field)

**Status**: ✅ Complete (91 tests)

**Key Features**:
- Toggle "По артикулам" / "По склейкам"
- `group_by` parameter support (sku | imtId)
- URL state persistence (`?group_by=sku|imtId`)
- Full backward compatibility with Epic 33

**API Response Format**:
```typescript
interface AdvertisingGroup {
  group_by: 'sku' | 'imtId';
  nm_id?: string;          // Present when group_by='sku'
  imt_id?: string;         // Present when group_by='imtId'
  merged_product?: MergedProduct; // Only when group_by='imtId'
  // ... other fields
}
```

**Documentation**: Request #83

---

### Epic 37: Merged Group Table Display

**Status**: ✅ Done (Quality Score: 89.4/100)

**Delivered Components**:
- Story 37.1: Backend API Validation ✅
- Story 37.2: MergedGroupTable Component (3-tier rowspan) ✅
- Story 37.3: Aggregate Metrics Display ✅
- Story 37.4: Visual Styling & Hierarchy ✅
- Story 37.5: Testing & Documentation ✅

**Production Status**: Ready to deploy
**QA Phase 2**: Optional (7.5-11.5h) - polish only

---

### Epic 40: Orders FBS Realtime Sync

**Status**: ✅ Epic Complete (7/7 stories + enhancements)

**Latest Enhancements (Story 40.6)**:
- At-Risk Orders Pagination: `atRiskLimit`, `atRiskOffset` parameters
- `atRiskTotal` field: Total count before pagination
- `cachedAt` field: Cache timestamp for all analytics endpoints
- Prometheus Metrics: Query duration, cache hits/misses
- Integration Tests: Complex query validation

**Key Endpoints**:
```http
GET /v1/orders                             // List with filters
GET /v1/orders/{orderId}                   // Details with history
GET /v1/analytics/orders/velocity           // Processing speed metrics
GET /v1/analytics/orders/sla                // SLA compliance (with pagination)
GET /v1/analytics/orders/volume             // Volume trends
GET /v1/notifications/orders/settings       // Notification settings
POST /v1/notifications/orders/settings      // Update settings
POST /v1/orders/sync                        // Manual sync trigger
GET /v1/orders/sync-status                  // Sync status
```

**Documentation**: Request #93

---

## Data Validation & Integrity API

### Story 4.1: Financial Sanitary Validation

**Status**: ✅ Production Ready (221 tests, 100% passed)

**4 Validation Checks**:
1. **row_balance**: Total sum matches row-by-row reconstruction
2. **alternative_reconstruction**: Alternative calculation validation
3. **storno_control**: Storno sales ratio monitoring
4. **transport_exclusion**: Transport reimbursement exclusion verification

**Response Structure**:
```json
{
  "week": "2025-W05",
  "cabinet_id": "uuid",
  "all_passed": true,
  "checks_run": 4,
  "checks_passed": 4,
  "checks_failed": 0,
  "results": {
    "row_balance": { "passed": true, "total_rows": 15000, "violating_rows": 0 },
    "alternative_reconstruction": { "passed": true, "avg_error_pct": 0.0 },
    "storno_control": { "passed": true, "ratio_pct": 5.0 },
    "transport_exclusion": { "passed": true, "excluded_from_payout": true }
  }
}
```

---

### Epic 48: Orders FBS Integrity

**Status**: Backend Complete ✅

**6 Integrity Checks**:
1. `duplicates`: Duplicate order_id in orders_fbs
2. `orphans`: Records without linked cabinet
3. `missing_history`: Orders without status history
4. `duplicate_status_history`: Duplicate status records
5. `invalid_transitions`: Invalid status transitions (cancel → new)
6. `sync_overlaps`: Conflicting parallel sync operations

**Health Status Levels**:
- `healthy`: All checks pass (Green #22C55E)
- `warning`: Minor issues (Yellow #F59E0B)
- `unhealthy`: Critical problems (Red #EF4444)

**Documentation**: Request #96, #97

---

## Telegram Notifications System (Epic 34)

### Backend Status: ✅ Production Ready

**System Architecture**:
- Backend owns 100% of notification content, formatting, and logic
- Frontend manages ONLY user preferences (binding, enable/disable, quiet hours)
- Rate limiting: 60 messages/hour per chat
- Complete audit trail in `notification_log` table

**Event Types**:
| Event | Description | User Control |
|-------|-------------|--------------|
| `task.completed` | Task finished successfully | ✅ Can disable |
| `task.failed` | Task failed after all retries | ✅ Can disable |
| `task.stalled` | Worker stopped responding | ✅ Can disable |
| `daily_digest` | Daily summary | Planned (not yet) |

**Task-Specific Metrics** (Enhanced 2025-12-30):
```typescript
// products_sync
{
  products_fetched: number,  // Total loaded from WB API
  products_added: number,    // New products added
  products_removed: number   // Products removed
}

// adv_sync
{
  campaigns_synced: number,   // Total campaigns
  stats_campaigns: number,    // Campaigns with stats
  cost_records: number        // Cost records loaded
}
```

**Frontend Implementation Requirements**:

1. **Telegram Binding Section**:
```tsx
// Unbound State
<TelegramBindingPanel>
  <StatusBadge status="not_bound" />
  <Button onClick={generateBindingCode}>Привязать Telegram</Button>
</TelegramBindingPanel>

// Binding Flow (after click)
<TelegramBindingModal>
  <QRCode value={deepLink} />
  <BindingCode>{bindingCode}</BindingCode>
  <DeepLinkButton href={deepLink}>Открыть в Telegram</DeepLinkButton>
  <ExpirationTimer expiresAt={expiresAt} />
</TelegramBindingModal>

// Bound State
<TelegramBindingPanel>
  <StatusBadge status="bound" />
  <UserInfo username={username} />
  <PreferencesForm>
    <Toggle name="notifyOnSuccess" />
    <Toggle name="notifyOnError" />
    <Toggle name="notifyOnStalled" />
    <QuietHoursInput />
  </PreferencesForm>
</TelegramBindingPanel>
```

2. **Polling Strategy**:
```typescript
// Poll status every 3 seconds while modal open
useEffect(() => {
  if (!isBindingModalOpen) return;
  const interval = setInterval(async () => {
    const status = await checkStatus();
    if (status.bound) {
      setIsBindingModalOpen(false);
      showSuccessToast('Telegram успешно привязан!');
    }
  }, 3000);
  return () => clearInterval(interval);
}, [isBindingModalOpen, checkStatus]);
```

3. **Required Hooks**:
```typescript
// hooks/useTelegramBinding.ts
export function useTelegramBinding(cabinetId: string) {
  // GET /v1/notifications/telegram/status
  // POST /v1/notifications/telegram/bind
  // DELETE /v1/notifications/telegram/unbind
}

// hooks/useNotificationPreferences.ts
export function useNotificationPreferences(cabinetId: string) {
  // GET /v1/notifications/preferences
  // PATCH /v1/notifications/preferences
}
```

**Documentation**: Request #89, #90

---

## Integration Gaps & Recommendations

### 1. High Priority - Telegram Notifications ⚠️

**Gap**: Backend complete, frontend not implemented
**Impact**: Users missing real-time task notifications
**Effort**: 4-6 hours
**Recommendation**: Implement Telegram binding UI in user settings

**Steps**:
1. Create Telegram settings section in User Settings page
2. Implement binding flow with QR code and deep link
3. Add preferences form (enable/disable, quiet hours)
4. Implement status polling during binding
5. Add unbind functionality

---

### 2. Medium Priority - Orders Integrity Dashboard ⚠️

**Gap**: Backend complete, frontend not implemented
**Impact**: Limited visibility into data quality issues
**Effort**: 8-12 hours
**Recommendation**: Build dedicated Orders Integrity page

**Steps**:
1. Create `/orders/integrity` route
2. Implement health status card (healthy/warning/unhealthy)
3. Build integrity checks table (6 checks)
4. Add reconciliation panel for WB Dashboard comparison
5. Implement 5-minute polling for real-time updates

---

### 3. Low Priority - Grafana Dashboards ℹ️

**Status**: ✅ Complete (Epic 37 Grafana)
**Impact**: Business analytics available in Grafana
**Effort**: None (already done)
**Deliverables**: 61 panels across 5 dashboards
- Executive Dashboard (CEO/Owner) - 5 panels
- Financial Dashboard (CFO) - 14 panels
- Commercial Dashboard - 11 panels
- Operational Dashboard - 10 panels
- Marketing Dashboard - 21 panels

---

## Recent Backend Improvements

### Epic 52: Tariff Settings Admin API

**Status**: ✅ Complete (25 SP, 8 stories)

**New Admin Endpoints** (Backend-only):
```http
PUT    /v1/tariffs/settings           // Full replacement
PATCH  /v1/tariffs/settings           // Partial update
GET    /v1/tariffs/settings/audit     // Audit trail (21 fields)
POST   /v1/tariffs/settings/schedule  // Schedule future version
GET    /v1/tariffs/settings/history   // Version history
DELETE /v1/tariffs/settings/:id       // Delete scheduled version
```

**Frontend Impact**: Minimal
- Existing `GET /v1/tariffs/settings` unchanged
- Cache TTL reduced from 24h to 1h (version switching support)
- Admin-only access (Manager/Owner/Analyst get 403)

**Rate Limiting**: 10 req/min for mutations (PUT/PATCH/POST schedule)

**Documentation**: Request #101

---

### Epic 100: Price Calculator Bugfixes

**Status**: ✅ All Issues Resolved (2026-01-21)

**3 Critical Fixes**:
1. **Warehouse Search Response Format**: Fixed to return `{data: {warehouses, updated_at}}`
2. **Dimensions/Category Always Null**: Fixed field mapping from `subjectName` → `category`
3. **Warehouse Data Not Loaded**: Implemented tariffs fallback (81 warehouses from tariffs data)

**Business Impact**: Price Calculator now has 100% automation value

**Documentation**: Request #100

---

## Quick Wins (Easy Improvements)

### 1. Add Cache Timestamps to Analytics

**Current**: Most analytics endpoints have `cachedAt` field
**Improvement**: Display "Data updated at {time}" in UI
**Effort**: 1-2 hours
**Example**:
```tsx
{data.cachedAt && (
  <div className="text-xs text-muted-foreground">
    Data cached at: {new Date(data.cachedAt).toLocaleTimeString()}
  </div>
)}
```

---

### 2. Add Validation Status to Weekly Reports

**Current**: Validation endpoints exist
**Improvement**: Show validation badge on weekly report cards
**Effort**: 2-3 hours
**Example**:
```tsx
// Add to weekly report list
<ValidationBadge
  week={week}
  status={validationStatus}
  onClick={() => showValidationDetails(week)}
/>
```

---

### 3. Add Warehouse Availability Indicators

**Current**: `/acceptance/coefficients` returns `isAvailable` field
**Improvement**: Show green/red dot next to warehouse name
**Effort**: 1-2 hours
**Example**:
```tsx
< WarehouseCard >
  <WarehouseName>{name}</WarehouseName>
  <AvailabilityDot available={coefficient.isAvailable} />
</WarehouseCard>
```

---

## API Response Format Standards

### Successful Responses

All endpoints follow this structure:

```json
{
  "data": { /* actual response data */ },
  "meta": {
    "timestamp": "2026-01-30T10:00:00.000Z",
    // ... optional meta fields
  }
}
```

### Error Responses

Standard error format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": [ /* optional validation errors */ ]
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Data returned successfully |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Invalid/expired JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate/resource conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Backend error |

---

## Documentation Cross-Reference

| Request # | Topic | Status | Priority |
|-----------|-------|--------|----------|
| #79 | Advertising Sync Fix | ✅ Complete | N/A (deployed) |
| #91 | Frontend Pending Tasks | ✅ All Complete | N/A (archive) |
| #92 | Frontend Status Update | ℹ️ Informational | N/A (reference) |
| #89 | Telegram Integration Guide | ✅ Backend Ready | High (frontend TODO) |
| #90 | Telegram System Architecture | ✅ Documentation Complete | Reference |
| #93 | Epic 40 Orders FBS Guide | ✅ Epic Complete | Reference |
| #96 | Epic 44-48 Validation API | ✅ Backend Ready | Medium (frontend TODO) |
| #97 | Epic 48 Orders Integrity UI | ✅ Documentation Ready | Medium (frontend TODO) |
| #100 | Epic 44 Bugfixes | ✅ All Resolved | N/A (deployed) |
| #101 | Epic 52 Tariff Admin API | ✅ Complete | N/A (admin-only) |
| #102 | Tariffs Base Rates Guide | ✅ Documentation Ready | Reference |
| #108 | Two Tariff Systems Message | ℹ️ Important Info | Reference |

---

## Recommendations Summary

### Immediate Actions (This Sprint)

1. **Implement Telegram Notifications** (4-6 hours)
   - High value for users
   - Backend fully ready
   - Clear documentation available

2. **Add Cache Timestamps** (1-2 hours)
   - Easy win
   - Improves user trust
   - Already available in API

### Next Sprint

3. **Build Orders Integrity Dashboard** (8-12 hours)
   - Data quality monitoring
   - Backend endpoints ready
   - Clear UI requirements documented

4. **Add Validation Status Badges** (2-3 hours)
   - Improves weekly reports
   - Validation API complete
   - Easy integration

### Future Considerations

5. **Tariff Settings Admin UI** (not prioritized)
   - Backend admin API complete
   - Requires admin role
   - Low priority (admin-only feature)

6. **Daily Digest Notifications** (not implemented)
   - Backend supports event structure
   - Not yet implemented in backend
   - Would require backend work first

---

## Testing & Validation

### Manual Testing Checklist

**Telegram Integration**:
- [ ] Generate binding code
- [ ] Open deep link in Telegram
- [ ] Verify binding successful
- [ ] Update preferences
- [ ] Send test notification
- [ ] Unbind account

**Orders Integrity**:
- [ ] Check health status endpoint
- [ ] View all 6 integrity checks
- [ ] Trigger reconciliation
- [ ] Verify variance calculation
- [ ] Check breakdown by status/date

**Price Calculator**:
- [ ] Select warehouse
- [ ] Verify rates match expected system (Inventory vs Supply)
- [ ] Calculate logistics cost
- [ ] Calculate storage cost
- [ ] Verify coefficient application

---

## Contact & Support

**Backend Team**:
- Swagger UI: `http://localhost:3000/api`
- Test Examples: `test-api/*.http` files
- API Reference: `docs/API-PATHS-REFERENCE.md`

**Frontend Team**:
- Current Status: All epics complete
- Pending Work: Telegram UI, Orders Integrity Dashboard
- Documentation: `frontend/docs/request-backend/*.md`

---

**Document Version**: 1.0
**Last Updated**: 2026-01-30
**Next Review**: After Telegram integration completion

**Analysis Complete** ✅
