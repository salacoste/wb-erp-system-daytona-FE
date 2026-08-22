# Story 169.9-FE: Migrate Analytics Gaps Triage

Status: done

## Story

As an operations user, I want `/analytics/gaps` to prioritize data/operational gaps and explain each affected entity, so that I can investigate and hand off the correct recovery action.

## Acceptance Criteria (product)

1. Classified gaps: counts, severity/priority, entity identity, reasons, filters/sort/page, dialog evidence, recovery handoff unchanged.
2. No gaps vs failed/unavailable analysis distinct; valid no-gaps is not a failure state.
3. Dialog: title/focus/Escape/return lifecycle preserved; queue context retained.

Plan: `.omx/plans/169.9-migrate-analytics-gaps-triage.md` (authoritative). No separate prep-PR artifact existed for this Story — this file is the closeout record created at delivery time.

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) via Claude Code orchestrator on glm-5.2[1m]; 1 micro-fix round (sonnet, PageHeader barrel import). Reviews: 2× code-reviewer (opus) FRESH-parallel.

### Completion Notes List

- Owned surface only: 10 files changed (5 src, 5 tests incl. 2 new) — `src/app/(dashboard)/analytics/gaps/**`; `page.tsx` + `useGapsPageState.ts` untouched by construction (mutation/toast/URL semantics preserved).
- SummaryCards: solid-500 icon-chips + text-white → semantic pairs; coverage tiers ≥90/≥70/<70 preserved verbatim with the BD-31 no-data-neutral comment; missing-days neutral-zero preserved; tabular-nums on values.
- GapAnalysisDialog: severity badges `-100/-800` pastels → `/15`-chip triplets (169.5 idiom); everything else (evidence blocks bg-muted, buttons, Radix focus lifecycle) untouched.
- Header → PageHeader composition; decorative CalendarSearch dropped (PageHeader has no icon slot — checked live API); date inputs `label htmlFor↔id` linked (was an a11y gap) + `min-h-11`.
- GapsTable: scroll-region (`scrollContainerTabIndex` + `ariaLabel`), static TableCaption («Пропущенные дни в финансовых данных» — picker-semantics, 169.7 precedent), repeated «Анализ» buttons name the entity (`aria-label="Анализ за <date>"`, AX contract), `min-h-11`.
- New guards: tier-collapse (4 pairwise-distinct chip class pairs via Set-size — not forever-green), no-palette/no-hex source contracts with letter-lookahead (`#(?=[0-9A-Fa-f]*[A-Fa-f])[0-9A-Fa-f]{3,8}` — digit-only ticket refs `#197` exempt; pure-digit hexes `#333` documented as uncovered edge), label-linkage (both GapsPageContent suites), entity-named buttons, caption, scroll-region.
- Gates: targeted 6 files / 39/39 (baseline 27 → +12 growth-only; filter=owned 1:1 with path filter — advertising `sync-gaps-utils` sibling excluded by path); full vitest 18 913/0 (floor 18 901); lint 0/0; tsc 0; max-lines OK; format clean; doc-citations exit 0; locale-percent 4=baseline; `git diff --check` clean; `next build --webpack` exit 0.
- E2E: no Story-169.9 Playwright file exists (route e2e `financial-gaps.spec.ts` outside allowed surface — not edited); static pin sweep: heading «Пропуски в данных», «Покрытие», «Пропуски не обнаружены», `/Анализ/` all intact. Live browser matrix not run this cycle (environment gap recorded truthfully).
- Reviews: 2×opus APPROVE · APPROVE, 0 CRITICAL/HIGH. Contrast table both themes (layer-stated): solid chips 4.81–6.54 light / 7.27–11.41 dark PASS; /15 info 4.63, /15 error 5.09 PASS; muted chip 14.5+ PASS.
- PR #210 (impl `9f734b4b`, merge `8508a04c`); branch/remote/worktree cleaned with absence proofs.

### Gaps

- warning `/15`-chip light 3.96:1 on bg-card/popover — known wave-wide escalation, consolidated fix at 174.2 (darken light `--status-warning` ~L25% preserves solid-pair ≥3.0 headroom).
- Caption + scroll-container aria-label dually name the table (P1 LOW, optional dedup).
- Pure-digit hex literals (`#333`) escape the hex guard (accepted trade-off vs ticket-ref false positives).
- Route-level vs components-level `GapsPageContent.test.tsx` near-duplicates — consolidation deferred to a debt pass.

### File List

- `src/app/(dashboard)/analytics/gaps/components/{GapsPageContent,GapsSummaryCards,GapsTable,GapAnalysisDialog}.tsx` (M)
- `src/app/(dashboard)/analytics/gaps/{__tests__,components/__tests__}/GapsPageContent.test.tsx`, `components/__tests__/{GapsSummaryCards,GapsTable}.test.tsx` (M)
- `src/app/(dashboard)/analytics/gaps/components/__tests__/{GapAnalysisDialog,gaps-presentation-source-contracts}.test.ts` (A)

### Change Log

| Date | Change |
|---|---|
| 2026-08-22 | Implemented via full executor cycle; merged PR #210 (`9f734b4b`, merge `8508a04c`); cleanup with absence proofs. Status: backlog → done (plan was already ready-for-execution; sprint-status row was stale at backlog). **Lessons:** (1) Мелкая стори = полный цикл без ослабления гейтов — все универсальные проверки дёшевы на малом диффе. (2) Несвязанные label↔input — частый скрытый a11y-gap: пинить getByLabelText сразу. (3) Set-size tier-collapse guard ловит коллапс надёжнее попарных пинов. |
