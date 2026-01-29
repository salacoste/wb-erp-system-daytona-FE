# API Integration Guide

**Version:** 2.0
**Date:** 2026-01-17
**Author:** Frontend Team
**Status:** Complete

---

## Table of Contents

1. [Introduction](#introduction)
2. [Backend Documentation Location](#backend-documentation-location)
3. [Complete Endpoint Mapping Table](#complete-endpoint-mapping-table)
4. [Backend HTTP Files Catalog](#backend-http-files-catalog)
5. [Testing Backend APIs](#testing-backend-apis)
6. [Integration Pattern Examples](#integration-pattern-examples)

---

## Introduction

This guide provides a comprehensive mapping between frontend API clients and backend documentation. It serves as the single source of truth for understanding which backend endpoints are used by which frontend components, and where to find authoritative specifications.

**Purpose:**
- Map all frontend API usage to backend HTTP test files
- Cross-reference frontend specs with backend implementation docs
- Provide quick navigation between frontend and backend code
- Enable efficient API testing and validation

**Target Audience:**
- Frontend developers implementing API integration
- Backend developers verifying API contracts
- QA engineers testing API endpoints
- Full-stack developers working on cross-cutting features

---

## Backend Documentation Location

### Primary Backend API Documentation

**Backend HTTP Test Files:** `/test-api/*.http`

These files contain **authoritative API specifications** with working examples for all endpoints. They are maintained by the backend team and serve as the single source of truth for API contracts.

**How to Access:**
1. **From Frontend Repository:**
   ```bash
   cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new
   ls test-api/*.http
   ```

2. **From VS Code:**
   - Open any `.http` file in `/test-api/`
   - Use "Rest Client" extension to execute requests
   - Requires backend server running on `localhost:3000`

3. **Key Files:**
   - `00-variables.http` - Environment variables and authentication setup
   - `01-auth.http` - Authentication endpoints
   - `03-cabinets.http` - Cabinet management
   - `04-imports.http` - Import operations
   - `05-analytics-basic.http` - Basic analytics
   - `06-analytics-advanced.http` - Advanced analytics (liquidity, supply planning)
   - `07-advertising-analytics.http` - Advertising analytics
   - `08-products.http` - Product management
   - `09-tasks.http` - Task management
   - `12-storage.http` - Storage analytics (Epic 24)
   - `13-notifications.http` - Telegram notifications (Epic 34)
   - `15-price-calculator.http` - Price calculator (Epic 43/44)

### Frontend Spec Documents

**Location:** `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend/docs/request-backend/*.md`

These documents contain frontend-specific requirements, integration notes, and implementation details for each backend API request.

---

## Complete Endpoint Mapping Table

### Storage Analytics (Epic 24) - 100% Mapped

| Frontend Client | Endpoint | Backend HTTP File | Frontend Spec Docs | Status |
|----------------|----------|-------------------|-------------------|--------|
| `lib/api/storage-analytics.ts` | GET `/v1/analytics/storage/by-sku` | `12-storage.http` | `request-backend/36-epic-24-paid-storage-analytics-api.md` | ✅ Complete |
| `lib/api/storage-analytics.ts` | GET `/v1/analytics/storage/top-consumers` | `12-storage.http` | `request-backend/36-epic-24-paid-storage-analytics-api.md` | ✅ Complete |
| `lib/api/storage-analytics.ts` | GET `/v1/analytics/storage/trends` | `12-storage.http` | `request-backend/36-epic-24-paid-storage-analytics-api.md` | ✅ Complete |
| `lib/api/storage-analytics.ts` | POST `/v1/imports/paid-storage` | `12-storage.http` | `request-backend/51-paid-storage-import-methods.md` | ✅ Complete |
| `lib/api/storage-analytics.ts` | GET `/v1/imports/{id}` | `04-imports.http` | `request-backend/39-epic-24-storage-import-json-fix.md` | ✅ Complete |
| `lib/api/storage-analytics.ts` | GET `/v1/analytics/storage/summary` | `12-storage.http` | `request-backend/52-storage-sku-breakdown-for-weekly-reports.md` | ✅ Complete |

**Key Features:**
- Per-SKU storage costs with filtering and pagination
- Top consumers ranking with optional revenue ratio
- Time-series trends with multi-metric support
- WB API data import (smart and manual modes)
- Request #52: Storage summary for weekly report integration
- Request #66: Single source of truth for storage data

---

### Price Calculator (Epic 43/44) - 100% Mapped

| Frontend Client | Endpoint | Backend HTTP File | Frontend Spec Docs | Status |
|----------------|----------|-------------------|-------------------|--------|
| `lib/api/price-calculator.ts` | POST `/v1/products/price-calculator` | `15-price-calculator.http` | `request-backend/95-epic-43-price-calculator-api.md` | ✅ Complete |

**Key Features:**
- Target margin-based price calculation
- Comprehensive cost breakdown (COGS, logistics, buyback, advertising, storage)
- Recommended price with actual margin percentage
- Warning system for edge cases
- Real-time calculation support

**Request Example:**
```typescript
const result = await calculatePrice({
  target_margin_pct: 20.0,
  cogs_rub: 1500.0,
  logistics_forward_rub: 200.0,
  logistics_reverse_rub: 150.0,
  buyback_pct: 98.0,
  advertising_pct: 5.0,
  storage_rub: 50.0,
});
// => { result: { recommended_price: 2500, actual_margin_pct: 20.5, ... }, warnings: [] }
```

---

### Telegram Notifications (Epic 34) - 100% Mapped

| Frontend Client | Endpoint | Backend HTTP File | Frontend Spec Docs | Status |
|----------------|----------|-------------------|-------------------|--------|
| `lib/api/notifications.ts` | POST `/v1/notifications/telegram/bind` | `13-notifications.http` | `request-backend/89-epic-34-analytics-endpoint.md` | ✅ Complete |
| `lib/api/notifications.ts` | GET `/v1/notifications/telegram/status` | `13-notifications.http` | `request-backend/89-telegram-notifications-integration.md` | ✅ Complete |
| `lib/api/notifications.ts` | DELETE `/v1/notifications/telegram/unbind` | `13-notifications.http` | `request-backend/89-epic-34-analytics-endpoint.md` | ✅ Complete |
| `lib/api/notifications.ts` | GET `/v1/notifications/preferences` | `13-notifications.http` | `request-backend/89-epic-34-analytics-endpoint.md` | ✅ Complete |
| `lib/api/notifications.ts` | PUT `/v1/notifications/preferences` | `13-notifications.http` | `request-backend/89-epic-34-analytics-endpoint.md` | ✅ Complete |
| `lib/api/notifications.ts` | POST `/v1/notifications/test` | `13-notifications.http` | `request-backend/89-epic-34-analytics-endpoint.md` | ✅ Complete |

**Key Features:**
- Telegram bot binding with verification code
- Real-time binding status polling
- Notification preferences management (margin alerts, system events)
- Test notification support
- Per-cabinet notification settings

**Integration Flow:**
1. User clicks "Connect Telegram"
2. Frontend calls `POST /v1/notifications/telegram/bind`
3. Backend generates 6-digit code and deep link
4. User sends code to @wb_repricer_bot
5. Frontend polls `GET /v1/notifications/telegram/status` every 3 seconds
6. On success, status changes to `bound` with username

---

### Advertising Analytics (Epic 33/36) - 100% Mapped

| Frontend Client | Endpoint | Backend HTTP File | Frontend Spec Docs | Status |
|----------------|----------|-------------------|-------------------|--------|
| `lib/api/advertising-analytics.ts` | GET `/v1/analytics/advertising` | `07-advertising-analytics.http` | `request-backend/71-advertising-analytics-epic-33.md` | ✅ Complete |
| `lib/api/advertising-analytics.ts` | GET `/v1/analytics/advertising/campaigns` | `07-advertising-analytics.http` | - | ✅ Complete |
| `lib/api/advertising-analytics.ts` | GET `/v1/analytics/advertising/sync-status` | `07-advertising-analytics.http` | `request-backend/72-advertising-sync-status-404-error.md` | ✅ Complete |

**Key Features:**
- Multi-dimensional analytics (SKU, campaign, daily)
- ROAS/ROI calculations with profit metrics
- Efficiency classification (excellent/good/poor)
- Product card linking support (Epic 36)
- Organic vs advertising sales split (Epic 35)
- Campaign management with placement info (Request #79)

**View Modes:**
- `sku` - Per-product metrics with product card linking
- `campaign` - Campaign-level aggregation
- `daily` - Time-series performance data

**Epic 36 Enhancements:**
- `type` field: `merged_group` | `individual` | `undefined`
- `imtId` field for product card linking
- `mergedProducts` array for merged groups
- Vendor codes for all linked products

---

### Liquidity (Epic 29) - 100% Mapped

| Frontend Client | Endpoint | Backend HTTP File | Frontend Spec Docs | Status |
|----------------|----------|-------------------|-------------------|--------|
| `lib/api/liquidity.ts` | GET `/v1/analytics/liquidity` | `06-analytics-advanced.http` | `request-backend/55-liquidity-api-endpoint.md` | ✅ Complete |

**Key Features:**
- Cash position analysis (current, forecast, min required)
- Cash gap alerts with timeline
- Weekly burn rate analysis
- Liquidity ratio calculations
- Scenario planning (optimistic/pessimistic)

---

### Supply Planning (Epic 28) - 100% Mapped

| Frontend Client | Endpoint | Backend HTTP File | Frontend Spec Docs | Status |
|----------------|----------|-------------------|-------------------|--------|
| `lib/api/supply-planning.ts` | GET `/v1/analytics/supply-planning` | `06-analytics-advanced.http` | `request-backend/54-supply-planning-api-endpoint.md` | ✅ Complete |

**Key Features:**
- Reorder point calculations by SKU
- Days of stock remaining (DOS)
- Recommended order quantities
- Lead time analysis
- Seasonal demand forecasting

---

### Core Analytics (Legacy) - Mapped

| Frontend Client | Endpoint | Backend HTTP File | Frontend Spec Docs | Status |
|----------------|----------|-------------------|-------------------|--------|
| `lib/api.ts` (legacy) | GET `/v1/analytics/weekly/finance-summary` | `05-analytics-basic.http` | `request-backend/06-missing-expense-fields-in-finance-summary.md` | ✅ Complete |
| `lib/api.ts` (legacy) | GET `/v1/analytics/weekly/by-sku` | `05-analytics-basic.http` | `request-backend/10-margin-analysis-time-series-endpoint.md` | ✅ Complete |
| `lib/api.ts` (legacy) | GET `/v1/analytics/weekly/by-brand` | `05-analytics-basic.http` | - | ✅ Complete |
| `lib/api.ts` (legacy) | GET `/v1/analytics/weekly/by-category` | `05-analytics-basic.http` | - | ✅ Complete |
| `lib/api.ts` (legacy) | GET `/v1/analytics/cabinet-summary` | `05-analytics-basic.http` | - | ✅ Complete |

---

### Product Management - Mapped

| Frontend Client | Endpoint | Backend HTTP File | Frontend Spec Docs | Status |
|----------------|----------|-------------------|-------------------|--------|
| `lib/api.ts` (legacy) | GET `/v1/products` | `08-products.http` | `request-backend/13-products-pagination-wb-sdk-issue.md` | ✅ Complete |
| `lib/api.ts` (legacy) | GET `/v1/products/{nmId}` | `08-products.http` | - | ✅ Complete |
| `lib/api.ts` (legacy) | POST `/v1/products/{nmId}/cogs` | `07-cogs.http` | `request-backend/12-cogs-update-conflict-409-error.md` | ✅ Complete |
| `lib/api.ts` (legacy) | POST `/v1/products/cogs/bulk` | `07-cogs.http` | - | ✅ Complete |

---

## Backend HTTP Files Catalog

### Core Files

| File | Purpose | Endpoint Categories |
|------|---------|---------------------|
| `00-variables.http` | Environment setup | Variables, authentication |
| `01-auth.http` | Authentication | `POST /v1/auth/login`, `POST /v1/auth/register` |
| `02-health.http` | Health checks | `GET /v1/health` |
| `03-cabinets.http` | Cabinet management | `GET/POST/PUT /v1/cabinets`, `POST /v1/cabinets/{id}/keys` |
| `04-imports.http` | Import operations | `POST /v1/imports/*`, `GET /v1/imports/{id}` |

### Analytics Files

| File | Purpose | Endpoint Categories |
|------|---------|---------------------|
| `05-analytics-basic.http` | Basic analytics | `GET /v1/analytics/weekly/*` |
| `06-analytics-advanced.http` | Advanced analytics | `GET /v1/analytics/liquidity`, `GET /v1/analytics/supply-planning` |
| `07-advertising-analytics.http` | Advertising analytics | `GET /v1/analytics/advertising/*` |
| `12-storage.http` | Storage analytics | `GET /v1/analytics/storage/*`, `POST /v1/imports/paid-storage` |

### Feature-Specific Files

| File | Purpose | Epic | Endpoint Categories |
|------|---------|------|---------------------|
| `07-cogs.http` | COGS management | Epic 10 | `POST /v1/products/*/cogs` |
| `08-products.http` | Product management | Epic 12 | `GET /v1/products`, `GET /v1/products/{id}` |
| `09-tasks.http` | Task management | Epic 23 | `GET /v1/tasks`, `GET /v1/tasks/{id}` |
| `10-exports.http` | Export operations | Epic 6 | `POST /v1/exports/*`, `GET /v1/exports/{id}` |
| `11-schedules.http` | Scheduled tasks | Epic 23 | `GET/POST/PUT/DELETE /v1/schedules/*` |
| `13-notifications.http` | Telegram notifications | Epic 34 | `POST/GET/DELETE /v1/notifications/telegram/*` |
| `14-orders.http` | Orders sync | Epic 36 | `GET /v1/orders/*` |
| `15-price-calculator.http` | Price calculator | Epic 43/44 | `POST /v1/products/price-calculator` |

### Testing Files

| File | Purpose |
|------|---------|
| `40.7-orders-notifications.http` | E2E validation for orders/notifications |
| `epic-24-e2e-validation.http` | E2E validation for storage analytics |
| `99-errors.http` | Error response testing |

---

## Testing Backend APIs

### Prerequisites

1. **Backend Server Running:**
   ```bash
   cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new
   npm run start:dev
   # Backend available at http://localhost:3000
   ```

2. **VS Code Extension:**
   - Install "REST Client" extension (`humao.rest-client`)
   - Open any `.http` file in `/test-api/`
   - Click "Send Request" above each endpoint

### Quick Test Workflow

```bash
# 1. Navigate to test-api directory
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/test-api

# 2. Open variables file to set authentication
code 00-variables.http

# 3. Execute login to get token
# In 00-variables.http, click "Send Request" on:
# POST {{baseUrl}}/v1/auth/login

# 4. Test specific endpoint
# Example: Test storage analytics
code 12-storage.http
# Click "Send Request" on desired endpoint
```

### Example: Testing Storage Analytics

```http
### Get Storage by SKU
GET {{baseUrl}}/v1/analytics/storage/by-sku?weekStart=2025-W44&weekEnd=2025-W47
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

### Get Top Consumers
GET {{baseUrl}}/v1/analytics/storage/top-consumers?weekStart=2025-W44&weekEnd=2025-W47&limit=5
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

### Get Storage Trends
GET {{baseUrl}}/v1/analytics/storage/trends?weekStart=2025-W44&weekEnd=2025-W47&metrics=storage_cost,volume
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

### Example: Testing Price Calculator

```http
### Calculate Optimal Price
POST {{baseUrl}}/v1/products/price-calculator
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
Content-Type: application/json

{
  "target_margin_pct": 20.0,
  "cogs_rub": 1500.0,
  "logistics_forward_rub": 200.0,
  "logistics_reverse_rub": 150.0,
  "buyback_pct": 98.0,
  "advertising_pct": 5.0,
  "storage_rub": 50.0
}
```

### Common Testing Scenarios

**1. Authentication Flow:**
```bash
# 00-variables.http
POST {{baseUrl}}/v1/auth/register
POST {{baseUrl}}/v1/auth/login
POST {{baseUrl}}/v1/auth/logout
```

**2. Complete Storage Analytics Workflow:**
```bash
# 12-storage.http
# 1. Trigger import
POST {{baseUrl}}/v1/imports/paid-storage

# 2. Check import status
GET {{baseUrl}}/v1/imports/{import_id}

# 3. Fetch analytics
GET {{baseUrl}}/v1/analytics/storage/by-sku
GET {{baseUrl}}/v1/analytics/storage/top-consumers
GET {{baseUrl}}/v1/analytics/storage/trends
GET {{baseUrl}}/v1/analytics/storage/summary
```

**3. Telegram Notifications Integration:**
```bash
# 13-notifications.http
# 1. Start binding
POST {{baseUrl}}/v1/notifications/telegram/bind

# 2. Poll status (repeat every 3 seconds)
GET {{baseUrl}}/v1/notifications/telegram/status

# 3. Get preferences
GET {{baseUrl}}/v1/notifications/preferences

# 4. Update preferences
PUT {{baseUrl}}/v1/notifications/preferences

# 5. Send test notification
POST {{baseUrl}}/v1/notifications/test

# 6. Unbind
DELETE {{baseUrl}}/v1/notifications/telegram/unbind
```

---

## Integration Pattern Examples

### Modern API Client Pattern

All new API clients use the centralized `apiClient` with automatic authentication:

```typescript
// src/lib/api-client.ts
import { apiClient } from '@/lib/api-client'

// apiClient automatically adds:
// - Authorization: Bearer {token} from auth store
// - X-Cabinet-Id: {cabinetId} from auth store
```

### Pattern 1: Query String Building

Used in storage analytics, advertising analytics:

```typescript
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      // Handle arrays (e.g., metrics=['storage_cost', 'volume'])
      if (value.length > 0) {
        searchParams.append(key, value.join(','))
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

// Usage:
const queryParams = buildQueryString({
  weekStart: '2025-W44',
  weekEnd: '2025-W47',
  metrics: ['storage_cost', 'volume'],
  brand: 'Nike',
})

const response = await apiClient.get(
  `/v1/analytics/storage/trends?${queryParams}`
)
```

### Pattern 2: Response Normalization

Used in storage analytics for defensive programming:

```typescript
function normalizeStorageBySkuResponse(
  rawResponse: unknown,
  weekStart: string,
  weekEnd: string,
): StorageBySkuResponse {
  // If response is already properly structured, return as-is
  if (
    typeof rawResponse === 'object' &&
    rawResponse !== null &&
    'data' in rawResponse
  ) {
    return rawResponse as StorageBySkuResponse
  }

  // Fallback: If response is a bare array (unwrap bug), reconstruct structure
  if (Array.isArray(rawResponse)) {
    return {
      period: { from: weekStart, to: weekEnd, days_count: 0 },
      data: rawResponse,
      summary: {
        total_storage_cost: 0,
        products_count: rawResponse.length,
        avg_cost_per_product: 0,
      },
      pagination: {
        total: rawResponse.length,
        cursor: null,
        has_more: false,
      },
      has_data: rawResponse.length > 0,
    }
  }

  // Ultimate fallback: empty response structure
  return {
    period: { from: weekStart, to: weekEnd, days_count: 0 },
    data: [],
    summary: { total_storage_cost: 0, products_count: 0, avg_cost_per_product: 0 },
    pagination: { total: 0, cursor: null, has_more: false },
    has_data: false,
  }
}
```

### Pattern 3: Skip Data Unwrap

Used when backend returns response with metadata:

```typescript
// Default: apiClient unwraps { data: ... } automatically
const data = await apiClient.get<ResponseType>('/v1/endpoint')

// With skipDataUnwrap: Get full response with metadata
const fullResponse = await apiClient.get<FullResponseType>(
  '/v1/analytics/storage/trends',
  { skipDataUnwrap: true }
)
```

### Pattern 4: TanStack Query Integration

```typescript
// src/hooks/useStorageAnalytics.ts
import { useQuery } from '@tanstack/react-query'
import { getStorageBySku } from '@/lib/api/storage-analytics'

export function useStorageAnalytics(params: StorageBySkuParams) {
  return useQuery({
    queryKey: ['storage', 'by-sku', params],
    queryFn: () => getStorageBySku(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!params.weekStart && !!params.weekEnd,
  })
}

// Usage in component:
function StorageAnalyticsPage() {
  const { data, isLoading, error } = useStorageAnalytics({
    weekStart: '2025-W44',
    weekEnd: '2025-W47',
    limit: 20,
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorDisplay error={error} />

  return <StorageTable data={data.data} />
}
```

### Pattern 5: Mutation with Cache Invalidation

```typescript
// src/hooks/usePriceCalculator.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { calculatePrice } from '@/lib/api/price-calculator'

export function usePriceCalculator() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: calculatePrice,
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })

      // Show warnings if any
      if (result.warnings.length > 0) {
        toast.warning(`${result.warnings.length} warnings`, {
          description: result.warnings.join('\n'),
        })
      }
    },
  })

  return {
    calculatePrice: mutation.mutate,
    isCalculating: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
  }
}
```

### Pattern 6: Polling for Async Operations

Used in import status, binding status:

```typescript
// src/hooks/useImportStatus.ts
import { useQuery } from '@tanstack/react-query'
import { getImportStatus } from '@/lib/api/storage-analytics'

export function useImportStatus(importId: string) {
  return useQuery({
    queryKey: ['imports', importId],
    queryFn: () => getImportStatus(importId),
    enabled: !!importId,
    refetchInterval: (query) => {
      const status = query.state.data?.status

      // Poll while pending/processing
      if (status === 'pending' || status === 'processing') {
        return 2000 // Poll every 2 seconds
      }

      // Stop polling when completed/failed
      return false
    },
  })
}

// Usage in component:
function ImportStatusPage({ importId }: Props) {
  const { data: status } = useImportStatus(importId)

  useEffect(() => {
    if (status?.status === 'completed') {
      toast.success(`Imported ${status.rows_imported} rows`)
    } else if (status?.status === 'failed') {
      toast.error(`Import failed: ${status.error}`)
    }
  }, [status])

  // ...
}
```

---

## Quick Reference

### Backend API Base URL
```bash
Development: http://localhost:3000
Production: https://api.wb-repricer.system
```

### Swagger UI
```
Development: http://localhost:3000/api
```

### Key Directories
```
Backend HTTP Files: /test-api/*.http
Frontend API Clients: /frontend/src/lib/api/*.ts
Frontend Specs: /frontend/docs/request-backend/*.md
```

### Common Headers
```typescript
{
  'Authorization': `Bearer ${token}`,
  'X-Cabinet-Id': cabinetId,
  'Content-Type': 'application/json'
}
```

---

## Maintenance

**When Adding New Endpoints:**

1. **Backend:** Add to appropriate `/test-api/*.http` file
2. **Frontend:** Create API client in `/src/lib/api/*.ts`
3. **Spec:** Document in `/docs/request-backend/*.md`
4. **This Guide:** Update endpoint mapping table

**When Modifying Endpoints:**

1. Update backend `.http` file with new contract
2. Update frontend API client with new types/logic
3. Update frontend spec with integration notes
4. Add changelog entry to this guide

---

**Last Updated:** 2026-01-17
**Version:** 2.0
**Maintained By:** Frontend Team

---

## Appendix: Epic Status Summary

| Epic | Feature | Frontend Status | Backend Status | Documentation |
|------|---------|-----------------|----------------|---------------|
| 24 | Storage Analytics | ✅ Complete | ✅ Complete | 100% Mapped |
| 28 | Supply Planning | ✅ Complete | ✅ Complete | 100% Mapped |
| 29 | Liquidity Analytics | ✅ Complete | ✅ Complete | 100% Mapped |
| 33 | Advertising Analytics | ✅ Complete | ✅ Complete | 100% Mapped |
| 34 | Telegram Notifications | ✅ Complete | ✅ Complete | 100% Mapped |
| 36 | Product Card Linking | ✅ Complete | ✅ Complete | 100% Mapped |
| 43/44 | Price Calculator | ✅ Complete | ✅ Complete | 100% Mapped |
| 6 | Date Range & Comparison | ✅ Complete | ✅ Complete | 100% Mapped |
| 10 | COGS & Margin | ✅ Complete | ✅ Complete | 100% Mapped |

**Overall Integration Status:** ✅ 100% Complete

All frontend API clients are fully mapped to backend documentation with complete HTTP test coverage.

---

## Task Queue API

The backend provides a task queue system for background processing.

### Enqueue Task

```http
POST /v1/tasks/enqueue
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}

{
  "task_type": "recalculate_weekly_margin",
  "payload": {
    "weeks": ["2025-W49", "2025-W50"]
  }
}
```

### Task Types

| Task Type | Payload | Description |
|-----------|---------|-------------|
| `recalculate_weekly_margin` | `{ weeks: string[], nm_ids?: string[] }` | Recalculate margins |
| `weekly_sanity_check` | `{ week?: string }` | Validate data quality |
| `weekly_margin_aggregate` | `{ week?: string }` | Re-aggregate data |

### Deprecated Tasks

- `enrich_cogs` - Use `recalculate_weekly_margin` instead

See [Request #94](request-backend/94-epic-42-tech-debt-task-handlers.md) for details.
