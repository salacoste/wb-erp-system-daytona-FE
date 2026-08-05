---
type: "Project Overview"
title: "WB ERP System — Frontend OpenWiki"
description: "Financial analytics dashboard for Wildberries (WB) marketplace sellers. Built with Next.js App Router, TypeScript, Tailwind, and a Russian-locale UI. Entry point for frontend OpenWiki documentation."
---
# WB ERP System — Frontend OpenWiki

Financial analytics dashboard for Wildberries marketplace sellers. Built with Next.js 16 App Router, TypeScript, and a Russian-locale UI.

## Overview

| Aspect | Detail |
|--------|--------|
| **Stack** | Next.js 16 + TypeScript 5 + Tailwind CSS + shadcn/ui (Radix) |
| **Server State** | TanStack Query v5 (all pages are client components) |
| **Client State** | Zustand (auth, dashboard widgets, rate-limit, polling) |
| **Testing** | Vitest (~1050 unit test files, MSW) + Playwright E2E (~83 specs) + outbound network guards + privacy/diagnostic-capture checks |
| **Backend** | REST API via `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`) |
| **Port** | 3100 (dev and prod) |

**Core Features**: Weekly financial analytics, COGS management with versioning, margin analysis, storage/advertising metrics, price calculator, buyout/return analytics, liquidity analysis, unit economics, FBS/FBO order analytics with WB shelf-life (expiration) management, AI forecasting, Telegram notifications, multi-cabinet (tenant) support.

## Quick Commands

```bash
npm run dev                    # Dev server on :3100
npm run build                  # Production build
npm run lint                   # ESLint (max-warnings: 112)
npm run type-check             # tsc --noEmit
npm test                       # Vitest unit tests
npm run test:e2e               # Playwright E2E
npm run check:privacy          # Privacy console guard (PII-adjacent files)
npm run test:privacy           # Privacy console + diagnostic-capture-policy unit tests
npm run check:docs             # Doc-citation drift gate
npm run check:anti-pattern-8-normalizer  # AP#8 normalizer ratchet
```

## Documentation Sections

- **[Architecture](architecture.md)** — Route groups, layout/provider hierarchy, client-side data fetching, auth proxy, deployment.
- **[API Layer & Normalizers](api-and-normalizers.md)** — API client singleton, Boundary Normalizer Pattern, Anti-Pattern #8 null semantics, CSV export.
- **[Domain Logic](domain-logic.md)** — Financial formulas (theoretical profit, margin, liquidity, unit economics), ISO week / Moscow timezone, profitability thresholds.
- **[Conventions & Quality Gates](conventions-and-quality.md)** — File size limits, ESLint enforcement, Defensive Frontend Principle, ratchet scripts, toolchain pinning, two-pass review discipline.
- **[Testing & Operations](testing-and-ops.md)** — Vitest + MSW, Playwright E2E, outbound network guards (Vitest + Playwright + static boundary), privacy console and diagnostic-capture guards, frontend verification orchestrator, local validation, environment variables.

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
| Outbound network guard (Vitest) | `src/test/outbound-network-guard.ts`, `src/test/network-guard-bootstrap.ts`, `test-utils/outbound-network-policy.ts` |
| Playwright network guard + static boundary | `e2e/fixtures/playwright-network-guard.ts`, `src/test/playwright-static-boundary.ts` |
| Frontend verification orchestrator | `scripts/story-128-10/verify-frontend.mjs`, `scripts/story-128-10/frontend-command-manifest.json` |
| Agent guidelines | `CLAUDE.md`, `CLAUDE-PATTERNS.md`, `CLAUDE-ANTI-PATTERNS.md` |
| Epics & stories tracker | `docs/EPICS-AND-STORIES-TRACKER.md` |
| API integration guide | `docs/api-integration-guide.md` |

## Backlog

| Area | Source Anchor | Reason Deferred |
|------|---------------|-----------------|
| Analytics module deep-dives (30+ sub-routes) | `src/app/(dashboard)/analytics/*/` | Too many independent modules; each follows the same normalizer→hook→component pattern documented in [API Layer & Normalizers](api-and-normalizers.md) |
| Component library inventory | `src/components/` | Large surface; shadcn/ui base + custom feature components; not architecturally load-bearing for wiki navigation |
| docs/ directory structure | `docs/epics/`, `docs/stories/`, `docs/request-backend/` | 211 resolved backend requests; primarily project-management artifacts, not code documentation |
| Backlog task tracking | `backlog/tasks/` | 55 tracked tasks via Backlog.md CLI; process artifacts, not source code |
| Zustand store details | `src/stores/` | 5 stores; architecture covered in [Architecture](architecture.md); individual store APIs are self-documenting |
| OMX story-plan orchestration | `scripts/manage-omx-story-plans.mjs`, `.omx/plans/`, `docs/process/omx-story-worktree-orchestrator-prompt.md` | Process/planning tooling for epic 162–165 story plans; not runtime source |
