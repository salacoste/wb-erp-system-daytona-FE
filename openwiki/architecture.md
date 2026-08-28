---
type: "Architecture Overview"
title: "Architecture"
description: "Next.js App Router dashboard architecture — route groups, layout and provider hierarchy, client-side data fetching for interactive pages, authentication (proxy + Zustand store), state management, and environment configuration."
tags: [architecture, nextjs, app-router, authentication, tanstack-query, zustand, configuration]
verified:
  - by: openwiki/0.4.3
    at: 2026-08-28T08:47:49.990Z
sources:
  - id: openwiki-source-5f5b95b3d6a215fa02ceb945
    resource: repo://.env.example
  - id: openwiki-source-6ae244f79c5e27a2b1f08014
    resource: repo://components.json
  - id: openwiki-source-276795f6d5ad19adb078c64e
    resource: repo://eslint.config.js
  - id: openwiki-source-50a18d054b596a7ed0eeffb0
    resource: repo://next.config.ts
  - id: openwiki-source-fbccae247df2d4fe4a532ee8
    resource: repo://postcss.config.js
  - id: openwiki-source-d9e1ff9416fc7e39bc47b9bb
    resource: repo://src/app/(dashboard)/layout.tsx
  - id: openwiki-source-8d46e58add4326fa55236087
    resource: repo://src/app/layout.tsx
  - id: openwiki-source-8d0f263ceba491caec34db6c
    resource: repo://src/app/providers.tsx
  - id: openwiki-source-a7c7d558f70edbb3171b87ab
    resource: repo://src/lib/api-client.ts
  - id: openwiki-source-204fc5ae728b15ba9daed4a2
    resource: repo://src/lib/env.ts
  - id: openwiki-source-f34ac1e549d94dc3ac475ae4
    resource: repo://src/proxy.ts
  - id: openwiki-source-e745bb5faf82e54620afb942
    resource: repo://src/stores/authStore.ts
  - id: openwiki-source-98d5ddb014a0fd4d678f6f2a
    resource: repo://tsconfig.json
generated: { by: "openwiki/0.4.3", at: "2026-08-28T08:47:49.990Z" }
---
# Architecture

## Route Groups

The app uses three parenthesized route groups (directories that organize code without affecting URLs):

| Group | Purpose | Key Routes |
|-------|---------|------------|
| `(auth)` | Login / registration | `/login`, `/register` |
| `(onboarding)` | New user setup | `/cabinet`, `/processing`, `/wb-token` |
| `(dashboard)` | All authenticated app pages | `/dashboard`, `/analytics/*` (30+ sub-routes), `/orders/*`, `/shipments/*`, `/supplies/*`, `/products`, `/cogs/*`, `/finances`, `/communications`, `/settings/*`, `/monitor`, `/monitoring`, `/moysklad`, `/automation/*` |

Root `/` is a hydration-aware entry (`src/app/page.tsx`): it renders a named loading state until the Zustand `persist` runtime proves rehydration (`persist.hasHydrated()` / `onFinishHydration()`), then `router.replace`s **exactly once** to `/dashboard` when `isAuthenticated && token`, otherwise `/login`. A 5-second bounded hydration failure renders a storage-hydration error state (`PageState`) with a caller-triggered document reload; no navigation happens before hydration resolves.

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

The dashboard layout (`src/app/(dashboard)/layout.tsx`) is a **client component** that acts as an auth fallback gate: checks Zustand store hydration, and if no token exists in localStorage, clears the `auth-token` cookie and redirects to `/login`. This prevents redirect loops that would occur if only middleware guarded the route. Story 167.1 unified this protected AppShell: the layout resolves **one** canonical navigation model via `resolveNavigationItems({ role, urgentCount })` (`src/components/custom/sidebar-navigation.ts`) and passes the same ordered entries to both the desktop `Sidebar` and the mobile `MobileSidebarSheet`, so labels, hrefs, icons, role visibility, and the supply-planning badge cannot drift between renderers. The layout also renders a skip-link to `#main-content` and detects cross-tab logout (storage event on the auth key) before deciding to redirect.

Source: `src/app/layout.tsx`, `src/app/providers.tsx`, `src/app/(dashboard)/layout.tsx`, `src/components/custom/sidebar-navigation.ts`

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
`src/proxy.ts` (renamed from `middleware.ts` for Next.js 16) reads the `auth-token` cookie (set client-side after login) and validates the JWT structure. Protected routes without a valid token redirect to `/login` with a `redirect` query param. Authenticated users hitting `/login` or `/register` are redirected to the dashboard (or the `redirect` target).

The authenticated redirect is sanitized by `getSafeAuthRedirect` (`src/proxy.ts`): a `redirect` param is honored only if it starts with a single `/` (protocol-relative `//` is rejected), parses to the **same origin** as the request, and does not itself target `/login` or `/register`; everything else falls back to `/dashboard`. `LoginForm` enforces the same policy client-side before navigating (`isSafeRedirect` in `src/components/custom/LoginForm.tsx`, which additionally rejects backslashes, malformed percent-encoding, and control characters). Next.js 16 renamed the middleware entrypoint from `middleware.ts` to `proxy.ts` and the exported function from `middleware` to `proxy`. Focused tests: `src/proxy.test.ts`.

### Client-side auth store
`src/stores/authStore.ts` — Zustand store with `persist` middleware → localStorage. Stores `token`, `cabinetId`, `user` data. The `auth-token` cookie is mirrored from the store via `setAuthCookie()` in `src/lib/utils.ts` for middleware access.

### Token refresh
`AuthProvider` (`src/components/auth/AuthProvider.tsx`) runs `useAuth()` hook for automatic JWT refresh with a 5-minute pre-expiry buffer (`src/lib/auth.ts`).

### Multi-tenant isolation
Cabinet ID (tenant) is injected as `X-Cabinet-Id` header on every API call via the API client. Some endpoints also accept `cabinet_id` in request body.

Isolation also extends into the TanStack Query **cache** (Story 97.5-FE discipline, applied to price recommendations in W3-FE): concrete query keys embed `cabinetId` read from `useAuthStore(auth => auth.cabinetId)`, so switching cabinets can never serve another cabinet's cached rows even though the header would scope the network request. The canonical example is the `queryKeys` factory in `src/hooks/usePriceRecommendations.ts`: `all` stays an unscoped prefix (so `invalidateQueries({ queryKey: queryKeys.all })` in `usePriceRefresh` / `usePricingBasis` keeps prefix-invalidating everything), while `list(cabinetId, params)`, `detail(cabinetId, nmId)`, and `history(cabinetId, nmId, limit)` concretes plus their `lists()`/`details()`/`histories()` group prefixes are cabinet-scoped. The hooks are `enabled` only when `cabinetId` is non-null (idle queryFn, no fetch). Focused isolation suite: `src/hooks/__tests__/price-recommendations-cabinet-isolation.test.ts` (4 cabinets × list/detail/history, 12 keys pairwise distinct, plus single-field param-diff and history-limit axes); unit behavior incl. disabled-null-cabinet cases in `src/hooks/__tests__/usePriceRecommendations.test.ts`.

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

## Design System

The presentation layer is migrating to a layered, semantic design system built on Tailwind v4 and shadcn/ui (Radix). The layers are built in order and consumed strictly downward — later route migrations reuse these foundations rather than restyling:

1. **Semantic tokens** — `src/styles/globals.css` defines the CSS-first Tailwind v4 `@theme` palette (background/foreground, card/popover, brand/primary, destructive, financial-positive/negative/neutral, status-success/warning/error/information/pending, availability, chart series, focus/ring, disabled) plus typography, spacing, radius, shadow, and animation scales for light and dark themes. The `ThemeProvider` (`next-themes`, class-based) toggles these.
2. **Generic shadcn primitives** — `src/components/ui/**` are domain-agnostic wrappers around Radix. They consume semantic tokens only (no hardcoded or light-only palette values) and own accessibility contracts: focus return, `motion-reduce`, ≥44×44 localized close controls, semantic invalid states, and named table scroller regions.
3. **Product compositions** — `src/components/product/` are presentational, route-supplied compositions that own no URL/search/query/state. Six families exist (Stories 166.3–166.8): page context (`PageHeader` with a single `h1`, `Breadcrumbs`, `ContextBar`), metrics/status (`FinancialValue`, `MetricCard`, `DataAvailability`, `StatusBadge`), filters (`FilterToolbar`), tables (`ResponsiveTable` family), charts (`ChartFrame`/`ChartEvidence` family), and page states (`PageState`, `AsyncOperationStatus`, `BulkResultSummary`, `ContextualSplitView` — the root entry and global `not-found.tsx` already consume `PageState`).
4. **Domain-shared / route-owned UI** — Epics 167–173 are migrating the 76 `page.tsx` routes onto these layers one BMAD Story at a time (Epic 167 closed; Epic 168 analytics migration in progress).

See [Design System](design-system.md) for the token contract, primitive hardening, product-composition APIs, and the Epics 166–174 migration program.

## Environment Configuration

`src/lib/env.ts` exposes a single `env` object reading `NEXT_PUBLIC_*` variables at build time: `apiUrl` (`NEXT_PUBLIC_API_URL`, defaulting to the local backend at `http://localhost:3000`), `appName` / `appVersion`, boolean flags `enableAnalytics`, `enableWebSocket`, `enableDevTools` (each `=== 'true'`), plus `isProduction`/`isDevelopment`. `env.enableDevTools` conditionally mounts `ReactQueryDevtools` inside `Providers`, and the API client constructor warns if a production `apiUrl` uses plain `http://` outside localhost.

## Configuration

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config |
| `tsconfig.json` | TypeScript strict mode, `@/` path alias |
| `eslint.config.js` | Flat ESLint config with custom `no-restricted-syntax` for AP#8 |
| `src/styles/globals.css` | Tailwind v4 CSS-first theme — semantic token palette (background, card, brand/primary, financial, status, availability, chart roles), typography/spacing/radius/shadow scales, light + dark themes. The JavaScript `tailwind.config.ts` was removed; see [Design System](design-system.md). |
| `postcss.config.js` | `@tailwindcss/postcss` + autoprefixer (Tailwind v4 compiler contract) |
| `components.json` | shadcn/ui CLI metadata aligned to Tailwind v4 (`config: ""`, CSS variables, new-york style) |
| `.env.example` | Environment variable names (see [Testing & Operations](testing-and-ops.md)) |
