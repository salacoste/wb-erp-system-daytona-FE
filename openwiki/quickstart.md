---
type: Reference
title: "WB ERP System — Frontend OpenWiki"
description: "Entry page for the WB ERP frontend wiki: current delivery and migration status, stack overview, quick local commands, and a task-routing map to the domain pages."
tags: [quickstart, overview, delivery-status, commands]
verified:
  - by: openwiki/0.4.3
    at: 2026-09-01T08:47:48.765Z
sources:
  - id: openwiki-source-a85a3a5994b0c404049b89d3
    resource: repo://_bmad-output/implementation-artifacts/174-3-expanded-scope-register.md
  - id: openwiki-source-c278c3812722174099a1e7a5
    resource: repo://_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md
  - id: openwiki-source-61e0371a06d746820bb42371
    resource: repo://.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md
  - id: openwiki-source-2b487a3c9bd5b7b67a02a1a8
    resource: repo://e2e/fixtures/story-174-3/execution-manifest.json
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-02888236bcd9b1d1d663f151
    resource: repo://scripts/generate-story-174-3-scope-register.mjs
  - id: openwiki-source-8f2fb2dd82c28c75ce354113
    resource: repo://scripts/run-story-174-3-real-browser-zoom.mjs
  - id: openwiki-source-1bbe76f55f6efa9d2465f6c5
    resource: repo://scripts/run-story-174-3-state-evidence.mjs
generated: { by: "openwiki/0.4.3", at: "2026-09-01T08:47:48.765Z" }
---

# WB ERP System — Frontend OpenWiki

Financial analytics dashboard for Wildberries marketplace sellers. Built with Next.js 16 App Router, TypeScript, and a Russian-locale UI.

## Current Delivery Status

- Epic 127 is done.
- Epic 162 is done.
- Epics 163 and 164 are done.
- Epic 165: stories 165.1-165.3 are done; 165.4 and 165.5 are deferred (backend-gated).

Development and validation are **local-only**: there is no deployment target or production platform. The frontend runs on `http://localhost:3100`; `NEXT_PUBLIC_API_URL` selects the backend origin (default `http://localhost:3000`). These statuses mirror the **Current Delivery Status** section in `README.md`.

## Epics 166–174 Migration Snapshot

Canonical snapshot sources: the consolidated status/debt registry (`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`, snapshot **2026-08-31**), per-story execution state in `_bmad-output/implementation-artifacts/sprint-status.yaml`, and the Story 174.3 execution plan (`.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md`).

As of the current snapshot, the shadcn full-UI migration program stands at **91/94 canonical stories**:

- Epics 166 (foundation, 8/8), 167 (AppShell/auth, 9/9), 168 (analytics core, 11/11), 169 (operational analytics, 15/15), 170 (marketing analytics, 7/7), 171 (AI/forecast analytics, 9/9), 172 (core business operations, 17/17), and **173 (13/13)** are all CLOSED.
- Epic 174 (5 stories) is **IN PROGRESS at 2/5**: **174.1** route-ledger/plan parity (`check-shadcn-migration-parity.mjs` proves 94 BMAD stories = 94 OMX plans and 76 routes = 76 ledger rows) and **174.2** legacy-UI removal + design-system boundary (`check-shadcn-ui-boundary.mjs` ratchet 523) are done and cleaned.
- **Story 174.3 (complete accessibility, responsive, theme, and visual verification) is in active remediation, not "next".** Commit `82465fbf96f2319116c1cad101044e8004a52cc3` received three independent REQUEST-CHANGES/REJECT verdicts; merge and cleanup are blocked until every accepted finding is repaired, validation is regenerated on a new immutable commit, and three fresh independent reviewers return APPROVE on that same unchanged SHA (zero unresolved P0–P2, no material P3). Any content change restarts the gate. The accepted remediation scope is the generated `_bmad-output/implementation-artifacts/174-3-expanded-scope-register.md` (~424 files across route-owner remediation, story evidence, shared-owner remediation, foundation/AppShell coordination, and documentation classes) — the register, not the historical three-file bootstrap, is the current file-level coordination authority. After 174.3: 174.4 (functional/backend regression) and 174.5 (docs/cleanup) → 94/94.
- The repo-owned registry records the full Vitest floor after Story 174.2 as **19,118 passed / 0 failed across 1,234 files** (lint/tsc clean, ui-boundary ratchet 523); the Story 174.3 branch additionally committed an execution manifest (`e2e/fixtures/story-174-3/execution-manifest.json`) recording the matrix executions behind the remediation. All 76 route-owning stories are implemented while all 76 route-ledger rows **intentionally remain `planned`** — Story 174.5 owns the final `verified` transitions.

For the full per-story status ledger, the route ledger, and the **Story 174.3 evidence pipeline** (execution manifest, fail-closed manifest reader, AST-based execution-requirements extraction, contract tests), see [Migration Program (Epics 166–174)](migration-program.md). The design contract itself (tokens, primitives, composition families, the WCAG 2.2 AA inclusive visual matrix) is documented in [Design System](design-system.md).

## Overview

| Aspect | Detail |
|--------|--------|
| **Stack** | Next.js 16 + TypeScript 5 + Tailwind CSS + shadcn/ui (Radix) |
| **Server State** | TanStack Query v5 (Next.js server page/layout wrappers coexist with client components; interactive data fetching is client-side) |
| **Client State** | Zustand (auth, dashboard widgets, rate-limit, polling) |
| **Testing** | Vitest + MSW units, Playwright E2E (preflight-gated) with axe, the story-174-3 inclusive visual matrix and evidence runners, outbound network guards, privacy/diagnostic-capture checks |
| **Backend** | REST API via `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`; do not append `/api` — frontend modules call `/v1/...` routes themselves) |
| **Port** | 3100 (dev and `npm run start`) |

**Core Features**: Weekly financial analytics, COGS management with versioning, margin analysis, storage/advertising metrics, price calculator, buyout/return analytics, liquidity analysis with trends, unit economics, FBS/FBO order analytics with WB shelf-life management, account balance + financial documents (NEW-7), seller communications with gated write-back (NEW-2), AI forecasting, Telegram notifications, multi-cabinet (tenant) support.

## Quick Commands

Local validation (from `README.md` and `package.json`):

```bash
cp .env.example .env.local   # once, then: npm install
npm run dev                    # Dev server on :3100
npm run build                  # Production build (build+start = local smoke, still :3100)
npm run lint                   # ESLint with --max-warnings 0 (zero-warning policy, Story 164.4)
npm run type-check             # tsc --noEmit
npm test -- --run              # Vitest unit tests
npm run test:coverage          # Vitest with coverage
npm run test:privacy           # Privacy console + diagnostic-capture-policy tests (node:test)
npm run check:privacy          # Privacy console guard (PII-adjacent files)
npm run format:check           # Prettier check
npm run check:docs             # Doc-citation drift gate
npm run check:anti-pattern-8-normalizer  # AP#8 normalizer ratchet
```

Browser tests require the backend on `localhost:3000` (backend owns its Owner seed — the frontend has no database-seeding script) and the frontend on `localhost:3100`; copy `.env.e2e.example` to `.env.e2e` first:

```bash
npm run test:e2e:preflight     # Config + service diagnostics only (no browser)
npm run test:e2e               # Bounded read-only orders smoke on Chromium (preflight-gated)
npm run test:e2e:full          # Full Playwright suite through the same preflight
```

Migration and Story 174.3 gates have **no `npm run` alias** — invoke them directly (see [Conventions & Quality Gates](conventions-and-quality.md) and [Testing & Operations](testing-and-ops.md)):

```bash
node scripts/check-shadcn-migration-parity.mjs   # Story 174.1: BMAD ↔ route ledger ↔ OMX plan parity (94 = 94, 76 = 76)
node scripts/check-shadcn-ui-boundary.mjs        # Story 174.2: design-system boundary ratchet (baseline 523, fails only on increase)
node scripts/run-story-174-3-state-evidence.mjs  # Story 174.3: fail-closed state-evidence runner (modes: --owner-units / --owner-browsers / --dedicated-routes / --owners / --defaults / --all)
node scripts/run-story-174-3-real-browser-zoom.mjs  # Story 174.3: headed macOS real-browser 200% zoom orchestrator (all 76 routes × both themes)
node scripts/generate-story-174-3-scope-register.mjs  # Story 174.3: regenerate the expanded-scope register from origin/main
```

## Task Routing

| Task | Go to |
|------|-------|
| Route migration work (Stories 166–174, route ledger, worktrees, handoffs), the Story 174.3 evidence pipeline (execution manifest, contract tests, scope register) | [Migration Program (Epics 166–174)](migration-program.md) |
| Token / component / primitive work, design-system boundary canon (`LEGACY_PALETTE` / `CONTEXTUAL_HEX`), the WCAG 2.2 AA inclusive visual matrix | [Design System](design-system.md) |
| App structure / route groups / auth / environment & API configuration | [Architecture](architecture.md) |
| Gate / baseline / ratchet work, including `check-shadcn-ui-boundary.mjs` (ratchet 523) and `check-shadcn-migration-parity.mjs` self-suites | [Conventions & Quality Gates](conventions-and-quality.md) |
| Test / e2e / automation work, including the story-174-3 e2e runner tooling (`e2e/support/story-174-3-runner-*.ts`, real-browser-zoom and state-evidence runners, fixture corpus under `e2e/fixtures/story-174-3/`) | [Testing & Operations](testing-and-ops.md) |

## Wiki Map

- **[Architecture](architecture.md)** — route groups, layout/provider hierarchy, client-side data fetching, auth, and the canonical configuration table.
- **[Design System](design-system.md)** — Tailwind v4 semantic tokens, hardened shadcn primitives, composition families, enforced design-system boundary, and the Story 174.3 inclusive visual contract.
- **[Migration Program (Epics 166–174)](migration-program.md)** — per-epic/story status ledger, route ledger, parity validation, Story 174.3 remediation and evidence pipeline, orchestration process.
- **[Conventions & Quality Gates](conventions-and-quality.md)** and **[Testing & Operations](testing-and-ops.md)** — coding standards/gates and the testing strategy with the story-174-3 evidence runners.
