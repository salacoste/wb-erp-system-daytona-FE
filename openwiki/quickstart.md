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
  - id: openwiki-source-7825c41e82ca828e4e955736
    resource: repo://docs/HANDOFF-2026-09-06-V18-SESSION8-FE-D5-FE-D3FAM-WCAG-W6-EXECUTED-AND-REMAINING-BACKLOG.md
  - id: openwiki-source-dd73bf43340fba783fd95443
    resource: repo://docs/HANDOFF-2026-09-09-V19-SESSION9-PRETTIER-BROWSER02-PRIVACY-EXECUTED-AND-REMAINING-BACKLOG.md
  - id: openwiki-source-012193b44418d77f0463a518
    resource: repo://docs/ORCHESTRATOR-PROMPT-2026-09-10-V20-DEBT-CONTINUATION-OMC-SUBAGENTS.md
  - id: openwiki-source-c66fd1b858bdd6d97345f065
    resource: repo://docs/request-backend/230-auth-refresh-endpoint-missing.md
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-cf420d2a3bbc3f5b978f6bfe
    resource: repo://scripts/.check-docs-baseline.txt
  - id: openwiki-source-a6d59436db4440630eef1244
    resource: repo://scripts/.shadcn-ui-boundary-baseline.txt
  - id: openwiki-source-02888236bcd9b1d1d663f151
    resource: repo://scripts/generate-story-174-3-scope-register.mjs
  - id: openwiki-source-e8dafb8ad730440a037549d9
    resource: repo://scripts/run-e2e-isolated.mjs
  - id: openwiki-source-8f2fb2dd82c28c75ce354113
    resource: repo://scripts/run-story-174-3-real-browser-zoom.mjs
  - id: openwiki-source-1bbe76f55f6efa9d2465f6c5
    resource: repo://scripts/run-story-174-3-state-evidence.mjs
generated: { by: "openwiki/0.5.1", at: "2026-09-10T08:47:50.517Z" }
verified:
  - by: openwiki/0.5.1
    at: 2026-09-10T08:47:50.517Z
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
- **D-2 (PB-3, reactive 401 refresh)** — backend contract agreed (request-backend #230: `POST /v1/auth/refresh`, sliding rotation, expired JWT never refreshes); frontend executed on `debt/d2-pb3-reactive-refresh` — api-client interceptor (single-flight refresh reading the token from the store, replay ×1), nonce-preserving `refreshToken` in the auth store. Live-verified locally 2026-09-03 (refresh 200 / revocation 401); remote BE publish is an open backend follow-up.
- **Boundary waves 1-2** (PRs #394/#395): financial-summary (58 sites) and margin-family (29 sites) palette → semantic tokens; boundary ratchet **459 → 401 → 372** (baseline in `scripts/.shadcn-ui-boundary-baseline.txt`; 3 owner-accepted exceptions — do not touch).
- Quality wave (PR #392/#393): AcceptanceStatusBadge solid pairs, GapsTable SR dedup, `ScenarioUrgencyTier` single classification source. Vitest floor 19,424; lint 0/0, tsc 0, build 0.
- **P2 wave-3 "AA-quick-wins"** (2026-09-05, session-3): `/15→/5` and `/10→/5` solid-pair fixes across `unit-economics-config.ts`, CashflowRowPrimitives, pnl-waterfall, and the price-calculator family; Vitest floor **19,424 → ≥ 19,439**. The layered-compositing model was falsified (over-card); artifact `_bmad-output/implementation-artifacts/debt-p2-wave3-aa-quickwins.md` is the new canon.

Subsequent sessions (handoff chain V16→V18, ending at `docs/HANDOFF-2026-09-06-V18-SESSION8-FE-D5-FE-D3FAM-WCAG-W6-EXECUTED-AND-REMAINING-BACKLOG.md`) executed further waves: FE-D5 cross-tab cabinet-create → Web Locks (`src/lib/cabinetCreationLock.ts`, PR #415), fe-d3-family hook-fallback sanitization (`sanitizeFallbackMessage` moved to `src/lib/sanitize-fallback-message.ts` with a SHA-pinned re-export, PR #416), WCAG wave-6 (PR #417), and a dead-code quickwin. The boundary ratchet continued down to the current baseline **118** in `scripts/.shadcn-ui-boundary-baseline.txt` — the entire residual 118 is now gated on the owner decision C5 (chart palette), so no further boundary waves are possible until that decision lands.

### Session-9 (2026-09-08/09, V19) and session-10 (2026-09-10, V20) — latest chain entry points

Latest handoff: `docs/HANDOFF-2026-09-09-V19-SESSION9-PRETTIER-BROWSER02-PRIVACY-EXECUTED-AND-REMAINING-BACKLOG.md` (5 items, PRs #420–#428, all merged, cleanup 0/0/0). Next orchestrator entry point: `docs/ORCHESTRATOR-PROMPT-2026-09-10-V20-DEBT-CONTINUATION-OMC-SUBAGENTS.md` (session-10 continues the P3 debt backlog through OMC subagents). Live main after #427: `c012f89d`.

- **prettier-md** (PR #420): strict mode `--embedded-language-formatting=off` applied to **1,189 files** under `docs/**/*.md` (fences byte-untouched); treewide `prettier --check` exit 0 idempotently. Owner precedents: `\_\_` / `\|` escapes in GFM cells, embedded formatting must stay off.
- **CABINET-BROWSER-02 pre-existing red** (PR #421/#422): root cause was a stale twin-pin in the spec, **not** a regression (FE-D1 hypothesis falsified — both mutations use `retry: false`, 4xx is not mocked); re-pinned to `toHaveText(MARGIN_RECOVERY_MESSAGE)`; live e2e verified via a PM2↔worktree-dev swap.
- **privacy docs-example redaction** (PR #423/#424): the privacy gate scans the HEAD merge-diff (fallback `-m`), so pre-existing doc examples with fake Bearer tokens surfaced on merge #420; 4 files under `docs/request-backend/` shortened below the 12-char trigger.
- **privacy scanner × tool dirs exclusion** (PR #425): owner decision 2026-09-08 excluded the 5 vendored BMAD knowledge dirs (≈630 actual violations across 4 classes) from the change-set scan via `EXCLUDED_CHANGE_SET_PREFIXES` + a per-file filter in `collectGitChangeFiles` — accepted residual recorded; scan roots/PII pins untouched.
- **route-guards exact-array unification** (PR #427): 33 deviants across 3 waves (catalog pins, real disk guards, 18 count-pins, 7 boundary checks incl. a stale tariffs pin 29→32); the 174.3 execution manifest was regenerated with `--owner-units` (3 hash updates, 275/275 == disk). Test floor 19,559 → **19,570** (CLAUDE.md synced in the same PR).
- **docs-95 split** (session-10, registry §24): `scripts/.check-docs-baseline.txt` is now zone-annotated — 1 CANONICAL entry, 4 ARCHIVAL-CANDIDATE, 90 ARCHIVAL (frozen story artifacts). Zones are narrative only (comments are stripped by the gate); `--update-baseline` regenerates the file flat and silently destroys the zones, so re-split after any regeneration. Zone semantics: a NEW break of a CANONICAL citation is a real maintenance signal in a living doc; multi-host ties resolve to the most-alive host.

Live gate state (V19 §2, verified by runs): Vitest full **19,570 / 0** · lint 0/0 · tsc 0 · build `--webpack` 0 · **boundary 118 = baseline** · 3 exceptions · docs 95 · locale 4 · lessons 0 · privacy exit 0 (bare run, never piped — a pipe eats the exit code) · 174.3 contracts 33/33. Environment: Node **24.18.0** (PATH-pinned; Node 26 breaks webpack), PM2 frontend on :3100, backend on :3000; after a Mac reboot restore Docker → `pm2 resurrect`.

Remaining backlog (V19 §3.0): cwd-anchoring of 4 sibling guards (tax, shipments, sku-packaging, box-types), harness restart-per-run, FR-7 / AT-matrix / Manager-creds test epics, unowned presentation-guard surfaces (§20), route-constant scanner quirk — plus the owner decision ledger (C5 chart-palette gating the 118 residual, WCAG 1.4.11 valence channels, A2 OrganicTab /80, apiClient-wide sanitization ~128 .tsx, financial tokens / logger-redact). Backend follow-ups to monitor: remote publish of the D-2 refresh branch, FE-D3-residual NestJS filters. Route backend-blocking work to `docs/request-backend/` (e.g. `docs/request-backend/230-auth-refresh-endpoint-missing.md`).

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
npm run check:docs             # Doc-citation drift gate (baseline: scripts/.check-docs-baseline.txt, zone-annotated)
npm run check:anti-pattern-8-normalizer  # AP#8 normalizer ratchet
npm run check:eslint-rules     # ESLint rule registry guard
npm run check:lessons          # Lessons-length guard
npm run check:markers          # Story-marker guard
npm run check:max-lines        # File-size guard (200-line cap)
npm run check:next-params      # async-params guard
npm run check:locale-percent   # Locale coverage ratchet (baseline 4)
npm run check:e2e-assertions   # Vacuous e2e assertion guard
npm run check:e2e-waits        # Fixed-wait e2e guard
npm run check:e2e-bare-skips   # Bare-skip e2e guard
```

Browser tests require the backend on `localhost:3000` (backend owns its Owner seed — the frontend has no database-seeding script) and the frontend on `localhost:3100`; copy `.env.e2e.example` to `.env.e2e` first:

```bash
npm run test:e2e:preflight     # Config + service diagnostics only (no browser)
npm run test:e2e               # Bounded read-only orders smoke on Chromium (preflight-gated)
npm run test:e2e:full          # Full Playwright suite through the same preflight
npm run test:e2e:isolated      # scripts/run-e2e-isolated.mjs: tmp-worktree restart-per-run orchestrator
                               # (own dev server on :3100, guaranteed PM2 restore, fail-closed on foreign :3100 owners)
```

Migration and Story 174.3 gates have **no `npm run` alias** — invoke them directly (see [Conventions & Quality Gates](conventions-and-quality.md) and [Testing & Operations](testing-and-ops.md)):

```bash
node scripts/check-shadcn-migration-parity.mjs   # Story 174.1: BMAD ↔ route ledger ↔ OMX plan parity (94 = 94, 76 = 76)
node scripts/check-shadcn-ui-boundary.mjs        # Story 174.2: design-system boundary ratchet (current baseline 118, fails only on increase)
node scripts/run-story-174-3-state-evidence.mjs  # Story 174.3: fail-closed state-evidence runner (modes: --owner-units / --owner-browsers / --dedicated-routes / --owners / --defaults / --all)
node scripts/run-story-174-3-real-browser-zoom.mjs  # Story 174.3: headed macOS real-browser 200% zoom orchestrator (all 76 routes × both themes)
node scripts/generate-story-174-3-scope-register.mjs  # Story 174.3: regenerate the expanded-scope register from origin/main
```

## Task Routing

| Task | Go to |
|------|-------|
| Route migration work (Stories 166–174, route ledger, worktrees, handoffs), the Story 174.3 evidence pipeline (execution manifest, contract tests, scope register) | [Migration Program (Epics 166–174)](migration-program.md) |
| Token / component / primitive work, design-system boundary canon (`LEGACY_PALETTE` / `CONTEXTUAL_HEX`), the WCAG 2.2 AA inclusive visual matrix, and the debt-session boundary waves / contrast sweeps (ratchet 118) | [Design System](design-system.md) |
| App structure / route groups / auth store (including D-1 `ensureSessionNonce`, D-2 nonce-preserving `refreshToken`, and FE-D5 `cabinetCreationLock` Web Locks) / environment & API configuration | [Architecture](architecture.md) |
| api-client transport, error semantics, the D-2 reactive 401 single-flight refresh interceptor, and the FE-D3/fe-d3-family `sanitizeFallbackMessage` fallback sanitization | [API Client and Normalizers](api-and-normalizers.md) |
| Financial summary math, margin/liquidity calculations, cabinet creation and settlement flows, task-role semantics (including the quality-wave `ScenarioUrgencyTier` work) | [Domain Logic](domain-logic.md) |
| Gate / baseline / ratchet work, including `check-shadcn-ui-boundary.mjs` (current baseline 118, fails only on increase; the residual is C5-gated) and `check-shadcn-migration-parity.mjs` self-suites | [Conventions & Quality Gates](conventions-and-quality.md) |
| Test / e2e / automation work, including the story-174-3 e2e runner tooling (`e2e/support/story-174-3-runner-*.ts`, real-browser-zoom and state-evidence runners, fixture corpus under `e2e/fixtures/story-174-3/`) and the D-1 two-tab nonce-nulling e2e, and the isolated restart-per-run e2e orchestrator (`npm run test:e2e:isolated`) | [Testing & Operations](testing-and-ops.md) |

## Wiki Map

- **[Architecture](architecture.md)** — route groups, layout/provider hierarchy, client-side data fetching, the auth store, and the canonical configuration table.
- **[API Client and Normalizers](api-and-normalizers.md)** — the typed API surface, transport, error semantics, and the null-money/ratio preservation rules.
- **[Design System](design-system.md)** — Tailwind v4 semantic tokens, hardened shadcn primitives, composition families, enforced design-system boundary, and the Story 174.3 inclusive visual contract.
- **[Domain Logic](domain-logic.md)** — financial-summary math, margin/liquidity calculations, cabinet creation/settlement, and task-role semantics.
- **[Migration Program (Epics 166–174)](migration-program.md)** — per-epic/story status ledger, route ledger (76/76 verified), parity validation, Story 174.3 evidence pipeline, orchestration process, and the final 94/94 closeout.
- **[Conventions & Quality Gates](conventions-and-quality.md)** and **[Testing & Operations](testing-and-ops.md)** — coding standards/gates and the testing strategy with the story-174.3 evidence runners.
