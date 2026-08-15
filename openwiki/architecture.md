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
4. **Domain-shared / route-owned UI** — future Epics 167–173 migrate the 76 `page.tsx` routes onto these layers one BMAD Story at a time.

See [Design System](design-system.md) for the token contract, primitive hardening, product-composition APIs, and the Epics 166–174 migration program.

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
