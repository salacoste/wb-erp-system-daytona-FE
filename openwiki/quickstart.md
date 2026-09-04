---
type: Reference
title: "WB ERP System — Frontend OpenWiki"
description: "Entry page for the WB ERP frontend wiki: current delivery and migration status, stack overview, quick local commands, and a task-routing map to the domain pages."
tags: [quickstart, overview, delivery-status, commands]
sources:
  - id: openwiki-source-c278c3812722174099a1e7a5
    resource: repo://_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md
  - id: openwiki-source-3ff50b7610374b28cb2b4cf5
    resource: repo://_bmad-output/planning-artifacts/shadcn-route-ledger.md
  - id: openwiki-source-3ae3de7eae6af907f9e7299c
    resource: repo://docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md
  - id: openwiki-source-5bfb8400b5daf58813b7ad6a
    resource: repo://docs/HANDOFF-2026-09-03-V15-SESSION2-EXECUTION-AND-REMAINING-BACKLOG.md
  - id: openwiki-source-c66fd1b858bdd6d97345f065
    resource: repo://docs/request-backend/230-auth-refresh-endpoint-missing.md
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
generated: { by: "openwiki/0.5.0", at: "2026-09-03T08:47:55.542Z" }
verified:
  - by: openwiki/0.5.0
    at: 2026-09-03T08:47:55.542Z
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

Canonical snapshot sources: the consolidated status/debt registry (`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`, snapshot **2026-09-02**), the route ledger (`_bmad-output/planning-artifacts/shadcn-route-ledger.md`), and the final handoff `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md`.

**The program is COMPLETE: 94/94 canonical stories, all 9 epics (166–174) CLOSED** (window 2026-08-11 → 2026-09-02). Final base on main: `0d6225acb9abfafa872d2d2ee45f215594edc4e6`.

- Epics 166 (foundation, 8/8), 167 (AppShell/auth, 9/9), 168 (analytics core, 11/11), 169 (operational analytics, 15/15), 170 (marketing analytics, 7/7), 171 (AI/forecast analytics, 9/9), 172 (core business operations, 17/17), 173 (13/13), and 174 (final audit, 5/5) are all CLOSED.
- Epic 174 final audit: **174.1** parity (PRs #369/#370/#371), **174.2** legacy-UI removal + design-system boundary (#372), **174.3** visual/a11y matrix (#374), **174.4** full functional/backend regression (#375/#376), **174.5** docs/repository closeout (PR #379 on base `0d6225ac`).
- **Route-ledger: 76/76 rows `verified` (2026-09-02)** — 54 rows with full evidence chains (implementation, validation, visual/a11y, review, merge, cleanup) plus 22 rows whose cleanup links are closed by a collective live-absence audit; all 76 story PR SHAs are ancestors of `0d6225ac`.
- Final gate floors: Vitest **19,363 passed / 0 failed** (1,270 + 4 files), lint 0/0, tsc 0, build 0 (`npx next build --webpack`), UI boundary ratchet **459 = 459** (3 owner-accepted exceptions after the FeedbackButtons fix), docs-citation baseline 95, locale-percent 4. The parity gate is pinned to `EXPECTED_BASE_SHA = 0d6225ac` and reports base-sha-mismatch on main by design — re-run it in a worktree on the pinned SHA.
- Full delivery contracts live in `_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md`; the program retrospective is `_bmad-output/implementation-artifacts/epic-166-174-program-retrospective-2026-09-02.md`. Residual owner-scoped debt (product bugs PB-1/PB-3, WCAG sweeps, boundary residue) is catalogued in the final handoff §4 and the registry — nothing blocks the program.

For the full per-story status ledger, the route ledger, and the final-verification evidence, see [Migration Program (Epics 166–174)](migration-program.md). The design contract itself (tokens, primitives, composition families, the WCAG 2.2 AA inclusive visual matrix) is documented in [Design System](design-system.md).

## Post-Program Debt Sessions (2026-09-02/03)

After the 94/94 closeout, debt-session waves landed on main (`docs/HANDOFF-2026-09-03-V15-SESSION2-EXECUTION-AND-REMAINING-BACKLOG.md`):

- **D-1 (PB-1, silent cabinet create)** — PR #390: initiation-mint `ensureSessionNonce`, indeterminate recovery-alert, `finishRecoveryOperation` release, and a two-tab nonce-nulling e2e. Test floor 19,363 → 19,421.
- **D-2 (PB-3, reactive 401 refresh)** — backend contract agreed (request-backend #230: `POST /v1/auth/refresh`, sliding rotation, expired JWT never refreshes); frontend implemented on `debt/d2-pb3-reactive-refresh` — api-client interceptor (single-flight refresh, replay ×1), nonce-preserving `refreshToken` in the auth store. Live-verified locally 2026-09-03 (refresh 200 / revocation 401).
- **Boundary waves 1-2** (PRs #394/#395): financial-summary (58 sites) and margin-family (29 sites) palette → semantic tokens; boundary ratchet **459 → 401 → 372** (current baseline in `scripts/.shadcn-ui-boundary-baseline.txt`; 3 owner-accepted exceptions — do not touch).
- Quality wave (PR #392/#393): AcceptanceStatusBadge solid pairs, GapsTable SR dedup, `ScenarioUrgencyTier` single classification source. Vitest floor now **≥ 19,436 / 0** (latest +12 reactive-refresh suite D-2/PB-3, per `CLAUDE.md`); lint 0/0, tsc 0, build 0.

Remaining backlog (boundary waves 3-5 from a 372 residual, `/80` sweep, FE-D1/D3/D5, logger-redact) is prioritized in the session handoff above.

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
node scripts/check-shadcn-ui-boundary.mjs        # Story 174.2: design-system boundary ratchet (final baseline 459, fails only on increase)
node scripts/run-story-174-3-state-evidence.mjs  # Story 174.3: fail-closed state-evidence runner (modes: --owner-units / --owner-browsers / --dedicated-routes / --owners / --defaults / --all)
node scripts/run-story-174-3-real-browser-zoom.mjs  # Story 174.3: headed macOS real-browser 200% zoom orchestrator (all 76 routes × both themes)
node scripts/generate-story-174-3-scope-register.mjs  # Story 174.3: regenerate the expanded-scope register from origin/main
```

## Task Routing

| Task | Go to |
|------|-------|
| Route migration work (Stories 166–174, route ledger, worktrees, handoffs), the Story 174.3 evidence pipeline (execution manifest, contract tests, scope register) | [Migration Program (Epics 166–174)](migration-program.md) |
| Token / component / primitive work, design-system boundary canon (`LEGACY_PALETTE` / `CONTEXTUAL_HEX`), the WCAG 2.2 AA inclusive visual matrix, and the debt-session boundary waves / contrast sweeps (ratchet 372) | [Design System](design-system.md) |
| App structure / route groups / auth store (including D-1 `ensureSessionNonce` cabinet-create semantics and D-2 nonce-preserving `refreshToken`) / environment & API configuration | [Architecture](architecture.md) |
| api-client transport, error semantics, and the D-2 reactive 401 single-flight refresh interceptor | [API Client and Normalizers](api-and-normalizers.md) |
| Financial summary math, margin/liquidity calculations, cabinet creation and settlement flows, task-role semantics (including the quality-wave `ScenarioUrgencyTier` work) | [Domain Logic](domain-logic.md) |
| Gate / baseline / ratchet work, including `check-shadcn-ui-boundary.mjs` (current baseline 372, fails only on increase) and `check-shadcn-migration-parity.mjs` self-suites | [Conventions & Quality Gates](conventions-and-quality.md) |
| Test / e2e / automation work, including the story-174-3 e2e runner tooling (`e2e/support/story-174-3-runner-*.ts`, real-browser-zoom and state-evidence runners, fixture corpus under `e2e/fixtures/story-174-3/`) and the D-1 two-tab nonce-nulling e2e | [Testing & Operations](testing-and-ops.md) |

## Wiki Map

- **[Architecture](architecture.md)** — route groups, layout/provider hierarchy, client-side data fetching, the auth store, and the canonical configuration table.
- **[API Client and Normalizers](api-and-normalizers.md)** — the typed API surface, transport, error semantics, and the null-money/ratio preservation rules.
- **[Design System](design-system.md)** — Tailwind v4 semantic tokens, hardened shadcn primitives, composition families, enforced design-system boundary, and the Story 174.3 inclusive visual contract.
- **[Domain Logic](domain-logic.md)** — financial-summary math, margin/liquidity calculations, cabinet creation/settlement, and task-role semantics.
- **[Migration Program (Epics 166–174)](migration-program.md)** — per-epic/story status ledger, route ledger (76/76 verified), parity validation, Story 174.3 evidence pipeline, orchestration process, and the final 94/94 closeout.
- **[Conventions & Quality Gates](conventions-and-quality.md)** and **[Testing & Operations](testing-and-ops.md)** — coding standards/gates and the testing strategy with the story-174-3 evidence runners.
