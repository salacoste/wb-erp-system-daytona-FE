---
type: "Reference"
title: "WB ERP System — Frontend OpenWiki"
openwiki_generated: true
verified:
  - by: openwiki/0.4.3
    at: 2026-08-31T08:47:49.410Z
sources:
  - id: openwiki-source-89e2a6b1ae97c68779084212
    resource: repo://_bmad-output/implementation-artifacts/sprint-status.yaml
  - id: openwiki-source-c278c3812722174099a1e7a5
    resource: repo://_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md
  - id: openwiki-source-a2371d6362e5db4bc834ad03
    resource: repo://CLAUDE.md
  - id: openwiki-source-c514ae3fa8388a3c90d10274
    resource: repo://docs/HANDOFF-2026-08-30-TEAM-HANDOFF-173.13-EPILOGUE-174-FULL-DEBT.md
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "openwiki/0.4.3", at: "2026-08-31T08:47:49.410Z" }
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

Canonical snapshot sources: the consolidated status/debt registry (`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`, snapshot **2026-08-31**), per-story execution state in `_bmad-output/implementation-artifacts/sprint-status.yaml`, and the team handoff `docs/HANDOFF-2026-08-30-TEAM-HANDOFF-173.13-EPILOGUE-174-FULL-DEBT.md` (updated 2026-08-31 with the 173.13/174.1/174.2 closeouts; `main` after Story 174.2 PR #372 on base `fbdab2da`).

As of the 2026-08-31 snapshot, the shadcn full-UI migration program stands at **91/94 canonical stories**:

- Epics 166 (foundation, 8/8), 167 (AppShell/auth, 9/9), 168 (analytics core, 11/11), 169 (operational analytics, 15/15), 170 (marketing analytics, 7/7), 171 (AI/forecast analytics, 9/9), 172 (core business operations, 17/17), and **173 are all CLOSED**.
- Epic 173 closed **13/13**: settings 173.1–173.7, shipments 173.8–173.11 (list, detail, 173.10 box types, 173.11 SKU packaging), supplies list 173.12, and Supply Detail 173.13 (PRs #365/#366/#367).
- Epic 174 (5 stories) is **IN PROGRESS at 2/5**: **174.1** route-ledger/plan parity is done (feature PR #369, exact-five closeout #370, lifecycle PR #371 — the `check-shadcn-migration-parity.mjs` validator proves 94 BMAD stories = 94 OMX plans and 76 routes = 76 ledger rows), and **174.2** legacy-UI removal + design-system boundary enforcement is done (PR #372: 65 proven-dead deletions, `check-shadcn-ui-boundary.mjs` ratchet 523, classification manifest). **NEXT = Story 174.3** (a11y/visual), then 174.4 (functional/backend regression) and 174.5 (docs/cleanup) → 94/94.
- The full Vitest floor is **19,118 passed / 0 failed across 1,234 files** after exact dead-test deletion (−756) in Story 174.2; the ui-boundary ratchet baseline is 523 and lint/tsc remain clean.
- All 76 route-owning stories are implemented while all 76 route-ledger rows **intentionally remain `planned`** — Story 174.5 owns the final `verified` transitions.

Full per-story status, the story pipeline, the route ledger, and the orchestration/handoff process live in [Migration Program (Epics 166–174)](migration-program.md). The design contract itself (tokens, primitives, composition families, boundary enforcement) is documented in [Design System](design-system.md).

## Overview

| Aspect | Detail |
|--------|--------|
| **Stack** | Next.js 16 + TypeScript 5 + Tailwind CSS + shadcn/ui (Radix) |
| **Server State** | TanStack Query v5 (Next.js server page/layout wrappers coexist with client components; interactive data fetching is client-side) |
| **Client State** | Zustand (auth, dashboard widgets, rate-limit, polling) |
| **Testing** | Vitest (full floor 19,118 passed / 0 failed / 1,234 files, MSW) + Playwright E2E + outbound network guards + privacy/diagnostic-capture checks |
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

Two migration gates have **no `npm run` alias** — invoke them directly (see [Conventions & Quality Gates](conventions-and-quality.md) and [Testing & Operations](testing-and-ops.md)):

```bash
node scripts/check-shadcn-migration-parity.mjs   # Story 174.1: BMAD ↔ route ledger ↔ OMX plan parity (94 = 94, 76 = 76)
node scripts/check-shadcn-ui-boundary.mjs        # Story 174.2: design-system boundary ratchet (baseline 523, fails only on increase)
```

## Task Routing

| Task | Go to |
|------|-------|
| Route migration work (Stories 166–174, route ledger, worktrees, handoffs) | [Migration Program (Epics 166–174)](migration-program.md) |
| Token / component / primitive work, design-system boundary canon (`LEGACY_PALETTE` / `CONTEXTUAL_HEX`) | [Design System](design-system.md) |
| App structure / auth / environment / API configuration | [Architecture](architecture.md) |
| Gate / baseline / ratchet work, including `check-shadcn-ui-boundary.mjs` (ratchet 523) and `check-shadcn-migration-parity.mjs` self-suites | [Conventions & Quality Gates](conventions-and-quality.md) |
| Test / e2e / automation work, parity & boundary script `node:test` self-suites and their Vitest exclusions | [Testing & Operations](testing-and-ops.md) |

## Wiki Map

- **[Architecture](architecture.md)** — route groups, auth proxy, environment/API configuration.
- **[Design System](design-system.md)** — Tailwind v4 semantic tokens, hardened shadcn primitives, composition families, enforced design-system boundary.
- **[Migration Program (Epics 166–174)](migration-program.md)** — per-epic/story status ledger, route ledger, parity validation, orchestration process.
- **[Conventions & Quality Gates](conventions-and-quality.md)** — file size limits, ESLint enforcement, Defensive Frontend Principle, ratchet scripts, presentation-source-contract pattern, toolchain pinning.
- **[Testing & Operations](testing-and-ops.md)** — Vitest + MSW, Playwright E2E with preflight/handshake, outbound network guards, privacy guards, local validation, OpenWiki workflow.
