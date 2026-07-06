# Architecture

## High-Level Architecture

This is a **Next.js 15 App Router** application. All routes live under `src/app/` and are organized into three route groups:

| Route Group | URL Prefix | Purpose |
|-------------|-----------|---------|
| `(auth)` | `/login`, `/register` | Public authentication pages |
| `(onboarding)` | `/cabinet`, `/wb-token`, `/processing` | First-time setup (no URL prefix) |
| `(dashboard)` | `/dashboard`, `/analytics/*`, `/orders/*`, etc. | All protected routes (sidebar + navbar layout) |

The `(dashboard)` group contains the vast majority of the application — over 30 feature route trees including the analytics hub, COGS management, orders, supplies, shipments, monitoring, automation, and settings.

### Root Layout (`src/app/layout.tsx`)

```
<html lang="ru">
  <ThemeProvider>          ← next-themes (light/dark)
    <Providers>            ← TanStack QueryClientProvider + TooltipProvider
      <AuthProvider>       ← activates useAuth() for auto token refresh
        {children}
        <Toaster />        ← sonner toasts
```

### Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

Waits for Zustand hydration before rendering. Provides a client-side auth guard as a fallback to `middleware.ts`. Renders Sidebar + Navbar + TokenHealthBanner around page content.

## Authentication Flow

Auth involves three layers that work together:

1. **Middleware** (`src/middleware.ts`) — Edge-level route protection. Reads the `auth-token` cookie (middleware can't access localStorage). Redirects unauthenticated users to `/login?redirect=...`. Uses `isValidToken()` from `src/lib/auth.ts` to check JWT expiry.

2. **Auth Store** (`src/stores/authStore.ts`) — Zustand store with `localStorage` persistence (key: `auth-storage`). Holds `user`, `token`, `cabinetId`, `isAuthenticated`. The `login()` and `refreshToken()` actions also call `setAuthCookie()` to sync the cookie for middleware access. Includes cross-tab logout sync via localStorage events.

3. **AuthProvider** (`src/components/auth/AuthProvider.tsx`) — Thin wrapper that activates `useAuth()`, which refreshes the token on mount and every 5 minutes, auto-logging out on refresh failure.

**Role normalization**: Backend sends lowercase roles (`owner`); the store normalizes to capitalized (`Owner`). Roles: Owner, Manager, Analyst, Service. RBAC in `src/lib/role-permissions.ts` — only Owner/Manager/Service can mutate operational data; Analyst is read-only.

## API Client

The centralized HTTP layer is a singleton class in `src/lib/api-client.ts`:

- **Auto-injects headers**: `Authorization: Bearer <token>` and `X-Cabinet-Id: <cabinetId>` from the Zustand auth store
- **Response unwrapping**: Auto-unwraps `response.data` from the `{ data, message, error }` envelope
- **Error handling**: Creates `ApiError` with `status`, `data`, and `retryAfter` (parsed from 429/503 `Retry-After` headers)
- **Options**: `skipAuth`, `skipCabinetId`, `skipDataUnwrap`, `responseType: 'blob'`, `suppressNetworkErrorLog`
- Exported singleton: `export const apiClient = new ApiClient()`

Domain-specific API modules live in `src/lib/api/` (100+ files). Each domain typically has paired files: an API function file (e.g., `orders.ts`) and a normalizer (e.g., `orders-normalizer.ts`) that transforms raw API responses into typed frontend models.

Auth API wrappers in `src/lib/api.ts`:
- `registerUser()` → `POST /v1/auth/register`
- `loginUser()` → `POST /v1/auth/login`
- `refreshToken()` → `POST /v1/auth/refresh`
- `logoutUser()` → `POST /v1/auth/logout`

## State Management

### Server State — TanStack Query v5

Configured in `src/app/providers.tsx`:
- `staleTime: 60s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: true`

Nearly every data-fetching hook in `src/hooks/` (~200+ files) uses `useQuery` or `useMutation`. This is the largest code area in the repository.

### Client State — Zustand v5

| Store | File | Purpose |
|-------|------|---------|
| Auth | `src/stores/authStore.ts` | User, token, cabinetId, login/refresh/logout |
| Dashboard Widgets | `src/stores/dashboardWidgetsStore.ts` | Widget visibility (14 types), persona presets, min 3 visible |
| Rate Limit | `src/stores/rateLimitStore.ts` | API 429/503 tracking, per-endpoint, cross-tab sync |
| Tariff Rate Limit | `src/stores/tariffRateLimitStore.ts` | Tariff-specific rate limiting |
| Margin Polling | `src/stores/marginPollingStore.ts` | Margin calculation polling state |
| Persona Presets | `src/stores/persona-presets.ts` | Persona → hidden widgets mapping |

### React Context

`src/contexts/dashboard-period-context.tsx` — Centralized dashboard period/week selection with URL sync + localStorage persistence. Logic is split across `dashboard-period-state.ts`, `dashboard-period-storage.ts`, and `dashboard-period-types.ts`.

## Component Layers

`src/components/` has six subdirectories:

| Directory | Purpose | Notes |
|-----------|---------|-------|
| `ui/` | shadcn/ui design system primitives (28 components) | **Do not edit directly** — use the shadcn CLI. Uses `cn()` + CVA + `forwardRef`. |
| `custom/` | Feature components (~100+ files) | Organized by feature: auth, COGS, margin, dashboard, products, financial, etc. |
| `analytics/` | Analytics-specific components | |
| `auth/` | Auth provider, login/register forms | |
| `layout/` | Layout components | |
| `notifications/` | Telegram notification system (17 files) | Preferences, binding, quiet hours, event types |

## Library Layer (`src/lib/`)

Beyond the API client, `src/lib/` contains ~100+ utility files:

- **Env validation**: `env.ts` — typed env var access
- **Routes**: `routes.ts` (60+ route constants), `routes-protected.ts` (`isProtectedRoute()` / `isPublicRoute()`)
- **Auth helpers**: `auth.ts` — `decodeJWT()`, `isTokenExpired()` (5-min buffer), `isValidToken()`
- **Logging**: `logger.ts` — dev-only logger, no-op in production
- **Analytics**: `mixpanel.ts` — Mixpanel wrapper
- **Business logic utilities** (~80 files): COGS formulas, liquidity calculations, unit economics, logistics/tariff calculations, supply planning, margin helpers, date/week utilities

## TypeScript Types

`src/types/` contains 100+ type definition files organized by domain. Key types:
- `auth.ts` — `User` (id, email, name, role, cabinet_ids), request/response types
- `api.ts` — `ApiResponse<T>`, `ApiError` class, `ApiRequestOptions`, `isForbiddenError()`
- Domain types: `orders.ts`, `analytics.ts`, `cogs/`, `liquidity/`, `unit-economics/`, `supply-planning/`, etc.

## Configuration

- **`next.config.ts`**: ESLint ignored during builds (separate gate), webpack cache disabled in dev, security headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`), AVIF/WebP images. `reactStrictMode` temporarily disabled.
- **`tsconfig.json`**: `strict: true`, `target: ES2020`, `moduleResolution: bundler`, path alias `@/*` → `./src/*`
- **`tailwind.config.ts`**: Tailwind CSS 4 with shadcn/ui theme tokens

## Key Source References

| Area | File(s) |
|------|---------|
| Root layout | `src/app/layout.tsx` |
| Providers | `src/app/providers.tsx` |
| Middleware | `src/middleware.ts` |
| API client | `src/lib/api-client.ts` |
| Auth store | `src/stores/authStore.ts` |
| Routes | `src/lib/routes.ts`, `src/lib/routes-protected.ts` |
| Env | `src/lib/env.ts` |
| Query client | `src/app/providers.tsx` |
