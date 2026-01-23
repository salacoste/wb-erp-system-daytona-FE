# Story 52-FE.7: Page Layout, Types & Integration

**Epic**: Epic 52-FE - Tariff Settings Admin UI
**Story ID**: 52-FE.7
**Title**: Page Layout, Types & Integration
**Status**: ✅ Complete
**Story Points**: 2
**Priority**: Required (Foundation)
**Completed**: 2026-01-23

---

## User Story

**As an** Admin,
**I want** a well-organized settings page with tabs,
**So that** I can easily navigate between current settings, history, and audit.

---

## Acceptance Criteria

- [x] **AC1**: Page accessible at `/settings/tariffs`
- [x] **AC2**: Admin role check - non-admins redirected to dashboard
- [x] **AC3**: 3 tabs layout:
  - Tab 1: "Текущие настройки"
  - Tab 2: "История версий"
  - Tab 3: "Журнал изменений"
- [x] **AC4**: Sidebar navigation: Settings > Тарифы (Admin only)
- [x] **AC5**: TypeScript types for all API DTOs
- [x] **AC6**: React Query hooks with proper caching
- [x] **AC7**: Breadcrumbs: Главная > Настройки > Тарифы
- [x] **AC8**: Responsive layout (desktop-first)
- [x] **AC9**: Loading skeletons for all tabs

---

## Technical Design

### Route Configuration

```typescript
// src/lib/routes.ts
export const ROUTES = {
  // ... existing routes
  SETTINGS: {
    NOTIFICATIONS: '/settings/notifications',
    TARIFFS: '/settings/tariffs', // NEW - Admin only
  },
} as const
```

### Page Component

```typescript
// src/app/(dashboard)/settings/tariffs/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TariffSettingsForm } from '@/components/custom/tariffs-admin/TariffSettingsForm'
import { VersionHistoryTable } from '@/components/custom/tariffs-admin/VersionHistoryTable'
import { AuditLogTable } from '@/components/custom/tariffs-admin/AuditLogTable'
import { RateLimitIndicator } from '@/components/custom/tariffs-admin/RateLimitIndicator'

export default function TariffSettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Admin check
  if (!isLoading && user?.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  if (isLoading) {
    return <TariffSettingsPageSkeleton />
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbItem href="/dashboard">Главная</BreadcrumbItem>
        <BreadcrumbItem href="/settings">Настройки</BreadcrumbItem>
        <BreadcrumbItem>Тарифы</BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Управление тарифами</h1>
          <p className="text-muted-foreground">
            Настройки глобальных тарифов Wildberries
          </p>
        </div>
        <RateLimitIndicator />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Текущие настройки</TabsTrigger>
          <TabsTrigger value="history">История версий</TabsTrigger>
          <TabsTrigger value="audit">Журнал изменений</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          <TariffSettingsForm />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <VersionHistoryTable />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLogTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### TypeScript Types

```typescript
// src/types/tariffs-admin.ts

/** Version status calculated from effective dates */
export type TariffVersionStatus = 'scheduled' | 'active' | 'expired'

/** Volume tier for logistics pricing */
export interface LogisticsVolumeTier {
  fromLiters: number
  toLiters: number
  rateRub: number
}

/** Full tariff settings DTO (21 fields) */
export interface TariffSettingsDto {
  // Acceptance (2 fields)
  acceptanceBoxRatePerLiter: number
  acceptancePalletRate: number

  // Logistics (3 fields + tiers)
  logisticsVolumeTiers: LogisticsVolumeTier[]
  logisticsLargeFirstLiterRate: number
  logisticsLargeAdditionalLiterRate: number

  // Returns (2 fields)
  returnLogisticsFboRate: number
  returnLogisticsFbsRate: number

  // Commission (2 fields)
  defaultCommissionFboPct: number
  defaultCommissionFbsPct: number

  // Storage (3 fields)
  storageFreeDays: number
  fixationClothingDays: number
  fixationOtherDays: number

  // FBS-specific (4+ fields)
  fbsUsesFboLogisticsRates: boolean
  logisticsFbsVolumeTiers?: LogisticsVolumeTier[]
  logisticsFbsLargeFirstLiterRate?: number
  logisticsFbsLargeAdditionalLiterRate?: number
  clothingCategories?: string[]

  // Meta (3 fields)
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

/** Query params for audit log */
export interface TariffAuditParams {
  page?: number
  limit?: number
  field_name?: string
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

export type TrackedTariffField = typeof TRACKED_TARIFF_FIELDS[number]
```

### API Client Functions

```typescript
// src/lib/api/tariffs-admin.ts
import { apiClient } from '@/lib/api-client'
import type {
  TariffSettingsDto,
  UpdateTariffSettingsDto,
  ScheduleTariffVersionDto,
  TariffVersion,
  TariffAuditResponse,
  TariffAuditParams,
} from '@/types/tariffs-admin'

const BASE_URL = '/v1/tariffs/settings'

/** GET /v1/tariffs/settings */
export async function getTariffSettings(): Promise<TariffSettingsDto> {
  return apiClient.get(BASE_URL)
}

/** PUT /v1/tariffs/settings */
export async function putTariffSettings(
  data: TariffSettingsDto
): Promise<TariffSettingsDto> {
  return apiClient.put(BASE_URL, data)
}

/** PATCH /v1/tariffs/settings */
export async function patchTariffSettings(
  data: UpdateTariffSettingsDto
): Promise<TariffSettingsDto> {
  return apiClient.patch(BASE_URL, data)
}

/** GET /v1/tariffs/settings/history */
export async function getTariffVersionHistory(): Promise<TariffVersion[]> {
  const response = await apiClient.get<{ data: TariffVersion[] }>(`${BASE_URL}/history`)
  return response.data
}

/** POST /v1/tariffs/settings/schedule */
export async function scheduleTariffVersion(
  data: ScheduleTariffVersionDto
): Promise<TariffVersion> {
  return apiClient.post(`${BASE_URL}/schedule`, data)
}

/** DELETE /v1/tariffs/settings/:id */
export async function deleteTariffVersion(id: number): Promise<void> {
  return apiClient.delete(`${BASE_URL}/${id}`)
}

/** GET /v1/tariffs/settings/audit */
export async function getTariffAuditLog(
  params: TariffAuditParams = {}
): Promise<TariffAuditResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.field_name) searchParams.set('field_name', params.field_name)

  const query = searchParams.toString()
  return apiClient.get(`${BASE_URL}/audit${query ? `?${query}` : ''}`)
}
```

### Query Keys

```typescript
// src/hooks/tariff-query-keys.ts
export const tariffQueryKeys = {
  all: ['tariffs'] as const,
  settings: () => [...tariffQueryKeys.all, 'settings'] as const,
  versionHistory: () => [...tariffQueryKeys.all, 'history'] as const,
  auditLog: (params?: TariffAuditParams) =>
    [...tariffQueryKeys.all, 'audit', params] as const,
}
```

### Base Hook (useTariffSettings)

```typescript
// src/hooks/useTariffSettings.ts
import { useQuery } from '@tanstack/react-query'
import { getTariffSettings } from '@/lib/api/tariffs-admin'
import { tariffQueryKeys } from './tariff-query-keys'

export function useTariffSettings() {
  return useQuery({
    queryKey: tariffQueryKeys.settings(),
    queryFn: getTariffSettings,
    staleTime: 60 * 1000, // 1 minute (reduced from 24h due to version switching)
  })
}
```

### Sidebar Update

```typescript
// src/components/layout/Sidebar.tsx - Add to settings section
{user?.role === 'admin' && (
  <SidebarItem
    href={ROUTES.SETTINGS.TARIFFS}
    icon={Settings2}
    label="Тарифы"
  />
)}
```

---

## UI/UX Specifications

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  🏠 Главная > ⚙️ Настройки > Тарифы                     │
│  ───────────────────────────────────────────────────────│
│                                                          │
│  Управление тарифами          Запросов: 10/10 [███████] │
│  Настройки глобальных тарифов Wildberries               │
│                                                          │
│  ┌──────────────────┬──────────────────┬───────────────┐│
│  │ Текущие настройки│ История версий   │ Журнал измен. ││
│  └──────────────────┴──────────────────┴───────────────┘│
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  [Tab Content - varies by selected tab]           │ │
│  │                                                    │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Loading Skeleton

```tsx
function TariffSettingsPageSkeleton() {
  return (
    <div className="container py-6 space-y-6">
      <Skeleton className="h-4 w-48" /> {/* Breadcrumb */}
      <Skeleton className="h-8 w-64" /> {/* Title */}
      <Skeleton className="h-4 w-96" /> {/* Subtitle */}
      <Skeleton className="h-10 w-full max-w-md" /> {/* Tabs */}
      <Skeleton className="h-96 w-full" /> {/* Content */}
    </div>
  )
}
```

---

## Testing Requirements

### Unit Tests

- [x] Page renders for admin users
- [x] Non-admin users redirected to dashboard
- [x] All 3 tabs render correctly
- [x] Tab switching works
- [x] Loading skeleton displayed while auth loading

### Integration Tests

- [x] TypeScript types match API responses
- [x] Query hooks fetch data correctly
- [x] Cache invalidation works across hooks

---

## Files to Create

### New Files

```
src/app/(dashboard)/settings/tariffs/page.tsx
src/types/tariffs-admin.ts
src/lib/api/tariffs-admin.ts
src/hooks/tariff-query-keys.ts
src/hooks/useTariffSettings.ts
```

### Modified Files

```
src/lib/routes.ts (add TARIFFS route)
src/components/layout/Sidebar.tsx (add tariffs link for admin)
```

---

## Definition of Done

- [x] All acceptance criteria met
- [x] TypeScript types compile without errors
- [x] Page loads for admin users
- [x] Non-admins redirected correctly
- [x] Tabs switch content correctly
- [x] Code reviewed and approved

---

## Implementation Status

**Status:** ✅ Complete

### Implemented Files
- `src/app/(dashboard)/settings/tariffs/page.tsx` (146 lines) - Main page with tabs and admin check
- `src/types/tariffs-admin.ts` (179 lines) - All 21 field types, DTOs, tracked fields constant
- `src/lib/api/tariffs-admin.ts` - API client functions for all 7 endpoints
- `src/hooks/tariff-query-keys.ts` - Query key factory for React Query
- `src/hooks/useTariffSettings.ts` - Settings fetch hook
- `src/lib/routes.ts` - Added TARIFFS route constant
- `__tests__/page.test.tsx` - Page-level tests

### Notes
Page uses useAuth for role check (Owner only). Tabs use shadcn/ui Tabs component. Loading skeleton displayed during auth loading. Breadcrumb navigation implemented with links.

---

**Created**: 2026-01-22
**Last Updated**: 2026-01-23
