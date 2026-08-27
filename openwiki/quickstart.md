---
type: "Project Overview"
title: "WB ERP System — Frontend OpenWiki"
description: "Financial analytics dashboard for Wildberries (WB) marketplace sellers. Built with Next.js App Router, TypeScript, Tailwind, and a Russian-locale UI. Entry point for frontend OpenWiki documentation."
sources:
  - id: openwiki-source-89e2a6b1ae97c68779084212
    resource: repo://_bmad-output/implementation-artifacts/sprint-status.yaml
  - id: openwiki-source-c278c3812722174099a1e7a5
    resource: repo://_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md
  - id: openwiki-source-808c20fe8494873098c93449
    resource: repo://docs/HANDOFF-2026-08-26-LATE-epic-171-complete-172-recon-ready.md
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "openwiki/0.4.3", at: "2026-08-27T08:47:50.418Z" }
verified:
  - by: openwiki/0.4.3
    at: 2026-08-27T08:47:50.418Z
---
# WB ERP System — Frontend OpenWiki

Financial analytics dashboard for Wildberries marketplace sellers. Built with Next.js 16 App Router, TypeScript, and a Russian-locale UI.

## Current Delivery Status

- Epic 127 is done.
- Epic 162 is done.
- Epics 163 and 164 are done.
- Epic 165: stories 165.1-165.3 are done; 165.4 and 165.5 are deferred (backend-gated).

Development and validation are **local-only**: there is no deployment target or production platform. These statuses mirror the **Current Delivery Status** section in `README.md`.

## Overview

| Aspect | Detail |
|--------|--------|
| **Stack** | Next.js 16 + TypeScript 5 + Tailwind CSS + shadcn/ui (Radix) |
| **Server State** | TanStack Query v5 (Next.js server page/layout wrappers coexist with client components; interactive data fetching is client-side) |
| **Client State** | Zustand (auth, dashboard widgets, rate-limit, polling) |
| **Testing** | Vitest (~1165 unit test files, MSW) + Playwright E2E (~87 specs) + outbound network guards + privacy/diagnostic-capture checks |
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

## Documentation Sections

- **[Architecture](architecture.md)** — Route groups, layout/provider hierarchy, client-side data fetching, auth proxy, environment configuration (`NEXT_PUBLIC_API_URL`).
- **[Design System](design-system.md)** — Tailwind v4 semantic token contract, hardened shadcn primitives, the six product-composition families (page context, metrics/status, filters, tables, charts, page states), and the Epics 166–174 full UI migration program (foundation 166.1–166.8, AppShell/auth Epic 167 closed, analytics-core Epic 168 closed, Epic 169 operational analytics: route work for 169.1–169.13 is merged, with the remaining sequence 169.14 (backend paid-storage contract, in progress) → 169.15 (shared FE boundary) → 169.12 contract closeout, Epic 170 marketing/marketplace analytics closed 7/7 (advertising workspace, campaign bid-recommendation detail, brand margin, brand share, category margin, ad/organic cross-reference, search analytics), **Epic 171 AI/forecast analytics closed 9/9** (171.1–171.9 shipped through PRs #252–#270, closing the `/analytics/models` tree with the evaluations list, SKU-accuracy detail, and performance detail), and **Epic 172 in progress at 4/17** — 172.1 business dashboard (#278), 172.2 automation gallery (#280), 172.3 rules list (#282), and 172.4 rule editor (#285) shipped, migrating the dashboard and the entire automation domain (gallery/list/editor); next is 172.5 COGS Single (owner-coordinated). Epics 173 (backlog) and 174 (final consolidation) follow.
- **[API Layer & Normalizers](api-and-normalizers.md)** — API client singleton, Boundary Normalizer Pattern, Anti-Pattern #8 null semantics, CSV export, communications write-back (async 202 job polling).
- **[Domain Logic](domain-logic.md)** — Financial formulas (theoretical profit, margin, liquidity with trends, unit economics), account finances + document download (NEW-7), seller communications with gated write-back (NEW-2), historical SPP (Story 128.27), ISO week / Moscow timezone, profitability thresholds.
- **[Conventions & Quality Gates](conventions-and-quality.md)** — File size limits, ESLint enforcement, Defensive Frontend Principle, ratchet scripts, toolchain pinning, two-pass review discipline.
- **[Testing & Operations](testing-and-ops.md)** — Vitest + MSW, Playwright E2E, local E2E preflight + handshake (Story 162.2), outbound network guards (Vitest + Playwright + static boundary), privacy console and diagnostic-capture guards, frontend verification orchestrator, local validation, environment variables.

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
| shadcn/UI migration program (Epics 166–174) | `.omx/plans/shadcn-full-ui-migration-master.md`, `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`, `_bmad-output/planning-artifacts/shadcn-route-ledger.md` |
| Communications (NEW-2) — read + write-back | `src/lib/api/communications.ts`, `src/lib/api/communications-writeback.ts`, `src/hooks/useCommunications.ts`, `src/hooks/useCommunicationsWriteback.ts`, `src/hooks/useWritebackJob.ts`, `src/lib/communications-writeback-utils.ts` |
| Finances (NEW-7) — balance + documents | `src/lib/api/finances.ts`, `src/hooks/useFinances.ts`, `src/lib/finances/download-blob.ts`, `src/lib/finances/finances-formatters.ts` |
| Liquidity trends (Story 165.4) | `src/lib/api/liquidity.ts` (`getLiquidityTrends`), `src/app/(dashboard)/analytics/liquidity/components/liquidity-trend-config.ts`, `src/types/liquidity/distribution.ts` |
| Backfill retry (Story 165.5) | `src/lib/api/backfill.ts` (`retryBackfill`), `src/types/backfill.ts` (`BackfillRetrySource`) |
| Pricing basis / repricing (SPP-1 lane) | `src/lib/api/pricing-basis.ts`, `src/hooks/usePricingBasis.ts`, `src/components/custom/PriceBasisBadge.tsx`, `src/app/(dashboard)/analytics/pricing/components/PricingBasisToggle.tsx` — see [Domain Logic — Pricing Basis](domain-logic.md#pricing-basis-repricing-spp-1-lane) |
| Outbound network guard (Vitest) | `src/test/outbound-network-guard.ts`, `src/test/network-guard-bootstrap.ts`, `test-utils/outbound-network-policy.ts` |
| Playwright network guard + static boundary | `e2e/fixtures/playwright-network-guard.ts`, `src/test/playwright-static-boundary.ts` |
| Local E2E preflight + handshake (Story 162.2) | `scripts/e2e-preflight.mjs`, `scripts/e2e-preflight-handshake.mjs`, `scripts/e2e-preflight.test.mjs` |
| Historical SPP server lifecycle (Story 128.27) | `scripts/historical-spp-global-setup.ts`, `src/test/historical-spp-server-lifecycle.ts`, `src/test/historical-spp-server-lifecycle.test.ts` |
| Frontend verification orchestrator (historical, Story 128.10) | `scripts/story-128-10/verify-frontend.mjs`, `scripts/story-128-10/frontend-command-manifest.json`, `scripts/story-128-10/README.md` |
| Agent guidelines | `CLAUDE.md`, `CLAUDE-PATTERNS.md`, `CLAUDE-ANTI-PATTERNS.md` |
| Epics & stories tracker | `docs/EPICS-AND-STORIES-TRACKER.md` |
| API integration guide | `docs/api-integration-guide.md` |

## Backlog

| Area | Source Anchor | Reason Deferred |
|------|---------------|-----------------|
| Analytics module deep-dives (30+ sub-routes) | `src/app/(dashboard)/analytics/*/` | Too many independent modules; each follows the same normalizer→hook→component pattern documented in [API Layer & Normalizers](api-and-normalizers.md). Exception: the pricing module's repricing basis lane is documented in [Domain Logic — Pricing Basis](domain-logic.md#pricing-basis-repricing-spp-1-lane) |
| Component library inventory | `src/components/` | Large surface; shadcn/ui base + custom feature components; the design-system foundation is documented in [Design System](design-system.md) |
| docs/ directory structure | `docs/epics/`, `docs/stories/`, `docs/request-backend/` | 211 resolved backend requests; primarily project-management artifacts, not code documentation |
| Backlog task tracking | `backlog/tasks/` | 55 tracked tasks via Backlog.md CLI; process artifacts, not source code |
| Zustand store details | `src/stores/` | 5 stores; architecture covered in [Architecture](architecture.md); individual store APIs are self-documenting |
| Route migrations (Epics 167–174) | `.omx/plans/shadcn-full-ui-migration-master.md`, `src/app/(dashboard)/**/page.tsx` | Foundation (Epic 166), the full onboarding lane (Epic 167, closed), Epic 168 analytics core (168.1–168.11, closed incl. unit-economics and shared profitability consolidation), and Epic 169 stories 169.1–169.13 (acquiring index/period/transaction detail, buyout, buyout reconciliation, enhanced FBS, FBS stock, funnel, gaps triage, liquidity, returns incl. the unknown-category boundary preface) are merged; 169.12's storage route presentation merged early (PR #227) but stays review-blocked pending the Correct Course sequence — Story 169.14 (backend paid-storage import contract, in progress) then 169.15 (shared FE boundary) then the bounded 169.12 closeout — while 169.13 supply planning is fully done (preface PR #231 preserving unknown risk/reorder enums, PR #232 with `supply-risk-tokens.ts` as the single risk-tier token source). The remaining ledger routes migrate one Story at a time under the master plan: **Epic 170 is complete 7/7** (170.1 advertising workspace, 170.2 campaign bid-recommendation detail, 170.3 brand margin, 170.4 brand share, 170.5 category margin, 170.6 advertising–organic cross-reference, 170.7 search analytics — all merged 2026-08-25/26), and **Epic 171 is complete 9/9** (171.1 AI anomaly triage, 171.2 AI admin model governance, 171.3 AI preferences, 171.4 forecast workspace, 171.5 forecast accuracy, 171.6 model registry/training entry, 171.7 model evaluations list, 171.8 evaluation SKU-accuracy detail, 171.9 model performance detail — shipped through PRs #252–#270, closing the `/analytics/models` tree). **Epic 172 is in progress at 4/17** (172.1 business dashboard #278, 172.2 automation gallery #280, 172.3 rules list #282, 172.4 rule editor #285 — the dashboard and the entire automation gallery/list/editor domain are migrated; next is 172.5 COGS Single, owner-coordinated, followed by 172.6–172.17). Epics 173 (13 stories, backlog) and 174 (5 stories, final consolidation) follow. In parallel, the independent 169 lane still owes 169.14 → 169.15 → 169.12 closeout (12/15 done). Migration is 58/94 canonical Stories (status snapshot: `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`; handoff: `docs/HANDOFF-2026-08-26-LATE-epic-171-complete-172-recon-ready.md`). See [Design System](design-system.md). |
| OMX story-plan orchestration | `scripts/manage-omx-story-plans.mjs`, `.omx/plans/`, `docs/process/omx-story-worktree-orchestrator-prompt.md` | Process/planning tooling for epic 162–165 story plans; not runtime source |
