---
type: "Architecture Overview"
title: "Architecture"
description: "Next.js App Router dashboard architecture — route groups, layout and provider hierarchy, client-side data fetching for interactive pages, authentication (proxy + Zustand store), and state management."
---
# Architecture

## Route Groups

The app uses three parenthesized route groups (directories that organize code without affecting URLs):

| Group | Purpose | Key Routes |
|-------|---------|------------|
| `(auth)` | Login / registration | `/login`, `/register` |
| `(onboarding)` | New user setup | `/cabinet`, `/processing`, `/wb-token` |
| `(dashboard)` | All authenticated app pages | `/dashboard`, `/analytics/*` (30+ sub-routes), `/orders/*`, `/shipments/*`, `/supplies/*`, `/products`, `/cogs/*`, `/finances`, `/communications`, `/settings/*`, `/monitor`, `/monitoring`, `/moysklad`, `/automation/*` |

Root `/` redirects to `/dashboard` (authenticated) or `/login` (unauthenticated).

Source: `src/app/(dashboard)/layout.tsx`, `src/lib/routes.ts`

## Layout & Provider Hierarchy

```
RootLayout (src/app/layout.tsx)
 └─ ThemeProvider (next-themes — class-based, light default)
     └─ Providers (src/app/providers.tsx)
         └─ QueryClientProvider (TanStack Query: 60s stale, 5min GC, retry=1)
             └─ TooltipProvider
                 └─ AuthProvider (auto JWT refresh)
                     └─ Toaster (sonner)
                         └─ Route Group Layouts
                             └─ (dashboard) → DashboardLayout (client component)
                                                ├─ Sidebar + Navbar
                                                ├─ TokenHealthBanner
                                                └─ [Page Content]
```

The dashboard layout (`src/app/(dashboard)/layout.tsx`) is a **client component** that acts as an auth fallback gate: checks Zustand store hydration, and if no token exists in localStorage, clears the `auth-token` cookie and redirects to `/login`. This prevents redirect loops that would occur if only middleware guarded the route.

Source: `src/app/layout.tsx`, `src/app/providers.tsx`, `src/app/(dashboard)/layout.tsx`

## Data Fetching — Interactive Pages Are Client-Side

Next.js server page and layout wrappers coexist with client components. **Not every page uses the `use client` directive**; server components still render page/layout wrappers. However, the interactive, data-driven pages fetch client-side — none of the React Server Components fetch data. Those data flows use this layered architecture:

```
Page (client component)
  └─ Custom hook (src/hooks/use*.ts)
      └─ TanStack Query useQuery()
          └─ apiClient.get/post()  (src/lib/api-client.ts)
              └─ fetch() with auto-injected headers
                  ├─ Authorization: Bearer <JWT>
                  └─ X-Cabinet-Id: <cabinetId>
```

TanStack Query is configured with a browser-singleton `QueryClient` to avoid recreation on re-render. See `src/app/providers.tsx` and `src/lib/queryClient.ts`.

Query keys use structured factory patterns (e.g., `cabinetSummaryKeys.all` / `.byParams(params)`) for granular cache invalidation. Files are organized as `src/hooks/*-query-keys.ts`.

## Authentication

### Proxy (server-side, Next 16 convention)
`src/proxy.ts` (renamed from `middleware.ts` for Next.js 16) reads the `auth-token` cookie (set client-side after login) and validates the JWT structure. Protected routes without a valid token redirect to `/login` with a `redirect` query param. Authenticated users hitting `/login` or `/register` are redirected to the dashboard (or the `redirect` target). Next.js 16 renamed the middleware entrypoint from `middleware.ts` to `proxy.ts` and the exported function from `middleware` to `proxy`; the auth logic is otherwise unchanged.

### Client-side auth store
`src/stores/authStore.ts` — Zustand store with `persist` middleware → localStorage. Stores `token`, `cabinetId`, `user` data. The `auth-token` cookie is mirrored from the store via `setAuthCookie()` in `src/lib/utils.ts` for middleware access.

### Token refresh
`AuthProvider` (`src/components/auth/AuthProvider.tsx`) runs `useAuth()` hook for automatic JWT refresh with a 5-minute pre-expiry buffer (`src/lib/auth.ts`).

### Multi-tenant isolation
Cabinet ID (tenant) is injected as `X-Cabinet-Id` header on every API call via the API client. Some endpoints also accept `cabinet_id` in request body.

### WB API token
Separate from the JWT — a per-cabinet Wildberries API token configured during onboarding (`/wb-token`). Missing-token 401 errors are treated as expected soft errors, not logged as failures. `<RequireWbToken>` components guard routes that need it.

### RBAC
`src/lib/role-permissions.ts` — `canManageOperationalData()` returns true for Owner, Manager, and Service roles; Analyst is read-only.

## State Management

### Zustand stores (`src/stores/`)
| Store | Purpose | Persisted |
|-------|---------|-----------|
| `authStore` | JWT, cabinetId, user | ✅ localStorage + cross-tab sync |
| `dashboardWidgetsStore` | Dashboard widget layout/visibility | ✅ |
| `rateLimitStore` | API rate-limit tracking | ✅ |
| `marginPollingStore` | Margin recalculation polling state | ❌ |
| `dashboardPeriodStore` | Selected date range / period | ❌ |

Source: `src/stores/`

## Configuration

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config |
| `tsconfig.json` | TypeScript strict mode, `@/` path alias |
| `eslint.config.js` | Flat ESLint config with custom `no-restricted-syntax` for AP#8 |
| `tailwind.config.ts` | Tailwind theme (red primary `#E53935`, Russian locale) |
| `.env.example` | Environment variable names (see [Testing & Operations](testing-and-ops.md)) |
