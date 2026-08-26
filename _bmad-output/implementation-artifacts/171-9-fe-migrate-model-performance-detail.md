# Story 171.9-FE: Migrate Model Performance Detail

Status: done — PR #270 merged (`2d46a175`); proportionate 1-pass fresh review **APPROVE** (0 defects); e2e on branch 13/1↓/0 via npm wrapper; light+dark visual incl. chart; cleanup 0/0/0. **Epic 171: 9/9 — models tree fully migrated.**

## Story

As a model analyst, I want `/analytics/models/[id]/performance` to connect model identity, performance metrics, MAPE trend, and evaluation history, so that I can judge model quality and trace changes to evaluation runs.

Plan: `.omx/plans/171.9-migrate-model-performance-detail.md` (authoritative — branch `cdx/epic-171-story-9-model-performance-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-9-model-performance-shadcn`). **MINOR-GAP-plus story** — the only epic-171 subroute that actually carried palette (6 sites) + chart hex (8 sites) pre-change.

## Acceptance Criteria

Per plan (product AC 1-3 + plan/delivery AC 4-9). Route self-identifies as Story 109.5 — provenance comments updated on migration.

## Tasks / Subtasks

- [x] Task 0: hooks read-only (`useAiModels` + `useModelPerformance` enabled-gating — untouched).
- [x] Task 1: Behavior lock — baseline **41 tests / 1 file**. LOCK: state chain (loading→list-error→not-found→perf-error→happy); F-3 explicit null-guards; prevMetrics gating (`model.version > 0`); AP#8 em-dashes (null mape, delta); delta valence sign semantics; DRIFT labels; empty-trend Alert; AC-7 history rows; «Подробные оценки» link.
- [x] Task 2 (gaps):
  1. `DRIFT_BADGE_CONFIG` ×3 + `DRIFT_NULL_CONFIG` palette → semantic status tokens, hue-preserving (green→success, blue→information, red→error, gray→muted; 171.6 canon shapes) — dark-mode fixed (old palette was light-only).
  2. `getMapeDeltaColor` valence: green/red-600 → `text-status-success`/`text-status-error` (171.4 valence canon; sign semantics preserved).
  3. `MapeTrendChart` 8 hex → CSS variables per **171.4 chart canon** (verified parity against live ForecastChart): grid/axisLine/tickLine → border var; tick fill ×2 → chart-axis var; line stroke + activeDot → chart-1 categorical var (brand-red → categorical hue change deliberate + disclosed, same decision class as 171.4 AI line).
  4. **className detach**: `PERFORMANCE_STATUS_BADGE_CLASS: Record<ModelStatus,string>` (byte-identical 1:1 to registry 171.6 tokens, all 7 statuses — reviewer verified); label stays from `STATUS_BADGE_CONFIG[model.status].label`.
  5. `TableCaption` «История оценок — {type} v{version}» (optional captionText from Detail; spec-order above header); `tabular-nums` ×2 (MAPE, SKU).
  6. Shell `p-6` removed; provenance ×5.
- [x] Task 3: guard `__tests__/model-performance-presentation-source-contracts.test.ts` — 9 tests: catalog 5 files, no-palette/no-hex (canonical), drift/valence status-token pins, **chart CSS-variable pins**, detach pin (positive+re-coupling ban), caption pins (producer+consumer), tabular, padding. Anchor-safe relative-first enumeration (171.8 lesson).
- [x] Task 4: test re-pins: 4 DRIFT hue-substring pins (green/blue/red/gray → status-success/information/error/muted — MORE specific, not weakened) + 2 valence exact-equality pins (→ text-status-success/error); +1 NEW caption role-pinned test. Reviewer confirmed re-pins, not weakenings.
- [x] Task 5: validation + 1 fresh review (APPROVE) + PR #270 + cleanup 0/0/0.

## Dev Notes

- Owned: `performance/**` only (page + 4 components/helpers + 1 test file + 1 new guard). `model-list-helpers.ts` NOT edited (verified by reviewer: `git diff main -- models/components/` = 0).
- Baselines: targeted 41/1; full floor **19 271/0** → **19 281/0** (+10 exact = 9 guard + 1 caption).

### References

- [Source: plan `.omx/plans/171.9-migrate-model-performance-detail.md`]
- Compliance verdict MINOR-GAP-plus (6 palette + 8 chart-hex + caption/tabular/padding/provenance)
- Chart canon: ForecastChart.tsx (171.4, live source of truth); token canon: model-list-helpers.ts (171.6)

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct micro cycle (`6df8c44d`, single commit). Review: 1× code-reviewer (opus fresh) — **APPROVE** (0 real defects; reviewer independently reran targeted 51/51, models tree 245/245, tsc/lint, surface diff audit, and verified the scope decision + token parity).

### Post-1st-pass-review fixes (2026-08-26)

- 0 code findings — nothing to fix. Notes dispositioned:
- r-LOW (process condition — SATISFIED in this closeout): the 174.2 carry-out list recorded below + in the registry NEXT note.
- r-NIT ×3 keep: padding pin covers only Detail (others verified clean by reviewer sweep); detach regex doesn't catch destructured reads (positive pin adequate); catalog pin fails loudly on new files (intentional canon property).

### Scope decision (orchestrator, live-code-over-docs — reviewer CONFIRMED)

The V9 prompt's special note pre-assigned the `STATUS_BADGE_CONFIG.className` field removal to 171.9 ("last [id]-consumer to detach"). Pre-flight disproved the premise: **`ModelListSection.tsx:149` (registry root, forbidden tree) also renders `badge.className`** — field removal would require editing 3 forbidden files (model-list-helpers.ts + ModelListSection.tsx + the 171.6 guard's token pins which read the helpers directly). Decision: 171.9 detaches ONLY its own consumer (byte-identical route-local map → future removal = pure deletion, zero visual risk); the field stays for the registry consumer. This follows the plan's own conflict rule (live code + passing tests govern; forbidden edit → stop → orchestrator resolution).

### **Carry-out list for the 174.2 owner (route-ledger handoff, r-LOW condition):**

1. Remove `className` field from `STATUS_BADGE_CONFIG` (`models/components/model-list-helpers.ts`) once `ModelListSection` migrates to its own overlay.
2. Rewrite the stale ownership comment at `model-list-helpers.ts:24-26` ("field stays because subroutes 171.7/171.9 overlay it" — sole consumer is now ModelListSection only).
3. Rewrite the stale comment at `evaluations/components/evaluations-list-helpers.ts:20-23` ("removal owned by Story 171.9" — 171.9 detached but could not remove; ownership now 174.2).
4. Relocate the 171.6 guard's status-token pins (`model-registry-presentation-source-contracts.test.ts:59-68`) — they read the helpers file directly and must follow the field's removal.

### Debug Log References

### Completion Notes List

- /tmp logs: 171-9-baseline/targeted/models/lint/tsc/ml/build/full/e2e.
- E2E attestation: `npm run test:e2e -- e2e/analytics/ai-models.spec.ts --reporter=line` in the worktree; wrapper expanded to 14 = 13 passed / 1 skipped / 0 failed (incl. both performance-page tests).
- Visual (playwright-cli live login): a11y — h1 «Производительность модели», badge «Активна», `table "История оценок — Прогноз выручки (день) v3"` WITH caption node; light full-page — chart line in categorical color, grid light gray, badges readable, zero defects; dark full-page — chart visible, badges/table readable, no light-only defects. Guard self-match trap: no recurrence (comments written in prose from the start).

### Gaps

- Between-breakpoint / 200%-zoom / reduced-motion manual passes not captured as screenshots (unit + e2e + light/dark full-page cover the delta; micro-cycle proportionality per §6.2).
- 171.6 guard still joins-before-filtering (latent anchor-safety class, non-firing for known worktree names) — included in the 174.2 carry-out class noted in 171.8.

### File List

Diff 4fcc4b50..6df8c44d = **7 files** (6 M + 1 A guard test); +218/−42. Exact: `git diff --name-status 4fcc4b50..6df8c44d`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story planned (MINOR-GAP-plus recon — the only palette+hex-carrying epic-171 subroute). Plan referenced as authoritative. |
| 2026-08-26 | Micro cycle: single commit 6df8c44d; scope decision (field removal deferred to registry owner — registry-root consumer disproved the "last consumer" premise); 1×opus APPROVE (0 defects). Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: PR #270 (`6df8c44d`, merge `2d46a175`); targeted 51/2 (+10 exact), full 19 281/0 (floor 19 271), models tree 245/14, lint 0/0, tsc 0, max-lines OK, build (webpack) OK, e2e-on-branch 13/1↓/0; light+dark visual incl. chart; cleanup 0/0/0. **Epic 171: 9/9 complete — models tree fully migrated; retrospective optional.** Status: review → done. **Lessons:** (1) «Последний отвязавший удаляет поле» ломается: registry-root тоже потребитель — проверяй ВСЕХ заранее. (2) Chart-канон 171.4 переносится дословно по живому ForecastChart: border/chart-axis/chart-1. (3) Palette-substring тест-пины обновляй на token-substring — это re-pin (строже), не weakening. |
