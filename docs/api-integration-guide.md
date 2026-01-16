# API Integration Guide

**Version:** 1.2
**Date:** 2025-12-05
**Author:** Frontend Team
**Status:** Ready for Development

**Recent Updates:**
- 2025-12-05: **Request #41** - Separate sales and returns tracking (`sales_gross`, `returns_gross`, `sales_gross_total`, `returns_gross_total`)
- 2025-12-05: Added Story 6.5-FE - Export Analytics endpoints (`POST /v1/exports/analytics`, `GET /v1/exports/:id`) with types
- 2025-12-05: Added Epic 6-FE - Date range support (`weekStart`/`weekEnd`) and period comparison (`compareTo`, `compareToStart`, `compareToEnd`)
- 2025-12-05: Added Cabinet Summary endpoint (`GET /v1/analytics/cabinet-summary`)
- 2025-01-27: Added Request #17 - Manual margin recalculation for future COGS dates
- 2025-11-23: Added Request #15 - Margin display in product list (`include_cogs` parameter)
- 2025-11-22: Updated finance-summary endpoint with all 9 expense categories
- 2025-11-22: Added Request #06 changes (acquiring_fee_total, commission_sales_total)
- 2025-11-22: Updated payout_total formula with new expense fields

---

## 📋 Overview

This guide provides comprehensive instructions for integrating the WB Repricer System Frontend with the backend API. It covers all 33+ endpoints, authentication patterns, error handling, and best practices.

**⚠️ Important:** This guide provides frontend-specific examples and patterns. **Always refer to the backend documentation** (linked throughout this guide) for authoritative API specifications, request/response formats, and business logic details.

**Target Audience:** Frontend developers implementing API integration

**Prerequisites:**
- Backend API is running and accessible
- **Swagger UI:** `http://localhost:3000/api` - Interactive API documentation (📚 **Use this for live API testing**)
- Backend documentation reviewed: `../docs/frontend-po/`

**📚 Primary Backend Documentation:**
- **[Backend Functionality Analysis](../docs/frontend-po/01-backend-functionality-analysis.md)** - Complete API reference
- **[Backend README](../docs/frontend-po/README.md)** - Navigation guide

---

## 🔐 Authentication

**📚 Backend Documentation:** 
- [Authentication & Multi-Tenancy](../docs/frontend-po/01-backend-functionality-analysis.md#-аутентификация-и-multi-tenancy)
- [Authentication Endpoints](../docs/frontend-po/01-backend-functionality-analysis.md#1-authentication-3-endpoints)

### Required Headers

**All API requests (except `/v1/auth/*` and `/v1/health`) require:**

```typescript
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

### Implementation

The API client automatically includes these headers (see `docs/front-end-architecture.md`):

```typescript
// src/lib/api.ts
const { token, cabinetId } = useAuthStore.getState()

if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

if (cabinetId) {
  headers['X-Cabinet-Id'] = cabinetId
}
```

### Token Management

- **JWT Token:** Obtained from `POST /v1/auth/login`
- **Token Storage:** Stored in Zustand auth store with persistence
- **Token Expiration:** 24 hours (or 7 days with `rememberMe: true`)
- **Token Refresh:** Not implemented in backend (user must re-login)

---

## 📡 API Base Configuration

**📚 Backend Documentation:** [Backend Architecture](../docs/frontend-po/01-backend-functionality-analysis.md#-архитектура-backend) | [API Process](../docs/frontend-po/01-backend-functionality-analysis.md#1-api-process-порт-3000)

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### API Client Setup

```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Implementation from architecture document
  }
}

export const apiClient = new ApiClient()
```

---

## 🔌 API Endpoints Reference

### 1. Authentication Endpoints

**📚 Backend Documentation:** [Authentication (3 endpoints)](../docs/frontend-po/01-backend-functionality-analysis.md#1-authentication-3-endpoints)

#### POST /v1/auth/register

**Purpose:** Create a new user account

**📚 Backend Reference:** [Register Endpoint](../docs/frontend-po/01-backend-functionality-analysis.md#1-authentication-3-endpoints)

**Request:**
```typescript
interface RegisterRequest {
  email: string
  password: string
  name?: string
}

const response = await apiClient.post<{ user: User; token: string }>(
  '/v1/auth/register',
  {
    email: 'user@example.com',
    password: 'securePassword123',
    name: 'John Doe'
  }
)
```

**Response:**
```typescript
interface RegisterResponse {
  user: {
    id: string
    email: string
    name?: string
    role: 'Owner' | 'Manager' | 'Analyst' | 'Service'
  }
  token: string // JWT token
}
```

**Error Handling:**
- `400` - Validation error (email already exists, weak password)
- `500` - Server error

**Usage Example:**
```typescript
// src/hooks/useAuth.ts
export function useRegister() {
  const mutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiClient.post<RegisterResponse>('/v1/auth/register', data)
      // Store token in auth store
      useAuthStore.getState().login(response.token, response.user)
      return response
    },
    onError: (error: ApiError) => {
      // Handle error (show toast, etc.)
      console.error('Registration failed:', error.message)
    }
  })
  
  return mutation
}
```

---

#### POST /v1/auth/login

**Purpose:** Authenticate user and obtain JWT token

**📚 Backend Reference:** [Login Endpoint](../docs/frontend-po/01-backend-functionality-analysis.md#1-authentication-3-endpoints) | [JWT Token Details](../docs/frontend-po/01-backend-functionality-analysis.md#jwt-token)

**Request:**
```typescript
interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean // Extends token expiration to 7 days
}

const response = await apiClient.post<{ user: User; token: string }>(
  '/v1/auth/login',
  {
    email: 'user@example.com',
    password: 'password123',
    rememberMe: true
  }
)
```

**Response:**
```typescript
interface LoginResponse {
  user: {
    id: string
    email: string
    name?: string
    role: string
    cabinet_ids: string[] // Available cabinets for this user
  }
  token: string // JWT token
}
```

**Error Handling:**
- `401` - Invalid credentials
- `400` - Validation error

**Usage Example:**
```typescript
// src/hooks/useAuth.ts
export function useLogin() {
  const router = useRouter()
  const mutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiClient.post<LoginResponse>('/v1/auth/login', data)
      const { login } = useAuthStore.getState()
      login(response.token, response.user)
      
      // Set default cabinet if available
      if (response.user.cabinet_ids.length > 0) {
        useAuthStore.getState().setCabinetId(response.user.cabinet_ids[0])
      }
      
      return response
    },
    onSuccess: () => {
      router.push('/dashboard')
    },
    onError: (error: ApiError) => {
      // Show error message to user
      toast.error('Invalid email or password')
    }
  })
  
  return mutation
}
```

---

#### POST /v1/auth/logout

**Purpose:** Logout user and invalidate token

**📚 Backend Reference:** [Logout Endpoint](../docs/frontend-po/01-backend-functionality-analysis.md#1-authentication-3-endpoints)

**Request:**
```typescript
await apiClient.post('/v1/auth/logout')
```

**Response:**
```typescript
{ message: 'Logged out successfully' }
```

**Usage Example:**
```typescript
// src/hooks/useAuth.ts
export function useLogout() {
  const router = useRouter()
  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/v1/auth/logout')
      useAuthStore.getState().logout()
      router.push('/login')
    }
  })
  
  return mutation
}
```

---

### 2. Cabinets Endpoints

**📚 Backend Documentation:** [Cabinets (7 endpoints)](../docs/frontend-po/01-backend-functionality-analysis.md#2-cabinets-7-endpoints) | [Onboarding Flow](../docs/frontend-po/02-user-flows-and-business-value.md)

#### POST /v1/cabinets

**Purpose:** Create a new cabinet (onboarding)

**📚 Backend Reference:** [Create Cabinet](../docs/frontend-po/01-backend-functionality-analysis.md#2-cabinets-7-endpoints) | [Critical Onboarding Note](../docs/frontend-po/01-backend-functionality-analysis.md#критично-для-onboarding)

**Request:**
```typescript
interface CreateCabinetRequest {
  name: string
  description?: string
}

const cabinet = await apiClient.post<Cabinet>('/v1/cabinets', {
  name: 'My Wildberries Store',
  description: 'Main store cabinet'
})
```

**Response:**
```typescript
interface Cabinet {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

**Usage Example:**
```typescript
// src/hooks/useCabinets.ts
export function useCreateCabinet() {
  const mutation = useMutation({
    mutationFn: async (data: CreateCabinetRequest) => {
      const cabinet = await apiClient.post<Cabinet>('/v1/cabinets', data)
      // Set as active cabinet
      useAuthStore.getState().setCabinetId(cabinet.id)
      return cabinet
    }
  })
  
  return mutation
}
```

---

#### GET /v1/cabinets

**Purpose:** List all cabinets for current user (with pagination)

**📚 Backend Reference:** [List Cabinets](../docs/frontend-po/01-backend-functionality-analysis.md#2-cabinets-7-endpoints)

**Request:**
```typescript
interface GetCabinetsParams {
  cursor?: string
  limit?: number // 1-100, default: 20
}

const response = await apiClient.get<{
  items: Cabinet[]
  next_cursor?: string
  total: number
}>('/v1/cabinets', {
  params: { limit: 20 }
})
```

**Usage Example:**
```typescript
// src/hooks/useCabinets.ts
export function useCabinets(params?: GetCabinetsParams) {
  return useQuery({
    queryKey: ['cabinets', params],
    queryFn: () => apiClient.get<CabinetsResponse>('/v1/cabinets', {
      params
    })
  })
}
```

---

#### GET /v1/cabinets/{id}

**Purpose:** Get cabinet details

**📚 Backend Reference:** [Get Cabinet Details](../docs/frontend-po/01-backend-functionality-analysis.md#2-cabinets-7-endpoints)

**Request:**
```typescript
const cabinet = await apiClient.get<Cabinet>(`/v1/cabinets/${cabinetId}`)
```

---

#### PUT /v1/cabinets/{id}

**Purpose:** Update cabinet information

**📚 Backend Reference:** [Update Cabinet](../docs/frontend-po/01-backend-functionality-analysis.md#2-cabinets-7-endpoints)

**Request:**
```typescript
const updated = await apiClient.put<Cabinet>(`/v1/cabinets/${cabinetId}`, {
  name: 'Updated Name',
  description: 'Updated description'
})
```

---

#### POST /v1/cabinets/{id}/keys

**Purpose:** Save WB API token (encrypted at rest)

**📝 Важно:** См. [CHANGELOG: WB Token Key Name Fix](./CHANGELOG-wb-token-key-name.md) для информации об имени ключа токена (`wb_api_token`).

**📚 Backend Reference:** [Save WB Token](../docs/frontend-po/01-backend-functionality-analysis.md#2-cabinets-7-endpoints) | [Automatic Processes](../docs/frontend-po/01-backend-functionality-analysis.md#-автоматические-процессы) | [Token Encryption](../docs/frontend-po/01-backend-functionality-analysis.md#безопасное-хранение-wb-api-токенов-шифрование-at-rest)

**Request:**
```typescript
interface SaveTokenRequest {
  key_name: string // e.g., 'wb_api_token'
  value: string // WB API token
}

await apiClient.post(`/v1/cabinets/${cabinetId}/keys`, {
  key_name: 'wb_api_token',
  value: 'your-wb-api-token-here'
})
```

**Response:**
```typescript
{
  message: 'Token saved successfully',
  key_name: 'wb_api_token'
}
```

**Critical:** After saving WB token, backend automatically:
1. Syncs products from WB API (last 3 months) - See [Automatic Processes](../docs/frontend-po/01-backend-functionality-analysis.md#при-сохранении-wb-токена)
2. Ingests financial reports (last 3 months) - See [Automatic Processes](../docs/frontend-po/01-backend-functionality-analysis.md#при-сохранении-wb-токена)

**Usage Example:**
```typescript
// src/hooks/useCabinets.ts
export function useSaveWbToken() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async ({ cabinetId, token }: { cabinetId: string; token: string }) => {
      await apiClient.post(`/v1/cabinets/${cabinetId}/keys`, {
        key_name: 'wb_api_token',
        value: token
      })
    },
    onSuccess: () => {
      // Invalidate tasks query to show new processing tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('WB token saved. Data processing started automatically.')
    }
  })
  
  return mutation
}
```

---

### 3. Products Endpoints

**📚 Backend Documentation:** [Products (7 endpoints)](../docs/frontend-po/01-backend-functionality-analysis.md#7-products-7-endpoints---epic-12) | [COGS & Margin Workflow](../docs/frontend-po/04-cogs-and-margin-workflow.md)

#### GET /v1/products

**Purpose:** List products with filters and pagination

**📚 Backend Reference:** [List Products](../docs/frontend-po/01-backend-functionality-analysis.md#7-products-7-endpoints---epic-12) | [Product Filters](../docs/frontend-po/01-backend-functionality-analysis.md#фильтры)

**Request:**
```typescript
interface GetProductsParams {
  brand?: string
  category?: string
  has_cogs?: boolean // Filter by COGS status
  q?: string // Search query
  cursor?: string
  limit?: number // 1-1000, default: 20
}

const response = await apiClient.get<{
  items: Product[]
  next_cursor?: string
  total: number
}>('/v1/products', {
  params: {
    has_cogs: false, // Products without COGS
    limit: 50
  }
})
```

**Response:**
```typescript
interface Product {
  nm_id: string // WB article ID
  name: string
  brand?: string
  category?: string
  cogs?: number // Cost of Goods Sold
  cogs_version?: number
  updated_at: string
}
```

**Usage Example:**
```typescript
// src/hooks/useProducts.ts
export function useProducts(params?: GetProductsParams) {
  return useInfiniteQuery({
    queryKey: ['products', params],
    queryFn: ({ pageParam }) => 
      apiClient.get<ProductsResponse>('/v1/products', {
        params: { ...params, cursor: pageParam }
      }),
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    initialPageParam: undefined
  })
}
```

---

#### GET /v1/products/{nmId}

**Purpose:** Get product details

**📚 Backend Reference:** [Get Product Details](../docs/frontend-po/01-backend-functionality-analysis.md#7-products-7-endpoints---epic-12)

**Request:**
```typescript
const product = await apiClient.get<Product>(`/v1/products/${nmId}`)
```

---

#### GET /v1/products/missing-cogs

**Purpose:** Get products without COGS assigned

**📚 Backend Reference:** [Missing COGS Products](../docs/frontend-po/01-backend-functionality-analysis.md#7-products-7-endpoints---epic-12)

**Request:**
```typescript
const response = await apiClient.get<{
  items: Product[]
  next_cursor?: string
  total: number
}>('/v1/products/missing-cogs', {
  params: { limit: 100 }
})
```

**Usage Example:**
```typescript
// src/hooks/useProducts.ts
export function useMissingCogsProducts() {
  return useQuery({
    queryKey: ['products', 'missing-cogs'],
    queryFn: () => apiClient.get<ProductsResponse>('/v1/products/missing-cogs')
  })
}
```

---

#### GET /v1/products/cogs-coverage

**Purpose:** Get COGS coverage metrics

**📚 Backend Reference:** [COGS Coverage Metrics](../docs/frontend-po/01-backend-functionality-analysis.md#7-products-7-endpoints---epic-12) | [COGS Coverage Details](../docs/frontend-po/04-cogs-and-margin-workflow.md)

**Request:**
```typescript
const metrics = await apiClient.get<{
  total_products: number
  with_cogs: number
  without_cogs: number
  coverage_percentage: number
}>('/v1/products/cogs-coverage')
```

**Usage Example:**
```typescript
// src/hooks/useProducts.ts
export function useCogsCoverage() {
  return useQuery({
    queryKey: ['products', 'cogs-coverage'],
    queryFn: () => apiClient.get<CogsCoverageResponse>('/v1/products/cogs-coverage'),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
```

---

#### POST /v1/products/{nmId}/cogs

**Purpose:** Assign COGS to a single product

**📚 Backend Reference:** [Assign COGS](../docs/frontend-po/01-backend-functionality-analysis.md#7-products-7-endpoints---epic-12) | [COGS Assignment Workflow](../docs/frontend-po/04-cogs-and-margin-workflow.md) | [Automatic Margin Calculation](../docs/frontend-po/04-cogs-and-margin-workflow.md)

**Request:**
```typescript
interface AssignCogsRequest {
  cogs: number // Must be > 0
}

const response = await apiClient.post<{
  success: boolean
  product: Product
}>(`/v1/products/${nmId}/cogs`, {
  cogs: 150.50
})
```

**Critical:** After assigning COGS, backend automatically triggers margin calculation task - See [Automatic Margin Calculation](../docs/frontend-po/04-cogs-and-margin-workflow.md)

**Usage Example:**
```typescript
// src/hooks/useProducts.ts
export function useAssignCogs() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async ({ nmId, cogs }: { nmId: string; cogs: number }) => {
      return apiClient.post(`/v1/products/${nmId}/cogs`, { cogs })
    },
    onSuccess: () => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'cogs-coverage'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      // Invalidate tasks to show margin calculation task
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })
  
  return mutation
}
```

---

#### POST /v1/products/cogs/bulk

**Purpose:** Bulk assign COGS to multiple products (up to 1000)

**📚 Backend Reference:** [Bulk COGS Assignment](../docs/frontend-po/01-backend-functionality-analysis.md#7-products-7-endpoints---epic-12) | [Bulk Operations](../docs/frontend-po/04-cogs-and-margin-workflow.md)

**Request:**
```typescript
interface BulkAssignCogsRequest {
  assignments: Array<{
    nm_id: string
    cogs: number
  }>
}

const response = await apiClient.post<{
  succeeded: number
  failed: number
  errors?: Array<{
    nm_id: string
    error: string
  }>
}>('/v1/products/cogs/bulk', {
  assignments: [
    { nm_id: '12345678', cogs: 150.50 },
    { nm_id: '87654321', cogs: 200.00 }
  ]
})
```

**Usage Example:**
```typescript
// src/hooks/useProducts.ts
export function useBulkAssignCogs() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async (assignments: BulkAssignCogsRequest['assignments']) => {
      return apiClient.post<BulkAssignCogsResponse>('/v1/products/cogs/bulk', {
        assignments
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      
      if (data.failed > 0) {
        toast.warning(`${data.succeeded} succeeded, ${data.failed} failed`)
      } else {
        toast.success(`Successfully assigned COGS to ${data.succeeded} products`)
      }
    }
  })
  
  return mutation
}
```

---

### 4. Analytics Endpoints

**📚 Backend Documentation:** [Analytics (6 endpoints)](../docs/frontend-po/01-backend-functionality-analysis.md#4-analytics-6-endpoints) | [Data Visualization Recommendations](../docs/frontend-po/03-data-visualization-recommendations.md)

#### GET /v1/analytics/weekly/available-weeks

**Purpose:** Get list of available weeks with data

**📚 Backend Reference:** [Available Weeks](../docs/frontend-po/01-backend-functionality-analysis.md#4-analytics-6-endpoints)

**Request:**
```typescript
const weeks = await apiClient.get<string[]>('/v1/analytics/weekly/available-weeks')
// Returns: ['2024-W01', '2024-W02', ...]
```

**Usage Example:**
```typescript
// src/hooks/useAnalytics.ts
export function useAvailableWeeks() {
  return useQuery({
    queryKey: ['analytics', 'available-weeks'],
    queryFn: () => apiClient.get<string[]>('/v1/analytics/weekly/available-weeks')
  })
}
```

---

#### GET /v1/analytics/weekly/finance-summary

**Purpose:** Get weekly financial summary (main dashboard metrics, expense breakdown)

**📚 Backend Reference:** [Finance Summary](../docs/frontend-po/01-backend-functionality-analysis.md#4-analytics-6-endpoints) | [Key Metrics](../docs/frontend-po/01-backend-functionality-analysis.md#ключевые-метрики-в-finance-summary) | [Dashboard Visualization](../docs/frontend-po/03-data-visualization-recommendations.md)

**⚠️ Updated 2025-11-22:** Added `acquiring_fee_total` and `commission_sales_total` (Request #06). `wb_commission_adj` now contains only `commission_other`.

**Request:**
```typescript
interface FinanceSummaryParams {
  week: string // ISO week: 'YYYY-Www' (e.g., '2025-W45')
}

const response = await apiClient.get<FinanceSummaryResponse>(
  `/v1/analytics/weekly/finance-summary?week=${week}`
)
```

**Response Structure:**
```typescript
interface FinanceSummaryResponse {
  data: {
    summary_rus: FinanceSummary       // РФ и вне ЕАЭС
    summary_eaeu: FinanceSummary      // ЕАЭС
    summary_total: FinanceSummaryTotal // Consolidated (RUS + EAEU)
  }
  meta: {
    week: string
    cabinet_id: string
    generated_at: string
    timezone: "Europe/Moscow"
  }
}

interface FinanceSummary {
  week: string
  report_type: string // "основной" | "по выкупам"

  // Revenue metrics
  sale_gross: number              // Вайлдберриз реализовал Товар
  to_pay_goods: number            // К перечислению за товар

  // All 9 expense categories (positive values)
  logistics_cost: number          // 1. Логистика
  storage_cost: number            // 2. Хранение
  paid_acceptance_cost: number    // 3. Платная приёмка
  penalties_total: number         // 4. Штрафы
  wb_commission_adj: number       // 5. Прочие комиссии WB (commission_other only) ⚠️
  acquiring_fee_total: number     // 6. Эквайринг (Request #06) ✅ NEW
  commission_sales_total: number  // 7. Комиссия продаж (Request #06) ✅ NEW
  loyalty_fee: number             // 8. Комиссия лояльности
  loyalty_points_withheld: number // 9. Удержание баллов лояльности

  // Compensations (can be positive)
  loyalty_compensation: number
  other_adjustments_net: number

  // Special revenue (informational, not in payout_total)
  seller_delivery_revenue: number     // DBS/EDBS paid delivery
  transport_reimbursement_neutral: number // Transport reimbursement (qty=2)

  // Final result (can be negative)
  payout_total: number            // Итого к оплате

  // Transaction metrics
  transaction_count: number
  product_transactions: number    // qty=1 (товарные операции)
  service_transactions: number    // qty=0 (сервисные операции)

  created_at: string
  updated_at: string
}

interface FinanceSummaryTotal {
  // Same structure as FinanceSummary but with _total suffix
  week: string
  sale_gross_total: number
  to_pay_goods_total: number
  logistics_cost_total: number
  storage_cost_total: number
  paid_acceptance_cost_total: number
  penalties_total: number
  wb_commission_adj_total: number
  acquiring_fee_total: number
  commission_sales_total: number
  loyalty_fee_total: number
  loyalty_points_withheld_total: number
  loyalty_compensation_total: number
  other_adjustments_net_total: number
  seller_delivery_revenue_total: number
  transport_reimbursement_neutral_total: number
  payout_total: number
  transaction_count_total: number
  created_at: string
  updated_at: string
}
```

**Payout Total Formula:**
```typescript
payout_total = to_pay_goods
  - logistics_cost
  - storage_cost
  - paid_acceptance_cost
  - penalties_total
  - wb_commission_adj
  - acquiring_fee_total          // Added in Request #06
  - commission_sales_total       // Added in Request #06
  - loyalty_fee
  - loyalty_points_withheld
  + loyalty_compensation
  ± other_adjustments_net
```

**Important Notes:**
- All expense values are **positive numbers** (absolute values)
- Fields return `0` (not `null` or `undefined`) when no expenses
- `payout_total` can be **negative**
- `wb_commission_adj` contains **only** `commission_other` (NOT `commission_sales`)
- `commission_sales` is tracked separately as `commission_sales_total`

**Usage Example:**
```typescript
// src/hooks/useExpenses.ts
export function useExpenses() {
  return useQuery({
    queryKey: ['dashboard', 'expenses'],
    queryFn: async () => {
      // Get available weeks first
      const weeks = await apiClient.get<Array<{week: string}>>('/v1/analytics/weekly/available-weeks')
      const latestWeek = weeks[0]?.week

      // Get finance summary
      const response = await apiClient.get<FinanceSummaryResponse>(
        `/v1/analytics/weekly/finance-summary?week=${latestWeek}`
      )

      // Use summary_total (consolidated) or fallback to summary_rus
      const summary = response.data.summary_total || response.data.summary_rus

      // Extract all 9 expense categories
      const expenses = [
        { category: 'Логистика', amount: summary.logistics_cost_total ?? summary.logistics_cost ?? 0 },
        { category: 'Хранение', amount: summary.storage_cost_total ?? summary.storage_cost ?? 0 },
        { category: 'Платная приёмка', amount: summary.paid_acceptance_cost_total ?? summary.paid_acceptance_cost ?? 0 },
        { category: 'Штрафы', amount: summary.penalties_total ?? 0 },
        { category: 'Прочие комиссии WB', amount: summary.wb_commission_adj_total ?? summary.wb_commission_adj ?? 0 },
        { category: 'Комиссия лояльности', amount: summary.loyalty_fee_total ?? summary.loyalty_fee ?? 0 },
        { category: 'Удержание баллов лояльности', amount: summary.loyalty_points_withheld_total ?? summary.loyalty_points_withheld ?? 0 },
        { category: 'Эквайринг', amount: summary.acquiring_fee_total ?? summary.acquiring_fee ?? 0 },
        { category: 'Комиссия продаж', amount: summary.commission_sales_total ?? summary.commission_sales ?? 0 }
      ].filter(item => item.amount > 0) // Only non-zero expenses

      return { expenses, total: expenses.reduce((sum, e) => sum + e.amount, 0) }
    },
    staleTime: 30000 // 30 seconds
  })
}
```

**Implementation Reference:**
- Expense Chart: `src/components/custom/ExpenseChart.tsx`
- Expense Hook: `src/hooks/useExpenses.ts`
- Finance Types: `src/hooks/useDashboard.ts`
- Story: `docs/stories/3.3.expense-breakdown-visualization.md`
- Request #06: `docs/request-backend/06-missing-expense-fields-in-finance-summary.md`

---

#### GET /v1/analytics/weekly/by-sku

**Purpose:** Get analytics by SKU (includes margin if COGS assigned)

**📚 Backend Reference:** [Analytics by SKU](../docs/frontend-po/01-backend-functionality-analysis.md#4-analytics-6-endpoints) | [Margin Analysis by SKU](../docs/frontend-po/04-cogs-and-margin-workflow.md) | [SKU Visualization](../docs/frontend-po/03-data-visualization-recommendations.md)

**Request:**
```typescript
interface BySkuParams {
  // Epic 6.1-FE: Date range support
  week?: string          // Single week (legacy)
  weekStart?: string     // Start of range (ISO week: YYYY-Www)
  weekEnd?: string       // End of range (ISO week: YYYY-Www)

  // Epic 6.2-FE: Period comparison
  compareTo?: string       // Compare to single week
  compareToStart?: string  // Compare to range start
  compareToEnd?: string    // Compare to range end

  report_type?: 'rus' | 'eaeu' | 'total'
  includeCogs?: boolean    // Include COGS data (default: false)
  cursor?: string
  limit?: number // 1-1000
}

// Date range without comparison
const response = await apiClient.get('/v1/analytics/weekly/by-sku', {
  params: {
    weekStart: '2025-W44',
    weekEnd: '2025-W47',
    includeCogs: true,
    limit: 50
  }
})

// Date range WITH period comparison
const responseWithComparison = await apiClient.get('/v1/analytics/weekly/by-sku', {
  params: {
    weekStart: '2025-W44',
    weekEnd: '2025-W47',
    compareToStart: '2025-W40',
    compareToEnd: '2025-W43',
    includeCogs: true
  }
})
```

**Response with Comparison (Epic 6.2-FE):**
```typescript
interface ComparisonAnalyticsItem {
  nm_id: string
  sa_name: string
  // Current period values
  revenue_net: number
  profit: number | null
  margin_pct: number | null
  qty: number
  // Comparison period values
  compare_revenue_net: number
  compare_profit: number | null
  compare_margin_pct: number | null
  compare_qty: number
  // Delta calculations
  revenue_delta: number
  revenue_delta_pct: number
  profit_delta: number | null
  profit_delta_pct: number | null
  margin_delta_pct: number | null
}
```

**Usage Example:**
```typescript
// src/hooks/useMarginAnalytics.ts
export function useMarginAnalyticsBySku(params: MarginAnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'margin', 'sku', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.weekStart) queryParams.append('week_start', params.weekStart)
      if (params.weekEnd) queryParams.append('week_end', params.weekEnd)
      if (params.compareTo) queryParams.append('compare_to', params.compareTo)
      if (params.compareToStart) queryParams.append('compare_to_start', params.compareToStart)
      if (params.compareToEnd) queryParams.append('compare_to_end', params.compareToEnd)
      if (params.includeCogs) queryParams.append('include_cogs', 'true')
      return apiClient.get(`/v1/analytics/weekly/by-sku?${queryParams}`)
    }
  })
}
```

---

#### GET /v1/analytics/weekly/by-brand

**Purpose:** Get analytics aggregated by brand

**📚 Backend Reference:** [Analytics by Brand](../docs/frontend-po/01-backend-functionality-analysis.md#4-analytics-6-endpoints) | [Margin Analysis by Brand](../docs/frontend-po/04-cogs-and-margin-workflow.md)

**Request:**
```typescript
interface ByBrandParams {
  // Epic 6.1-FE: Date range support
  week?: string
  weekStart?: string
  weekEnd?: string
  // Epic 6.2-FE: Period comparison
  compareTo?: string
  compareToStart?: string
  compareToEnd?: string
  report_type?: 'rus' | 'eaeu' | 'total'
  includeCogs?: boolean
  cursor?: string
  limit?: number
}

const response = await apiClient.get('/v1/analytics/weekly/by-brand', {
  params: {
    weekStart: '2025-W44',
    weekEnd: '2025-W47',
    includeCogs: true
  }
})
```

---

#### GET /v1/analytics/weekly/by-category

**Purpose:** Get analytics aggregated by category

**📚 Backend Reference:** [Analytics by Category](../docs/frontend-po/01-backend-functionality-analysis.md#4-analytics-6-endpoints) | [Margin Analysis by Category](../docs/frontend-po/04-cogs-and-margin-workflow.md)

**Request:**
```typescript
interface ByCategoryParams {
  // Epic 6.1-FE: Date range support
  week?: string
  weekStart?: string
  weekEnd?: string
  // Epic 6.2-FE: Period comparison
  compareTo?: string
  compareToStart?: string
  compareToEnd?: string
  report_type?: 'rus' | 'eaeu' | 'total'
  includeCogs?: boolean
  cursor?: string
  limit?: number
}

const response = await apiClient.get('/v1/analytics/weekly/by-category', {
  params: {
    weekStart: '2025-W44',
    weekEnd: '2025-W47',
    includeCogs: true
  }
})
```

---

#### GET /v1/analytics/cabinet-summary (Epic 6.4-FE)

**Purpose:** Get cabinet-level KPIs, top products, and top brands

**Request:**
```typescript
interface CabinetSummaryParams {
  weeks?: number        // Number of weeks to include (default: 4, max: 52)
  weekStart?: string    // Alternative: explicit range start
  weekEnd?: string      // Alternative: explicit range end
}

const response = await apiClient.get<CabinetSummaryResponse>(
  '/v1/analytics/cabinet-summary',
  { params: { weeks: 4 } }
)
```

**Response:**
```typescript
interface CabinetSummaryResponse {
  summary: {
    totals: {
      revenue_net: number
      cogs_total: number
      profit: number
      margin_pct: number
      qty: number
      profit_per_unit: number | null
      roi: number | null
    }
    products: {
      total: number
      with_cogs: number
      without_cogs: number
      coverage_pct: number
    }
    trends: {
      revenue_trend: 'up' | 'down' | 'stable'
      profit_trend: 'up' | 'down' | 'stable'
      margin_trend: 'up' | 'down' | 'stable'
      week_over_week_growth: number
    }
  }
  top_products: Array<{
    nm_id: string
    sa_name: string
    revenue_net: number
    profit: number | null
    margin_pct: number | null
    contribution_pct: number
  }>
  top_brands: Array<{
    brand: string
    revenue_net: number
    profit: number | null
    margin_pct: number | null
  }>
  meta: {
    cabinet_id: string
    cabinet_name?: string
    period: {
      start: string
      end: string
      weeks_count: number
    }
    generated_at: string
  }
}
```

**Usage Example:**
```typescript
// src/hooks/useCabinetSummary.ts
export function useCabinetSummary(params: CabinetSummaryParams = {}) {
  const { weeks = 4, weekStart, weekEnd } = params
  return useQuery({
    queryKey: ['analytics', 'cabinet-summary', { weeks, weekStart, weekEnd }],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (weekStart && weekEnd) {
        queryParams.append('week_start', weekStart)
        queryParams.append('week_end', weekEnd)
      } else {
        queryParams.append('weeks', weeks.toString())
      }
      return apiClient.get(`/v1/analytics/cabinet-summary?${queryParams}`)
    },
    staleTime: 60000, // 1 minute
  })
}
```

#### POST /v1/exports/analytics (Story 6.5-FE)

**Purpose:** Create an analytics export job (CSV or Excel)

**Request:**
```typescript
interface ExportRequest {
  type: 'by-sku' | 'by-brand' | 'by-category' | 'cabinet-summary'
  week_start?: string    // ISO week format: YYYY-Www
  week_end?: string      // ISO week format: YYYY-Www
  format: 'csv' | 'xlsx'
  include_cogs?: boolean
  filters?: {
    brand?: string
    category?: string
  }
}

const response = await apiClient.post<ExportCreateResponse>(
  '/v1/exports/analytics',
  request
)
```

**Response:**
```typescript
interface ExportCreateResponse {
  export_id: string
  estimated_time_sec: number
}
```

#### GET /v1/exports/{export_id} (Story 6.5-FE)

**Purpose:** Get export job status and download URL

**Request:**
```typescript
const status = await apiClient.get<ExportStatus>(`/v1/exports/${exportId}`)
```

**Response:**
```typescript
interface ExportStatus {
  export_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  download_url?: string        // Available when status='completed'
  file_size_bytes?: number
  rows_count?: number
  expires_at?: string          // ISO date string (48h expiry)
  error_message?: string       // Available when status='failed'
  estimated_time_sec?: number
}
```

**Usage Example:**
```typescript
// src/hooks/useExportAnalytics.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ExportRequest, ExportStatus, ExportCreateResponse } from '@/types/analytics'

export function useExportAnalytics() {
  const [exportId, setExportId] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: async (request: ExportRequest) => {
      return apiClient.post<ExportCreateResponse>('/v1/exports/analytics', {
        type: request.type,
        week_start: request.weekStart,
        week_end: request.weekEnd,
        format: request.format,
        include_cogs: request.includeCogs,
      })
    },
    onSuccess: (response) => setExportId(response.export_id),
  })

  const statusQuery = useQuery({
    queryKey: ['exports', exportId],
    queryFn: () => apiClient.get<ExportStatus>(`/v1/exports/${exportId}`),
    enabled: !!exportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') return false
      return 2000 // Poll every 2 seconds
    },
  })

  return {
    createExport: createMutation.mutate,
    isCreating: createMutation.isPending,
    status: statusQuery.data,
    reset: () => setExportId(null),
  }
}
```

---

### 5. Tasks Endpoints

**📚 Backend Documentation:** [Tasks (5 endpoints)](../docs/frontend-po/01-backend-functionality-analysis.md#6-tasks-5-endpoints) | [Task Types](../docs/frontend-po/01-backend-functionality-analysis.md#типы-задач) | [Task Statuses](../docs/frontend-po/01-backend-functionality-analysis.md#статусы-задач)

#### GET /v1/tasks/{task_uuid}

**Purpose:** Get task status and details

**📚 Backend Reference:** [Get Task Details](../docs/frontend-po/01-backend-functionality-analysis.md#6-tasks-5-endpoints) | [Task Statuses](../docs/frontend-po/01-backend-functionality-analysis.md#статусы-задач)

**Request:**
```typescript
const task = await apiClient.get<Task>(`/v1/tasks/${taskUuid}`)
```

**Response:**
```typescript
interface Task {
  uuid: string
  type: 'finances_weekly_ingest' | 'products_sync' | 'enrich_cogs' | 
        'weekly_margin_aggregate' | 'weekly_sanity_check' | 'publish_weekly_views'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'dlq' | 'cancelled'
  progress?: number // 0-100
  result?: unknown
  error?: string
  created_at: string
  updated_at: string
}
```

**Usage Example:**
```typescript
// src/hooks/useTasks.ts
export function useTask(taskUuid: string) {
  return useQuery({
    queryKey: ['tasks', taskUuid],
    queryFn: () => apiClient.get<Task>(`/v1/tasks/${taskUuid}`),
    refetchInterval: (data) => {
      // Poll while task is in progress
      if (data?.status === 'pending' || data?.status === 'in_progress') {
        return 2000 // Poll every 2 seconds
      }
      return false
    }
  })
}
```

---

#### GET /v1/tasks

**Purpose:** List tasks with filters

**📚 Backend Reference:** [List Tasks](../docs/frontend-po/01-backend-functionality-analysis.md#6-tasks-5-endpoints) | [Task Monitoring](../docs/frontend-po/01-backend-functionality-analysis.md#бизнес-ценность-полная-видимость-фоновых-процессов-мониторинг-обработки-данных)

**Request:**
```typescript
interface GetTasksParams {
  type?: string
  status?: string
  cursor?: string
  limit?: number
}

const response = await apiClient.get<{
  items: Task[]
  next_cursor?: string
}>('/v1/tasks', {
  params: {
    status: 'in_progress',
    limit: 20
  }
})
```

---

### 6. Imports Endpoints

**📚 Backend Documentation:** [Imports (2 endpoints)](../docs/frontend-po/01-backend-functionality-analysis.md#3-imports-2-endpoints) | [Import Capabilities](../docs/frontend-po/01-backend-functionality-analysis.md#возможности) | [Import Statuses](../docs/frontend-po/01-backend-functionality-analysis.md#статусы-импорта)

#### POST /v1/imports/wb-finance-excel

**Purpose:** Upload Excel file for processing

**📚 Backend Reference:** [Upload Excel File](../docs/frontend-po/01-backend-functionality-analysis.md#3-imports-2-endpoints) | [File Requirements](../docs/frontend-po/01-backend-functionality-analysis.md#возможности) | [Processing Details](../docs/frontend-po/01-backend-functionality-analysis.md#обработка-до-200000-строк-за-12-15-секунд)

**Request:**
```typescript
// Note: This requires FormData, not JSON
const formData = new FormData()
formData.append('file', file) // File object

const response = await apiClient.post<{
  import_id: string
  status: 'pending'
}>('/v1/imports/wb-finance-excel', formData, {
  headers: {
    // Don't set Content-Type, browser will set it with boundary
  }
})
```

**Usage Example:**
```typescript
// src/hooks/useImports.ts
export function useUploadExcel() {
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      return apiClient.post<ImportResponse>(
        '/v1/imports/wb-finance-excel',
        formData
      )
    },
    onSuccess: (data) => {
      toast.success('File uploaded. Processing started.')
      // Navigate to import status page
      router.push(`/imports/${data.import_id}`)
    }
  })
  
  return mutation
}
```

---

#### GET /v1/imports/{id}

**Purpose:** Get import status and statistics

**📚 Backend Reference:** [Get Import Status](../docs/frontend-po/01-backend-functionality-analysis.md#3-imports-2-endpoints) | [Import Statuses](../docs/frontend-po/01-backend-functionality-analysis.md#статусы-импорта) | [Import Statistics](../docs/frontend-po/01-backend-functionality-analysis.md#3-imports-2-endpoints)

---

### 7. Validation Endpoints

**📚 Backend Documentation:** [Validation (3 endpoints)](../docs/frontend-po/01-backend-functionality-analysis.md#5-validation-3-endpoints) | [Validation Types](../docs/frontend-po/01-backend-functionality-analysis.md#типы-проверок)

#### POST /v1/validation/{cabinetId}/validate/{week}

**Purpose:** Trigger validation for a specific week

**📚 Backend Reference:** [Trigger Validation](../docs/frontend-po/01-backend-functionality-analysis.md#5-validation-3-endpoints)

**Request:**
```typescript
await apiClient.post(`/v1/validation/${cabinetId}/validate/${week}`)
// week format: 'YYYY-Www' (e.g., '2024-W01')
```

---

#### GET /v1/validation/{cabinetId}/results/{week}

**Purpose:** Get validation results for a specific week

**📚 Backend Reference:** [Get Validation Results](../docs/frontend-po/01-backend-functionality-analysis.md#5-validation-3-endpoints) | [Validation Types](../docs/frontend-po/01-backend-functionality-analysis.md#типы-проверок)

**Request:**
```typescript
const results = await apiClient.get<ValidationResults>(
  `/v1/validation/${cabinetId}/results/${week}`
)
```

---

#### GET /v1/validation/{cabinetId}/summary

**Purpose:** Get validation summary for multiple weeks

**📚 Backend Reference:** [Validation Summary](../docs/frontend-po/01-backend-functionality-analysis.md#5-validation-3-endpoints)

**Request:**
```typescript
const summary = await apiClient.get<ValidationSummary>(
  `/v1/validation/${cabinetId}/summary`
)
```

---

### 8. Health & Metadata Endpoints

**📚 Backend Documentation:** [Health & Metadata (2 endpoints)](../docs/frontend-po/01-backend-functionality-analysis.md#8-health--metadata-2-endpoints)

#### GET /v1/health

**Purpose:** Health check endpoint (public, no authentication required)

**📚 Backend Reference:** [Health Check](../docs/frontend-po/01-backend-functionality-analysis.md#8-health--metadata-2-endpoints)

**Request:**
```typescript
const health = await apiClient.get<{ status: string }>('/v1/health')
```

---

#### GET /v1/meta

**Purpose:** Get system version and metadata

**📚 Backend Reference:** [Metadata](../docs/frontend-po/01-backend-functionality-analysis.md#8-health--metadata-2-endpoints)

**Request:**
```typescript
const meta = await apiClient.get<{
  version: string
  build_date: string
}>(`/v1/meta`)
```

**Request:**
```typescript
const importStatus = await apiClient.get<{
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  rows_processed?: number
  rows_total?: number
  error?: string
  statistics?: {
    rows_imported: number
    rows_skipped: number
    errors: number
  }
}>(`/v1/imports/${importId}`)
```

---

## 🛠️ Error Handling

**📚 Backend Documentation:** [Error Handling](../docs/frontend-po/01-backend-functionality-analysis.md#2-обработка-ошибок) | [Error Response Formats](../docs/frontend-po/README.md)

### Error Types

```typescript
// src/lib/api.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

### Error Handling Patterns

```typescript
// src/lib/api.ts
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    // Map status codes to user-friendly messages
    switch (error.status) {
      case 401:
        return 'Сессия истекла. Пожалуйста, войдите снова.'
      case 403:
        return 'У вас нет доступа к этому ресурсу.'
      case 404:
        return 'Ресурс не найден.'
      case 422:
        return error.data?.message || 'Ошибка валидации данных.'
      case 500:
        return 'Ошибка сервера. Попробуйте позже.'
      default:
        return error.message || 'Произошла ошибка.'
    }
  }
  
  return 'Неизвестная ошибка.'
}
```

### Usage in Components

```typescript
// src/components/ProductList.tsx
const { data, error, isLoading } = useProducts()

if (error) {
  const errorMessage = handleApiError(error)
  return <ErrorDisplay message={errorMessage} />
}
```

---

## 📝 TypeScript Types

### Common Types

```typescript
// src/types/api.ts

// API Response wrapper
interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// Pagination
interface PaginatedResponse<T> {
  items: T[]
  next_cursor?: string
  total: number
}

// User
interface User {
  id: string
  email: string
  name?: string
  role: 'Owner' | 'Manager' | 'Analyst' | 'Service'
  cabinet_ids: string[]
}

// Cabinet
interface Cabinet {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Product
interface Product {
  nm_id: string
  name: string
  brand?: string
  category?: string
  cogs?: number
  cogs_version?: number
  updated_at: string
}

// Task
interface Task {
  uuid: string
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'dlq' | 'cancelled'
  progress?: number
  result?: unknown
  error?: string
  created_at: string
  updated_at: string
}

// Export (Story 6.5-FE)
type ExportType = 'by-sku' | 'by-brand' | 'by-category' | 'cabinet-summary'
type ExportFormat = 'csv' | 'xlsx'
type ExportStatusType = 'pending' | 'processing' | 'completed' | 'failed'

interface ExportRequest {
  type: ExportType
  weekStart?: string
  weekEnd?: string
  format: ExportFormat
  includeCogs?: boolean
  filters?: { brand?: string; category?: string }
}

interface ExportCreateResponse {
  export_id: string
  estimated_time_sec: number
}

interface ExportStatus {
  export_id: string
  status: ExportStatusType
  download_url?: string
  file_size_bytes?: number
  rows_count?: number
  expires_at?: string
  error_message?: string
  estimated_time_sec?: number
}
```

---

## 🎯 Best Practices

### 1. Use TanStack Query for Data Fetching

**Why:** Automatic caching, background updates, error handling

```typescript
// ✅ Good
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/v1/products')
  })
}

// ❌ Bad
const [products, setProducts] = useState([])
useEffect(() => {
  apiClient.get('/v1/products').then(setProducts)
}, [])
```

### 2. Use Mutations for Data Changes

**Why:** Optimistic updates, error handling, cache invalidation

```typescript
// ✅ Good
const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/v1/products/cogs', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }
})

// ❌ Bad
const handleSubmit = async (data) => {
  await apiClient.post('/v1/products/cogs', data)
  // Manual refetch needed
}
```

### 3. Handle Loading States

```typescript
// ✅ Good
const { data, isLoading, error } = useProducts()

if (isLoading) return <LoadingSpinner />
if (error) return <ErrorDisplay error={error} />
return <ProductList products={data} />

// ❌ Bad
const { data } = useProducts()
return <ProductList products={data} /> // data might be undefined
```

### 4. Use Infinite Queries for Pagination

```typescript
// ✅ Good
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['products'],
  queryFn: ({ pageParam }) => apiClient.get('/v1/products', {
    params: { cursor: pageParam }
  }),
  getNextPageParam: (lastPage) => lastPage.next_cursor
})

// ❌ Bad
const [page, setPage] = useState(1)
// Manual pagination management
```

### 5. Invalidate Related Queries

```typescript
// ✅ Good
const mutation = useMutation({
  mutationFn: assignCogs,
  onSuccess: () => {
    // Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})
```

### 6. Handle FormData for File Uploads

```typescript
// ✅ Good
const formData = new FormData()
formData.append('file', file)
await apiClient.post('/v1/imports/wb-finance-excel', formData)

// ❌ Bad
await apiClient.post('/v1/imports/wb-finance-excel', { file })
```

---

## 🔄 Common Integration Patterns

### Pattern 1: Dashboard Metrics

```typescript
// src/hooks/useDashboard.ts
export function useDashboard(week: string) {
  const financeSummary = useFinanceSummary({ week })
  const availableWeeks = useAvailableWeeks()
  
  return {
    financeSummary,
    availableWeeks,
    isLoading: financeSummary.isLoading || availableWeeks.isLoading,
    error: financeSummary.error || availableWeeks.error
  }
}
```

### Pattern 2: COGS Assignment Flow

```typescript
// src/hooks/useCogsAssignment.ts
export function useCogsAssignment() {
  const assignSingle = useAssignCogs()
  const assignBulk = useBulkAssignCogs()
  const { refetch: refetchCoverage } = useCogsCoverage()
  
  const handleAssign = async (nmId: string, cogs: number) => {
    await assignSingle.mutateAsync({ nmId, cogs })
    await refetchCoverage()
  }
  
  return { assignSingle, assignBulk, handleAssign }
}
```

### Pattern 3: Task Monitoring

```typescript
// src/hooks/useTaskMonitoring.ts
export function useTaskMonitoring(taskUuid: string) {
  const { data: task, isLoading } = useTask(taskUuid)
  
  useEffect(() => {
    if (task?.status === 'completed') {
      toast.success('Task completed successfully')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    } else if (task?.status === 'failed') {
      toast.error(`Task failed: ${task.error}`)
    }
  }, [task?.status])
  
  return { task, isLoading }
}
```

---

## 🧪 Testing

### Mock API Responses

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/v1/products', () => {
    return HttpResponse.json({
      items: [
        { nm_id: '123', name: 'Product 1', cogs: 100 }
      ],
      total: 1
    })
  }),
  
  http.post('/api/v1/products/:nmId/cogs', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      product: { nm_id: '123', cogs: body.cogs }
    })
  })
]
```

---

## 📚 Additional Resources

### Backend Documentation (Primary Sources)

**📚 Essential Reading:**
- **[Backend Functionality Analysis](../docs/frontend-po/01-backend-functionality-analysis.md)** - Complete API reference with all 33+ endpoints
- **[User Flows and Business Value](../docs/frontend-po/02-user-flows-and-business-value.md)** - User workflows and business context
- **[COGS and Margin Workflow](../docs/frontend-po/04-cogs-and-margin-workflow.md)** - Detailed COGS assignment and margin calculation process
- **[Data Visualization Recommendations](../docs/frontend-po/03-data-visualization-recommendations.md)** - Guidelines for displaying financial data
- **[Backend README](../docs/frontend-po/README.md)** - Quick start and navigation guide

**🔗 Quick Links:**
- **Swagger UI:** `http://localhost:3000/api` - Interactive API documentation
- **Backend Documentation Root:** `../docs/frontend-po/`

### Frontend Documentation

- **[Architecture](front-end-architecture.md)** - Technical architecture and patterns
- **[UI/UX Spec](front-end-spec.md)** - Design system and component specifications
- **[PRD](prd.md)** - Product requirements and user stories

---

## ✅ Integration Checklist

### Before Starting Development

- [ ] Backend API is running and accessible
- [ ] Swagger UI reviewed: `http://localhost:3000/api`
- [ ] Backend documentation reviewed: `../docs/frontend-po/`
- [ ] API client implemented (Story 1.5)
- [ ] Authentication flow implemented (Stories 1.2, 1.3)

### During Development

- [ ] All API calls use centralized API client
- [ ] Authentication headers included automatically
- [ ] Error handling implemented for all endpoints
- [ ] Loading states shown for async operations
- [ ] TanStack Query used for data fetching
- [ ] Cache invalidation implemented correctly
- [ ] TypeScript types defined for all responses

### Testing

- [ ] All endpoints tested with real API
- [ ] Error scenarios tested (401, 404, 500, etc.)
- [ ] Loading states tested
- [ ] Cache invalidation tested
- [ ] File upload tested (Excel import)

---

**Last Updated:** 2025-01-27  
**Version:** 1.1  
**Status:** Ready for Development

---

## 🔄 Manual Margin Recalculation (Request #17)

**📚 Backend Documentation:** 
- [Request #17 Guide](../request-backend/17-cogs-assigned-after-completed-week-recalculation.md)
- [COGS Backdating Logic](../COGS-BACKDATING-BUSINESS-LOGIC.md)

### Problem

When COGS is assigned with a date **after** the last completed week, automatic margin recalculation is skipped. This happens because `calculateAffectedWeeks()` returns an empty array if `valid_from > last completed week end`.

**Example:**
- Last completed week: W46 (ended November 19, 2025)
- COGS assigned: November 23, 2025 (AFTER last completed week)
- Result: Margin not shown (`current_margin_pct: null`)

### Solution: Manual Recalculation

**Frontend Hook:** `useManualMarginRecalculation`

```typescript
import { useManualMarginRecalculation } from '@/hooks/useManualMarginRecalculation'

const { mutate: recalculate, isPending } = useManualMarginRecalculation()

// Trigger recalculation for specific week
recalculate({
  weeks: ["2025-W46"],
  nm_ids: ["321678606"] // Optional: specific products
})
```

**API Endpoint:** `POST /v1/tasks/enqueue`

```typescript
POST /v1/tasks/enqueue
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
Content-Type: application/json

{
  "task_type": "recalculate_weekly_margin",
  "payload": {
    "cabinet_id": "<cabinet_id>",
    "weeks": ["2025-W46"],
    "nm_ids": ["321678606"]  // Optional
  }
}
```

**Response:**
```json
{
  "task_uuid": "uuid-123",
  "status": "pending",
  "enqueued_at": "2025-01-27T10:15:00Z"
}
```

### Frontend Implementation

**Warning Alert in COGS Form:**
- Automatically shown when COGS `valid_from` date is after last completed week
- Provides manual recalculation button
- Recommends assigning COGS with historical date

**Component:** `src/components/custom/SingleCogsForm.tsx`

**Hook:** `src/hooks/useManualMarginRecalculation.ts`

### Best Practice

**Assign COGS with Historical Date:**
```typescript
// ✅ Recommended: Assign COGS with date DURING target week
POST /v1/products/321678606/cogs
{
  "unit_cost_rub": 999.00,
  "valid_from": "2025-11-15",  // Date DURING week W46
  "source": "manual"
}
// Result: Automatic recalculation triggered for W46
```

**Related Documentation:**
- Request #17: `docs/request-backend/17-cogs-assigned-after-completed-week-recalculation.md`
- COGS Backdating: `docs/COGS-BACKDATING-BUSINESS-LOGIC.md`
- Story 4.1: `docs/stories/4.1.single-product-cogs-assignment.md`
- Story 4.8: `docs/stories/4.8.margin-recalculation-polling.md`

---

