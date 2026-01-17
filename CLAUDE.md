# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WB Repricer System - Frontend** - Financial analytics dashboard for Wildberries marketplace sellers. Next.js 15 + TypeScript frontend with public REST API backend integration.

**Backend API**: Separate service running on `http://localhost:3000` (default), configurable via `NEXT_PUBLIC_API_URL`.

### Core Purpose
- Display weekly financial analytics (revenue, expenses, margin, profit)
- COGS (Cost of Goods Sold) management with versioning
- Product margin analysis with real-time recalculation
- Storage analytics, advertising metrics, price calculator
- Telegram notification preferences management

---

## Development Commands

```bash
# Development (recommended)
npm run dev              # Start on port 3000 with hot reload

# Production (PM2)
npm run build           # Build production bundle
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production  # Port 3100

# PM2 Management
pm2 status              # Check running processes
pm2 logs wb-repricer-frontend[-dev]    # View logs
pm2 restart wb-repricer-frontend[-dev] # Restart
pm2 stop wb-repricer-frontend[-dev]    # Stop

# Code Quality
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix ESLint errors
npm run type-check      # TypeScript type checking
npm run format          # Prettier format
npm run format:check    # Check formatting

# Testing
npm test                # Run unit tests (Vitest)
npm run test:ui         # Run tests with UI
npm run test:coverage   # Coverage report
npm run test:e2e        # Run E2E tests (Playwright)
npm run test:e2e:ui     # Run E2E tests with UI

# Cleanup
npm run clean           # Remove .next and cache
npm run clean:full      # Full clean + reinstall
```

---

## Architecture & Structure

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5 (strict mode, no `any`)
- **Styling**: Tailwind CSS 4.x + shadcn/ui components
- **State**: TanStack Query v5 (server) + Zustand (client)
- **Forms**: react-hook-form + zod validation
- **Testing**: Vitest (unit) + Playwright (E2E)

### Project Structure
```
src/
├── app/              # Next.js App Router pages
│   ├── (dashboard)/  # Authenticated routes (layout with sidebar)
│   ├── (auth)/       # Public auth routes
│   └── layout.tsx    # Root layout with providers
├── components/
│   ├── ui/           # shadcn/ui components (DO NOT EDIT MANUALLY)
│   ├── custom/       # Feature components (ProductList, ExpenseChart, etc.)
│   ├── layout/       # Layout components (Sidebar, Header)
│   └── auth/         # Auth components (AuthProvider)
├── lib/              # Utilities, API client, helpers
│   └── api/          # API modules by domain (storage, price-calculator, etc.)
├── hooks/            # Custom React hooks (useDashboard, useProducts, etc.)
├── stores/           # Zustand stores (authStore, marginPollingStore)
├── types/            # TypeScript type definitions
├── services/         # Service layer (cabinets.service.ts)
├── config/           # Configuration files (features.ts, routes.ts)
└── test/             # Test utilities and fixtures
```

---

## Frontend Epic Catalog

This is a frontend project. We track frontend implementation epics (marked with -FE suffix) that integrate with backend APIs.

| Epic ID | Title | Status | Stories | Backend API Reference |
|---------|-------|--------|---------|----------------------|
| Epic 1-FE | Foundation & Authentication | ✅ Complete | 5 | Backend Epic 6 |
| Epic 2-FE | Onboarding & Initial Data Setup | ✅ Complete | 4 | Backend Epic 2 |
| Epic 3-FE | Dashboard & Financial Overview | ✅ Complete | 6 | Backend Epic 3 |
| Epic 4-FE | COGS Management & Margin Analysis | ✅ Complete | 10 | Backend Epic 12 |
| Epic 5-FE | COGS History Management | ✅ Complete | 3 | Backend Epic 12 |
| Epic 6-FE | Advanced Analytics & Reporting | ✅ Complete | 5 | Backend Epic 16 |
| Epic 24-FE | Paid Storage Analytics UI | ✅ Complete | 11 | Backend Epic 24 |
| Epic 33-FE | Advertising Analytics UI | ✅ Complete | 8 | Backend Epic 33 |
| Epic 34-FE | Telegram Notifications UI | ✅ Complete | 6 | Backend Epic 34 |
| Epic 36-FE | Product Card Linking UI | ✅ Complete | 5 | Backend Epic 36 |
| Epic 37-FE | Merged Group Table Display UI | ✅ Done | 5 | Backend Epic 37 |
| Epic 42-FE | Task Handlers Adaptation | 📋 Ready for Dev | 4 | Backend Epic 42 |
| Epic 44-FE | Price Calculator UI | ✅ Complete | 6 | Backend Epic 43 |

**Status Legend**: ✅ Complete | 🚧 In Progress | 📋 Ready for Dev

**Note**: Backend epics are managed by the backend team. We only track which backend APIs our frontend epic integrates with.

**Documentation locations**:
- Frontend epic docs: `docs/epics/epic-*-fe.md` or `docs/stories/epic-*/`
- Story details: `docs/stories/epic-XX/story-XX.Y-*.md`
- Status tracking: `docs/stories/STORIES-STATUS-REPORT.md`
- Backend API contracts: `/test-api/*.http` (for API reference only)

---

## Route Structure (23 Pages)

### Public Routes `(auth)`
| Path | Purpose |
|------|---------|
| `/login` | Login page |
| `/register` | Registration page |

### Onboarding `(onboarding)` (no URL prefix)
| Path | Purpose |
|------|---------|
| `/cabinet` | Cabinet creation |
| `/wb-token` | WB API token entry |
| `/processing` | Initial data processing status |

### Protected Routes `(dashboard)` (requires auth)
| Path | Purpose |
|------|---------|
| `/dashboard` | Main dashboard |
| `/cogs` | Product list with COGS form |
| `/cogs/bulk` | Bulk COGS assignment |
| `/cogs/history` | COGS version history |
| `/cogs/price-calculator` | Price calculator (Epic 44) |
| `/analytics` | Analytics hub |
| `/analytics/dashboard` | Cabinet summary (Epic 6.4) |
| `/analytics/sku` | Margin by SKU |
| `/analytics/brand` | Margin by brand |
| `/analytics/category` | Margin by category |
| `/analytics/time-period` | Time-period comparison |
| `/analytics/storage` | Storage analytics (Epic 24) |
| `/analytics/supply-planning` | Stockout prediction |
| `/analytics/unit-economics` | Unit economics (Epic 5) |
| `/analytics/liquidity` | Liquidity analysis (Epic 7) |
| `/analytics/advertising` | Advertising ROAS (Epic 33) |
| `/settings/notifications` | Telegram settings (Epic 34) |

**Routes reference**: `src/lib/routes.ts` - centralized route constants

---

## API Integration (40+ Endpoints)

### Authentication Headers (Auto-Added)
```http
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

**Implementation**: Automatic injection via `ApiClient` class in `src/lib/api-client.ts`

### API Endpoint Catalog

#### Authentication (3)
- `POST /v1/auth/register` - Create account
- `POST /v1/auth/login` - Get JWT token
- `POST /v1/auth/logout` - Invalidate session

#### Cabinets (7)
- `POST /v1/cabinets` - Create cabinet
- `GET /v1/cabinets` - List cabinets (paginated)
- `GET /v1/cabinets/{id}` - Get details
- `PUT /v1/cabinets/{id}` - Update cabinet
- `POST /v1/cabinets/{id}/keys` - Save WB token
- `GET /v1/cabinets/{id}/status` - Sync status
- `DELETE /v1/cabinets/{id}` - Delete cabinet

#### Products (7+)
- `GET /v1/products` - List with filters (`has_cogs`, `search`, `cursor`, `limit`)
- `GET /v1/products/{nmId}` - Get details
- `POST /v1/products/{nmId}/cogs` - Assign COGS (single)
- `POST /v1/products/cogs/bulk` - Bulk assign (up to 1000)
- `POST /v1/products/price-calculator` - Reverse margin calc (Epic 43)
- **Request #15**: `include_cogs=true` adds margin data to list

#### Analytics (12+)
- `GET /v1/analytics/weekly/finance-summary` - Dashboard metrics
- `GET /v1/analytics/weekly/by-sku` - SKU analytics
- `GET /v1/analytics/weekly/by-brand` - Brand analytics
- `GET /v1/analytics/weekly/by-category` - Category analytics
- `GET /v1/analytics/weekly/margin-trends` - Margin trends
- `GET /v1/analytics/cabinet-summary` - Cabinet KPIs (Epic 6.4)
- `GET /v1/analytics/unit-economics` - Cost breakdown % (Epic 27)
- `GET /v1/analytics/supply-planning` - Stockout prediction (Epic 28)
- `GET /v1/analytics/liquidity` - Inventory turnover (Epic 7)
- `GET /v1/analytics/advertising` - Ad performance (Epic 33, 36)
- `GET /v1/analytics/storage/*` - Storage analytics (Epic 24)

#### Tasks (5)
- `GET /v1/tasks` - List tasks
- `GET /v1/tasks/{task_uuid}` - Get status
- `POST /v1/tasks/enqueue` - Manual trigger (Manager+ only)

**Task types**: `finances_weekly_ingest`, `products_sync`, `weekly_margin_aggregate`, `recalculate_weekly_margin`

#### Exports (Story 6.5)
- `POST /v1/exports/analytics` - Create export job
- `GET /v1/exports/{export_id}` - Get status + download URL

**Types**: `by-sku`, `by-brand`, `by-category`, `cabinet-summary`
**Formats**: `csv`, `xlsx`

### Role-Based Access Control
| Role | Task Enqueue | View Analytics |
|------|--------------|---------------|
| Owner | ✅ | ✅ |
| Manager | ✅ | ✅ |
| Service | ✅ | ✅ |
| Analyst | ❌ (403) | ✅ |

**Frontend**: Hide/disable buttons for Analyst using `canEnqueueTasks(role)` helper

---

## Backend API Documentation Reference

This section provides API contract references for integration with the backend service.

### Quick Reference Map

| Frontend Module | Backend .http File | Backend Epic | Purpose |
|-----------------|-------------------|--------------|---------|
| `storage-analytics.ts` | `12-storage.http` | Backend Epic 24 | Paid storage analytics |
| `advertising-analytics.ts` | `07-advertising-analytics.http` | Backend Epic 33/36 | Advertising metrics |
| `notifications.ts` | `13-notifications.http` | Backend Epic 34 | Telegram notifications |
| `price-calculator.ts` | `15-price-calculator.http` | Backend Epic 43/44 | Price calculator |
| `liquidity.ts` | `06-analytics-advanced.http` | Backend Epic 29 | Liquidity analysis |
| `supply-planning.ts` | `06-analytics-advanced.http` | Backend Epic 28 | Supply planning |

### Backend HTTP Files Catalog

| File | Size | Endpoints | Backend Epic Reference |
|------|------|-----------|------------------------|
| `00-variables.http` | 3.1 KB | Login setup | - |
| `01-auth.http` | 1.7 KB | Auth endpoints | Backend Epic 6 |
| `03-cabinets.http` | 4.4 KB | Cabinet CRUD | Backend Epic 1 |
| `05-analytics-basic.http` | 17.8 KB | Weekly analytics | Backend Epic 3 |
| `06-analytics-advanced.http` | 46.3 KB | Advanced analytics | Backend Epics 27-29 |
| `07-advertising-analytics.http` | 77.3 KB | Advertising | Backend Epic 33 |
| `12-storage.http` | 11.6 KB | Storage | Backend Epic 24 |
| `13-notifications.http` | 17.9 KB | Telegram | Backend Epic 34 |
| `15-price-calculator.http` | 16.3 KB | Price calc | Backend Epic 43 |

**Usage**: Install "REST Client" extension (Huachao Mao) for VS Code, open any `.http` file, click "Send Request"

**Note**: These files contain backend API contracts for reference only. Backend epics are managed by the backend team.

---

## Critical Development Rules

### File Size Limit (MANDATORY)
- **All source files MUST be under 200 lines** (ESLint enforced)
- Split large files into smaller modules

### TypeScript Requirements
- **Strict mode enabled** - No `any` types (use `unknown`)
- All functions must have explicit return types
- Interfaces for all API contracts

### Component Standards
- Server Components by default (no `'use client'` unless needed)
- Functional components only (no classes)
- One component per file
- Components in PascalCase, files in kebab-case

### Import Rules
- Use path aliases: `@/components` not `../../components`
- Group imports: external → internal → types
- Absolute imports preferred

### shadcn/ui Components
- **DO NOT EDIT manually** - Use `npx shadcn@latest add [component]`
- Copy-paste architecture - each component is in your codebase
- Customize via variants or wrapper components

---

## Key Architecture Patterns

### API Client Pattern
**Location**: `src/lib/api-client.ts`

**Features**:
- Auto-includes JWT (`Authorization: Bearer {token}`)
- Auto-includes Cabinet ID (`X-Cabinet-Id: {cabinetId}`)
- Auto-unwraps `{ data: ... }` responses
- Error handling with `ApiError` class
- `skipDataUnwrap` option for complex responses

### TanStack Query Pattern
**Location**: All hooks in `src/hooks/`

```typescript
// GET requests
const { data, isLoading, error } = useQuery({
  queryKey: ['key', params],
  queryFn: () => apiClient.get('/endpoint'),
})

// POST/PUT/DELETE
const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/endpoint', data),
  onSuccess: () => queryClient.invalidateQueries(['key']),
})
```

**Configuration**: `src/lib/queryClient.ts`
- staleTime: 60s, gcTime: 5min
- retry: 1
- refetchOnWindowFocus: true

### Zustand Pattern
**Location**: `src/stores/`

```typescript
// Auth store with persistence
const { user, token, cabinetId } = useAuthStore()

// Margin polling store
const { addPollingProduct, isPolling } = useMarginPollingStore()
```

### Polling Pattern (Critical for COGS → Margin)
**Pattern**: After COGS assignment, poll for margin calculation

```typescript
// Strategy based on COGS date
getPollingStrategy(validFrom, isBulk) -> {
  interval: 3000-5000ms,
  maxAttempts: 10-20,
  estimatedTime: 30000-180000ms
}

// Usage
const { mutate, isPolling } = useSingleCogsAssignmentWithPolling()
```

**Files**: `src/lib/margin-helpers.ts`, `src/hooks/*-polling.ts`

---

## Component Catalog

### shadcn/ui Components (22 base components)
**Location**: `src/components/ui/`

**Form**: button, input, label, form, select, checkbox, switch, slider
**Layout**: card, sheet, dialog, alert-dialog, collapsible
**Feedback**: alert, progress, skeleton, sonner (toast)
**Navigation**: dropdown-menu, tabs, popover
**Other**: table, badge, tooltip

### Custom Components (70+ components, ~18,490 lines)
**Location**: `src/components/custom/`

**Auth/Onboarding**: LoginForm, RegistrationForm, CabinetCreationForm, WbTokenForm, ProcessingStatus

**Layout**: Sidebar, Navbar, RequireWbToken wrapper

**Products/COGS**: ProductList, ProductSearchFilter, ProductPagination, SingleCogsForm, BulkCogsForm, CogsHistoryTable

**Analytics**: FinancialSummaryTable, MarginBySkuTable, ExpenseChart, TrendGraph, MetricCard, KPICard

**Date Selection**: WeekSelector, WeekComparisonSelector, MultiWeekSelector, DateRangePicker

**Storage (Epic 24)**: ProductStorageInfo

**Notifications (Epic 34)**: NotificationPreferencesPanel, TelegramBindingModal, QuietHoursPanel

**Price Calculator (Epic 44)**: PriceCalculatorForm, PriceCalculatorResults, CostBreakdownChart, MarginSlider

### Component Patterns
1. **Page → Container → Presenters**: Page orchestrates, containers manage state, presenters render
2. **Compound Components**: Parent with multiple sub-components
3. **Hook-Driven Features**: Components consume hooks for all data/mutations
4. **Protection Wrappers**: Route protection via RequireWbToken
5. **Responsive Layout**: Sheet sidebar on mobile, fixed on desktop

---

## Hooks Catalog (45 hooks)

**Location**: `src/hooks/`

**Auth**: `useAuth`, `useCabinetSummary`
**Products/COGS**: `useProducts`, `useSingleCogsAssignment`, `useBulkCogsAssignment`, `useCogsHistory`
**Analytics**: `useDashboard`, `useFinancialSummary`, `useMarginAnalytics`, `useTrends`
**Storage**: `useStorageAnalytics` (Epic 24)
**Supply**: `useSupplyPlanning` (Epic 6)
**Unit Economics**: `useUnitEconomics` (Epic 5)
**Liquidity**: `useLiquidity` (Epic 7)
**Advertising**: `useAdvertisingAnalytics` (Epic 33)
**Price Calculator**: `usePriceCalculator` (Epic 44)
**Notifications**: `useNotificationPreferences`, `useTelegramBinding` (Epic 34)
**Tasks**: `useProcessingStatus`, `useManualMarginRecalculation`

### Hook Pattern
```typescript
export function useFeature(params) {
  return useQuery({
    queryKey: featureQueryKeys.byId(params),
    queryFn: () => getFeature(params),
    enabled: !!params,
    staleTime: 30000,
  })
}
```

---

## State Management

### Zustand Stores (2 stores)

**`authStore.ts`**: Authentication state
- State: user, token, cabinetId, isAuthenticated
- Persistence: localStorage with cross-tab sync
- Actions: login, logout, refreshToken, setToken
- Cookie sync: Sets auth-token cookie for middleware

**`marginPollingStore.ts`**: Margin calculation tracking
- State: Set of nmIds currently polling
- Actions: addPollingProduct, removePollingProduct, isPolling

### React Query Cache
**Query Keys Pattern**:
```typescript
storageQueryKeys.all = ['storage']
storageQueryKeys.bySku = (params) => ['storage', 'by-sku', params]

// Invalidation
queryClient.invalidateQueries({ queryKey: storageQueryKeys.all })
```

---

## Type System (13 type files)

**Location**: `src/types/`

**Core**: `api.ts`, `auth.ts`, `cabinet.ts`, `cogs.ts`
**Analytics**: `analytics.ts`, `storage-analytics.ts`, `advertising-analytics.ts`
**Business Logic**: `unit-economics.ts`, `liquidity.ts`, `supply-planning.ts`
**Features**: `price-calculator.ts`, `notifications.ts`

**Patterns**:
- Request/Response pairs for API contracts
- Status enums with string literal unions
- Config interfaces with labels, colors, icons
- Cursor-based pagination types

---

## Business Logic Locations

### Calculations
**`src/lib/margin-helpers.ts`**: Week calculations, COGS temporal logic
- `getLastCompletedWeek()` - Conservative week logic (Mon/Tue AM → W-2, Tue PM → W-1)
- `getWeekMidpointDate()` - Thursday (COGS version lookup)
- `calculateAffectedWeeks()` - Array of weeks needing recalc
- `isCogsAfterLastCompletedWeek()` - Warning check (Request #17)

**`src/lib/*-utils.ts`**: Domain-specific business logic
- `unit-economics-utils.ts`: Profitability status, health score
- `liquidity-utils.ts`: Turnover categories, liquidation scenarios
- `supply-planning-utils.ts`: Stockout risk, reorder values
- `campaign-utils.ts`: Campaign status, efficiency labels
- `efficiency-utils.ts`: ROAS/ROI categorization

### Formatters
**All in Russian locale**:
- `formatCurrency()` → "1 234 567,89 ₽"
- `formatPercentage()` → "15,5 %"
- `formatDate()` → "20.01.2025"
- `formatIsoWeek()` → "2025-W03"

### Transformers
**`src/lib/transformers/advertising-transformers.ts`**: Epic 37 merged groups conversion

---

## Configuration & Constants

### Environment (`src/lib/env.ts`)
```typescript
apiUrl: NEXT_PUBLIC_API_URL (default: localhost:3000)
appName, appVersion, enableAnalytics
isDevelopment, isProduction, enableDevTools
```

### Feature Flags (`src/config/features.ts`)
```typescript
features.epic37MergedGroups = {
  enabled: boolean,
  useRealApi: boolean,
  debug: boolean
}
```

### Routes (`src/lib/routes.ts`)
Centralized route constants with type safety:
```typescript
ROUTES.DASHBOARD.SKA
ROUTES.COGS.PRICE_CALCULATOR
ROUTES.ANALYTICS.STORAGE
```

---

## Testing Strategy

### Structure
- **Unit tests**: `src/**/*.test.tsx` (colocated with components)
- **Integration tests**: `src/lib/api/__tests__/`
- **E2E tests**: `e2e/**/*.spec.ts` (Playwright)

### Coverage Goals
- Unit Tests: 60%+
- Integration Tests: 30%+
- E2E Tests: 10%+

### Test Utilities
**Location**: `src/test/utils/test-utils.tsx`

- `createTestQueryClient()` - Fresh client
- `createQueryWrapper()` - Wrapper for hooks
- `renderWithProviders()` - Custom render

### Test Fixtures
**Location**: `src/test/fixtures/`

- `price-calculator.ts` - Epic 44 mocks
- `storage-analytics.ts` - Epic 24 mocks

---

## Common Patterns

### Currency Formatting
```typescript
import { formatCurrency } from '@/lib/utils'
formatCurrency(1234567.89) // "1 234 567,89 ₽"
```

### Conditional Classes
```typescript
import { cn } from '@/lib/utils'
<div className={cn('base-class', condition && 'conditional-class')} />
```

### Debounced Search
```typescript
// Pattern: two-state search (searchInput + search)
const [searchInput, setSearchInput] = useState('')
const [search, setSearch] = useState('')

useEffect(() => {
  const delay = setTimeout(() => setSearch(searchInput), 500)
  return () => clearTimeout(delay)
}, [searchInput])
```

### Query Keys Factory
```typescript
export const xxxQueryKeys = {
  all: ['xxx'] as const,
  byId: (id: string) => [...xxxQueryKeys.all, 'id', id] as const,
  list: (params) => [...xxxQueryKeys.all, 'list', params] as const,
}
```

### Status Configuration Pattern
```typescript
const STATUS_CONFIG: Record<Status, Config> = {
  status1: { label, color, bgColor, icon },
  status2: { label, color, bgColor, icon },
}

export function getStatusConfig(status): Config
export function getStatusLabel(status): string
```

**Used in**: Unit economics, liquidity, supply planning, advertising

---

## Critical Business Rules

### Week Definition (CRITICAL)
- **ISO week format**: `YYYY-Www` (e.g., "2025-W49")
- **Timezone**: `Europe/Moscow`
- **Week starts**: Monday
- **Last completed week**: Mon/Tue before 12:00 → W-2, Tue after 12:00 → W-1

### Margin Formula
```
margin_pct = ((revenue - cogs) / revenue) * 100
```

### ROAS Formula
```
roas = revenue / spend (where spend > 0)
```

### COGS Temporal Logic
- **Midpoint rule**: Thursday determines which COGS version applies
- COGS with `valid_from` after last completed week → Warning + manual recalc button (Request #17)

### Payout Total Formula (WB Dashboard Compatible)
```
payout_total = to_pay_goods
  - logistics_cost
  - storage_cost
  - paid_acceptance_cost
  - penalties_total
  - wb_commission_adj  # commission_other ONLY (reason='Удержание')
  - acquiring_fee_total
  - commission_sales_total
  - loyalty_fee
  - loyalty_points_withheld
  + loyalty_compensation
  ± other_adjustments_net
```

### Data Quality Rules
- COGS must be positive number (> 0)
- Historical COGS tracked with `valid_from` dates
- Task idempotency: `task_uuid = hash({cabinet_id, task_type, payload, planned_at})`

---

## Key Issues & Solutions

### Product Search (Story 4.1)
- **Parameter fix**: Backend expects `q=` not `search=` (fixed in `useProducts.ts`)
- **Debounce**: 500ms delay prevents API spam
- **Partial match**: Backend filters client-side for partial article matches

### Margin Display (Request #15)
- Use `include_cogs=true` for batch margin data
- Performance: ~300ms for 25 products (8x faster than sequential)

### COGS After Last Week (Request #17)
- Automatic recalculation skipped if `valid_from > lastCompletedWeek`
- Warning alert + manual button in `SingleCogsForm.tsx`

### Pagination Duplicates (Request #13)
- WB SDK cursor pagination bug → Client-side workaround
- Backend fetches ALL products, paginates in-memory
- Redis caching: First load ~500ms, cached ~50ms

---

## Documentation References

### Essential Documents

**Architecture & Design**:
- `docs/front-end-architecture.md` - Technical architecture
- `docs/front-end-spec.md` - UI/UX specifications (comprehensive)
- `docs/prd.md` - Product requirements

**API Integration**:
- `docs/api-integration-guide.md` - Complete API reference (33+ endpoints)
- `docs/MARGIN-COGS-BACKEND-INTEGRATION.md` - Margin & COGS integration
- `docs/request-backend/README.md` - All backend requests (100+ files)

**Epic Documentation**:
- `docs/epics/epic-24-price-calculator-ui.md` - Price Calculator
- `docs/epics/epic-34-fe-telegram-notifications-ui.md` - Telegram
- `docs/stories/epic-37/` - Merged Groups documentation
- `docs/stories/epic-24/README.md` - Storage Analytics

**UI/UX Reference Documents**:
- `docs/front-end-spec.md` - Complete UI/UX specification (personas, flows, design system)
- `docs/wireframes/` - Wireframe documentation
  - `epic-36-ui-mockup.md` - Product card linking UI
  - `epic-42-ui-mockup.md` - Task handlers UI
- `docs/user-guide/` - User guide documentation
  - `price-calculator.md` - Price calculator user guide

**Stories & Status**:
- `docs/stories/STORIES-STATUS-REPORT.md` - All stories status (76 total, 68 done)
- `docs/stories/EPIC-4-COMPLETION-SUMMARY.md` - Epic 4 summary
- `docs/stories/epic-*/story-*.md` - Individual story documents

**Backend API**:
- Swagger UI: `http://localhost:3000/api`
- `test-api.http` - HTTP request examples for all endpoints

---

## Environment Variables (Optional)

```bash
# .env.local (optional - defaults work for local dev)
NEXT_PUBLIC_API_URL=http://localhost:3000  # Default: localhost:3000
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot  # Optional (has fallback)
```

---

## Port Configuration

- **Development (`npm run dev`)**: Port 3000 (Next.js default)
- **PM2 (both modes)**: Port 3100 (configured in `ecosystem.config.js`)

---

## WCAG 2.1 AA Accessibility (Mandatory)

- Color contrast ≥4.5:1
- All interactive elements keyboard-navigable
- All images have alt text
- All form inputs have labels
- ARIA labels where needed
- E2E tests with `@axe-core/playwright`

---

## Git Workflow

```bash
# Feature branch
git checkout -b feature/story-{ID}.{NUM}

# Commit (lint + type-check first)
npm run lint && npm run type-check
git commit -m "feat: implement story X.Y"

# PR for review
git push origin feature-story-X.Y
```

---

## Tech Stack Rationale

1. **Next.js over CRA**: SSR for performance, built-in routing, better TypeScript
2. **shadcn/ui over MUI**: Copy-paste architecture, Radix UI accessibility, Tailwind customization
3. **TanStack Query over Redux**: Designed for server state, automatic caching, less boilerplate
4. **Zustand over Redux**: Lightweight, no boilerplate, TypeScript-friendly
5. **React Hook Form over Formik**: Minimal re-renders, excellent TypeScript, shadcn integration
6. **200-line file limit**: Optimizes AI context, enforces single responsibility
7. **Red primary color**: Matches Wildberries brand, different from typical SaaS

---

## Design System Specifications

### Color Palette
| Element | Color | Usage |
|---------|-------|-------|
| Primary Red | `#E53935` | Main brand, buttons, links |
| Primary Dark | `#D32F2F` | Hover states |
| Primary Light | `#FFCDD2` | Hover backgrounds |
| White | `#FFFFFF` | Backgrounds |
| Gray Scale | `#F5F5F5` (light), `#EEEEEE` (borders), `#757575` (text) | UI elements |

### Semantic Colors
- **Green** (`#22C55E`) - Positive values, profitable margins
- **Red** (`#EF4444`) - Negative values, losses, high expenses
- **Blue** (`#3B82F6`) - Primary metrics, information
- **Purple** (`#7C4DFF`) - Storage analytics (Epic 24)
- **Yellow** (`#F59E0B`) - Warnings, medium severity

### Typography
| Element | Size/Weight | Usage |
|---------|------------|-------|
| H1 | 32px, bold | Page titles |
| H2 | 24px, semi-bold | Section headers |
| Body | 14-16px, regular | Content |
| Metric Values | 32-48px, bold | Dashboard metrics |

---

## User Personas

### Primary: Business Owner / Entrepreneur
- 50-5000 SKUs, 500K-50M RUB/month revenue
- **Goals**: Quick profit insight, reduce manual work by 75%, optimize pricing
- **Pain points**: Manual spreadsheets, no real-time visibility, COGS tracking difficulty

### Secondary: Financial Director / CFO
- 1000+ SKUs, financial professional
- **Goals**: Accurate reporting, strategic decisions, trend analysis
- **Pain points**: Need comprehensive overviews, multi-dimensional analysis

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Initial page load | < 3 seconds |
| Time to interactive | < 5 seconds |
| Dashboard data load | < 2 seconds |
| API response (p95) | < 500ms |
| Error rate | < 1% |

---

## Test User Credentials

```
Email: test@test.com
Password: Russia23!
```

---

**Last Updated**: 2026-01-17
**Backend API Docs**: `http://localhost:3000/api` (Swagger)
**Total Frontend Epics**: 13
**Total Stories**: 76 (68 complete, 89% done)
**Total Components**: 100+ (70 custom, 22 shadcn/ui)
**Total Hooks**: 45
