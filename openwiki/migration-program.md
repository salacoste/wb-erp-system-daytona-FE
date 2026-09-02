---
type: migration-program
title: Migration Program (Epics 166-174)
description: Final state and history of the shadcn full-UI migration program (Epics 166-174, 94/94 stories, 76/76 verified routes, all epics CLOSED 2026-09-02), including the FULL/MINOR/born-clean story pipeline, the parity and ui-boundary scripts now serving as post-migration regression guards, and the owner-escalated post-migration debt registry.
tags: [migration, shadcn, epics, orchestration, status-ledger, omc, debt-registry]
sources:
  - id: openwiki-source-9e7c9f2a75e8c54131fe45ec
    resource: repo://_bmad-output/implementation-artifacts/174-1-fe-prove-bmad-route-ledger-and-omx-plan-parity.md
  - id: openwiki-source-a85a3a5994b0c404049b89d3
    resource: repo://_bmad-output/implementation-artifacts/174-3-expanded-scope-register.md
  - id: openwiki-source-3e71d1b4f21e549179c02918
    resource: repo://_bmad-output/implementation-artifacts/174-3-fe-complete-accessibility-responsive-theme-and-visual-verification.md
  - id: openwiki-source-0a41e9b0f6d5cbb55c2aeb55
    resource: repo://_bmad-output/implementation-artifacts/174-4-fe-complete-full-local-functional-and-backend-contract-regression.md
  - id: openwiki-source-e45a8928f9bfd3b0a9024a1c
    resource: repo://_bmad-output/implementation-artifacts/debt-d3-d4-wcag-solid-pairs.md
  - id: openwiki-source-a9bdeeac493ab84f5c393c26
    resource: repo://_bmad-output/implementation-artifacts/debt-sec-doc-1-redact-creds.md
  - id: openwiki-source-89e2a6b1ae97c68779084212
    resource: repo://_bmad-output/implementation-artifacts/sprint-status.yaml
  - id: openwiki-source-4b2b1e6e74590c45f5b8abda
    resource: repo://_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md
  - id: openwiki-source-3ff50b7610374b28cb2b4cf5
    resource: repo://_bmad-output/planning-artifacts/shadcn-route-ledger.md
  - id: openwiki-source-61e0371a06d746820bb42371
    resource: repo://.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md
  - id: openwiki-source-02284da49c2233d6ad8eee98
    resource: repo://.omx/plans/shadcn-full-ui-migration-master.md
  - id: openwiki-source-3ae3de7eae6af907f9e7299c
    resource: repo://docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md
  - id: openwiki-source-52f9f2aa17dde77e23385c81
    resource: repo://e2e/fixtures/story-174-3/execution-manifest.ts
  - id: openwiki-source-63d46e41978bcf9c4a46a1d7
    resource: repo://scripts/check-shadcn-migration-parity.mjs
  - id: openwiki-source-bdeb846005a65a32b569a6d3
    resource: repo://scripts/check-shadcn-ui-boundary.mjs
  - id: openwiki-source-28021c2f62a088d4d9f6489f
    resource: repo://scripts/lib/story-174-3-execution-requirements.mjs
  - id: openwiki-source-11392b4e8de554e0126fdfd1
    resource: repo://scripts/lib/story-174-3-manifest.mjs
  - id: openwiki-source-64fe71a7ae47db511ff422d4
    resource: repo://src/test/story-174-3-state-contract.test.ts
  - id: openwiki-source-72aa0e35fae33f199ccac4c2
    resource: repo://src/test/story-174-3-surface-contract.test.ts
generated: { by: "openwiki/0.5.0", at: "2026-09-02T08:47:53.996Z" }
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T08:47:53.996Z
---

# Migration Program (Epics 166-174)

This page is the canonical wiki home for the shadcn full-UI migration **program**: the master plan, the story pipeline, the current status ledger, and the handoff/orchestration process. Per-story migration status lives here (not in `design-system.md` or `quickstart.md`) so status churn is isolated from stable conventions. See [/openwiki/conventions-and-quality.md](/openwiki/conventions-and-quality.md) for coding standards and [/openwiki/design-system.md](/openwiki/design-system.md) for the token/component layers this program delivers.

## Program goal and invariants

The master plan (`.omx/plans/shadcn-full-ui-migration-master.md`) migrates the entire frontend presentation layer to the approved shadcn/ui semantic design system, one BMAD Story at a time, **preserving** backend contracts, calculations, query keys, mutation behavior, URLs/search parameters, authentication, cabinet context, Russian localization, and formatting semantics. The only approved contract exceptions are Story 167.8 (cabinet session reconciliation/create-idempotency) and Story 169.14 (paid-storage import lifecycle/result), both executed in the backend repository; no other story inherits either exception.

Program completion requires: exactly 94 stories with matching OMX plans and completion evidence, all 76 `page.tsx` routes verified exactly once via the route ledger, legacy presentation removed only after its last consumer migrates, and every temporary feature worktree and branch removed after merge. Production/deployment work and CI gates are explicitly out of scope; local validation is the merge gate.

Key structural rules:

- **Layering**: semantic tokens → generic shadcn primitives → product compositions → domain-shared components → route-owned UI trees. `src/components/ui/**` stays generic and is forbidden territory for route stories.
- **Ownership**: every file consumed by two or more routes has exactly one upstream owner story (e.g. 172.5 owns single-COGS presentation for 172.6–172.8; 172.14 owns order-shared presentation for 172.15–172.16; 173.1 owns the settings shell; 173.8 owns shipment-shared presentation for 173.9–173.11; 173.12 owns supply-shared presentation for 173.13). Forbidden shared files (`package.json`, `src/components/ui/**`, `src/hooks/**`, `src/lib/**`, `src/types/**`, `src/stores/**`, AppShell, `analytics/shared/**`) require stop-and-escalate, never direct edits.
- **DAG over numbering**: story numbers are identities, not a universal execution order. Correct-course prerequisites (e.g. 167.8 → 167.9 → 167.5 before 167.6/167.7; 169.14 → 169.15 → 169.12 closeout; owner stories before consumers) override numeric order. The standing operator policy is sequential execution: numeric order 173.2 → 173.13 → 174.1 → 174.5 is safe and satisfies the DAG. Epic 174 starts only after Epics 166–173 are complete.

```mermaid
flowchart TD
  E166["Epic 166: tokens, primitives, compositions"] --> S1671["167.1 AppShell"]
  E166 --> S1681["168.1 analytics shared owner"]
  S1671 --> ROUTES["Route Stories 167.2-172.17"]
  S1678["167.8 backend cabinet contract"] --> S1679["167.9 conditional settlement"]
  S1679 --> S1675["167.5 cabinet onboarding"]
  S1681 --> ANALYTICS["Analytics Stories 168.2-171.9"]
  R16914["169.14 backend paid-storage contract"] --> R16915["169.15 frontend boundary"]
  R16915 --> R16912["169.12 contract closeout"]
  R1725["172.5 COGS shared owner"] --> R17268["172.6-172.8"]
  R17214["172.14 orders shared owner"] --> R1721516["172.15-172.16"]
  S1731["173.1 settings shell owner"] --> S1732["173.2-173.7 settings children"]
  S1738["173.8 shipments owner"] --> S173911["173.9-173.11"]
  S17312["173.12 supplies owner"] --> S17313["173.13 supply detail"]
  ROUTES --> E174["Epic 174: parity, audits, cleanup"]
  ANALYTICS --> E174
  S1732 --> E174
  S173911 --> E174
  S17313 --> E174
```

## Status ledger (verified 2026-08-31, PR #372)

| Epic | Scope | Progress | Status |
|---|---|---|---|
| 166 foundation | 8 stories | 8/8 | **CLOSED** (tokens, primitives, compositions, contracts) |
| 167 AppShell/auth | 9 stories | 9/9 | **CLOSED** |
| 168 analytics core | 11 stories | 11/11 | **CLOSED** (hub + 10 routes) |
| 169 operational analytics | 15 stories | 15/15 | **CLOSED** (169.14 → 169.15 → 169.12 contract-closeout chain; 169.13 via PR #232) |
| 170 advertising/brand/search | 7 stories | 7/7 | **CLOSED** (PRs #237-#250) |
| 171 AI/forecast/models | 9 stories | 9/9 | **CLOSED** (PRs #252-#270) |
| 172 business workspace | 17 stories | 17/17 | **CLOSED** — 172.10 Finances & Documents (#308/#309), 172.11 Monitor (#311/#312), 172.12 Monitoring Operations Console (#315), 172.13 Moysklad workspace (#317), 172.14 Orders Overview (#319), 172.15 FBO Orders (#321), 172.16 Order Integrity (#323), 172.17 Product Management (#325, includes Epic-172 retrospective) |
| 173 settings/shipments/supplies | 13 stories | **13/13** | **CLOSED** — settings 173.1–173.7 (#328–#348), shipments 173.8 (#350/#351 + auxiliary #352, no residue), 173.9 (#353/#354 + auxiliary #355, fully historical), 173.10 Shipment Box Types (#356/#357, 17 files, visible units/44px targets), 173.11 SKU Packaging (#359/#360, 24 files, strict integer/single-bulk-delete payloads), 173.12 Supplies List owner (#361, WCAG solid-pair badge canon after a 4.06:1 axe catch), 173.13 Supply Detail (#365/#366 + auxiliary #367, fully historical; full floor 19,874/0/1255) |
| 174 consolidation | 5 stories | **5/5** | **CLOSED** — 174.1 parity (#369 `360c9cb9` + closeout #370 `fbdab2da` + lifecycle #371 `e7d438ce`); 174.2 legacy removal + design-system boundary (PR #372, merge `862d45a1`, ratchet born at 523); 174.3 inclusive visual/a11y matrix (PR #374, merge `c5605a38`, after the immutable three-APPROVE gate closed via remediation `56b3a6c2`); 174.4 full functional/backend-contract regression (PR #375 `a21bf67e` + closeout #376, ~53 spec defects fixed, boundary ratcheted 523→459); 174.5 final documentation/cleanup (PR #379 on base `0d6225ac`, route ledger 76/76 `verified`, tracker drift synced) |

**Program complete: 94 of 94 stories done, all 9 epics CLOSED (2026-08-11 → 2026-09-02), final main base `0d6225acb9abfafa872d2d2ee45f215594edc4e6`.** All 76 route-ledger rows are `verified` — flipped `planned → verified` only by Story 174.5 after a full per-row evidence audit: 54 rows with complete per-story chains and 22 early-wave rows (167.4–167.7, 168.1–168.11, 169.1–169.7) whose cleanup link was satisfied by a collective live-absence audit (`git worktree list` / `branch --list 'cdx/*'` / `ls-remote --heads origin`), after an independent adversarial verifier **refuted 4 builder-map rows** (167.5/167.6/167.7 CLEANUP, 167.4 partial), forcing the audit rescope 18→22 and correcting the full-chain tally 58→54. Every story PR SHA is an ancestor of `0d6225ac`.

Final full-suite Vitest floor: **19,363 passed / 0 failed across 1,270 + 4 files** (trajectory: 19,874 at 173.13 → 19,118 after 174.2's deliberate −756 dead-test deletion → 19,355 in the 174.3 window → 19,363 with 174.4's +8 contracts).

Epic 173 closed 13/13: 173.1 owns the settings shell (children 173.2–173.7 never edited it); 173.8 owns shipment-shared presentation for 173.9–173.11; 173.12 owned supply-shared presentation for 173.13, including the 18-file `DETAIL_EXCLUDED` load-bearing guard catalog proving the list equals the exact transitive import closure of `[id]/page.tsx`. APIs, hooks, query keys, types, calculations, authentication, cabinet context, URLs/search parameters, mutation semantics, cache behavior, and backend contracts remain behavior-preservation surfaces unless an exact story explicitly owns a change.

### Epic 174 consolidation chain

Epic 174 is sequential and started only after all 13 Epic 173 stories merged with lifecycle cleanup/evidence complete; frontmatter wording such as `ready-for-execution` never overrides a plan's prerequisite DAG.

1. **174.1 parity — DONE** (`scripts/check-shadcn-migration-parity.mjs`): proves schema-v3 parity 94 BMAD stories = 94 OMX plans and 76 source routes = 76 ledger rows = 76 unique route-owning stories = 76 unique linked implementation artifacts, including App Router route-group normalization and the exact backend exceptions 167.8/169.14. It is dependency-free and filesystem-only, runs a 33-test deterministic `node:test` mutation suite (deep-cloned real corpus; asserts exact `{ code, identity }` failure records for missing/orphan/duplicate/title/evidence/status/repository/prerequisite/route/artifact defects) before validating the canonical corpus, and emits one machine-readable report plus one human summary from the same run/base SHA. Backend Git corroboration is labeled `PASS(historical+local+cached)` with live remote proof honestly `unavailable` (DNS). It did **not** flip ledger rows to `verified` — 174.5 owns those transitions.
2. **174.2 legacy removal + boundary enforcement — DONE** (PR #372): 65 proven-dead files deleted (−13,022 lines) across six executor waves with per-file import-closure proof, the complete lib-wave (§3.1 of the 2026-08-30 team handoff: wb-status trio → solid status pairs, monitoring `STATUS_COLORS`, `getMarginColor` dedupe to canonical 168.3 tiers, orders/liquidity/supply-planning helpers), the 171.9 carry-outs ×5, `SUPPLY_STATUS_CONFIG` whole-file delete, and the C2/C3/C4/C10/C16 families. It also added the bounded design-system boundary enforcement described below.
3. **174.3 inclusive visual/theme/responsive/a11y proof — DONE** (PR #374, merge `c5605a38`; status synced from stale `review` to `done` by 174.5) — see the dedicated section below. The scope covered the 76-route inclusive visual matrix (the canonical twelve-state ledger taxonomy across light+dark themes, six widths, 200% real browser-UI zoom, reduced motion, keyboard/focus, reading/heading order, non-color data meaning, axe WCAG 2 A/AA/2.2 AA at 390px and 1280px), remediation of the discovered product defects, and the fail-closed execution-manifest evidence pipeline. The **three-review remediation gate** closed via remediation commit `56b3a6c2`: the initial commit and three remediation candidates received `REQUEST CHANGES`/`REJECT` verdicts from independent reviewers before a final unchanged SHA collected three `APPROVE`s. Automated axe alone was never sufficient; unavailable environments (real VoiceOver/NVDA/JAWS/TalkBack) were recorded as gaps, never passes.
4. **174.4 full functional/backend-contract regression — DONE** (PR #375 `a21bf67e` + closeout #376): fixed ~53 baseline-failing tests (spec-defect classes across Epic-44 sliders/aria, navigation canonicalization, 167.5/167.7 auth seeds, h2-loading collisions, timeouts, strict locators) plus 2 real product WCAG/layout defects (D5/D6); regenerated the 174.3 execution manifest via its documented `--owner-browsers` runner after spec fixes broke SHA pins (**367 passed / 0 failed / 23 skipped**); resolved the 13 bisect-proven pre-existing liquidity (×12, resolved-by-174.3) and monitor weekly-chart (×1, fixed) e2e failures; ratcheted the ui-boundary baseline 523 → **459** (the 64-violation drop originated in the 174.3-window raw-class removals, initially mis-attributed and corrected by a second fresh-context review pass). Two review passes: APPROVE-WITH-NOTES after the false-attribution finding was applied, then REJECT-as-is with a scoped fix path at the recorded counts.
5. **174.5 final documentation and cleanup — DONE** (PR #379 on base `0d6225ac`): documentation/tracking-only closeout owning zero runtime routes — flipped all 76 ledger rows to `verified` with the adversarially verified evidence map, re-pinned the parity gate to its terminal state (`EXPECTED_BASE_SHA` → `0d6225ac`, ledger expectation `planned → verified`), synced tracker drift (duplicate 174.2 row deleted, 174.3 `review → done`, 21 frozen pre-merge artifact status lines synced with history preserved in parentheses), re-confirmed the owner-accepted exceptions, and published the final delivery manifest, program retrospective, and final 94/94 handoff. Zero completed migration branches/worktrees remain; no deploy action.

### Validator scripts and baselines

Two enforcement scripts were built during Epic 174 and now serve as **post-migration regression guards over a finished program** — they protect the completed migration against regressions on future changes; they gate no in-flight stories. Each has a committed plain-text baseline:

- `scripts/check-shadcn-migration-parity.mjs` (Story 174.1) — BMAD/route-ledger/OMX plan parity; self-suite `scripts/__tests__/check-shadcn-migration-parity.test.mjs` (33/33). Now in **terminal state**: the corpus expectation was moved to `verified` and `EXPECTED_BASE_SHA` was re-pinned to the Story 174.5 base `0d6225ac`. Maintainer note: on `main` after merge it reports **base-sha-mismatch BY DESIGN** (precedent 174.1); re-check by running in a worktree based on the pinned SHA or re-pinning the constant to a new story base. Corpus-only mode: `STORY_174_1_SKIP_SELF_TESTS=1` (same pin).
- `scripts/check-shadcn-ui-boundary.mjs` (Story 174.2, ratchet lowered by 174.4) — node-stdlib-only scanner over production `src/**/*.{ts,tsx}` (tests, d.ts, `src/test/**` excluded; relative-first enumeration so foreign worktree paths cannot re-enter), detecting the extended `LEGACY_PALETTE` regex and 3-branch `CONTEXTUAL_HEX` canon. Its ratchet baseline `scripts/.shadcn-ui-boundary-baseline.txt` = **459** (born at 523 in 174.2; 174.4 actioned the mandated ratchet-down after the 174.3-window raw-class removals dropped live counts to 459): a plain run exits 0 at ≤ 459 counted violations and fails only on increase ("registered" = baseline-grandfathered, locale-percent precedent). **3** suppressed matches in **3** files remain in the `BOUNDARY_EXCEPTIONS` register (single source of truth, mirrored 1:1 by the classification manifest): the C5 waterfall categorical hex (11 hex + 2 tokens across 13 series, awaiting a chart-palette owner decision) and two historical `#7C3AED` chart marks (PriceHistorySheet, FunnelTab — 170.x carry-outs). The former fourth exception (FeedbackButtons) was **lifted 2026-09-02** when PB-4 was fixed via a solid status pair (debt D-3). Self-suite 10/10. The remaining 459 violations are the cat-1 residue (~59 live files) owned by a future owner-sweep through the same ratchet — never a mechanical replacement.
- The docs-citation gate `check:docs` tracks its own historical baseline `scripts/.check-docs-baseline.txt` (95 committed entries, `--update-baseline` only with NEW/RESOLVED analysis in the commit message); a canonical-vs-archival split of that baseline is an open owner decision.

Live per-story history: `_bmad-output/implementation-artifacts/sprint-status.yaml`. Consolidated per-epic slice: `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` (final snapshot 2026-09-02, PROGRAM COMPLETE; treat the repo as truth on drift, corrected through a reviewable documentation lane).

## Story 174.3: the inclusive visual matrix and its evidence pipeline

Story 174.3 (`in-progress-remediation`, branch `cdx/epic-174-story-3-inclusive-visual-verification`, plan `.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md`) is the program's assurance story for accessibility, responsive, theme, and visual verification. Its canonical state taxonomy is the twelve-state matrix **default/loading/refresh/empty/filtered-empty/error/stale/partial/permission/pending/partial-success/not-found** applied to all 76 ledger routes (76 × 12 = 912 materialized route/state rows: 444 exact executed, 468 explicit route-specific not-applicable, 0 blocked, plus 76 canonical Story-runner defaults, 318 owner-unit and 50 owner-browser executable rows across 154/21 unique sources). The title-token fallback was deleted: absence of a substring can never become N/A, and every declared executable scenario must resolve exactly once.

### Three-review remediation gate and the expanded scope register

Commit `82465fbf96f2319116c1cad101044e8004a52cc3` received three independent `REQUEST CHANGES`/`REJECT` verdicts; subsequent candidates `633f202b`, `7e41cc96`, and `f8cbaba2` were also rejected by independent reviews (findings included focusable native table rows, incorrectly N/A-declared model-evaluation features, pointer-only row `onClick`, retained raw browser diagnostics under `.playwright-cli/`, and raw API-derived error text on the finance-history terminal state — all closed). The gate required every accepted finding repaired, validation regenerated, and a new immutable commit approved by three fresh independent reviewers on that same unchanged SHA (any content change invalidated all approvals and restarted the gate); the gate ultimately closed via remediation commit `56b3a6c2` and PR #374 merged as `c5605a38`. This gate is historical — 174.3 closed long before program end.

The story began with a frozen three-file bootstrap (`e2e/shadcn-migration-visual-accessibility.spec.ts`, `e2e/fixtures/story-174-3-visual-accessibility.ts`, the delivery record), but the live matrix found concrete route-owner defects, so the scope legitimately expanded. The **generated** register `_bmad-output/implementation-artifacts/174-3-expanded-scope-register.md` — produced by `scripts/generate-story-174-3-scope-register.mjs` from the exact `origin/main` comparison plus current untracked Story files and regenerated before freeze (path drift is a review blocker) — is now the **current file-level coordination authority**, not the historical three-file bootstrap. It enumerates 424 files across coordination classes: `route-owner-remediation` (335 files, ledger route owner + 174.3), `story-evidence` (46), `owner-browser-evidence` (15), `shared-owner-remediation` (15), `foundation-appshell-coordination` (5), `repository-validation` (3), `delivery-record` (2), `story-support` (2), and `remediation-plan` (1). All product/shared entries are coordinated, contract-preserving repairs that add no dependency; no backend, deployment, production, force-push, or direct-`main` operation is admitted.

```mermaid
flowchart TD
  B["Three-file frozen bootstrap"] --> RUN["Execute 76-route matrix"]
  RUN --> DEF["Route-owner defects found"]
  DEF --> SCOPE["Generate expanded scope register, 424 files"]
  SCOPE --> REM["Apply coordinated owner repairs"]
  REM --> VAL["Regenerate exact-worktree validation ledger"]
  VAL --> SHA["Create immutable final commit"]
  SHA --> REV{"Three fresh independent reviews"}
  REV -- "Any REQUEST CHANGES" --> REM
  REV -- "Three APPROVE, same unchanged SHA" --> PR["PR, merge, cleanup evidence"]
```

The 174.3 remediation/evidence flow: the frozen bootstrap executes the canonical matrix, discovered defects expand the register, repairs regenerate validation, and only three same-SHA `APPROVE` verdicts unblock merge.

### Execution-manifest pipeline (fail-closed)

The evidence backbone is `e2e/fixtures/story-174-3/execution-manifest.ts` plus `scripts/lib/story-174-3-manifest.mjs`, with contract tests in `src/test/story-174-3-*.test.ts` enforcing the manifest, state, surface, and manual-evidence contracts:

- **Types**: `Story1743RequiredExecution` is `{ source, sourceSha256, scenarioId, runner: 'vitest' | 'playwright' }`; manifest entries extend it with `command`, `result: 'passed' | 'failed' | 'skipped'`, `exitCode`, `startedAt`, `durationMs`; the manifest carries `schemaVersion: 1`, `generatedAt`, and a `runtime { node, npm }` block.
- **Reader (`scripts/lib/story-174-3-manifest.mjs`)**: `readStory1743Manifest` returns an empty manifest only for a true `ENOENT`, and `validateStory1743Manifest` rejects malformed JSON, unsupported schema, missing runtime metadata, duplicate entries, and every malformed field class — each entry must have a 64-hex-character `sourceSha256`, a supported runner/result, a non-empty command, an integer exit code, a valid ISO timestamp, and a non-negative duration.
- **Indexer (`indexStory1743ExecutionManifest` in `execution-manifest.ts`)**: keys results by `(source, scenarioId)`; for every required execution it fails on missing entries, stale source hashes, runner mismatches, non-`passed` results or non-zero exit codes, and incomplete runner metadata. With `requireExactSet: true` the merge-ready gate additionally rejects **surplus** entries (stale, failed, skipped, nonexistent-source, obsolete-scenario, unknown) — exact key-set equality with the canonical owner plus default-route execution union — while recording mode remains explicitly partial.
- **Requirements extraction (`scripts/lib/story-174-3-execution-requirements.mjs`)**: `story1743ExactOwnerExecutions` parses the owner declaration sources (state/owner-evidence/surface-contract/chart/table/dedicated-route scenario fixtures) with the TypeScript compiler, accepts only literal `source`/`scenarioId`/runner arguments in the `bind`/`binding`/`scenario` helper calls, rejects conflicting runners, and computes a SHA-256 of each source file so the committed manifest is pinned to exact content. The runner spec plus the route ledger drive `story1743MergeReadyExecutions`.
- **Contract tests**: `src/test/story-174-3-state-contract.test.ts` (route/state dispositions, owner reconciliation, explicit N/A clauses, merge-ready execution indexing), `story-174-3-surface-contract.test.ts` (76 route surface contracts: overlays 83 executed / 15 N/A, tables 42/21, charts 13/4, table/chart features 292 executed / 331 N/A, all conditional branches fail closed), `story-174-3-manifest-reader.test.ts` (every fail-closed reader branch), and `story-174-3-manual-evidence-contract.test.ts` (the immutable operator-driven manual ledger `e2e/fixtures/story-174-3/manual-evidence.ts`).

The committed `e2e/fixtures/story-174-3/execution-manifest.json` recorded 770 passed entries (627 Vitest / 143 Playwright, including the 76 canonical defaults and 4 dedicated-route executions) and 0 failed in the final validation ledger, alongside full Vitest 19,355/19,355 across 1,270 files, the canonical Story runner (82 passed / 1 optional Manager skip), real browser-UI 200% zoom for all 76 routes × both themes, and the 70/70-page production build. Story 174.4 later fixed three pinned spec defects and **regenerated the owner-browser manifest via the dedicated runner** (`scripts/run-story-174-3-state-evidence.mjs --owner-browsers`: 367 passed / 0 failed / 23 skipped) — a live guard now: any edit to a SHA-pinned e2e spec breaks module-load of the whole e2e suite, and regeneration is allowed only through that runner.

### What the matrix verifies and its honesty rules

Every final route run covers light and dark themes at 320/390/768/1024/1280/1440 CSS pixels, `prefers-reduced-motion: reduce`, body-scoped WCAG 2 A/AA/2.2 AA axe at both 390px and 1280px, a nonzero measured contrast set validated against axe's applicable thresholds, route/surface geometry, computed theme tokens (light/dark root/body signatures must differ), reading/heading order (exactly one route-specific visible `h1` before the first semantic data surface; `/`, `/login`, `/register` are explicit redirectors), table/chart semantics, and visible keyboard focus. Zero focusable native table rows is a canonical invariant: pointer-only row convenience may stay, but keyboard activation belongs to named native buttons. True 200% zoom is executed through real browser-UI shortcuts on headed Chromium, proving the doubled device-pixel ratio and bounded geometry.

Authenticated screenshots, videos, traces, ARIA snapshots, and raw attachments are prohibited; evidence is privacy-safe DOM/accessibility/geometry/computed-style data only, and `e2e/.auth/user.json`, `test-results/`, `playwright-report/`, and `.playwright-cli/` must be deleted after final validation without reading their contents. The operator-driven manual ledger records Codex-App browser-operator sessions (never conflated with automated results or human AT review); real VoiceOver/Safari, NVDA/JAWS, and TalkBack remain explicit environment-capability gaps (`ENV-WEBKIT-TAB` style records), and unavailable environments are never relabeled as passes.

## The Story 173.1 settings-shell pattern

Story 173.1 (Settings Shell and Overview) established the reusable owner pattern for the settings family: a **static overview page** plus a **shared seven-route settings shell** consumed by the child settings stories (173.2–173.7), with a desktop grid layout and a compact Sheet for narrow viewports, and role-aware **restricted/current states** carrying Owner/non-Owner semantics. It was delivered in an exact six-file manifest (focused 2/22, settings 17/217, full floor 19,489/0). The child settings stories shipped through it without touching the shell: 173.2 Backfill (17 files, dual-pipeline status, guarded pending trigger), 173.3 Cabinet (12 files, fail-closed unknown Jam tier), 173.4 Expenses (9 files, pending-safe CRUD overlays), 173.5 Notifications (28 files, Telegram binding lifecycle, quiet-hours validation), 173.6 Tariffs (29 files, nested-tier validation, controlled dirty state), and 173.7 Tax (11 files, same-cabinet draft preservation, cross-cabinet isolation), each with its own exact manifest, feature + closeout PR pair, and full-floor advance. Their migrated routes live under `src/app/(dashboard)/settings/*`; 173.8's shipments list and 173.9's shipment detail migrated routes live under `src/app/(dashboard)/shipments/*`.

Its known gap is debt item **C18**: the credentialed non-Owner restricted-navigation visual (Manager/Analyst/Service × Tariffs/Import, desktop + compact Sheet, both themes) was not captured because optional Manager credentials are not configured. The semantic proof is deterministic in Vitest; a Manager screenshot must not be claimed without a real credentialed run. C18 was carried out to Story **174.3**, whose inclusive visual matrix and expanded scope register absorbed it; the real-credentialed Manager journeys themselves remained environment-gap skips (see the post-migration debt section).

## Story pipeline: FULL / MINOR / born-clean

Every story follows a unified A–J pipeline, but its **verdict class** is decided by an explicit compliance count (palette + raw hex + `py-6` occurrences across the owned surface, counted with literal paths because zsh does not word-split `$VAR`):

- **NO-OP** — everything already implemented; close with evidence only.
- **MINOR-GAP** (≤10 files) — orchestrator edits directly; typically token/class swaps, captions, `tabular-nums`.
- **MINOR born-clean** — the route was born already token-clean; only guard tests and contract gaps (captions, tabular numerals, paddings) are added.
- **FULL / FULL-lite** — legacy palette-heavy surfaces; executed in executor "waves" of ~30 non-overlapping files, with targeted Vitest after each wave. 172.1 (Business Dashboard, 127 files, 4 waves) is the FULL reference; 172.5 is the FULL-lite owner reference including the import-closure audit canon; 172.14 is the FULL owner-story reference for the shared orders family (29 modified files + guard, cross-restraint 0-import proof).

Pipeline stages, in order: **A** plan + pre-flight (registry carry-in grep by story ID; reconnaissance written to a file, never held in context) → **B** worktree + behavior-lock (branch/worktree names come from the story plan; targeted baseline N/M) → **C** compliance count + import-closure pre-scan (BFS from entry points; every live file in the closure goes into the future guard catalog) → **D** edits (waves or direct) → **E** guard tests (pinned per-file catalog, no-palette/no-hex regexes, contract pins for caption/tabular/valence/badge idioms) → **F** validation gates → **G** adversarial review (reviewer ≠ author, fresh context, diff attached as `/tmp/<story>-review-diff.txt`, import-closure audit mandatory) → **H** fixes → **I** commit/PR/merge/cleanup → **J** closeout (story artifact, sprint-flip, registry, handoff §0, CLAUDE.md floor — one closeout PR).

Validation gates per PR (unpiped exit codes; Node 24.18.0 — system Node 26 breaks webpack builds): full Vitest ≥ floor with 0 failed, ESLint 0 errors/0 warnings, `tsc` 0, `check:max-lines` (source ≤200, test ≤800 lines), `check:docs` exit 0, locale-percent ratchet, lessons-length ≤120 chars, `next build --webpack`, and Playwright e2e 0 failed via the npm wrapper (the wrapper injects orders+auth setup, so attest test counts by decomposition).

## OMC story-worktree orchestration and handoff lineage

Handoff lineage (each superseding the previous as the execution entry point; older files remain only as historical process evidence):

1. `docs/HANDOFF-2026-08-27-CROSS-TEAM-OMC-ORCHESTRATOR-172-8-CONTINUATION.md` — cross-team OMC continuation canon. **Superseded operationally**: it contained obsolete Story 172.12 execution instructions and a known plaintext test-credential exposure (debt SEC-DOC-1 — the literals were redacted 2026-09-02, PR #383).
2. `docs/ORCHESTRATOR-PROMPT-2026-08-28-V11-HANDOFF-SUPERVISOR-OMC.md` — supervisor control loop (V11); later superseded by V12 (A–J conveyor) and V13 (final Story 174.5) orchestrator prompts.
3. `docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md` — the deep process canon (19 sections: story lifecycle §7, UX contracts §8, ownership/forbidden §9, gates §10, and the complete debt register §11). Remains a reference for the debt vocabulary (§11.9 status dictionary).
4. `docs/HANDOFF-2026-08-30-TEAM-HANDOFF-173.13-EPILOGUE-174-FULL-DEBT.md` — was the continuation entry point through Stories 174.1–174.2; superseded.
5. `docs/HANDOFF-2026-09-01-TEAM-HANDOFF-174-5-FINAL-CLOSEOUT-AND-DEBT.md` — the 174.5 closeout brief; superseded.
6. `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` — **the final handoff and current entry point for maintainers**: program completion summary, final gates and how to re-run them (including the parity base-pin note), the complete **owner-escalated debt register** (§4), an explicit owner-decision checklist (§5), maintainer entry points (§6), and the P0→P3 onboarding backlog (§8). The deep 08-29 §11 debt canon remains its reference vocabulary.

Worktree hygiene, summarized:

- One story = one branch `cdx/epic-{epic}-story-{story}-{slug}` = one temporary worktree at an explicit validated path (`/private/tmp/wb-repricer-fe-...`), created from current `main` only after prerequisites merge; never reuse a stale branch or another story's worktree. The standing operator policy is sequential execution; numeric order is safe and satisfies the DAG.
- Subagents never commit/push/merge — git operations belong exclusively to the orchestrator; each wave of a story runs in the single story worktree with non-overlapping file lists.
- Every Agent call in this environment requires an explicit model tier (`opus`/`sonnet`/`haiku`); defaults are executor=sonnet (opus for hard edits), code-reviewer=opus, explore/verifier/writer=sonnet.
- Mandatory cleanup is completion evidence, not housekeeping: PR merged with `--match-head-commit` identity fences, exact recorded PR number, remote branch deleted via exact-old-SHA lease, worktree removed, `git worktree prune`, verified 0/0/0 (remote/local/worktree) and primary checkout in sync. Story 173.1 proved exact cleanup for both its feature and closeout lanes, 173.8 and 173.9 through all three lanes (feature/closeout/auxiliary, no residue), 173.13 through feature + exact-five docs + auxiliary (#365/#366/#367), 174.1 through feature + exact-five closeout (#369/#370) plus lifecycle PR #371, and 174.2 through feature PR #372 (remote+local branch absent, worktree removed, prune ran); the audits recorded 0/0/0 across all completed Epic 172–174.2 lanes.

Cross-team cautions: parallel teams/sessions are real (PRs #295/#296/#300/#301 landed on top of other sessions' PRs; a mid-flight 172.10 collision was resolved by the owner absorbing the parallel delta and re-running the full pipeline). Never touch foreign worktrees; on a mid-flight conflict for the NEXT story, take the next unclaimed story per the registry instead of duplicating. Registry/handoff vs repo drift resolves in favor of the repo, corrected in the next closeout commit.

## Post-migration debt registry (the program's aftermath)

With the program closed, nothing below blocks anything — every item is **owner-scoped**, registered with status, fix-canon, and evidence in the final handoff (`docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` § Debt escalation), and several 2026-09-02 post-program waves already landed (PRs #382–#385) with artifacts under `_bmad-output/implementation-artifacts/debt-*.md`.

**Resolved during the final window / aftermath:**

- **PB-4** — FeedbackButtons `text-green-700` 3.53:1 dark-theme AA failure (the origin comment falsely claimed "≈6.5:1") — fixed via the solid `bg-status-success` pair (D-3, PR #384; artifact `debt-d3-d4-wcag-solid-pairs.md`); its boundary exception lifted the same day.
- **PB-2** — nested `<main>` on `/analytics/ai-admin/preferences` (+ parallel `/models` location, 97.1 propagation) — `<main>` → `<div>` (D-5, PR #385; artifact `debt-d5-pb2-nested-main.md`).
- **/15-family** — text-status on /15 tints <4.5:1 in `margin-status-helpers.ts` + `AcceptanceStatusBadge.tsx` — solid pairs applied (D-4, PR #384); ~100 remaining /15 sites repo-wide are an owner sweep.
- **FE-D9** — `logApiError` logged non-2xx bodies including secrets — `redactSensitive` redact layer in both branches (PR #382; artifact `debt-fe-d9-redact-logger.md`).
- **SEC-DOC-1** — plaintext credentials in tracked docs — both literals removed, non-echoing scan = 0 (PR #383; artifact `debt-sec-doc-1-redact-creds.md`); rotation of the live credential, the backend repo (135 stale hits), and git history remain an explicit owner request (`docs/security/SEC-DOC-1-rotation-owner-decision-2026-09-02.md`).
- **C6** (tabular-nums) resolved-by-migration, pinned by RTC tests; the 174.2-registered pre-existing liquidity e2e failures (×12) were resolved by 174.3 and the monitor weekly-chart failure (×1) fixed by 174.4.

**Confirmed live, awaiting owner triage:**

- **PB-1** — silent cabinet-create failure: nonce-less session → settlement `indeterminate` → `handleCreateCabinet` silently skips, the recovery alert never renders (`src/lib/api.ts:128` + `src/stores/authStore.ts` sessionNonce). Priority one in the owner checklist.
- **PB-3** — no reactive 401-refresh interceptor in the api-client (proactive `useAuth.refreshTokenIfNeeded` only); the actual behavior is pinned by `src/lib/api/__tests__/api-client-401-refresh.test.ts`.
- **/80-sweep** — repo-wide `text-*/80` (pricing/automation/cashflow/popover + hover variants) at historical 3.2–3.45:1; needs measure-then-replace-or-exception, a candidate for boundary-scanner extension.
- **Boundary cat-1 residue** — 459 registered violations across ~59 live files; owner-sweep through the ratchet (C14 pattern), explicitly not a mechanical replacement.
- **C-series leftovers** — C5 waterfall dual color authority (hex ↔ tokens, chart-palette owner decision), C13 GapsTable caption duplication, C15 `URGENCY_CLASS` localized keys, C8 `FunnelPageContent` at the 200-line cap.
- **FE-D1/D3/D5/D8** — mutation retry:1 retrying 4xx; raw `getErrorMessage`; cross-tab cabinet CAS/Web Locks; `SAFE_RECONCILIATION` stuck-path.

**Environment/harness gaps and canons:**

- **AT-matrix** — real screen readers (VoiceOver/NVDA/JAWS/TalkBack) were never executed; proven instead: Chromium+Firefox keyboard, WebKit semantic proxy, axe, and 200% zoom across 76 routes × 2 themes. Owner must run real SR or accept the residual release risk.
- **Manager-creds** — Manager journeys skipped (22–23 optional skips).
- **FR-7** — nmId 202867769 W26 FBS variants absent after a DB reseed; 2 e2e unrunnable until reseed or re-pin.
- Harness canons: shared `next dev` degrades under repeated suite runs (restart-per-run, tmp-worktree pattern); BE login throttle 5/hr shared; storageState TTL ~1h with a preflight that treats stale sessions as fresh.
- **P3 process leftovers** — 39 pre-existing `format:check` warnings; the docs-95 baseline canonical-vs-archival split; unifying ~25 route guards; deleting the stopped pm2 registration (id 5).

The standing FE-debt table (FE-D1…FE-D9), wave carry-outs C1–C18, BE-debt, and contrast escalations remain catalogued in `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` (final snapshot 2026-09-02), cross-referenced against the final handoff's escalation register.

## The 169 paid-storage lane (cross-repository exception)

Story 169.14 established the authoritative paid-storage import lifecycle/result contract in the **backend** repository: BullMQ `waiting | delayed | prioritized | waiting-children` map to wire `pending`, `active` maps to `processing`, terminal states keep their meanings, and BullMQ `unknown` fails closed as wire `failed` with sanitized `UNKNOWN_QUEUE_STATE` detail. Story 169.15 aligned the shared frontend boundary and may use a frontend-only `unknown` sentinel solely for an unrecognized backend wire value. Story 169.12's route presentation had merged early (PR #227) and was only closed after the 169.14 → 169.15 chain validated the route (contract-closeout lane PRs #299/#304), closing Epic 169 at 15/15.

This lane carries unusually strict evidence machinery (serialized single-leader lifecycle, mode-600 review-bootstrap and record-retirement transactions, payload-hash-verified RED/reviewer/manifest evidence re-read from trusted history, and a suffix-aware secret scan rejecting credential families across `=`, `:=`, `+=`, `-=`, `?=`, `&&=`, `||=`) because it is the only authorized cross-repository contract change; see the plans `169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md` and `169.15-align-shared-frontend-paid-storage-import-boundary.md` under `.omx/plans/` for the executable detail. For frontend stories, the practical takeaway is: the paid-storage wire contract above is authoritative, and no other story may touch backend contracts.
