# Epic 52-FE: Tariff Settings Admin UI

**Epic ID**: Epic 52-FE
**Backend Epic**: Epic 52 (Complete)
**Status**: 📋 Ready for Development
**Priority**: Medium
**Estimated Effort**: 7 stories, ~26 SP (~10-14 days frontend)
**Created**: 2026-01-22
**Author**: PM Agent

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [User Stories](#user-stories)
4. [Page Structure](#page-structure)
5. [API Integration](#api-integration)
6. [Technical Notes](#technical-notes)
7. [Dependencies](#dependencies)

---

## Problem Statement

### Current State

**Backend Status**: Complete
- 7 admin endpoints implemented (`/v1/tariffs/settings/*`)
- Per-field audit trail (21 tracked fields)
- Versioning with effective dates
- Rate limiting (10 req/min for mutations)

**Frontend Status**: Missing
- No admin UI for tariff management
- No visibility into version history
- No audit trail viewer
- No way to schedule future tariff changes
- Admins must use direct API calls or database access

### User Impact

**Без Admin UI администраторы НЕ МОГУТ**:
1. Просматривать историю версий тарифов
2. Редактировать текущие тарифные настройки через UI
3. Планировать будущие изменения тарифов
4. Отслеживать кто и когда менял настройки (audit)
5. Удалять запланированные версии

### Business Value

| Ценность | Описание |
|----------|----------|
| **Operational Efficiency** | Управление тарифами без прямого доступа к БД |
| **Audit Compliance** | Полная история изменений для compliance |
| **Planning Capability** | Планирование тарифов заранее |
| **Error Reduction** | Валидация на уровне UI предотвращает ошибки |
| **Transparency** | Видимость всех изменений для команды |

---

## Solution Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  /settings/tariffs (Admin Only)                              │
│    │                                                          │
│    ├─> Tab 1: Current Settings                               │
│    │     ├─> TariffSettingsForm (Story 52-FE.2)             │
│    │     │     • Acceptance rates                            │
│    │     │     • Logistics tiers                             │
│    │     │     • Commission rates                            │
│    │     │     • Storage settings                            │
│    │     │     • FBS settings                                │
│    │     └─> Save (PUT/PATCH)                               │
│    │                                                          │
│    ├─> Tab 2: Version History                                │
│    │     ├─> VersionHistoryTable (Story 52-FE.1)            │
│    │     │     • All versions with status                    │
│    │     │     • Delete scheduled versions                   │
│    │     └─> ScheduleVersionModal (Story 52-FE.3)           │
│    │           • Create future version                       │
│    │                                                          │
│    └─> Tab 3: Audit Log                                      │
│          └─> AuditLogTable (Story 52-FE.4)                  │
│                • Field-level changes                         │
│                • User, timestamp, IP                         │
│                • Filtering by field                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (/v1/tariffs/settings/*)            │
│                                                               │
│  GET  /settings         → Current tariffs (existing)         │
│  PUT  /settings         → Full replacement (Admin)           │
│  PATCH /settings        → Partial update (Admin)             │
│  GET  /settings/history → Version list (Admin)               │
│  POST /settings/schedule → Create future version (Admin)     │
│  DELETE /settings/:id   → Delete scheduled (Admin)           │
│  GET  /settings/audit   → Audit trail (Admin)                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose | File |
|-----------|---------|------|
| `TariffSettingsPage` | Main page with tabs | `page.tsx` |
| `TariffSettingsForm` | Edit current settings | `TariffSettingsForm.tsx` |
| `VersionHistoryTable` | List all versions | `VersionHistoryTable.tsx` |
| `ScheduleVersionModal` | Create future version | `ScheduleVersionModal.tsx` |
| `AuditLogTable` | Audit trail viewer | `AuditLogTable.tsx` |
| `LogisticsTiersEditor` | Edit volume tiers array | `LogisticsTiersEditor.tsx` |
| `RateLimitIndicator` | Show rate limit status | `RateLimitIndicator.tsx` |

### React Query Hooks

| Hook | Purpose | File |
|------|---------|------|
| `useTariffSettings` | GET current settings | `useTariffSettings.ts` |
| `useTariffVersionHistory` | GET version history | `useTariffVersionHistory.ts` |
| `useTariffAuditLog` | GET audit trail | `useTariffAuditLog.ts` |
| `useUpdateTariffSettings` | PUT/PATCH settings | `useUpdateTariffSettings.ts` |
| `useScheduleTariffVersion` | POST schedule | `useScheduleTariffVersion.ts` |
| `useDeleteTariffVersion` | DELETE scheduled | `useDeleteTariffVersion.ts` |

---

## User Stories

### Story 52-FE.1: Version History Table

**User Story**: As an Admin, I want to view all tariff versions with their status so that I can understand the history and plan future changes.

**Acceptance Criteria**:
- [ ] Table displays all versions from `GET /v1/tariffs/settings/history`
- [ ] Each row shows: effective_from, effective_until, status badge, source, notes, created_at, updated_by
- [ ] Status badges: `scheduled` (blue), `active` (green), `expired` (gray)
- [ ] "Delete" button visible only for `scheduled` versions
- [ ] Pagination support (if >20 versions)
- [ ] Empty state when no history

**API Endpoints**: `GET /v1/tariffs/settings/history`

**Components**:
- `VersionHistoryTable.tsx` - Main table component
- `VersionStatusBadge.tsx` - Status indicator

**Story Points**: 3

---

### Story 52-FE.2: Tariff Settings Edit Form

**User Story**: As an Admin, I want to edit current tariff settings through a form so that I can update rates without database access.

**Acceptance Criteria**:
- [ ] Form displays all 21 editable fields grouped by category
- [ ] Categories: Acceptance, Logistics, Returns, Commission, Storage, FBS
- [ ] Validation rules match backend (positive numbers, 0-100 for percentages)
- [ ] `logisticsVolumeTiers` editor with add/remove/edit rows
- [ ] Save button calls `PUT` (full) or `PATCH` (partial) based on changes
- [ ] Success toast after save
- [ ] Error handling for validation errors (400) and rate limit (429)
- [ ] Confirm dialog before save

**API Endpoints**:
- `GET /v1/tariffs/settings` (load current)
- `PUT /v1/tariffs/settings` (full replace)
- `PATCH /v1/tariffs/settings` (partial update)

**Components**:
- `TariffSettingsForm.tsx` - Main form container
- `AcceptanceRatesSection.tsx` - Acceptance fields
- `LogisticsRatesSection.tsx` - Logistics fields + tiers editor
- `CommissionRatesSection.tsx` - Commission fields
- `StorageSettingsSection.tsx` - Storage fields
- `FbsSettingsSection.tsx` - FBS-specific fields
- `LogisticsTiersEditor.tsx` - Volume tiers array editor

**Story Points**: 8

---

### Story 52-FE.3: Schedule Future Version

**User Story**: As an Admin, I want to schedule a future tariff version so that I can plan rate changes in advance.

**Acceptance Criteria**:
- [ ] "Schedule New Version" button opens modal
- [ ] Modal includes: date picker for `effective_from`, all tariff fields (pre-filled from current)
- [ ] Date validation: must be future date (tomorrow or later)
- [ ] Submit calls `POST /v1/tariffs/settings/schedule`
- [ ] Error handling for duplicate date (409 Conflict)
- [ ] Success toast with scheduled date
- [ ] Max 10 scheduled versions limit shown
- [ ] After success, refresh version history table

**API Endpoints**: `POST /v1/tariffs/settings/schedule`

**Components**:
- `ScheduleVersionModal.tsx` - Modal with form
- `ScheduleVersionForm.tsx` - Form fields (reuses sections from 52-FE.2)

**Story Points**: 5

---

### Story 52-FE.4: Audit Log Viewer

**User Story**: As an Admin, I want to view the audit trail of tariff changes so that I can track who changed what and when.

**Acceptance Criteria**:
- [ ] Table displays audit entries from `GET /v1/tariffs/settings/audit`
- [ ] Columns: timestamp, user_email, field_name, old_value, new_value, IP address
- [ ] Filter dropdown by field_name (21 options)
- [ ] Pagination (50 items per page)
- [ ] Date range filter (optional)
- [ ] Values formatted appropriately (arrays as JSON, numbers with units)
- [ ] Empty state when no audit entries

**API Endpoints**: `GET /v1/tariffs/settings/audit?page=1&limit=50&field_name=storageFreeDays`

**Components**:
- `AuditLogTable.tsx` - Main audit table
- `AuditFieldFilter.tsx` - Field name filter dropdown
- `AuditValueDisplay.tsx` - Format old/new values

**Story Points**: 4

---

### Story 52-FE.5: Delete Scheduled Version

**User Story**: As an Admin, I want to delete a scheduled tariff version so that I can cancel planned changes that are no longer needed.

**Acceptance Criteria**:
- [ ] Delete button visible only for `status = "scheduled"` versions
- [ ] Confirmation dialog: "Are you sure you want to delete the version scheduled for {date}?"
- [ ] Submit calls `DELETE /v1/tariffs/settings/:id`
- [ ] Error handling for non-scheduled versions (400)
- [ ] Success toast after deletion
- [ ] Refresh version history table after success

**API Endpoints**: `DELETE /v1/tariffs/settings/:id`

**Components**:
- `DeleteVersionDialog.tsx` - Confirmation dialog

**Story Points**: 2

---

### Story 52-FE.6: Rate Limit UX & Error Handling

**User Story**: As an Admin, I want to see rate limit status and clear error messages so that I understand when I'm approaching limits.

**Acceptance Criteria**:
- [ ] Rate limit indicator shows remaining requests (from response headers)
- [ ] Warning toast when <3 requests remaining
- [ ] 429 error handling with retry countdown
- [ ] 403 error redirects to dashboard with "Admin access required" message
- [ ] 400 validation errors shown inline on form fields
- [ ] 409 conflict error shows clear message about duplicate date

**API Endpoints**: All mutation endpoints (PUT, PATCH, POST, DELETE)

**Components**:
- `RateLimitIndicator.tsx` - Shows remaining requests
- Error handling in all mutation hooks

**Story Points**: 2

---

### Story 52-FE.7: Page Layout, Types & Integration

**User Story**: As an Admin, I want a well-organized settings page with tabs so that I can easily navigate between current settings, history, and audit.

**Acceptance Criteria**:
- [ ] Page at `/settings/tariffs` with 3 tabs
- [ ] Admin role check (redirect non-admins to dashboard)
- [ ] Sidebar navigation: Settings > Tariffs (Admin only)
- [ ] TypeScript types for all API DTOs
- [ ] React Query hooks with proper caching
- [ ] Breadcrumbs: Home > Settings > Tariffs
- [ ] Responsive layout (desktop-first, mobile-friendly)
- [ ] Loading skeletons for all data fetching states

**API Endpoints**: All endpoints

**Components**:
- `src/app/(dashboard)/settings/tariffs/page.tsx` - Main page
- `src/types/tariffs-admin.ts` - TypeScript types
- `src/lib/api/tariffs-admin.ts` - API client functions
- `src/hooks/useTariff*.ts` - React Query hooks

**Story Points**: 2

---

## Page Structure

### Route: `/settings/tariffs`

**Access Control**: Admin role only

**Layout**:
```
┌────────────────────────────────────────────────────────────┐
│  Home > Settings > Tariff Settings                          │
│                                                              │
│  ⚙️ Управление тарифами Wildberries                         │
│  ──────────────────────────────────────────────────────────│
│                                                              │
│  [Текущие настройки] [История версий] [Журнал изменений]   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tab Content (varies by selected tab)                │  │
│  │                                                        │  │
│  │  Tab 1: TariffSettingsForm                           │  │
│  │  Tab 2: VersionHistoryTable + ScheduleVersionModal   │  │
│  │  Tab 3: AuditLogTable                                │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [RateLimitIndicator]  Осталось запросов: 8/10             │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Sidebar Navigation

```
Settings
  ├─> Уведомления 🔔 (existing)
  └─> Тарифы ⚙️ (NEW - Admin only)
```

---

## API Integration

### Endpoints Summary

| Endpoint | Method | Purpose | Rate Limit | Hook |
|----------|--------|---------|------------|------|
| `/v1/tariffs/settings` | GET | Current settings | None | `useTariffSettings()` |
| `/v1/tariffs/settings` | PUT | Full replace | 10/min | `useUpdateTariffSettings()` |
| `/v1/tariffs/settings` | PATCH | Partial update | 10/min | `useUpdateTariffSettings()` |
| `/v1/tariffs/settings/history` | GET | Version list | None | `useTariffVersionHistory()` |
| `/v1/tariffs/settings/schedule` | POST | Create future | 10/min | `useScheduleTariffVersion()` |
| `/v1/tariffs/settings/:id` | DELETE | Delete scheduled | None | `useDeleteTariffVersion()` |
| `/v1/tariffs/settings/audit` | GET | Audit trail | None | `useTariffAuditLog()` |

### TypeScript Types

```typescript
// src/types/tariffs-admin.ts

/** Version status calculated from dates */
export type TariffVersionStatus = 'scheduled' | 'active' | 'expired'

/** Volume tier for logistics */
export interface LogisticsVolumeTier {
  fromLiters: number
  toLiters: number
  rateRub: number
}

/** Full tariff settings DTO */
export interface TariffSettingsDto {
  // Acceptance
  acceptanceBoxRatePerLiter: number
  acceptancePalletRate: number
  // Logistics
  logisticsVolumeTiers: LogisticsVolumeTier[]
  logisticsLargeFirstLiterRate: number
  logisticsLargeAdditionalLiterRate: number
  // Returns
  returnLogisticsFboRate: number
  returnLogisticsFbsRate: number
  // Commission
  defaultCommissionFboPct: number
  defaultCommissionFbsPct: number
  // Storage
  storageFreeDays: number
  fixationClothingDays: number
  fixationOtherDays: number
  // FBS-specific
  fbsUsesFboLogisticsRates: boolean
  logisticsFbsVolumeTiers?: LogisticsVolumeTier[]
  logisticsFbsLargeFirstLiterRate?: number
  logisticsFbsLargeAdditionalLiterRate?: number
  clothingCategories?: string[]
  // Meta
  effectiveFrom?: string
  source?: 'manual' | 'api'
  notes?: string
}

/** Update request (partial allowed for PATCH) */
export type UpdateTariffSettingsDto = Partial<TariffSettingsDto>

/** Schedule request requires effective_from */
export interface ScheduleTariffVersionDto extends Partial<TariffSettingsDto> {
  effective_from: string // YYYY-MM-DD, must be future
}

/** Version history item */
export interface TariffVersion {
  id: number
  effective_from: string
  effective_until: string | null
  status: TariffVersionStatus
  source: 'manual' | 'api'
  notes?: string
  created_at: string
  updated_by: string
}

/** Audit log entry */
export interface TariffAuditEntry {
  id: number
  action: 'UPDATE' | 'CREATE' | 'DELETE'
  field_name: string
  old_value: string | null
  new_value: string | null
  user_id: string
  user_email: string
  ip_address: string
  created_at: string
}

/** Audit log response with pagination */
export interface TariffAuditResponse {
  data: TariffAuditEntry[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/** 21 tracked audit fields */
export const TRACKED_TARIFF_FIELDS = [
  'acceptanceBoxRatePerLiter',
  'acceptancePalletRate',
  'logisticsVolumeTiers',
  'logisticsLargeFirstLiterRate',
  'logisticsLargeAdditionalLiterRate',
  'returnLogisticsFboRate',
  'returnLogisticsFbsRate',
  'defaultCommissionFboPct',
  'defaultCommissionFbsPct',
  'storageFreeDays',
  'fixationClothingDays',
  'fixationOtherDays',
  'clothingCategories',
  'fbsUsesFboLogisticsRates',
  'logisticsFbsVolumeTiers',
  'logisticsFbsLargeFirstLiterRate',
  'logisticsFbsLargeAdditionalLiterRate',
  'effectiveFrom',
  'source',
  'notes',
] as const
```

### Error Responses

```typescript
// 403 Forbidden - Non-admin user
{ message: "Required roles: admin. User role: manager", error: "Forbidden" }

// 400 Bad Request - Validation error
{ message: ["storageFreeDays must be at least 0"], error: "Bad Request" }

// 409 Conflict - Duplicate effective_from
{ message: "A version already exists for 2026-02-01", error: "Conflict" }

// 429 Too Many Requests - Rate limit
{ message: "Rate limit exceeded: 10 requests per minute", error: "Too Many Requests" }
```

---

## Technical Notes

### Form Validation (Zod Schema)

```typescript
const tariffSettingsSchema = z.object({
  // Acceptance (positive numbers)
  acceptanceBoxRatePerLiter: z.number().positive(),
  acceptancePalletRate: z.number().positive(),

  // Logistics
  logisticsVolumeTiers: z.array(z.object({
    fromLiters: z.number().positive(),
    toLiters: z.number().positive(),
    rateRub: z.number().positive(),
  })).min(1),
  logisticsLargeFirstLiterRate: z.number().positive(),
  logisticsLargeAdditionalLiterRate: z.number().positive(),

  // Returns
  returnLogisticsFboRate: z.number().positive(),
  returnLogisticsFbsRate: z.number().positive(),

  // Commission (0-100 percentages)
  defaultCommissionFboPct: z.number().min(0).max(100),
  defaultCommissionFbsPct: z.number().min(0).max(100),

  // Storage (non-negative integers)
  storageFreeDays: z.number().int().min(0),
  fixationClothingDays: z.number().int().min(0),
  fixationOtherDays: z.number().int().min(0),

  // FBS (optional)
  fbsUsesFboLogisticsRates: z.boolean(),
  logisticsFbsVolumeTiers: z.array(z.object({
    fromLiters: z.number().positive(),
    toLiters: z.number().positive(),
    rateRub: z.number().positive(),
  })).optional(),

  // Meta
  source: z.enum(['manual', 'api']).default('manual'),
  notes: z.string().max(500).optional(),
})
```

### Volume Tiers Validation

Backend requires:
- Tiers sorted by `fromLiters` ascending
- Non-overlapping ranges
- Full coverage from 0.001L to 1.000L (for standard tiers)

### Admin Role Check Pattern

```typescript
// In page.tsx
const { user } = useAuth()

if (user?.role !== 'admin') {
  redirect('/dashboard')
  return null
}
```

### Rate Limit Headers

Backend returns:
- `X-RateLimit-Limit: 10`
- `X-RateLimit-Remaining: 8`
- `X-RateLimit-Reset: 1705932000` (Unix timestamp)

---

## Dependencies

### Required Before Implementation

- Backend Epic 52 - Complete
- Admin user account for testing

### External Dependencies

- `@tanstack/react-query` - Data fetching (existing)
- `react-hook-form` + `zod` - Form handling (existing)
- shadcn/ui components: Tabs, Table, Dialog, Form, Input, Select, DatePicker

### Affected Files (New)

```
src/app/(dashboard)/settings/tariffs/
  └── page.tsx

src/components/custom/tariffs-admin/
  ├── TariffSettingsForm.tsx
  ├── AcceptanceRatesSection.tsx
  ├── LogisticsRatesSection.tsx
  ├── CommissionRatesSection.tsx
  ├── StorageSettingsSection.tsx
  ├── FbsSettingsSection.tsx
  ├── LogisticsTiersEditor.tsx
  ├── VersionHistoryTable.tsx
  ├── VersionStatusBadge.tsx
  ├── ScheduleVersionModal.tsx
  ├── ScheduleVersionForm.tsx
  ├── AuditLogTable.tsx
  ├── AuditFieldFilter.tsx
  ├── AuditValueDisplay.tsx
  ├── DeleteVersionDialog.tsx
  └── RateLimitIndicator.tsx

src/types/tariffs-admin.ts

src/lib/api/tariffs-admin.ts

src/hooks/
  ├── useTariffSettings.ts
  ├── useTariffVersionHistory.ts
  ├── useTariffAuditLog.ts
  ├── useUpdateTariffSettings.ts
  ├── useScheduleTariffVersion.ts
  └── useDeleteTariffVersion.ts
```

### Modified Files

- `src/components/layout/Sidebar.tsx` - Add tariffs link (admin only)
- `src/lib/routes.ts` - Add ROUTES.SETTINGS.TARIFFS

---

## Implementation Order

**Recommended sequence**:

1. **Story 52-FE.7** (Types, Hooks, Page Layout) - Foundation (2 SP)
2. **Story 52-FE.1** (Version History Table) - Read-only view (3 SP)
3. **Story 52-FE.4** (Audit Log Viewer) - Read-only view (4 SP)
4. **Story 52-FE.2** (Settings Edit Form) - Core functionality (8 SP)
5. **Story 52-FE.3** (Schedule Version) - Advanced feature (5 SP)
6. **Story 52-FE.5** (Delete Version) - Complete CRUD (2 SP)
7. **Story 52-FE.6** (Rate Limit UX) - Polish (2 SP)

**Total**: 26 SP (~10-14 days frontend)

### Sprint Planning

**Sprint 1 (9 SP)**:
- Story 52-FE.7 (2 SP) - Foundation
- Story 52-FE.1 (3 SP) - Version history
- Story 52-FE.4 (4 SP) - Audit log

**Sprint 2 (10 SP)**:
- Story 52-FE.2 (8 SP) - Edit form
- Story 52-FE.6 (2 SP) - Rate limit UX

**Sprint 3 (7 SP)**:
- Story 52-FE.3 (5 SP) - Schedule version
- Story 52-FE.5 (2 SP) - Delete version

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex form validation | Medium | Medium | Reuse existing form patterns, thorough testing |
| Rate limit UX confusion | Low | Low | Clear indicator and messaging |
| Admin role misconfiguration | Low | High | Test with non-admin accounts |
| Volume tiers editor complexity | Medium | Medium | Build as separate component, unit test |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Admin adoption | >80% use UI vs API | Track page views |
| Error rate | <1% failed saves | Track 400/409 errors |
| Time to update | <2 minutes | User timing metrics |
| Audit compliance | 100% changes tracked | Verify audit entries |

---

## Related Documentation

### Backend

- [Request #101: Epic 52 Backend Changes](../request-backend/101-epic-52-tariff-settings-admin-api.md)
- Backend Epic 52 stories: `docs/stories/epic-52/`

### Frontend

- [Epic 44-FE: Price Calculator UI](./epic-44-price-calculator-ui.md) - Uses tariff settings
- [Frontend Architecture](../front-end-architecture.md)

---

**Last Updated**: 2026-01-22
**Status**: 📋 Ready for Development
**Author**: PM Agent
