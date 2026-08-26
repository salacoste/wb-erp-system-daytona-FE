# Story 171.1-FE: Migrate AI Anomaly Triage

Status: review — implementation + r1/r2 fixes on branch; PR/merge/cleanup pending

## Story

As an authorized AI administrator, I want `/analytics/ai-admin/anomalies` to present anomaly identity, severity, evidence, status, and resolution safely, so that I can triage and resolve anomalies with an auditable outcome.

Plan: `.omx/plans/171.1-migrate-ai-anomaly-triage.md` (authoritative — branch `cdx/epic-171-story-1-ai-anomaly-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-1-anomaly-shadcn`). **MINOR-GAP story** (compliance-check verdict): palette already clean (0 legacy sites — built on tokens from birth); 7 cheap contract gaps; no full cycle needed.

## Acceptance Criteria

1. **Given** authorized anomaly data, **when** migrated, **then** anomaly classification/severity, evidence, timestamps, filters/sort/page, resolve validation/confirmation, mutation payload, invalidation, and final status preserve current behavior.
2. **Given** no anomalies, filtered-empty, unknown anomaly/status, stale/partial evidence, restricted access, resolve pending/success/failure, or conflict/already-resolved state, **when** rendered, **then** state and safe next action are explicit and input is retained after recoverable failure.
3. **Given** keyboard/touch or narrow layouts, **when** an anomaly is selected and the resolution dialog opens/closes, **then** entity identity, queue context, focus lifecycle, exact scope, and outcome announcement remain usable.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: NONE — route built token-clean; no boundary files in scope (hooks/api read-only; no red flags flagged — severity unrendered is a preserve-migration N/A, not a boundary lie).
- [x] Task 1: Behavior lock — baseline **23 tests / 3 files** (AnomaliesList 13?, page ?, Dialog ? — establish exact). LOCK: server-default sort (comment :123 documents non-interactive — N/A aria-sort); status Badge text+color; resolve mutation narrow-invalidation (anomaliesKeys.all(cabinetId)); 403 vs generic error branches (tested); toast+close on success; hydration-null skeleton; restricted-admin denial (tested); id primary column font-mono (AP#10 comment); AP#8 nulls if any.
- [x] Task 2: The 7 gaps (compliance-checker enumerated):
  1. `<TableCaption>` naming AI anomalies («Аномалии ИИ-прогнозов» or existing domain wording — read page header for canonical noun; 169.7 static picker-semantic)
  2. Resolve buttons aria-label WITH anomaly identity («Разрешить аномалию #id» — repeated-controls-name AX; dialog title already has it — mirror)
  3. tabular-nums on nmId + triggeredAt cells (id stays font-mono — no tabular, negative pin)
  4. filtered-empty ≠ no-anomalies message distinction (filter=resolved/pending → «Нет аномалий с выбранным фильтром» + visible reset path if filter control exists — READ the filter UI first; if server-side filter param exists in hook, mirror its UX)
  5. 409/already-resolved conflict message in Dialog onError (distinct from generic; input retained per AC-2)
  6. Unknown anomalyType neutral fallback (localized «Неизвестный тип» muted — 169.x unknown=muted canon) + test
  7. pending-state announcement: aria-live="polite" на dialog submitting state OR aria-busy on form (progress announced once — F-12 polite precedent)
  - DISPOSITION-NOT-FIX: severity unrendered (preserve-migration — field plumbed but not displayed today; adding = feature, out of scope; document); pagination single-page v1 (data.page/limit unused — N-A).
- [x] Task 3: Guards — light: no-palette/no-hex over 4 production files (route was born clean — pin stays); caption/aria-label/tabular pins; unknown-type + 409 + filtered-empty tests (new); pin NOT-severity-rendered? (no — absence pins are brittle; document in Gaps).
- [x] Task 4: Validation + 2-pass fresh review + PR + cleanup — route **37/4** (baseline 23/3; +14 growth incl. guard); full **19 217/0** (floor 19 204); lint 0/0; tsc 0; max-lines OK; build 0. e2e N/A (no anomalies spec; orders-price-anomaly = different route). Reviews: r1 opus APPROVE (1 MEDIUM static-mock server-param + 3 LOW → F1 apply-time pins + F2 min-h-11 + F4 cause-pin applied `9945ebd2`; F1-reset over-strict pin → cached-entry rationale `8d9867ea` — hook-level gcTime/staleTime override test-client defaults, r2-VERIFIED accurate not laundering); r2 opus **APPROVE — merge gate passes** (2 LOW: L1 min-h-11 source-pin applied `23a8be93`; L2 196-lines extraction → Gaps). CE: 5-file diff, siblings/hooks/api zero-diff.

## Dev Notes

- Owned: anomalies/** (7 files, 820 lines). READ-ONLY: sibling ai-admin trees, useResolveAnomaly + anomaly hooks/api, ui primitives.
- Baselines: 23/3 owned; full floor **19 204/0**. Node 24.18.0/npm 11.11.0.
- Canon: TableCaption 169.7; unknown=muted 169.11-13; repeated-controls-name (this epic's AX literal); tabular-nums + mono-negative-pin 169.x; conflict-distinct 170.4 honest-state; polite live F-12.

### References

- [Source: epics-166-174 §Story 171.1 + §C1-C11]
- [Source: `.omx/plans/171.1-migrate-ai-anomaly-triage.md`]
- Compliance-check verdict MINOR-GAP (7 items) — this story's scope

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) (`707434fa`) + orchestrator-applied r1/r2 fixes (`9945ebd2`, `8d9867ea`, `23a8be93`). Reviews: 2× code-reviewer (opus fresh) — APPROVE / APPROVE merge-gate.

### Post-1st-pass-review fixes (2026-08-26)

F1 server-param contract pins (apply-time toHaveBeenLastCalledWith; reset re-call pin was OVER-STRICT — test QueryClient cache-hit, replaced with verifiable rationale); F2 min-h-11 reset (44px canon); F4 cause-retention «Прочее» pin. F3 (196-lines extraction) → Gaps.

### Post-2nd-pass-review fixes (2026-08-26)

L1 min-h-11 source-pin (guard pattern; path-helper initially FILE_PATHS→ReferenceError — caught by own run, fixed to join(componentsDirectory)). L2 extraction → Gaps.

### Debug Log References

### Completion Notes List

- MINOR-GAP cycle on a born-token-clean route (0 palette sites — 105.2-FE pre-flight ruled NOT no-op: 7 real contract gaps): TableCaption «Аномалии ИИ-прогнозов»; resolve aria-label «Разрешить аномалию #id» (mirrors dialog title); tabular-nums nmId+triggeredAt (id mono-negative); filtered-empty ≠ no-anomalies + «Сбросить фильтр» min-h-11 (client Select statusFilter → server param — mechanism DISCLOSED by executor); 409 «Аномалия уже разрешена» + input retention (cause+note pinned); unknown-type = blank→«Неизвестный тип» muted (DISCLOSURE: anomalyType is a FREE string — no FE enum exists; blank-check, garbage renders raw per preserve-migration); pending aria-busy + sr-only polite «Отправка данных…».
- Dispositions (guard header): severity unrendered (preserve-migration N/A — field plumbed, adding = feature); pagination single-page v1 N/A; aria-sort N/A (server-default sort documented).
- Guard: recursive catalog pinned 4 production files; no-palette/no-hex (route born clean — pin holds); min-h-11 source-pin.

### Gaps

- AnomaliesList.tsx 196/200 lines — empty-state/filter-controls extraction on next touch (r1-F3/r2-L2).
- No anomalies e2e spec (route never covered; candidate for 174.4 consolidated pass).
- severity field plumbed-but-unrendered — future feature decision, not migration.

### File List

Diff a133e7dd..HEAD = **5 files** (M AnomaliesList, M ResolveAnomalyDialog, M 2 test files, A anomalies-presentation-source-contracts.test.ts); +~330/−11. Exact: `git diff --name-status a133e7dd..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from compliance-check recon (0 legacy — token-clean from birth; MINOR-GAP: 7 contract items; severity-render + pagination dispositioned N-A preserve). Plan referenced as authoritative. |
| 2026-08-26 | r1 fixes (param pins, 44px, cause pin; over-strict reset pin → rationale) + r2 fixes (min-h-11 source pin). Status: ready-for-dev → review. |
