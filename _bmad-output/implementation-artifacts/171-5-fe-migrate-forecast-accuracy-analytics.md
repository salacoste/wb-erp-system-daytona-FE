# Story 171.5-FE: Migrate Forecast Accuracy Analytics

Status: review — micro cycle + guard joins fix on branch; PR/merge/cleanup pending

## Story

As a business owner, I want `/analytics/forecast-accuracy` to show forecast accuracy (MAPE) by horizon and SKU, so that I can judge AI forecast quality.

Plan: `.omx/plans/171.5-migrate-forecast-accuracy-analytics.md` (authoritative — branch `cdx/epic-171-story-5-forecast-accuracy-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-5-accuracy-shadcn`). **MINOR-GAP story** (compliance verdict): born token-clean except 1 amber site; small RTC deltas.

## Acceptance Criteria

Per plan (C1-C11 apply; route self-identifies as Story 123.4 — provenance comments updated on migration).

## Tasks / Subtasks

- [x] Task 0: NONE — hook read-only (cabinet-scoped, no coercions flagged).
- [x] Task 1: Behavior lock — baseline **39 tests / 5 files**. LOCK: binary MAPE band (>200 high — text-swap non-color marker + caption swap + extreme ≥1000 Alert); null MAPE «—»; slice(0,20) SKU cap; horizon table unpaginated; single generic error Alert; loading skeleton; empty per-table messages; h1 text-2xl ×1 «Точность прогнозов»; e2e pins (role/heading/locale-regex — palette-safe).
- [ ] Task 2 (gaps):
  1. `AccuracyMetricsCards.tsx:69` `text-amber-600` → `text-status-warning` (binary band; marker preserved).
  2. TableCaption ×2 («Точность прогнозов по горизонтам» / «по SKU» — match table titles; static).
  3. tabular-nums on numeric cells (nmId font-mono stays no-tabular); `th scope="row"` on row-header cells where applicable (Horizon table first col if row-header semantics exist — read; SKU table nmId is NOT a th).
  4. Provenance comments 123.4 → add Story 171.5 note (keep 123.4 history line).
  - DISPOSITION: 403/partial branches — hook has none to test (no contract); unknown-model N/A (no model selector).
- [x] Task 3: micro-guards — born-clean pin (no-palette/no-hex 5 production files) + warning-token pin + caption pins.
- [x] Task 4: Validation + 1 fresh review (proportionate: ~6-line production diff) + PR + cleanup — e2e forecast-accuracy.spec.ts on branch.

## Dev Notes

- Owned: forecast-accuracy/** (10 files, 800 lines). READ-ONLY: useForecastAccuracy hook, ui kit, formatters.
- Baselines: 39/5; full floor **19 241/0**. Canon: 171.1-171.4 micro/no-op discipline; warning token; caption 169.7.

### References

- [Source: plan `.omx/plans/171.5-migrate-forecast-accuracy-analytics.md`; C1-C11]
- Compliance verdict MINOR-GAP (4 items)

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct micro cycle (`62c4ab16` + guard fix `18ca6873`). Review: 1× code-reviewer (opus fresh) — APPROVE (code).

### Post-1st-pass-review fixes (2028-26)

Story reconciliation (this record); th-scope disposition documented (review-L2): horizon first col is DATA not row-header — kept TableCell, no scope. hex-regex =-prefix: not adopted (marginal; palette-regex + lint cover).

### Debug Log References

### Completion Notes List

- Born-token-clean + 1 amber: text-amber-600 → text-status-warning (binary MAPE>200 band; text-swap + caption-swap markers preserved); TableCaption ×2 spec-order ABOVE header (171.2 r2 canon; visual bottom via ui caption-bottom); tabular-nums horizon-col + right cols (nmId font-mono no-tabular); provenance 123.4→(migrated 171.5) ×4 files.
- scope=row disposition: horizon col is data, not row-header — kept TableCell.
- Guard-5: catalog pinned 5 (page.tsx + 4 components; resolve(dirname(fileURLToPath(import.meta.url)),'..','..') from components/__tests__ → route root); no-palette/no-hex self-tested; warning-token pin; caption pins.
- Process lesson caught live: `echo EXIT=$?` between && links RESETS $? — the && chain continued on a red suite (guard ENOENTs). Fix commit separate; reviewer verified no masked source regression.

### Gaps

- hex-regex `=`-prefix alternate not adopted (marginal exposure; optional).
- No charts in route — no sr-alternative needed.

### File List

Diff a26e78e9..HEAD = **5 files** (4 M components + 1 A guard test); +~90/−12. Exact: `git diff --name-status a26e78e9..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from compliance-check recon (born-clean + 1 amber; captions/tabular/scope; provenance 123.4→171.5 note). Plan referenced as authoritative. |
| 2026-08-26 | Micro cycle + guard joins fix + review dispositions. Status: ready-for-dev → review. |
