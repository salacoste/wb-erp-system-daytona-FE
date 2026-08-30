---
type: "Project Overview"
title: "WB ERP System — Frontend OpenWiki"
description: "Financial analytics dashboard for Wildberries (WB) marketplace sellers. Built with Next.js App Router, TypeScript, Tailwind, and a Russian-locale UI. Entry point for frontend OpenWiki documentation."
sources:
  - id: openwiki-source-89e2a6b1ae97c68779084212
    resource: repo://_bmad-output/implementation-artifacts/sprint-status.yaml
  - id: openwiki-source-c278c3812722174099a1e7a5
    resource: repo://_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md
  - id: openwiki-source-3ff50b7610374b28cb2b4cf5
    resource: repo://_bmad-output/planning-artifacts/shadcn-route-ledger.md
  - id: openwiki-source-d00ac2b01a56b9dfd3ba2359
    resource: repo://docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-561c5f4bcf455a8137d695ec
    resource: repo://src/app/(dashboard)/finances/components/DocumentsTable.tsx
  - id: openwiki-source-9e71a052a2764709de7ad2bc
    resource: repo://src/app/(dashboard)/finances/page.tsx
  - id: openwiki-source-b4b6a5a03fd28d4ece7a5233
    resource: repo://src/app/(dashboard)/settings/components/SettingsNav.tsx
  - id: openwiki-source-0f7d9f90eda573afa4d28051
    resource: repo://src/app/(dashboard)/settings/layout.tsx
  - id: openwiki-source-a23872cac5b4aca0b8805092
    resource: repo://src/lib/api/shipment-cost/index.ts
  - id: openwiki-source-3f47509f929df39271256b73
    resource: repo://src/lib/api/shipment-cost/shipments-api.ts
  - id: openwiki-source-002f0ac48988e91bf3fbcbac
    resource: repo://src/lib/route-helpers.ts
  - id: openwiki-source-0d56172f9421afb20759e105
    resource: repo://src/lib/routes.ts
generated: { by: "openwiki/0.4.3", at: "2026-08-30T08:47:56.434Z" }
verified:
  - by: openwiki/0.4.3
    at: 2026-08-30T08:47:56.434Z
---

# WB ERP System — Frontend OpenWiki

Financial analytics dashboard for Wildberries marketplace sellers. Built with Next.js 16 App Router, TypeScript, and a Russian-locale UI.

## Current Delivery Status

- Epic 127 is done.
- Epic 162 is done.
- Epics 163 and 164 are done.
- Epic 165: stories 165.1-165.3 are done; 165.4 and 165.5 are deferred (backend-gated).

Development and validation are **local-only**: there is no deployment target or production platform. These statuses mirror the **Current Delivery Status** section in `README.md`.

## Epics 166–174 Migration Snapshot

Canonical snapshot sources: the consolidated status/debt registry (`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`, snapshot **2026-08-30**) and per-story execution state in `_bmad-output/implementation-artifacts/sprint-status.yaml`. The handoff `docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md` (updated through the 2026-08-30 snapshot at `main` = `cd05d31c`) is the single continuation entry point (it supersedes the obsolete 2026-08-27 handoff).

As of the 2026-08-30 snapshot (`main` = `cd05d31c`, after Story 173.9 exact-five documentation PR #354), the shadcn full-UI migration program stands at **85/94 canonical stories**:

- Epics 166 (foundation), 167 (AppShell/auth), 168 (analytics core), 169 (operational analytics, 15/15), 170 (marketing analytics, 7/7), 171 (AI/forecast analytics, 9/9), and **172 are all CLOSED**. Epic 172 closed **17/17** (172.1–172.17, through Product Management PRs #325/#326).
- Epic 173 (settings/shipments/supplies) is **IN PROGRESS at 9/13**: Stories 173.1–173.7 (settings shell + overview, backfill, cabinet, expenses, notifications, tariffs, tax settings), 173.8 shipments list (#350/#351/#352), and 173.9 shipment detail (#353/#354) are all done. **NEXT = Story 173.10 (Shipment Box Types)**, after the narrow Story 173.9 auxiliary lifecycle-record lane merges and cleans; remaining backlog is 173.10–173.13 with 173.12 owning supplies.
- Epic 174 (5 stories) is the strict final consolidation chain (174.1 route-ledger parity → 174.5) and runs only after 166–173.
- The recorded Vitest floor was raised to **19,733 passed / 0 failed / 1,249 files** after Story 173.9; the route ledger still maps all 76 source routes with all rows `planned` (174.1 validates, 174.5 finalizes).

Full per-story status, the story pipeline, the route ledger, and the orchestration/handoff process live in [Migration Program (Epics 166–174)](migration-program.md). The design contract itself (tokens, primitives, composition families) is documented in [Design System](design-system.md).

## Overview

| Aspect | Detail |
|--------|--------|
| **Stack** | Next.js 16 + TypeScript 5 + Tailwind CSS + shadcn/ui (Radix) |
| **Server State** | TanStack Query v5 (Next.js server page/layout wrappers coexist with client components; interactive data fetching is client-side) |
| **Client State** | Zustand (auth, dashboard widgets, rate-limit, polling) |
| **Testing** | Vitest (1,229 unit test files / 19,489 tests floor, MSW) + Playwright E2E + outbound network guards + privacy/diagnostic-capture checks |
| **Backend** | REST API via `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`) |
| **Port** | 3100 (dev and prod) |

**Core Features**: Weekly financial analytics, COGS management with versioning, margin analysis, storage/advertising metrics, price calculator, buyout/return analytics, liquidity analysis with trends, unit economics, FBS/FBO order analytics with WB shelf-life (expiration) management, account balance + financial documents (NEW-7), seller communications — feedbacks, questions, chats, claims, pinned reviews with gated write-back (NEW-2), AI forecasting, Telegram notifications, multi-cabinet (tenant) support.

## Quick Commands

```bash
npm run dev                    # Dev server on :3100
npm run build                  # Production build
npm run lint                   # ESLint (0 errors, 0 warnings — zero-warning policy, Story 164.4)
npm run type-check             # tsc --noEmit
npm test                       # Vitest unit tests
npm run test:e2e               # Playwright E2E (bounded read-only smoke, preflight-gated)
npm run test:e2e:full          # Full Playwright E2E suite (same preflight)
npm run test:e2e:preflight     # E2E config + service diagnostics only (no browser)
npm run check:privacy          # Privacy console guard (PII-adjacent files)
npm run test:privacy           # Privacy console + diagnostic-capture-policy unit tests
npm run check:docs             # Doc-citation drift gate
npm run check:anti-pattern-8-normalizer  # AP#8 normalizer ratchet
```

## Task Routing

| Task | Go to |
|------|-------|
| Route migration work (Stories 166–174, including the new settings/shipments coverage, route ledger, worktrees, handoffs) | [Migration Program (Epics 166–174)](migration-program.md) |
| Token / component / primitive work (incl. settings, tariffs-admin, notifications, shipments families) | [Design System](design-system.md) |
| App structure / auth / environment / API configuration | [Architecture](architecture.md) |
| Gate / baseline / convention work | [Conventions & Quality Gates](conventions-and-quality.md) |
| Test / e2e / automation work | [Testing & Operations](testing-and-ops.md) |

Additional orientation:

- **[Architecture](architecture.md)** — Route groups, layout/provider hierarchy, client-side data fetching, auth proxy, environment configuration (`NEXT_PUBLIC_API_URL`), API client singleton and Boundary Normalizer Pattern.
- **[Design System](design-system.md)** — Tailwind v4 semantic token contract, hardened shadcn primitives, and the product-composition families (page context, metrics/status, filters, tables, charts, page states), including the newly migrated settings, tariffs-admin, notifications, and shipments component families.
- **[Conventions & Quality Gates](conventions-and-quality.md)** — File size limits, ESLint enforcement, Defensive Frontend Principle, ratchet scripts, toolchain pinning, two-pass review discipline, and the presentation-source-contract pattern exercised across the migrated settings/shipments pages.
- **[Testing & Operations](testing-and-ops.md)** — Vitest + MSW, Playwright E2E (including the new settings and shipments specs), local E2E preflight + handshake (Story 162.2), outbound network guards, privacy console and diagnostic-capture guards, frontend verification orchestrator, local validation, environment variables.

## Key Source References

| What | Where |
|------|-------|
| Root layout + providers | `src/app/layout.tsx`, `src/app/providers.tsx` |
| Dashboard shell + auth gate | `src/app/(dashboard)/layout.tsx` |
| Auth proxy (Next 16) | `src/proxy.ts` |
| API client singleton | `src/lib/api-client.ts` |
| Normalizer helpers | `src/lib/api/normalizer-helpers.ts` |
| Route constants | `src/lib/routes.ts` |
| Auth store | `src/stores/authStore.ts` |
| Design system — semantic tokens | `src/styles/globals.css`, `src/styles/__tests__/globals-token-contract.test.ts`, `src/styles/__tests__/globals-compiled-contrast.test.ts` |
| Design system — shadcn primitives | `src/components/ui/**`, `src/components/ui/__tests__/primitive-behavior-contracts.test.tsx`, `src/components/ui/__tests__/primitive-semantic-surfaces.test.tsx` |
| Design system — product composition families | `src/components/product/PageHeader.tsx`, `src/components/product/ContextBar.tsx`, `src/components/product/index.ts`, `src/components/product/{metrics,filters,tables,charts,states}/` |
| Protected AppShell navigation model | `src/app/(dashboard)/layout.tsx`, `src/components/custom/sidebar-navigation.ts` (`resolveNavigationItems`), `src/components/custom/Sidebar.tsx`, `src/app/(dashboard)/layout/MobileSidebarSheet.tsx` |
| shadcn/UI migration program (Epics 166–174) | `.omx/plans/shadcn-full-ui-migration-master.md`, `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`, `_bmad-output/planning-artifacts/shadcn-route-ledger.md`, `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`, `docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md` |
| Finances (NEW-7) — balance + documents page | `src/app/(dashboard)/finances/page.tsx`, `src/app/(dashboard)/finances/components/` (`BalanceCard`, `DocumentsBody`, `DocumentsFilters`, `DocumentsPagination`, `DocumentsTable`, `DocumentDownloadButton`), `src/lib/api/finances.ts`, `src/hooks/useFinances.ts` |
| Monitor route | `src/app/(dashboard)/monitor/page.tsx`, `src/app/(dashboard)/monitor/{components,hooks,types}/` |
| Monitoring operations console | `src/app/(dashboard)/monitoring/page.tsx`, `src/app/(dashboard)/monitoring/{components,hooks,types}/`, `src/lib/monitoring-constants.ts` |
| MoySklad integration workspace | `src/app/(dashboard)/moysklad/page.tsx`, `src/app/(dashboard)/moysklad/components/` |
| Orders — overview / FBO / integrity | `src/app/(dashboard)/orders/page.tsx` (+ `OrdersPageStates`, `useOrdersPageState`, `useOrdersFilterHandlers`), `src/app/(dashboard)/orders/fbo/`, `src/app/(dashboard)/orders/integrity/` |
| Product management | `src/app/(dashboard)/products/page.tsx` |
| Settings shell (Story 173.1) | `src/app/(dashboard)/settings/layout.tsx`, `src/app/(dashboard)/settings/components/SettingsNav.tsx`, `src/app/(dashboard)/settings/page.tsx` (shared seven-route shell: backfill, cabinet, expenses, notifications, tariffs, tax) |
| Shipments list + detail (Stories 173.8–173.9) | `src/lib/routes.ts` (`SHIPMENTS.ROOT` / `DETAIL` / `BOX_TYPES` / `SKU_PACKAGING`), `src/lib/route-helpers.ts` (`buildShipmentDetailRoute`), `src/lib/api/shipment-cost/` (`shipments-api.ts`, `shipments-normalizer.ts`, `shipment-calculations-api.ts`, `box-types-api.ts`, `sku-packaging-api.ts`) |
| Communications (NEW-2) — read + write-back | `src/lib/api/communications.ts`, `src/lib/api/communications-writeback.ts`, `src/hooks/useCommunications.ts`, `src/hooks/useCommunicationsWriteback.ts`, `src/hooks/useWritebackJob.ts`, `src/lib/communications-writeback-utils.ts` |
| Finances (NEW-7) — domain helpers | `src/lib/finances/download-blob.ts`, `src/lib/finances/finances-formatters.ts` |
s`, `src/hooks/useWritebackJob.ts`, `src/lib/communications-writeback-utils.ts` |
| Finances (NEW-7) — domain helpers | `src/lib/finances/download-blob.ts`, `src/lib/finances/finances-formatters.ts` |
