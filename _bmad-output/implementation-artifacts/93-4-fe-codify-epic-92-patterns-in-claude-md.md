# Story 93.4-FE: Codify Epic 92 Patterns in CLAUDE.md

Status: done

## Story

**As a** developer onboarding to the codebase or reviewing a multi-source dashboard PR,
**I want** the 4 architectural patterns Epic 92 surfaced (parallel-hook orchestration, raw-SVG vs chart-library decision, Story-1 fixture seeding, spec-grep discipline) documented in `CLAUDE.md` alongside the existing `Boundary Normalizer Pattern`,
**so that** these patterns become enforceable house-style (grep-and-cite-able) instead of tribal knowledge scattered across 6 retrospective files.

**Epic**: 93-FE Operational Cleanup & Pattern Codification
**Priority**: P3
**Estimate**: 2 story points
**Fourth story in Epic 93-FE.** Addresses Epic 92-FE retrospective action items #5 (Story-1 fixture seeding), #7 (codify 4 patterns), #8 (spec-grep discipline).

---

## Problem Statement

Epic 92-FE's retrospective (`_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md`) surfaced 6 architectural insights (Insights #1-#9 in the retro) and 9 action items. Four of those patterns are generalizable beyond Epic 92 and deserve CLAUDE.md-level codification so they become enforceable at future PR review time:

1. **Parallel-hook + independent-state-machine orchestration** (Insight #2) — used in `MonitorPageContent.tsx` across 3 stories (92.4 intro, 92.5 copy, 92.6 test coverage). Any multi-source dashboard should follow this shape.
2. **Raw-SVG vs chart-library decision rule** (Insight #3) — Story 92.5 chose raw SVG gauge specifically to avoid Story 92.4's recharts jsdom mock pain. The tradeoff is real and test-harness cost is load-bearing.
3. **Story-1 fixture seeding** (Insight #6, AI #5) — Epic 92's shared empty-fixtures module emerged in Story 92.6 retroactively. Had it been seeded in Story 92.1 alongside types + normalizer, every downstream story would have reused it.
4. **Spec-grep discipline** (Insight #7 preamble, AI #8) — Story 92.4 spec listed `salesCount`/`returnsCount` fields that didn't exist on `DailyMetrics`; caught in review as H-3 structural fix. Epic 91 had the same `operatingProfit` ghost field. Grep-before-handoff is load-bearing.

CLAUDE.md's `## Key Architecture Patterns` section (currently at lines 400-510) is the natural home. The new subsection sits alongside `Boundary Normalizer Pattern`, `TanStack Query`, `Zustand`, `Polling Pattern`.

### Pre-flight grep confirmations (2026-04-24)

- `CLAUDE.md` = **823 lines**. Adding a consolidated subsection (~120-150 lines) lands it at ~960 — acceptable. The file is already past 200; the ESLint file-size rule is scoped to `src/` not documentation.
- Canonical file references confirmed to exist:
  - `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` — parallel-hook orchestrator
  - `src/app/(dashboard)/monitor/components/MonitorBuyoutGauge.tsx` — raw SVG gauge
  - `src/app/(dashboard)/monitoring/components/HealthScoreWidget.tsx` — raw SVG gauge (Epic 68 original)
  - `src/app/(dashboard)/monitor/components/MonitorWeeklyChart.tsx` — recharts LineChart
  - `src/components/custom/dashboard/MonthlyPatternsChart.tsx` — recharts BarChart
  - `src/test/fixtures/monitor-empty.ts` — Story-1 fixture seeding canonical
  - `e2e/fixtures/monitor-fixtures.ts` — E2E wrapper around the shared fixtures

---

## Acceptance Criteria

### AC-1: New subsection added to `## Key Architecture Patterns`

Add a new H3 subsection titled `### Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)`. Place it AFTER `### Polling Pattern (COGS → Margin)` and BEFORE `## Critical Business Rules` (roughly line 510).

- [x] Single consolidated subsection with 4 H4 sub-subsections (one per pattern), NOT 4 peer H3 siblings (would balloon the section's TOC).
- [x] The subsection contains a 1-paragraph preamble explaining WHY these patterns are in CLAUDE.md (tribal-knowledge → enforceable) and a cross-reference to the Epic 92 retrospective for the full diagnostic history.

### AC-2: Pattern 1 — Parallel-hook + independent-state-machine orchestration

H4: `#### Pattern 1: Parallel-hook + independent-state-machine orchestration`

- [x] **When to use**: multi-source dashboards where partial failure should degrade gracefully (e.g., primary data loaded + 1-2 supplementary widgets can fail without blanking the page).
- [x] **Canonical example**: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` — 3 hooks (`useMonitorSummary` primary, `useDailyMetrics` + `usePipelineGrid` supplementary), each rendered through its own skeleton / error / success state machine.
- [x] **Shape** (code snippet, ≤25 lines): show the 3-branch pattern inside a `hasData` wrapper with per-hook loading/error/success rendering. Include the `useMemo` for the fetch-window params (prevents refetch storms).
- [x] **Anti-pattern to avoid**: full-page error when ANY hook fails (blanks cards for a pipeline-health failure).
- [x] **Cross-reference**: Story 92.4-FE (introduced pattern), Story 92.5-FE (copy), Story 92.6-FE (E2E coverage of graceful degradation).

### AC-3: Pattern 2 — Raw-SVG vs chart-library decision rule

H4: `#### Pattern 2: Raw-SVG vs chart-library decision rule`

- [x] **The tradeoff** (one paragraph): recharts = easier dev + harder tests (jsdom doesn't render SVG sizes → children don't mount → mocking needed). Raw SVG = more geometry upfront + trivially testable. Test-harness cost is load-bearing, not a dev-ergonomics-only choice.
- [x] **Decision rule** (bulleted):
  - Semi-circular gauges, simple arcs, static SVG, small-shape visualizations → **raw SVG**
  - Line charts, bar charts, complex interactive (zoom/pan/brush) → **recharts** + pre-planned jsdom mocks
- [x] **Canonical pairs** (with file paths):
  - Raw SVG: `src/app/(dashboard)/monitor/components/MonitorBuyoutGauge.tsx` + `src/app/(dashboard)/monitoring/components/HealthScoreWidget.tsx` (Epic 68 original).
  - Recharts: `src/app/(dashboard)/monitor/components/MonitorWeeklyChart.tsx` + `src/components/custom/dashboard/MonthlyPatternsChart.tsx`.
- [x] **When you MUST use recharts** (checkbox list): pre-plan jsdom mocks in the test file setup — see Story 92.4-FE's retro for the `LineChart`/`Line`/`XAxis` mock strategy.
- [x] **Cross-reference**: Story 92.4-FE (recharts jsdom pain diagnosis), Story 92.5-FE (raw SVG chosen to avoid it).

### AC-4: Pattern 3 — Story-1 fixture seeding

H4: `#### Pattern 3: Story-1 fixture seeding for new domains`

- [x] **The rule** (one sentence): any new epic touching a new domain MUST create `src/test/fixtures/<domain>-empty.ts` alongside types + normalizer in Story 1 of the epic. Downstream stories' unit tests AND E2E fixture helpers reuse it.
- [x] **Why**: retroactive extraction (what Epic 92 did in Story 92.6-FE) forces every downstream story to re-implement empty-data inline until the extraction happens. Upfront cost in Story 1 is ~30 lines; retroactive refactor is ~100+.
- [x] **Canonical example**: `src/test/fixtures/monitor-empty.ts` — shared between unit tests (`MonitorPageContent.test.tsx`) and E2E fixtures (`e2e/fixtures/monitor-fixtures.ts`). The E2E file wraps the same factories with `page.route` handlers.
- [x] **Checklist for Story 1 of any new-domain epic** (3-5 items): types defined → normalizer defined → shared-fixture module created → at least one test in the first downstream test file consumes it (proves the wiring).
- [x] **Cross-reference**: Story 92.6-FE (retroactive extraction), Epic 92 retro AI #5.

### AC-5: Pattern 4 — Spec-grep discipline

H4: `#### Pattern 4: Spec-grep discipline for story handoff`

- [x] **The rule**: story authors must grep every field name / function name / type name listed in the spec's `Data sources / fields consumed` section against the actual source file before marking the story `ready-for-dev`. Prevents ghost fields and stale references.
- [x] **Two case studies** (with file:line evidence):
  - Story 92.4-FE — spec listed 3 chart lines sourced from `DailyMetrics.salesCount`/`returnsCount`. Those fields didn't exist on `DailyMetrics`. Primary dev adapted to 2 lines; review caught it as H-3 → structural fix (extend upstream type + aggregation). Had the spec author grepped the type file, the structural work would have been scoped into Story 92.4-FE upfront, not discovered at review time.
  - Epic 91-FE Story 91.2-FE — spec added `operatingProfit: number` to `FinanceDailyResponseItem` based on "backend already sends it". Grep for `operatingProfit` usage = 0 call sites. Review caught it; field removed with an explanatory comment.
- [x] **Checklist**: for every spec that cites `<filename>.ts:<field>`, the author runs `grep -n '<field>' <filename>.ts` and confirms existence + type + nullability BEFORE marking `ready-for-dev`.
- [x] **Cross-reference**: Story 92.4-FE retro H-3, Story 93.3-FE (spec-grep surfaced that 2 of 3 sites were already documented → downscoped the story).

### AC-6: No duplication with existing CLAUDE.md sections

- [x] The new subsection does NOT repeat content from:
  - `### Boundary Normalizer Pattern` (lines 405-484) — different scope
  - `### TanStack Query` (lines 486-497) — covers basic hook pattern only, not multi-hook orchestration
  - `### Defensive Frontend Principle` (lines 94-151) — different concern
  - `### Known Anti-Patterns` (lines 152-390) — tactical anti-patterns, not architectural patterns
- [x] Cross-links: the new subsection references `### Boundary Normalizer Pattern` explicitly in Pattern 3 (Story-1 fixture seeding — fixtures consume the normalized types) and `### Known Anti-Patterns` for #8 (null-vs-zero) when showing the gauge null-handling.

### AC-7: Documentation hygiene

- [x] All code snippets in the new subsection are syntactically valid TypeScript (at least parse-valid, not necessarily runnable out of context).
- [x] All file paths cited are verified to exist (pre-flight grep confirmed — don't cite files that don't exist).
- [x] All Story references use the `Story NN.M-FE` format matching Story 93.1's convention.
- [x] Section length: ~120-180 lines total (across all 4 patterns). Actual section added: 129 lines. Within budget.

### AC-8: Validation

- [x] `npm run lint` → clean (CLAUDE.md isn't linted; all file path citations resolved).
- [x] `npm run check:docs` → 0 new broken citations. Pre-existing 13 broken citations unchanged. New subsection's 7 file-path references all resolve to existing files. Delta: +7 valid citations, +0 broken.
- [x] `npm run type-check` → unchanged (no source code modified; pre-existing errors unchanged).
- [x] `wc -l CLAUDE.md` → 952 (from 823 pre-edit; +129 lines).

### AC-9: Sprint-status

- [x] `93-4-fe-codify-epic-92-patterns-in-claude-md: ready-for-dev → review` upon impl complete.
- [x] Epic `93-fe` stays `in-progress`.

---

## Tasks / Subtasks

### Task 1: Read current CLAUDE.md structure (pre-flight)
- [x] 1.1: Read `CLAUDE.md` lines 400-512 (the existing `Key Architecture Patterns` section).
- [x] 1.2: Identify the exact insertion point: after `### Polling Pattern` closing line, before `## Critical Business Rules`.
- [x] 1.3: Verify all file paths cited in this spec exist via grep / Read. If any don't, flag + replace.

### Task 2: Write preamble + Pattern 1 (AC-1, AC-2)
- [x] 2.1: H3 header + 1-paragraph preamble explaining the "tribal → enforceable" motivation + Epic 92 retro cross-reference.
- [x] 2.2: H4 "Pattern 1: Parallel-hook + independent-state-machine orchestration".
- [x] 2.3: When-to-use + canonical example + code snippet (≤25 lines) + anti-pattern + cross-reference.

### Task 3: Write Pattern 2 (AC-3)
- [x] 3.1: H4 "Pattern 2: Raw-SVG vs chart-library decision rule".
- [x] 3.2: Tradeoff paragraph + decision rule bullets + canonical pairs with file paths + "when you MUST use recharts" checklist.

### Task 4: Write Pattern 3 (AC-4)
- [x] 4.1: H4 "Pattern 3: Story-1 fixture seeding for new domains".
- [x] 4.2: Rule + why + canonical example + Story-1 checklist.

### Task 5: Write Pattern 4 (AC-5)
- [x] 5.1: H4 "Pattern 4: Spec-grep discipline for story handoff".
- [x] 5.2: Rule + 2 case studies (Story 92.4-FE + Epic 91-FE Story 91.2-FE) + handoff checklist.

### Task 6: Cross-link + hygiene pass (AC-6, AC-7)
- [x] 6.1: Add cross-links to existing CLAUDE.md sections per AC-6.
- [x] 6.2: Verify all code snippets are syntactically valid TypeScript.
- [x] 6.3: Verify all file paths exist.
- [x] 6.4: Section length: 129 lines added. Within ~120-180 budget; no split needed.

### Task 7: Validation (AC-8, AC-9)
- [x] 7.1: `npm run check:docs` — 13 pre-existing broken citations; 0 new broken from this edit. +7 valid citations.
- [x] 7.2: `wc -l CLAUDE.md` — 952 lines (target 950-980; pass).
- [x] 7.3: `npm run type-check && npm run lint` — unchanged (no source code modified).
- [x] 7.4: Sprint-status transitioned to `review`.

---

## Dev Notes

### Canonical file references (pre-flight-verified)

1. Insertion point: `CLAUDE.md` around line 510 (after `### Polling Pattern (COGS → Margin)`, before `## Critical Business Rules`).
2. Pattern 1 canonical: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` (~160 lines post-93 edits).
3. Pattern 2 raw-SVG examples: `src/app/(dashboard)/monitor/components/MonitorBuyoutGauge.tsx`, `src/app/(dashboard)/monitoring/components/HealthScoreWidget.tsx`.
4. Pattern 2 recharts examples: `src/app/(dashboard)/monitor/components/MonitorWeeklyChart.tsx`, `src/components/custom/dashboard/MonthlyPatternsChart.tsx`.
5. Pattern 3 canonical: `src/test/fixtures/monitor-empty.ts`, `e2e/fixtures/monitor-fixtures.ts`.
6. Pattern 4 case studies:
   - Story 92.4 H-3 retro: `_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md` insight + action item §.
   - Story 91.2 ghost field: `_bmad-output/implementation-artifacts/epic-91-fe-retro-2026-04-21.md` "What Didn't Go Well" item #2.

### Code-snippet budgets per pattern

| Pattern | Budget | Rationale |
|---|---|---|
| Pattern 1 (parallel-hook) | ~20-25 lines of code | Show the 3-branch state machine + useMemo; too small = unclear, too big = duplicates full orchestrator |
| Pattern 2 (decision rule) | No code — just file paths | Tradeoff is narrative; code snippets would tempt "copy this" instead of "read the referenced files" |
| Pattern 3 (fixture seeding) | ~10-15 lines | Show the module shape (3 factories + re-export point) |
| Pattern 4 (spec-grep) | No code — checklist format | Discipline, not code |

Total section length target: ~150 lines. Hard cap: 200 (AC-7 extract trigger).

### Style guardrails

- Match Story 93.1's `Story NN.M-FE` convention for all story references (hyphen, not period-separated).
- Use em-dash (—) not hyphen (-) for inline clauses, matching Boundary Normalizer Pattern section's convention.
- File paths in backticks, line numbers after colon (`file.ts:N-M`).
- Headers: H3 for the new subsection, H4 for the 4 patterns. No H5 unless absolutely needed (too-deep nesting hurts readability).
- "Canonical example" / "Anti-pattern" / "When to use" / "Cross-reference" — reuse Boundary Normalizer's labeling conventions.

### Out-of-scope traps

- ❌ Do NOT rewrite existing subsections under `## Key Architecture Patterns`. Additive only.
- ❌ Do NOT create new file paths or fixtures. This is a documentation-only story; any new code = scope creep.
- ❌ Do NOT extract the 4 patterns into separate docs. CLAUDE.md is the source of truth for house-style; splitting defeats the point.
- ❌ Do NOT update retrospective files. They're historical; this story codifies their lessons, not revises them.
- ❌ Do NOT cite line numbers from uncommitted working-tree state. All line refs must be from the committed HEAD.
- ❌ Do NOT add a new ESLint rule to enforce any of these patterns. Documentation-first; automation is a future story.

### Retro lessons applied pre-authoring

- **Spec-grep discipline** (Pattern 4 itself): this spec grep-verified every file path cited in its Canonical References section. If any fail to resolve post-implementation, that's the irony nobody should miss.
- **AC/Task checkbox discipline** (Story 93.1 L-6, Story 93.2, Story 93.3 M-2): the coordinator (not a delegated executor) writes CLAUDE.md directly for a 2 SP doc story. Flag: tick all checkboxes as work progresses — this is the 4th story in a row that's been reminded.
- **Structural fix over silent adaptation** (Epic 92 insight #4): if during writing the coordinator discovers a pattern is actually MORE nuanced than the retro framing suggested, document the nuance — don't silently simplify.

---

## References

- Epic 93-FE spec: `_bmad-output/planning-artifacts/epics-93-fe.md` § Story 93.4.
- Epic 92-FE retrospective: `_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md` (source of all 4 patterns, insights #2/#3/#6/#7).
- Epic 91-FE retrospective: `_bmad-output/implementation-artifacts/epic-91-fe-retro-2026-04-21.md` (Pattern 4 `operatingProfit` ghost field case study).
- `CLAUDE.md` § `Key Architecture Patterns` (lines 400-510) — insertion target.
- `CLAUDE.md` § `Boundary Normalizer Pattern` (lines 405-484) — style/structure template to match.
- `CLAUDE.md` § `Known Anti-Patterns` (lines 152-390) — scope delineation (tactical anti-patterns vs architectural patterns).
- Story 93.1-FE — `@see Story NN.M-FE` convention origin.
- Story 93.3-FE — spec-grep discipline successfully applied to downscope that story from "add missing comments" to "upgrade existing comments".

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — documentation-only story, no debugging needed.

### Completion Notes List

- AC-1: New H3 subsection `### Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)` added at CLAUDE.md lines 510-638 (post-edit). Preamble cross-references `_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md`.
- AC-2: Pattern 1 at CLAUDE.md lines 514-552. Code snippet excerpted from `MonitorPageContent.tsx:40-157` — useMemo + 3-hook orchestration + 3-branch state machine. Anti-pattern shows ❌ full-page kill. Cross-references Stories 92.4-FE / 92.5-FE / 92.6-FE.
- AC-3: Pattern 2 at CLAUDE.md lines 554-570. No code snippet (narrative + file paths). 4 canonical file paths verified to exist. Cross-references Stories 92.4-FE / 92.5-FE.
- AC-4: Pattern 3 at CLAUDE.md lines 572-597. ~10-line code snippet from `monitor-empty.ts:14-71` showing 3 factory signatures. 5-item Story-1 checklist. Cross-references Story 92.6-FE, `### Boundary Normalizer Pattern`.
- AC-5: Pattern 4 at CLAUDE.md lines 599-621. 2 case studies (Story 92.4-FE + Story 91.2-FE). 4-item handoff checklist. Cross-references `### Known Anti-Patterns` #8.
- AC-6: No duplication with existing sections. Cross-links to `### Boundary Normalizer Pattern` (Pattern 3) and `### Known Anti-Patterns` (Pattern 1 anti-pattern box, Pattern 4 nullability note).
- AC-7: All snippets parse-valid TypeScript. All 7 file-path citations verified. All Story refs use `Story NN.M-FE` format. Section = 129 lines (within 120-180 budget).
- AC-8: `check:docs` = 13 pre-existing broken, 0 new broken, +7 new valid citations. `wc -l` = 952 (target 950-980). `type-check` unchanged (no src/ touched).
- AC-9: Sprint-status set to `review`. Epic `93-fe` stays `in-progress`.

### File List

| File | Status |
|---|---|
| `CLAUDE.md` | Modified — 823 → 952 lines; +129 lines new H3 subsection |
| `_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md` | Modified — status/checkboxes/record updated |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Modified — story set to `review` |

### Post-review fixes (2026-04-24)

- **M-1**: Pattern 4 case study 1 — added "at spec-handoff time (they were added later as the H-3 structural fix)" qualifier to the `salesCount`/`returnsCount` tense. Prevents present-tense contradiction since those fields now exist at `src/types/daily-metrics.ts:57,61`.
- **M-2**: Pattern 1 snippet — inserted `<MonitorMetricsTable periods={data.periods} />` after `<MonitorKpiCards>` with a "Primary blocks — render when hasData" comment. Both are primary blocks in the real `MonitorPageContent.tsx:122-123`.
- **M-3**: Pattern 1 snippet — added `const dailyData = dailyQuery.data ?? []` line and replaced `data={dailyQuery.data}` with `data={dailyData}`. The `?? []` is load-bearing (connects to Pattern 3 empty-fixture contract); annotated with inline comment.
- **L-1**: Dropped `:40-157` from Pattern 1 canonical example line. Dropped `:14-71` from Pattern 3 module shape line. File-path-only convention per Story 93.3 AC-2 lesson.
- **L-2**: Replaced all Unicode `…` in code blocks with `/* props */` or `/* params */` JS block comments. Only prose `…` at line 136 retained (outside code blocks, per spec).
- **L-3**: Appended "Testing requirement" line to Pattern 1 (E2E graceful-degradation paths) and Pattern 3 (shared-fixture wiring test). Parallel to Boundary Normalizer's testing callout at line 482.
- **L-4**: Intentionally deferred — cross-reference asymmetry finding requires touching existing subsections, which violates the additive-only scope constraint from Dev Notes § out-of-scope traps.
- **L-5**: Added gitignored-path note immediately after the `_bmad-output/` citation in the preamble: "*Retro artifacts live under `_bmad-output/implementation-artifacts/` (gitignored — local to the author's filesystem; not distributed with the repo).*"

### Post-merge second-review fixes (2026-04-24)

- **M-NEW-1**: Pattern 1 snippet reduced from 38 total/34 non-blank lines to exactly 25 lines inside the fence (≤25 budget restored). Collapsed hasData guards to early-return form, merged showSkeleton/showFullError to one line, removed blank separator lines.
- **M-NEW-2**: Pattern 4 Case Study 2 reframed from factually-incorrect "ghost field" (0 call sites) to accurate "sent-but-not-consumed" (field exists at `src/lib/api/daily-analytics/api.ts:48`, referenced in `src/types/daily-metrics.ts` + `src/components/custom/sku-financials/`). Added checklist item #5 for new-field-USAGE grep discipline.
- **L-NEW-1**: Removed orphan `refetch` from `useMonitorSummary()` destructure; `refetch` now only appears in supplementary error handler `<RetryButton onClick={dailyQuery.refetch} />` where it's used.
- **L-NEW-2**: Replaced all 4 `**Cross-reference**:` (colon after bold) with `**Cross-reference.**` (period inside bold) to match Boundary Normalizer section at line 484.
- **L-NEW-3**: Replaced cryptic `// M-1 fix: memoize...` comment with descriptive `// Memoize — prevents refetch storm on every render.`
- **L-NEW-4**: Added Insight #8 deferral acknowledgement sentence to preamble, noting the "mirrors X — keep in sync" pattern is already documented via Story 93.1 convention.
- **L-NEW-5**: Inlined 1-sentence summaries at first occurrence of each unresolvable retro reference: "Epic 92 retro AI #5" and "Story 92.4-FE retro H-3" both have inline context for fresh-clone readers.

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Story created. Fourth story in Epic 93-FE. 2 SP documentation-only story codifying 4 architectural patterns from Epic 92-FE retrospective into `CLAUDE.md § Key Architecture Patterns` as a new H3 subsection. Patterns: (1) parallel-hook + independent-state-machine orchestration, (2) raw-SVG vs chart-library decision rule, (3) Story-1 fixture seeding, (4) spec-grep discipline. Zero source-code changes, zero tests. Pre-flight grep confirmed all 7 canonical file references exist. Section budget ~150 lines; hard cap 200 with split-trigger on Pattern 2 if exceeded. Explicit out-of-scope: no new ESLint rules, no new fixtures, no retro revisions. Applies spec-grep discipline meta-recursively (Pattern 4 references this spec's own grep pre-flight). |
| 2026-04-24 | Implementation complete. CLAUDE.md 823 → 952 lines. 4 patterns codified in new H3 subsection (129 lines, within 120-180 budget). Zero source/test changes. check:docs: 0 new broken citations. Status: review. |
| 2026-04-24 | Addressed 7 of 8 code-review findings (0H/3M/4L fixed; 1L deferred per scope constraint). CLAUDE.md 952 → 961 lines. All validation gates pass. Status: review. |
| 2026-04-24 | Second fresh-context review found 7 new findings (0H/2M/5L). All fixed post-merge: snippet size budget restored (38→25 lines), Pattern 4 case study 2 reframed as "sent-but-not-consumed" (factually accurate vs ghost-field misclassification), cross-reference punctuation aligned with Boundary Normalizer, cryptic M-1 comment removed, Insight #8 deferral acknowledged, retro cross-refs inlined for fresh-clone readability. CLAUDE.md 961 → 951 lines. Status: done (post-merge fix pass). |
