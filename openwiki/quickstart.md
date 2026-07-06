# Quickstart — WB Repricer Frontend

## What is this project?

**WB Repricer System — Frontend** is a financial analytics dashboard (ERP) for Wildberries marketplace sellers, written in Russian (`lang="ru"`). It provides weekly financial analytics, COGS (cost of goods sold) management with versioning, margin analysis, storage/advertising metrics, a price calculator, Telegram notification preferences, and supply planning.

This repository is the **frontend** half of a monorepo (`wb-erp-system-daytona`). The backend REST API runs separately on `localhost:3000` and serves endpoints under `/v1/`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict) |
| UI Components | shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS 4 |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| Forms | React Hook Form 7 + Zod 4 |
| Charts | Recharts 3 |
| Unit Tests | Vitest + Testing Library + MSW v2 |
| E2E Tests | Playwright |
| Process Manager | PM2 |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment (defaults are provided, .env.local is optional)
cp .env.example .env.local

# Start dev server on port 3100
npm run dev

# Production
npm run build
npm run start          # also port 3100
```

**Test credentials (dev):** `test@test.com` / `Russia23!`

## Key Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3000` | Backend REST API (no `/api` suffix) |
| `NEXT_PUBLIC_APP_NAME` | No | `WB Repricer System` | Display name |
| `NEXT_PUBLIC_ENABLE_DEV_TOOLS` | No | unset | React Query DevTools |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | No | unset | Mixpanel analytics |
| `NEXT_PUBLIC_ENABLE_WEBSOCKET` | No | unset | WebSocket feature flag |

See `.env.example` for the full list.

## Documentation Sections

| Section | Page | What it covers |
|---------|------|----------------|
| **Architecture** | [architecture.md](architecture.md) | App Router structure, component layers, API client, state management, auth flow |
| **Development** | [development.md](development.md) | npm scripts, env setup, quality gates, file-size rules |
| **Domain Features** | [domain-features.md](domain-features.md) | Analytics, COGS, orders, supplies, notifications, AI/forecast |
| **Testing** | [testing.md](testing.md) | Vitest, Playwright, mutation guards, CI pipeline |
| **Operations** | [operations.md](operations.md) | PM2 process management, deployment scripts, troubleshooting |

## Where to Look First

- **Routes**: `src/lib/routes.ts` — all application route constants
- **API client**: `src/lib/api-client.ts` — singleton HTTP client with auth/cabinet header injection
- **Auth store**: `src/stores/authStore.ts` — Zustand store with localStorage persistence
- **App layout**: `src/app/layout.tsx` — root layout with ThemeProvider, Providers, AuthProvider
- **Dashboard layout**: `src/app/(dashboard)/layout.tsx` — auth guard, Sidebar + Navbar

## Existing Documentation

The repository has extensive existing docs under `docs/`:
- `docs/prd.md` — Master Product Requirements Document
- `docs/front-end-spec.md` — Full frontend specification (design system, personas, accessibility)
- `docs/front-end-architecture.md` — Technical architecture
- `docs/api-integration-guide.md` — Full endpoint catalog and integration patterns
- `docs/EPICS-AND-STORIES-TRACKER.md` — Single source of truth for epic/story status
- `docs/qa/gates/` — ~80 per-story quality gate YAML files

Also see the root-level guides: `SETUP.md`, `TROUBLESHOOTING.md`, `CONDUCTOR-SETUP.md`, `PM2-TROUBLESHOOTING.md`, and the `README.md` (76 KB, comprehensive).
