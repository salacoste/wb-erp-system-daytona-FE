# WB Repricer System - Frontend Architecture Document

**Version:** 1.0  
**Date:** 2025-01-20  
**Author:** Winston (Architect)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-20 | 1.0 | Initial frontend architecture document creation | Winston (Architect) |
| 2025-12-05 | 1.1 | Added Epic 6-FE components: DateRangePicker, DeltaIndicator, ComparisonPeriodSelector, KPICard, useMarginAnalytics hook updates, analytics types | Claude (Opus 4.5) |
| 2025-12-05 | 1.2 | Added Story 6.3-FE: ROI & Profit Metrics - useColumnVisibility hook, ColumnVisibilityToggle, analytics-utils, table column enhancements | Claude (Opus 4.5) |
| 2025-12-05 | 1.3 | Added Story 6.5-FE: Export Analytics UI - useExportAnalytics hook, ExportDialog, ExportStatusDisplay components, export types | Claude (Opus 4.5) |

---

## Template and Framework Selection

**Decision:** No existing frontend starter template. Starting fresh with Next.js.

**Framework Selection:**
- **Next.js 15.x** (App Router) - Required per PRD NFR17
- **TypeScript** - Required per PRD
- **shadcn/ui** - Component library foundation (specified in front-end-spec)
- **Tailwind CSS** - Styling framework (via shadcn/ui)

**Rationale:**
- Next.js provides SSR, routing, and performance optimizations required by PRD
- shadcn/ui offers accessible components with copy-paste architecture for full customization
- No starter template needed; we'll initialize Next.js and configure per project requirements

**Next Steps:**
1. Initialize Next.js with TypeScript
2. Install and configure Tailwind CSS
3. Set up shadcn/ui
4. Customize design system (red primary colors)

---

## Frontend Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Framework | Next.js | 15.x (latest stable) | Core React framework with SSR, routing, and performance optimization | Required per PRD NFR17. App Router provides modern React Server Components, built-in routing, and excellent TypeScript support. Enables SSR for better performance and SEO. |
| UI Library | shadcn/ui | Latest | Component library foundation | Specified in front-end-spec. Copy-paste architecture allows full customization. Built on Radix UI for accessibility. Tailwind-based for easy styling customization. |
| State Management | TanStack Query (React Query) | v5.x | Server state management and data fetching | Industry standard for API data fetching. Handles caching, background updates, and error states automatically. Reduces boilerplate compared to manual fetch logic. |
| Styling | Tailwind CSS | 4.x (latest) | Utility-first CSS framework | Required by shadcn/ui. Enables rapid UI development. Customizable design tokens for red/white theme. Excellent performance with JIT compilation. |
| Language | TypeScript | 5.x (latest) | Type-safe JavaScript | Required per PRD. Ensures code quality, better IDE support, and catches errors at compile time. ES+ syntax as specified. |
| Routing | Next.js App Router | Built-in | File-based routing system | Built into Next.js 13+. No additional library needed. Supports layouts, loading states, and error boundaries. |
| Form Handling | React Hook Form | Latest | Form state management and validation | Industry standard for React forms. Minimal re-renders, excellent TypeScript support. Integrates well with shadcn/ui Form components. |
| HTTP Client | Fetch API (native) | Native | API communication | Built into modern browsers. No additional dependency. Can be wrapped in custom API client for authentication headers. |
| Icons | Lucide React | Latest | Icon library | Recommended by shadcn/ui. Consistent icon set, tree-shakeable, TypeScript support. |
| Testing | Vitest + React Testing Library | Latest | Unit and component testing | Modern testing stack. Vitest is faster than Jest. React Testing Library promotes testing user behavior. |
| Build Tool | Next.js (Turbopack) | Built-in | Bundling and compilation | Next.js includes Turbopack (faster than Webpack). No additional configuration needed. |
| Dev Tools | ESLint | Latest | Code linting | Required per PRD NFR14. Configured with max-lines-per-file: 200 rule. |
| Animation | Framer Motion (optional) | Latest | Advanced animations | Optional for complex animations. CSS transitions sufficient for most use cases. Can be added later if needed. |

---

## Project Structure

```
frontend/
├── .next/                    # Next.js build output (gitignored)
├── public/                  # Static assets
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/                  # Next.js App Router directory
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── page.tsx          # Home/redirect page
│   │   ├── (auth)/           # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (onboarding)/     # Onboarding route group
│   │   │   ├── cabinet/
│   │   │   │   └── page.tsx
│   │   │   ├── wb-token/
│   │   │   │   └── page.tsx
│   │   │   └── processing/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/      # Protected routes group
│   │   │   ├── layout.tsx    # Dashboard layout (Sidebar + Navbar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── cogs/
│   │   │   │   ├── page.tsx  # COGS management list
│   │   │   │   ├── single/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── bulk/
│   │   │   │       └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx          # Analytics overview
│   │   │   │   ├── dashboard/        # Epic 6.4-FE: Cabinet Summary
│   │   │   │   │   ├── page.tsx      # KPIs, top products/brands
│   │   │   │   │   └── loading.tsx   # Loading skeleton
│   │   │   │   ├── sku/
│   │   │   │   │   └── page.tsx      # 6.1/6.2-FE: DateRange + Comparison
│   │   │   │   ├── brand/
│   │   │   │   │   └── page.tsx      # 6.1/6.2-FE: DateRange + Comparison
│   │   │   │   ├── category/
│   │   │   │   │   └── page.tsx      # 6.1/6.2-FE: DateRange + Comparison
│   │   │   │   ├── storage/          # Epic 24: Paid Storage
│   │   │   │   │   └── page.tsx
│   │   │   │   └── time-period/
│   │   │   │       └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   └── api/              # API routes (if needed)
│   │       └── ...
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (customized)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── form.tsx
│   │   │   ├── label.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── progress.tsx
│   │   │   └── checkbox.tsx
│   │   ├── custom/           # Custom project components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── ExpenseChart.tsx
│   │   │   ├── TrendGraph.tsx
│   │   │   ├── DateRangePicker.tsx      # Epic 6.1-FE: Week range selection
│   │   │   ├── DeltaIndicator.tsx       # Epic 6.2-FE: Delta display (↑↓)
│   │   │   ├── ComparisonPeriodSelector.tsx  # Epic 6.2-FE: Compare periods
│   │   │   ├── KPICard.tsx              # Epic 6.4-FE: KPI with trend indicator
│   │   │   ├── TopProductsTable.tsx     # Epic 6.4-FE: Top 10 products
│   │   │   ├── TopBrandsTable.tsx       # Epic 6.4-FE: Top 5 brands
│   │   │   ├── ColumnVisibilityToggle.tsx  # Epic 6.3-FE: Column toggle dropdown
│   │   │   ├── ExportDialog.tsx         # Epic 6.5-FE: Export configuration dialog
│   │   │   └── ExportStatusDisplay.tsx  # Epic 6.5-FE: Export progress/status
│   │   └── layout/           # Layout components
│   │       ├── DashboardLayout.tsx
│   │       └── AuthLayout.tsx
│   ├── lib/
│   │   ├── utils.ts          # cn() utility, formatters
│   │   ├── api.ts            # API client
│   │   ├── constants.ts       # App constants
│   │   └── analytics-utils.ts # Epic 6.3-FE: ROI/Profit formatting & colors
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDashboard.ts
│   │   ├── useCogs.ts
│   │   ├── useAnalytics.ts
│   │   ├── useAvailableWeeks.ts       # Week list for selectors
│   │   ├── useMarginAnalytics.ts      # SKU/Brand/Category analytics
│   │   │                               # Supports: weekStart, weekEnd,
│   │   │                               # compareTo, compareToStart, compareToEnd
│   │   ├── useCabinetSummary.ts       # Epic 6.4-FE: Cabinet summary API
│   │   ├── useColumnVisibility.ts     # Epic 6.3-FE: Column toggle with localStorage
│   │   └── useExportAnalytics.ts      # Epic 6.5-FE: Export mutation + status polling
│   ├── types/                # TypeScript type definitions
│   │   ├── api.ts            # API response types
│   │   ├── auth.ts           # Auth types
│   │   ├── product.ts         # Product/COGS types
│   │   ├── analytics.ts       # Epic 6: Analytics types
│   │   │                       # - CabinetSummaryResponse
│   │   │                       # - ComparisonAnalyticsItem
│   │   │                       # - PeriodDelta
│   │   │                       # - ExportRequest, ExportStatus (6.5-FE)
│   │   └── index.ts          # Re-exports
│   ├── stores/               # State management (if using Zustand)
│   │   ├── authStore.ts
│   │   └── cabinetStore.ts
│   └── styles/
│       └── globals.css       # Global styles, Tailwind directives
├── .env.local                # Environment variables (gitignored)
├── .env.example              # Example env file
├── .eslintrc.json            # ESLint config (max-lines-per-file: 200)
├── .gitignore
├── components.json            # shadcn/ui configuration
├── next.config.ts            # Next.js configuration
├── package.json
├── postcss.config.js         # PostCSS config for Tailwind
├── tailwind.config.ts        # Tailwind CSS config
├── tsconfig.json              # TypeScript configuration
└── README.md
```

---

## Component Standards

### Component Template

**Standard Component Structure (TypeScript):**

```typescript
'use client' // Only if component needs interactivity (hooks, event handlers)

import * as React from 'react'
import { cn } from '@/lib/utils'
// Import shadcn/ui components as needed
// Import custom types

interface ComponentNameProps {
  // Required props
  title: string
  value: number
  
  // Optional props
  variant?: 'default' | 'large' | 'small'
  isLoading?: boolean
  className?: string
  
  // Event handlers (if needed)
  onClick?: () => void
  onChange?: (value: string) => void
  
  // Children (if needed)
  children?: React.ReactNode
}

/**
 * ComponentName - Brief description of component purpose
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   title="Total Revenue" 
 *   value={1234567} 
 *   variant="large" 
 * />
 * ```
 */
export function ComponentName({
  title,
  value,
  variant = 'default',
  isLoading = false,
  className,
  onClick,
  onChange,
  children,
}: ComponentNameProps) {
  // Hooks (if client component)
  // const [state, setState] = React.useState()
  
  // Computed values
  const formattedValue = React.useMemo(() => {
    // Formatting logic
    return formatCurrency(value)
  }, [value])
  
  // Early returns for loading/error states
  if (isLoading) {
    return <Skeleton className={cn('h-20 w-full', className)} />
  }
  
  // Main render
  return (
    <div
      className={cn(
        'base-styles',
        variant === 'large' && 'large-variant-styles',
        variant === 'small' && 'small-variant-styles',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={title}
    >
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className="text-3xl font-bold">{formattedValue}</div>
      {children}
    </div>
  )
}

ComponentName.displayName = 'ComponentName'
```

### Naming Conventions

**Components:**
- PascalCase: `MetricCard.tsx`, `Sidebar.tsx`, `CogsAssignmentForm.tsx`
- Descriptive names: `ProductListTable.tsx` not `Table.tsx`
- Feature prefix for feature-specific: `DashboardMetricCard.tsx` vs `MetricCard.tsx`

**Files:**
- Match component name: `MetricCard.tsx` exports `MetricCard`
- One component per file (enforced by 200-line limit)
- Index files for re-exports: `index.ts` in feature folders

**Props Interfaces:**
- Pattern: `{ComponentName}Props`
- Example: `MetricCardProps`, `SidebarProps`

**Custom Hooks:**
- Prefix with `use`: `useDashboard.ts`, `useCogs.ts`, `useAuth.ts`
- File name matches hook name: `useDashboard.ts` exports `useDashboard`

**Utilities:**
- camelCase: `formatCurrency.ts`, `apiClient.ts`
- Descriptive: `formatCurrency` not `format`

**Types:**
- PascalCase: `DashboardMetrics`, `Product`, `CogsAssignment`
- Suffix with type if ambiguous: `ProductType`, `ApiResponse`
- Group in `types/` directory by domain

**Constants:**
- UPPER_SNAKE_CASE: `API_BASE_URL`, `MAX_FILE_SIZE`
- Group in `lib/constants.ts` or feature-specific files

**Route Segments (App Router):**
- kebab-case: `cogs-management/`, `wb-token/`, `margin-analysis/`
- Descriptive: `single-assignment/` not `single/`

**CSS Classes (Tailwind):**
- Use Tailwind utilities: `bg-primary`, `text-white`, `rounded-lg`
- Custom classes via `cn()`: `cn('base-class', condition && 'conditional-class')`
- Semantic naming in custom CSS (if needed): `.metric-card-large`

---

## State Management

### Store Structure

**State Management Directory Structure:**

```
src/
├── stores/                    # Zustand stores (client state)
│   ├── authStore.ts          # Authentication state (user, token, cabinet)
│   ├── uiStore.ts            # UI state (sidebar open/closed, theme)
│   └── index.ts              # Re-exports
├── lib/
│   └── queryClient.ts        # TanStack Query client setup
└── hooks/                     # Custom hooks wrapping stores/queries
    ├── useAuth.ts            # Auth store hook wrapper
    ├── useDashboard.ts       # Dashboard data queries
    ├── useCogs.ts            # COGS management queries
    └── useAnalytics.ts       # Analytics queries
```

**State Management Strategy:**

- **Server State (API Data):** TanStack Query
  - Dashboard metrics, products, financial data
  - Automatic caching, background refetching, error handling
  - Query keys organized by feature: `['dashboard', 'metrics']`, `['products', id]`

- **Client State (UI & Auth):** Zustand
  - Authentication: user info, JWT token, cabinet ID
  - UI state: sidebar collapsed, modals open, filters
  - Lightweight, no boilerplate, TypeScript-friendly

- **Form State:** React Hook Form
  - COGS assignment forms, login/registration
  - Local to forms, not global state

### State Management Template

**Zustand Store Template (Client State):**

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
}

interface AuthState {
  // State
  user: User | null
  token: string | null
  cabinetId: string | null
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  setCabinetId: (cabinetId: string) => void
  login: (user: User, token: string, cabinetId: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      cabinetId: null,
      isAuthenticated: false,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setToken: (token) => set({ token }),
      
      setCabinetId: (cabinetId) => set({ cabinetId }),
      
      login: (user, token, cabinetId) =>
        set({
          user,
          token,
          cabinetId,
          isAuthenticated: true,
        }),
      
      logout: () =>
        set({
          user: null,
          token: null,
          cabinetId: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage', // localStorage key
      // Only persist token and user, not isAuthenticated (computed)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        cabinetId: state.cabinetId,
      }),
    }
  )
)
```

**TanStack Query Setup Template:**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time: 5 minutes
      gcTime: 1000 * 60 * 5,
      // Stale time: 1 minute (data considered fresh)
      staleTime: 1000 * 60,
      // Retry failed requests
      retry: 1,
      // Refetch on window focus (for real-time feel)
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
})
```

**Custom Hook Template (TanStack Query):**

```typescript
// src/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { DashboardMetrics } from '@/types/api'

export function useDashboard() {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiClient.getDashboardMetrics(),
    // Data is fresh for 30 seconds
    staleTime: 1000 * 30,
  })
}

// Usage in component:
// const { data, isLoading, error } = useDashboard()
```

---

## API Integration

### Service Template

**API Client Service Template:**

```typescript
// src/lib/api.ts
import { useAuthStore } from '@/stores/authStore'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// API Response wrapper
interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// API Error class
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

// API Client class
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { token, cabinetId } = useAuthStore.getState()
    
    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    // Add authentication header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // Add cabinet ID header (if available)
    if (cabinetId) {
      headers['X-Cabinet-Id'] = cabinetId
    }
    
    // Build full URL
    const url = `${API_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')
      
      if (!response.ok) {
        const errorData = isJson ? await response.json() : await response.text()
        throw new ApiError(
          errorData?.message || `API Error: ${response.statusText}`,
          response.status,
          errorData
        )
      }
      
      // Parse response
      if (isJson) {
        const data: ApiResponse<T> = await response.json()
        return data.data || (data as unknown as T)
      }
      
      return (await response.text()) as unknown as T
    } catch (error) {
      // Handle network errors
      if (error instanceof ApiError) {
        throw error
      }
      
      // Handle fetch errors (network, CORS, etc.)
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0,
        error
      )
    }
  }
  
  // GET request
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }
  
  // POST request
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  // PUT request
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  // PATCH request
  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  // DELETE request
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Specific API service functions
export const dashboardApi = {
  getMetrics: () => apiClient.get<DashboardMetrics>('/dashboard/metrics'),
  getExpenses: () => apiClient.get<ExpenseBreakdown>('/dashboard/expenses'),
  getTrends: (period?: string) => 
    apiClient.get<TrendData>(`/dashboard/trends${period ? `?period=${period}` : ''}`),
}

export const cogsApi = {
  getProducts: (params?: { page?: number; limit?: number }) =>
    apiClient.get<Product[]>('/products'),
  assignCogs: (productId: string, cogs: number) =>
    apiClient.post<{ success: boolean }>(`/products/${productId}/cogs`, { cogs }),
  bulkAssignCogs: (assignments: Array<{ productId: string; cogs: number }>) =>
    apiClient.post<{ succeeded: number; failed: number }>('/products/cogs/bulk', {
      assignments,
    }),
}
```

### API Client Configuration

**Error Handling:**

```typescript
// src/lib/api.ts (continued)
// Error handling interceptor pattern
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    // Handle specific status codes
    switch (error.status) {
      case 401:
        // Unauthorized - redirect to login
        useAuthStore.getState().logout()
        return 'Session expired. Please log in again.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'Resource not found.'
      case 422:
        // Validation errors
        return error.data?.message || 'Validation error occurred.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return error.message || 'An error occurred.'
    }
  }
  
  return 'An unexpected error occurred. Please try again.'
}
```

**Environment Configuration:**

```typescript
// .env.local (example)
NEXT_PUBLIC_API_URL=https://api.wb-repricer.com/api
# Or for development:
# NEXT_PUBLIC_API_URL=http://localhost:3000/api

// src/lib/api.ts - Environment validation
if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not set. Using default localhost URL.')
}

// Ensure HTTPS in production
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_API_URL?.startsWith('http://')
) {
  console.error('API URL must use HTTPS in production!')
}
```

---

## Routing

### Route Configuration

**Route Configuration Template:**

```typescript
// src/lib/routes.ts
/**
 * Application route definitions
 * Centralized route constants for type-safe navigation
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Onboarding routes
  ONBOARDING: {
    CABINET: '/onboarding/cabinet',
    WB_TOKEN: '/onboarding/wb-token',
    PROCESSING: '/onboarding/processing',
  },
  
  // Protected routes
  DASHBOARD: '/dashboard',
  COGS: {
    ROOT: '/cogs',
    SINGLE: '/cogs/single',
    BULK: '/cogs/bulk',
  },
  ANALYTICS: {
    ROOT: '/analytics',
    SKU: '/analytics/sku',
    BRAND: '/analytics/brand',
    CATEGORY: '/analytics/category',
    TIME_PERIOD: '/analytics/time-period',
    SUMMARY: '/analytics/summary',
  },
  SETTINGS: '/settings',
} as const

// Type for route paths
export type RoutePath = typeof ROUTES[keyof typeof ROUTES] | string

// Protected route matcher
export const isProtectedRoute = (pathname: string): boolean => {
  const protectedPaths = [
    ROUTES.DASHBOARD,
    ROUTES.COGS.ROOT,
    ROUTES.COGS.SINGLE,
    ROUTES.COGS.BULK,
    ROUTES.ANALYTICS.ROOT,
    ROUTES.ANALYTICS.SKU,
    ROUTES.ANALYTICS.BRAND,
    ROUTES.ANALYTICS.CATEGORY,
    ROUTES.ANALYTICS.TIME_PERIOD,
    ROUTES.ANALYTICS.SUMMARY,
    ROUTES.SETTINGS,
  ]
  
  return protectedPaths.some((path) => pathname.startsWith(path))
}

// Public route matcher
export const isPublicRoute = (pathname: string): boolean => {
  const publicPaths = [
    ROUTES.HOME,
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.ONBOARDING.CABINET,
    ROUTES.ONBOARDING.WB_TOKEN,
    ROUTES.ONBOARDING.PROCESSING,
  ]
  
  return publicPaths.includes(pathname)
}
```

**Authentication Middleware (Next.js Middleware):**

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isProtectedRoute, isPublicRoute, ROUTES } from '@/lib/routes'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookie or header
  const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  // Check if route is protected
  const protected = isProtectedRoute(pathname)
  const publicRoute = isPublicRoute(pathname)
  
  // Redirect unauthenticated users from protected routes
  if (protected && !token) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect authenticated users from auth pages to dashboard
  if (publicRoute && token && (pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER)) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url))
  }
  
  return NextResponse.next()
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Protected Route Layout:**

```typescript
// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from '@/components/custom/Sidebar'
import { Navbar } from '@/components/custom/Navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth check
  const { isAuthenticated, token } = useAuthStore.getState()
  
  if (!isAuthenticated || !token) {
    redirect('/login')
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Lazy Loading Configuration:**

```typescript
// src/app/(dashboard)/analytics/page.tsx
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy analytics components
const AnalyticsDashboard = lazy(() => import('@/components/custom/AnalyticsDashboard'))
const TrendGraph = lazy(() => import('@/components/custom/TrendGraph'))

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <AnalyticsDashboard />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TrendGraph />
      </Suspense>
    </div>
  )
}
```

---

## Styling Guidelines

### Tailwind CSS Configuration

**Tailwind Config Template:**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary red color palette (from front-end-spec)
        primary: {
          DEFAULT: '#E53935',  // Main brand color
          dark: '#D32F2F',     // Hover states, pressed buttons
          light: '#FFCDD2',    // Hover backgrounds, disabled states
          foreground: '#FFFFFF', // Text on primary background
        },
        // Gray scale
        gray: {
          50: '#F5F5F5',  // Light backgrounds
          100: '#EEEEEE', // Borders
          200: '#BDBDBD', // Disabled text
          300: '#757575', // Body text
        },
        // Semantic colors
        success: {
          DEFAULT: '#4CAF50', // Positive margins
          foreground: '#FFFFFF',
        },
        error: {
          DEFAULT: '#E53935', // Negative margins, errors
          foreground: '#FFFFFF',
        },
        info: {
          DEFAULT: '#2196F3', // Primary metrics
          foreground: '#FFFFFF',
        },
        // shadcn/ui color system (via CSS variables)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Typography scale from front-end-spec
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'metric': ['32px', { lineHeight: '1.2', fontWeight: '700' }], // Large metric values
        'metric-lg': ['48px', { lineHeight: '1.2', fontWeight: '700' }], // Extra large metrics
      },
      spacing: {
        // Custom spacing scale
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
      },
      borderRadius: {
        // Border radius from front-end-spec
        DEFAULT: '8px', // Standard border radius
        lg: '12px',     // Large border radius
        sm: '4px',      // Small border radius
      },
      boxShadow: {
        // Shadow system from front-end-spec
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
```

**Global CSS with CSS Variables:**

```css
/* src/styles/globals.css */
@import 'tailwindcss';

@layer base {
  :root {
    /* Primary red colors */
    --primary: 0 65% 55%;        /* #E53935 */
    --primary-dark: 0 65% 50%;   /* #D32F2F */
    --primary-light: 0 100% 90%; /* #FFCDD2 */
    --primary-foreground: 0 0% 100%; /* White text */
    
    /* Background colors */
    --background: 0 0% 100%;     /* White */
    --foreground: 0 0% 20%;      /* Dark gray text */
    
    /* Card colors */
    --card: 0 0% 100%;           /* White */
    --card-foreground: 0 0% 20%;
    
    /* Border and input */
    --border: 0 0% 93%;          /* #EEEEEE */
    --input: 0 0% 93%;
    --ring: 0 65% 55%;           /* Primary red for focus rings */
    
    /* Semantic colors */
    --success: 142 76% 36%;      /* #4CAF50 */
    --error: 0 65% 55%;          /* #E53935 */
    --info: 217 91% 60%;        /* #2196F3 */
    
    /* Border radius */
    --radius: 0.5rem;            /* 8px */
  }
  
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
}
```

### Typography System

**Typography Usage Guidelines:**

```typescript
// Typography examples in components
// H1 - Page titles
<h1 className="text-h1">Dashboard</h1>

// H2 - Section headers
<h2 className="text-h2">Financial Overview</h2>

// Body text
<p className="text-body text-gray-300">Regular body text</p>

// Metric values (large)
<div className="text-metric text-primary">1,234,567 ₽</div>

// Metric values (extra large)
<div className="text-metric-lg text-primary">1,234,567 ₽</div>
```

---

## Testing Strategy

### Testing Pyramid

**Testing Strategy Overview:**

```
        /\
       /  \     E2E Tests (10%)
      /    \    Critical user workflows
     /______\   
    /        \  Integration Tests (30%)
   /          \ API interactions, data flow
  /____________\
 /              \ Unit Tests (60%)
/________________\ Components, utilities, business logic
```

**Testing Stack:**

| Test Type | Tool | Purpose | Coverage Target |
|-----------|------|---------|-----------------|
| Unit Tests | Vitest + React Testing Library | Component logic, utilities, hooks | 60%+ |
| Integration Tests | Vitest + MSW (Mock Service Worker) | API interactions, data flow | 30%+ |
| E2E Tests | Playwright | Critical user workflows | 10%+ |
| Visual Regression | Playwright + Percy (optional) | UI consistency | As needed |

### Unit Testing

**Unit Test Template:**

```typescript
// src/components/custom/MetricCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('renders title and value correctly', () => {
    render(<MetricCard title="Total Revenue" value={1234567} />)
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('1 234 567 ₽')).toBeInTheDocument()
  })
  
  it('shows skeleton when loading', () => {
    render(<MetricCard title="Total Revenue" value={0} isLoading />)
    
    expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument()
  })
  
  it('formats currency correctly for RUB', () => {
    render(<MetricCard title="Revenue" value={1234567.89} />)
    
    const value = screen.getByText(/1 234 567/)
    expect(value).toBeInTheDocument()
  })
})
```

### Integration Testing

**API Integration Test Template:**

```typescript
// src/hooks/useDashboard.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { useDashboard } from './useDashboard'

beforeEach(() => {
  server.resetHandlers()
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useDashboard', () => {
  it('fetches dashboard metrics successfully', async () => {
    server.use(
      http.get('/api/dashboard/metrics', () => {
        return HttpResponse.json({
          data: {
            totalPayable: 1000000,
            revenue: 5000000,
          },
        })
      })
    )
    
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(result.current.data).toEqual({
      totalPayable: 1000000,
      revenue: 5000000,
    })
  })
})
```

### End-to-End Testing

**E2E Test Template (Playwright):**

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })
  
  test('displays dashboard metrics', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Wait for metrics to load
    await expect(page.locator('text=Total Payable')).toBeVisible()
    await expect(page.locator('text=Revenue')).toBeVisible()
    
    // Check currency formatting
    const metricValue = page.locator('[data-testid="metric-value"]').first()
    await expect(metricValue).toContainText('₽')
  })
})
```

### Test File Organization

**Test Directory Structure:**

```
src/
├── components/
│   ├── custom/
│   │   ├── MetricCard.tsx
│   │   └── MetricCard.test.tsx      # Colocated unit tests
├── lib/
│   ├── utils.ts
│   └── utils.test.ts                 # Colocated utility tests
├── hooks/
│   ├── useDashboard.ts
│   └── useDashboard.test.tsx         # Colocated hook tests
└── test/
    ├── setup.ts                       # Test setup, mocks
    ├── mocks/
    │   └── server.ts                  # MSW server setup
    └── utils.tsx                      # Test utilities

e2e/
├── dashboard.spec.ts
├── cogs-assignment.spec.ts
└── onboarding.spec.ts
```

---

## Environment Configuration

### Environment Variables

**Environment Variables Template:**

```typescript
// .env.example
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
# Production: NEXT_PUBLIC_API_URL=https://api.wb-repricer.com/api

# Application Configuration
NEXT_PUBLIC_APP_NAME=WB Repricer System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_WEBSOCKET=false

# Development Only
NEXT_PUBLIC_ENABLE_DEV_TOOLS=true
```

**Environment Variable Validation:**

```typescript
// src/lib/env.ts
/**
 * Validates and exports environment variables
 * Ensures required variables are set and provides type safety
 */

const requiredEnvVars = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
} as const

// Validate required variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

// Type-safe environment variables
export const env = {
  // API
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  
  // App
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'WB Repricer System',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Feature flags
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableWebSocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
  
  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableDevTools: process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true',
} as const
```

### Build Configuration

**Next.js Configuration:**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // React strict mode for development
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: [], // Add image domains if needed
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Output configuration
  output: 'standalone', // For Docker deployments
}

export default nextConfig
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\""
  }
}
```

---

## Frontend Developer Standards

### Critical Coding Rules

**Essential Rules to Prevent Common Mistakes:**

1. **File Size Limit (CRITICAL)**
   - All source files MUST be under 200 lines
   - Split large files into smaller modules
   - ESLint rule: `max-lines-per-file: 200`
   - Exception: Generated files (if documented)

2. **TypeScript Requirements**
   - All code MUST use TypeScript (no `.js` files)
   - Use ES+ syntax (ES2020+)
   - Strict mode enabled (`strict: true` in tsconfig)
   - No `any` types (use `unknown` or proper types)
   - All functions must have explicit return types

3. **Component Structure**
   - One component per file
   - Use functional components only (no class components)
   - Server Components by default, Client Components only when needed
   - Mark Client Components with `'use client'` directive at top

4. **Import Organization**
   - Group imports: external → internal → types
   - Use path aliases (`@/components` not `../../components`)
   - Absolute imports preferred over relative

5. **Naming Conventions**
   - Components: PascalCase (`MetricCard.tsx`)
   - Hooks: camelCase with `use` prefix (`useDashboard.ts`)
   - Utilities: camelCase (`formatCurrency.ts`)
   - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
   - Types/Interfaces: PascalCase (`DashboardMetrics`)

6. **Code Comments**
   - All comments in English
   - JSDoc for exported functions/components
   - Explain "why" not "what"
   - No commented-out code in production

7. **Error Handling**
   - Always handle errors (no silent failures)
   - Use try-catch for async operations
   - Provide user-friendly error messages
   - Log errors appropriately (console.error in dev, proper logging in prod)

8. **Accessibility (WCAG AA)**
   - All interactive elements keyboard accessible
   - Proper ARIA labels where needed
   - Semantic HTML elements
   - Color contrast ratios meet WCAG AA (4.5:1 for text)

9. **Performance**
   - Use `React.memo` for expensive components
   - Lazy load heavy components
   - Optimize images with Next.js Image component
   - Avoid unnecessary re-renders

10. **API Integration**
    - Always use `apiClient` utility (no direct fetch)
    - Include error handling for all API calls
    - Use TanStack Query for data fetching
    - Never hardcode API URLs (use environment variables)

11. **State Management**
    - Server state: TanStack Query
    - Client state: Zustand stores
    - Form state: React Hook Form
    - Avoid prop drilling (use context or stores)

12. **Styling**
    - Use Tailwind CSS utilities only
    - No inline styles
    - Use `cn()` utility for conditional classes
    - Follow design system color palette

### Quick Reference

**Common Commands:**

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # TypeScript type checking

# Testing
npm test                 # Run unit tests (Vitest)
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI

# Code Quality
npm run format            # Format code with Prettier
npm run format:check      # Check formatting
```

**Key Import Patterns:**

```typescript
// Component imports
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/custom/MetricCard'

// Utility imports
import { formatCurrency, cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'

// Hook imports
import { useDashboard } from '@/hooks/useDashboard'
import { useAuthStore } from '@/stores/authStore'

// Type imports
import type { DashboardMetrics } from '@/types/api'

// Next.js imports
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// TanStack Query imports
import { useQuery, useMutation } from '@tanstack/react-query'

// React imports (minimal - Next.js handles most)
import { useState, useEffect } from 'react'
```

**Project-Specific Patterns:**

```typescript
// Currency formatting (RUB, Russian locale)
import { formatCurrency } from '@/lib/utils'
formatCurrency(1234567.89) // => "1 234 567,89 ₽"

// Conditional class names
import { cn } from '@/lib/utils'
<div className={cn('base-class', condition && 'conditional-class')} />

// API client usage
import { dashboardApi } from '@/lib/api'
const metrics = await dashboardApi.getMetrics()

// TanStack Query hook
import { useDashboard } from '@/hooks/useDashboard'
const { data, isLoading, error } = useDashboard()

// Zustand store usage
import { useAuthStore } from '@/stores/authStore'
const { user, token, login, logout } = useAuthStore()

// Route navigation
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/dashboard')

// Epic 6-FE: Date range and comparison
import { DateRangePicker } from '@/components/custom/DateRangePicker'
import { DeltaIndicator } from '@/components/custom/DeltaIndicator'
import { useMarginAnalyticsBySku } from '@/hooks/useMarginAnalytics'

// Date range with comparison
const { data } = useMarginAnalyticsBySku({
  weekStart: '2025-W44',
  weekEnd: '2025-W47',
  compareTo: '2025-W40',  // Single week comparison
  // OR use range comparison:
  // compareToStart: '2025-W40',
  // compareToEnd: '2025-W43',
})
```

---

## Epic 6-FE: Advanced Analytics Components

### DateRangePicker Component (Story 6.1-FE)

Week range selector with validation and quick presets:

```typescript
// src/components/custom/DateRangePicker.tsx
import { DateRangePicker } from '@/components/custom/DateRangePicker'

<DateRangePicker
  weekStart="2025-W44"
  weekEnd="2025-W47"
  onRangeChange={(start, end) => console.log(start, end)}
  maxWeeks={52}  // Maximum range span
/>
```

**Features:**
- Quick presets: "Последние 4 недели", "Последние 12 недель"
- Validation: prevents selecting future weeks, enforces max range
- ISO week format: `YYYY-Www`

### DeltaIndicator Component (Story 6.2-FE)

Visual indicator for period-over-period changes:

```typescript
// src/components/custom/DeltaIndicator.tsx
import { DeltaIndicator, DeltaBadge } from '@/components/custom/DeltaIndicator'

// Percentage change (default)
<DeltaIndicator value={12.5} />  // ↑ +12.5% (green)
<DeltaIndicator value={-5.6} />  // ↓ -5.6% (red)
<DeltaIndicator value={0} />     // — 0.0% (gray)

// Absolute currency change
<DeltaIndicator value={15000} type="absolute" />  // ↑ +15 000 ₽

// Inverse (for costs - negative is good)
<DeltaIndicator value={-10} inverse />  // ↑ -10% (green)

// Compact badge for tables
<DeltaBadge value={12.5} />  // Pill-style badge
```

**Props:**
- `value`: number | null | undefined
- `type`: 'percentage' | 'absolute'
- `inverse`: boolean (for costs where negative is good)
- `size`: 'sm' | 'md' | 'lg'
- `showTooltip`: boolean

### ComparisonPeriodSelector Component (Story 6.2-FE)

Period comparison mode selector with presets:

```typescript
// src/components/custom/ComparisonPeriodSelector.tsx
import { ComparisonPeriodSelector } from '@/components/custom/ComparisonPeriodSelector'

<ComparisonPeriodSelector
  enabled={comparisonEnabled}
  onEnabledChange={setComparisonEnabled}
  preset="previous"  // 'previous' | 'same_last_year' | 'custom'
  onPresetChange={setPreset}
  compareStart="2025-W40"
  compareEnd="2025-W43"
  onCompareRangeChange={(start, end) => ...}
  currentPeriodStart="2025-W44"
  currentPeriodEnd="2025-W47"
/>
```

**Presets:**
- `previous`: Previous period of same length
- `same_last_year`: Same weeks from previous year
- `custom`: Manual week range selection

### useMarginAnalytics Hook Updates (Story 6.1-FE, 6.2-FE)

Enhanced hook with date range and comparison support:

```typescript
// src/hooks/useMarginAnalytics.ts
import { useMarginAnalyticsBySku } from '@/hooks/useMarginAnalytics'

// Date range mode
const { data } = useMarginAnalyticsBySku({
  weekStart: '2025-W44',
  weekEnd: '2025-W47',
  includeCogs: true,
})

// With period comparison
const { data } = useMarginAnalyticsBySku({
  weekStart: '2025-W44',
  weekEnd: '2025-W47',
  compareTo: '2025-W40',  // Single week
  // OR range comparison:
  compareToStart: '2025-W40',
  compareToEnd: '2025-W43',
})
```

**Filter Parameters:**
- `weekStart`, `weekEnd`: Current period range (ISO week)
- `compareTo`: Single week comparison
- `compareToStart`, `compareToEnd`: Range comparison
- `includeCogs`: Include COGS data

### Cabinet Summary Dashboard (Story 6.4-FE)

KPI dashboard with top performers:

```typescript
// src/hooks/useCabinetSummary.ts
import { useCabinetSummary } from '@/hooks/useCabinetSummary'

const { data } = useCabinetSummary({ weeks: 4 })
// Returns: summary.totals, summary.products, summary.trends,
//          top_products[], top_brands[], meta
```

**KPICard Component:**
```typescript
import { KPICard } from '@/components/custom/KPICard'

<KPICard
  title="Выручка"
  value={1234567}
  format="currency"
  trend="up"
  trendValue={12.5}
/>
```

### Analytics Types (src/types/analytics.ts)

```typescript
// Period comparison response item
interface ComparisonAnalyticsItem {
  nm_id: string
  sa_name: string
  // Current period
  revenue_net: number
  profit: number | null
  margin_pct: number | null
  // Comparison period
  compare_revenue_net: number
  compare_profit: number | null
  compare_margin_pct: number | null
  // Deltas
  revenue_delta: number
  revenue_delta_pct: number
  profit_delta: number | null
  profit_delta_pct: number | null
  margin_delta_pct: number | null
}

// Cabinet summary response
interface CabinetSummaryResponse {
  summary: {
    totals: CabinetSummaryTotals
    products: CabinetProductStats
    trends: CabinetTrends
  }
  top_products: TopProductItem[]
  top_brands: TopBrandItem[]
  meta: { cabinet_id, period, generated_at }
}
```

### ROI & Profit Metrics (Story 6.3-FE)

**useColumnVisibility Hook:**

```typescript
// src/hooks/useColumnVisibility.ts
import { useColumnVisibility } from '@/hooks/useColumnVisibility'

const {
  visibility,      // { roi: boolean, profit_per_unit: boolean, markup_percent: boolean }
  toggleColumn,    // (column: keyof ColumnVisibility) => void
  reset,           // () => void - reset to defaults
  visibleCount,    // number of visible columns
} = useColumnVisibility('analytics-sku-columns')
```

**ColumnVisibilityToggle Component:**

```typescript
// src/components/custom/ColumnVisibilityToggle.tsx
import { ColumnVisibilityToggle } from '@/components/custom/ColumnVisibilityToggle'

<ColumnVisibilityToggle
  visibility={visibility}
  onToggle={toggleColumn}
  onReset={reset}
/>
```

**Analytics Utils (src/lib/analytics-utils.ts):**

```typescript
import {
  getROIColor,           // ROI color class by threshold
  formatROI,             // Format ROI as "50.5%"
  formatProfitPerUnit,   // Format as "125,50 ₽/ед."
  calculateROI,          // (profit, cogs) => number | null
  calculateProfitPerUnit // (profit, qty) => number | null
} from '@/lib/analytics-utils'

// ROI Color Thresholds:
// ≥100% → text-green-600 (Excellent)
// 50-99% → text-green-500 (Good)
// 20-49% → text-yellow-600 (Average)
// 0-19% → text-orange-500 (Low)
// <0% → text-red-600 (Negative)
```

**Table Enhancements:**

All margin analytics tables (MarginBySkuTable, MarginByBrandTable, MarginByCategoryTable) now support:
- Optional ROI column with color-coded values
- Optional Profit per Unit column
- Column visibility toggle via `columnVisibility` prop
- Sortable ROI and Profit per Unit columns
- Tooltips explaining formulas

```typescript
<MarginBySkuTable
  data={marginData}
  onProductClick={(nmId) => router.push(`/products/${nmId}`)}
  columnVisibility={{ roi: true, profit_per_unit: true, markup_percent: false }}
/>
```

### Export Analytics (Story 6.5-FE)

**useExportAnalytics Hook:**

```typescript
// src/hooks/useExportAnalytics.ts
import { useExportAnalytics } from '@/hooks/useExportAnalytics'

const {
  createExport,   // (request: ExportRequest) => void - start export
  isCreating,     // boolean - mutation in progress
  status,         // ExportStatus | undefined - current export status
  isPolling,      // boolean - polling active
  isTimedOut,     // boolean - exceeded 2 minute limit
  reset,          // () => void - clear export state
  createError,    // Error | null - creation error
} = useExportAnalytics()

// Start export
createExport({
  type: 'by-sku',
  weekStart: '2025-W01',
  weekEnd: '2025-W04',
  format: 'xlsx',
  includeCogs: true,
})
```

**ExportDialog Component:**

```typescript
// src/components/custom/ExportDialog.tsx
import { ExportDialog } from '@/components/custom/ExportDialog'

<ExportDialog
  open={showExportDialog}
  onOpenChange={setShowExportDialog}
  defaultType="by-sku"           // 'by-sku' | 'by-brand' | 'by-category' | 'cabinet-summary'
  defaultWeekStart={weekStart}   // ISO week format: YYYY-Www
  defaultWeekEnd={weekEnd}
/>
```

**ExportStatusDisplay Component:**

```typescript
// src/components/custom/ExportStatusDisplay.tsx
import { ExportStatusDisplay } from '@/components/custom/ExportStatusDisplay'

<ExportStatusDisplay
  status={exportStatus}          // ExportStatus object
  onRetry={() => reset()}        // Reset handler for retry
/>
```

**Export Types (src/types/analytics.ts):**

```typescript
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

**Usage in Analytics Pages:**

All analytics pages (SKU, Brand, Category) include Export functionality:

```typescript
// src/app/(dashboard)/analytics/sku/page.tsx
import { Download } from 'lucide-react'
import { ExportDialog } from '@/components/custom/ExportDialog'

const [showExportDialog, setShowExportDialog] = useState(false)

// In header:
<Button variant="outline" onClick={() => setShowExportDialog(true)} className="gap-2">
  <Download className="h-4 w-4" />
  Экспорт
</Button>

<ExportDialog
  open={showExportDialog}
  onOpenChange={setShowExportDialog}
  defaultType="by-sku"
  defaultWeekStart={weekStart}
  defaultWeekEnd={weekEnd}
/>
```

**Export Workflow:**
1. User clicks "Экспорт" button → ExportDialog opens
2. User selects export type, date range, format, and COGS option
3. User clicks "Экспортировать" → POST /v1/exports/analytics
4. Dialog shows ExportStatusDisplay with polling (2s interval)
5. On completion → auto-download via programmatic link click
6. On failure or timeout (2min) → show error with retry option

---

## Summary

This frontend architecture document provides comprehensive guidance for building the WB Repricer System Frontend using Next.js, TypeScript, shadcn/ui, and Tailwind CSS. It establishes:

- **Technology Stack**: Modern, performant tools aligned with PRD requirements
- **Project Structure**: Clear organization following Next.js App Router conventions
- **Component Standards**: Consistent patterns for maintainable code
- **State Management**: Separation of server and client state
- **API Integration**: Centralized, type-safe API client
- **Routing**: Protected routes with authentication middleware
- **Styling**: Tailwind CSS with custom red/white design system
- **Testing**: Comprehensive testing pyramid strategy
- **Environment Configuration**: Type-safe environment variable handling
- **Developer Standards**: Critical rules and quick reference guide

All code examples follow the 200-line file limit, TypeScript strict mode, and WCAG AA accessibility requirements as specified in the PRD.

---

**Document Status:** Complete  
**Next Steps:** Review with team, begin implementation following this architecture

