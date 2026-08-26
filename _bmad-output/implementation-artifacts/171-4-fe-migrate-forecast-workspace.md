# Story 171.4-FE: Migrate Forecast Workspace

Status: done — PR #258 merged (`5a1e40f1`); 2-pass fresh review (REQUEST CHANGES→fixed→APPROVE merge-gate); e2e on branch 11/1↓/0; cleanup 0/0/0

## Story

As a business owner, I want `/analytics/forecast` to show AI sales forecasts with confidence bands, model selection, and readiness states, so that I can plan stock and evaluate AI vs naive baselines.

Plan: `.omx/plans/171.4-migrate-forecast-workspace.md` (authoritative — branch `cdx/epic-171-story-4-forecast-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-4-forecast-shadcn`). Full-cycle story (17 source files, 14 test files, ~37 legacy sites, 2 e2e specs incl. 1 for this route).

## Acceptance Criteria

Per epic §Story 171.4 (BDD ×3 + plan delivery ACs — see plan; recon §4-5 contracts authoritative).

## Tasks / Subtasks

- [x] Task 0: NONE — `horizonDays ?? 0` (normalizer :53) = response ECHO field, never rendered (route horizonDays = client state 7/14/21/28) — no UI-reaching lie, disposition. Other candidates already dispositioned by 108.2/108.3 (#3), SEMANTIC-ZERO (#4), DISPLAY-GUARD (#5).
- [x] Task 1: Behavior lock — baseline via RUNNER (recon: 144 literal it-sites but param cases may make 183 — runner number is truth; 14 files). LOCK recon §5 items 1-10: band formula (0.10 floor, null-units→null-band, null-conf→0 semantic-zero); Math.round boundary; AP#8 nulls «—» tooltip/table/metrics (BD-35); naive=UNITS (iter-78); aiVsNaive valence by string prefix; query gate (sku→nmId positive-int; horizon 7/14/21/28); readiness default-to-ready + aiEnabled default-true; weeksRequired null + progressPct ?? 0 DISPLAY-GUARD; connectNulls=false ×2 (Epic 113 I1); readiness state machine (collecting/sneak_preview/ready); aiEnabled=false short-circuit + re-enable alert; FeedbackButtons inline; TopSkus/SneakPreview per-section errors (Pattern-1 ✓ already); NO URL sync (preserve — disposition like 170.7's decision: feature-add).
- [x] Task 2: Token migration (~37 sites):
  - **ForecastChart** (13 hex — the real work): grid/axis `#EEEEEE`×4→border, `#757575`×2→chart-axis (169.4 canon); confidence band fill `#E53935 opacity-0.15` → status-error /15 equivalent (var-based fill-opacity — use fill=var(--color-status-error) with existing opacity prop or /15 pre-mixed — document); **band cutout `#ffffff` opacity-1 (LIGHT-ONLY dark bug)** → var(--color-background) (dark-FIX); naive baseline `#9CA3AF` dashed → chart-axis-neutral or chart-3 (dashed preserved = non-color marker); AI line + activeDot `#E53935` → chart-negative valence (higher prediction = brand red historically — semantic decision: AI-prediction series = chart-1 primary, naive = muted dashed; DOCUMENT choice — no valence semantics in a forecast line, both are neutral data series → categorical chart-1 (AI) + muted dashed (naive) is the 170.x-consistent reading).
  - **ForecastTable**: BAND_STYLES high/med/low green/yellow/red-600+50 → status-success/warning/error text + /15 bg matched pairs (text labels Высокая/Средняя/Низкая preserved = non-color ✓); getAiVsNaive → financial-positive/negative (valence by +/- — 169.4).
  - **Valence sweeps**: SneakPreview trend icons → financial; Collecting (purple Brain→muted-primary?; green Check→status-success; amber-700 missing→status-warning; blue Bell→status-information; purple TrendingUp→muted); Header purple Brain→muted (decorative); StatusBadge dots green/amber/red-500 → status-success/warning/error solid; amber-600/red-600 texts → status-warning/error.
- [x] Task 3: RTC/AX additions: **sr-only data alternative for the chart** (none beyond role=img label — add: every date × AI/naive values at tooltip precision + band note; 169.11 canon); TableCaption «Прогноз продаж» (static, params-driven — 169.7); tabular-nums numeric cells (date col as-is); scroll-region; h1 stays in Header (text-2xl verify).
- [x] Task 4: Guards — recursive no-palette/no-hex (170.1 3-branch canon + self-tests) + pinned file count (17 source); band-tier-collapse (3 distinct + label); cutout-var pin (no #ffffff); naive-dashed pin; sr-alternative tests; e2e forecast-page.spec.ts on branch (palette-safe; forecast-accuracy = DIFFERENT route, N/A).
- [x] Task 5: Validation + 2-pass fresh review + PR + cleanup — route **196/20** (baseline 183/19; +13 guard growth); full **19 241/0** (floor 19 228, +13 exact); lint 0/0; tsc 0; max-lines OK; build 0; **e2e ON BRANCH 11✓/1↓/0✗** (forecast-page spec). Reviews: r1 opus **REQUEST CHANGES** (1 HIGH — cutout var(--color-background) WRONG SURFACE: dark bg 3.9% over card 6.7% = near-black slab; +2 LOW → CARD-token fix + guard-lockstep + honest sr-comment `307295be`); r2 opus **APPROVE — merge gate PASS** (0 blocking; caption-deviation + 18-pin disclosed-acceptable; globals.css values verified 3.92/6.67). CE: shared surfaces zero-diff. PR #258 merged `5a1e40f1`; branch remote/local + worktree deleted, 0/0/0 absence proofs.

## Dev Notes

- Owned: forecast/** (31 files, 3 204 lines). READ-ONLY: useAi* hooks (useAiPreferences shared with 171.3 route!), ai-forecast-normalizer, types/ai, FeedbackButtons, ui kit, formatters.
- Baselines: runner-derived (recon 144-literal; param cases TBD); full floor **19 228/0**. Node 24.18.0/npm 11.11.0.
- Canon: 169.4 (grid/axis, tier-collapse), 169.5 (/15+/30), 169.11 (sr-table, hex-guard), 170.3 (h1), 171.1/171.2 (born-clean guards). NO URL-sync = preserve disposition (170.7 precedent).

### References

- [Source: epics-166-174 §Story 171.4 + §C1-C11]
- [Source: `.omx/plans/171.4-migrate-forecast-workspace.md`]
- Recon §2 legacy inventory; §8 dispositions

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) (`d569e813`) + orchestrator-applied r1 (`307295be`). Reviews: 2× code-reviewer (opus fresh) — REQUEST CHANGES / APPROVE merge-gate.

### Post-1st-pass-review fixes (2026-08-26)

F1 HIGH: cutout fill var(--color-background) → var(--color-card) — r1 verified globals.css dark bg 3.92% vs card 6.67% (background painted a near-black slab over the Card); guard pin lockstep (F4). F2 LOW: sr-table comment byte-for-byte claim → numeric-formatting-matches + null divergence disclosed. F3 LOW: caption deviation (plain <caption> mt-3 text-xs vs ui TableCaption mt-4 text-sm) — accepted-disclosed, same tokens/semantics.

### Debug Log References

### Completion Notes List

- ForecastChart (13 hex): grid/axis → border/chart-axis (169.4); band fill status-error var + fillOpacity 0.15 composes; **cutout → var(--color-card) fillOpacity 1 (dark-FIX — r1 caught my executor's var(--color-background) as a second light-only-equivalent bug: bg≠card in dark)**; naive → chart-axis + strokeDasharray 4 4 kept (non-color marker); AI line+activeDot → chart-1 (categorical: both series neutral data — documented).
- ForecastTable: BAND_STYLES → status-success/warning/error text + bg-X/15 (labels Высокая/Средняя/Низкая preserved); getAiVsNaive → financial-positive/negative; 2 literal test pins flipped.
- Valence sweeps: SneakPreview → financial; Collecting purple→muted/green→success/amber-700→warning/blue-500→information; Header Brain→muted-foreground; StatusBadge dots → status solids; toggle amber → warning.
- NEW ForecastChartSrTable (42 lines; chart 160) — every date × AI/naive Math.round + band column, nulls «нет данных», caption band-note.
- Guards-13: recursive catalog pinned 18 (17+sr-table — disclosed); no-palette/no-hex self-tested; cutout-var CARD pin; naive-dashed pin; band-tier-collapse 3+labels; caption/tabular/scroll-region pins.
- Locks preserved: getForecastBand formula/0.10-floor untouched (helpers NOT in diff); Math.round; connectNulls ×2; AP#8 «—»; readiness machine; DISPLAY-GUARD.

### Gaps

- Plain <caption> vs ui TableCaption (mt-3 text-xs vs mt-4 text-sm) — accepted, same tokens/semantics (r1-F3).
- No URL-sync (preserve disposition — feature-add like 170.7 verdict).
- forecast-accuracy.spec.ts = DIFFERENT route (162.6) — N/A for this story.
- Visual/dark-mode browser matrix → 174.3.

### File List

Diff 15bbb5ab..HEAD = **10 files** (8 M + 2 A: ForecastChartSrTable.tsx, forecast-presentation-source-contracts.test.tsx); +~326/−50. Exact: `git diff --name-status 15bbb5ab..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from deep recon (full-cycle: 13 chart-hex incl. LIGHT-ONLY #ffffff cutout dark-bug; band tiers; valence sweeps; sr-alternative missing; horizonDays disposition). Plan referenced as authoritative. |
| 2026-08-26 | r1 fix (CARD-token cutout + guard lockstep + honest sr-comment). Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: PR #258 (impl `d569e813` + r1 `307295be` + story `6193e054`, merge `5a1e40f1`); route 196/20, full 19 241/0 (+13 exact), e2e-on-branch 11/1↓/0; 2×opus RC→APPROVE; cleanup 0/0/0. Epic 171: 4/9. Status: review → done. **Lessons:** (1) Cutout на Card-поверхности: bg ≠ card в dark (3.9/6.7%) — «white→background» = второй light-only баг; думай о SURFACE. (2) «var() вместо hex» ≠ доказательство — сверяй значения globals.css. |
