# Story 110.5: CSV export + Epic 110-FE retrospective

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **AI-forecast operator analyzing per-model and per-SKU performance**,
I want **a one-click CSV export button on the evaluations and SKU accuracy tables that downloads a Russian-locale-formatted file ready to open in Excel**,
so that **I can share offline analyses with non-platform stakeholders, archive historical performance snapshots, and reconcile against external BI tools without re-querying the API**.

## Acceptance Criteria

1. **New pure helper** `exportEvaluationsToCsv(evaluations: EvaluationEntry[], options?: { evaluatedAt?: string | null }): string` at `src/lib/csv/evaluations-csv-export.ts`. Returns a CSV string with `﻿` UTF-8 BOM prefix for Excel compatibility. NO side effects (no Blob, no DOM). Russian column headers. Russian-locale cell formatters (`formatDate` for dates, `formatPercentage` for MAPE, `formatNumber` for counts) from `src/lib/utils.ts`. AP#8: null mapeUnits / mapeRevenue render as `—` (em-dash, U+2014), NOT 0. Cell escaping: any cell containing comma / quote / newline is wrapped in double quotes with embedded quotes doubled.
2. **New pure helper** `exportSkuAccuracyToCsv(skuAccuracies: SkuAccuracyEntry[]): string` at `src/lib/csv/sku-accuracy-csv-export.ts`. Same UTF-8 BOM, same Russian-locale formatting, same AP#8 null discipline. Columns: nmId (`String(nmId)`, NOT `formatNumber` per Story 110.3 F-8 precedent), vendorCode, avgAiMape, avgNaiveMape, aiAccuracyPercent, naiveAccuracyPercent, evaluationCount.
3. **New `<ExportCsvButton>` component** at `src/components/custom/ai/ExportCsvButton.tsx`. Props: `{ csvContent: string; fileName: string; label?: string; disabled?: boolean }`. Side-effect logic (Blob creation + anchor click + revokeObjectURL) lives here, NOT in the pure helpers. WCAG: button label "Скачать CSV" + `aria-label` matching + `<Download>` icon from lucide-react. Disabled when no data to export.
4. **Integration: EvaluationsList page** — render `<ExportCsvButton>` in the page header (next to title or summary stats). Wire to `exportEvaluationsToCsv(evaluations, { evaluatedAt })` → filename `evaluations-{modelId}-{evaluatedAt-or-today}.csv`. Disabled when evaluations array empty.
5. **Integration: SKU accuracy overview page** — render `<ExportCsvButton>` in the page header above the SkuAccuracyTable. Wire to `exportSkuAccuracyToCsv(skuAccuracies)` → filename `sku-accuracy-{modelId}-{today}.csv`. Disabled when skuAccuracies array empty.
6. **UTF-8 BOM + Russian locale verification**: the BOM character (`﻿`) is the FIRST character of the CSV string (before any header text). Open the downloaded file in Excel (or run a unit-test assertion: `expect(csv.charCodeAt(0)).toBe(0xFEFF)`). All numeric cells use Russian decimal comma (e.g., `12,5 %` not `12.5%`); dates use `DD.MM.YYYY` format.
7. **Test coverage** ≥ 90% on the two pure helpers: header presence, BOM prefix, cell escaping (comma / quote / newline), AP#8 null handling, locale-correct number formatting, empty-array handling. Component test on `<ExportCsvButton>`: click triggers Blob creation, anchor download attribute set, URL.revokeObjectURL called for cleanup, disabled state respected.
8. **Anti-Pattern #8 compliance** — all nullable MAPE / accuracy / money fields render `—` (em-dash) when null. Counts (`evaluationCount`, `predictedUnits`, `actualUnits`) render `0` (semantic-zero exception).
9. **Epic 110-FE retrospective filed** at `_bmad-output/implementation-artifacts/epic-110-fe-retro-2026-05-19.md`. Follows existing retro format (per Story 109.6 precedent at `epic-109-fe-retro-2026-05-17.md`). Captures: scope shipped (5 stories), discipline observations (3-pass review on 110.3+110.4 surfaced char-count meta-pattern), accumulated test count (started Epic at 7591 floor; ended at ~7808), action items for Epic 111.
10. **Sprint-status close-out** — flip ALL Epic 110 stories to `done` (already done for 110.1-110.4; 110.5 itself flips on close); flip `epic-110-fe: in-progress → done`; flip `epic-110-fe-retrospective: optional → done`.
11. **Pre-flight verification** — Story 77.5 precedent (`unit-economics-csv-export.ts:1-47`) exists but does NOT include UTF-8 BOM and does NOT use Russian-locale formatters. Story 110.5 EXTENDS the pattern; pure-function discipline (separate string-build from side-effect download) is new — Story 77.5 conflates them.
12. **2-pass adversarial review complete** before flipping `Status: review → done`. Discipline streak preserved at 55+ (Epic 109 closed at 50+; Stories 110.1-110.5 add 5 → 55+).

## Tasks / Subtasks

- [x] **Task 1 — Create `exportEvaluationsToCsv` pure helper** (AC: 1, 6, 8) — `src/lib/csv/evaluations-csv-export.ts` + tests
  - [x] Function signature: `(evaluations: EvaluationEntry[], options?: { evaluatedAt?: string | null }) => string`.
  - [x] Russian column headers: `Дата оценки`, `ID прогноза`, `Артикул`, `Прогноз (ед.)`, `Факт (ед.)`, `Прогноз (выручка)`, `Факт (выручка)`, `MAPE (ед.)`, `MAPE (выручка)`, `Горизонт (дней)`.
  - [x] Each row: `formatDate(entry.evaluationDate)`, `entry.forecastId` (raw — opaque), `String(entry.nmId)` (raw — opaque ID per Story 110.3 F-8 precedent), `formatNumber(entry.predictedUnits)`, `formatNumber(entry.actualUnits)`, `formatCurrency(entry.predictedRevenue)`, `formatCurrency(entry.actualRevenue)`, AP#8 null guard on mapeUnits / mapeRevenue (`x !== null ? formatPercentage(x) : '—'`), `formatNumber(entry.horizonDays)`.
  - [x] BOM prefix: `'﻿' + csvBody`.
  - [x] Cell escaping: utility function `escapeCsvCell(value: string): string` — if value contains `,`, `"`, or `\n`, wrap in double quotes and double any embedded quotes.
  - [x] Tests in `src/lib/csv/__tests__/evaluations-csv-export.test.ts`:
    - BOM is first character: `expect(csv.charCodeAt(0)).toBe(0xFEFF)`.
    - Russian headers present (assert via includes-strings: `Дата оценки`, `MAPE (ед.)`, etc.).
    - AP#8: entry with `mapeUnits: null` renders `—` (em-dash, U+2014).
    - Cell escaping: name field containing `,` is wrapped in quotes; field containing `"` doubles the quotes; field containing `\n` is wrapped.
    - Russian locale: `formatPercentage(12.5)` produces `12,5 %` (comma decimal).
    - Empty array: returns BOM + headers only (no error).

- [x] **Task 2 — Create `exportSkuAccuracyToCsv` pure helper** (AC: 2, 6, 8) — `src/lib/csv/sku-accuracy-csv-export.ts` + tests
  - [x] Function signature: `(skuAccuracies: SkuAccuracyEntry[]) => string`.
  - [x] Russian column headers: `Артикул`, `Vendor code`, `Средний AI MAPE`, `Средний Naive MAPE`, `AI точность %`, `Naive точность %`, `Кол-во оценок`.
  - [x] Each row: `String(entry.nmId)` (per Story 110.3 F-8), `entry.vendorCode ?? '—'`, AP#8 null guards on the 4 nullable percentage fields, `formatNumber(entry.evaluationCount)` (SEMANTIC-ZERO count).
  - [x] BOM prefix + same cell escaping helper.
  - [x] Tests covering same shape as Task 1 tests.

- [x] **Task 3 — Extract shared `escapeCsvCell` + BOM helper** (AC: 1, 2) — `src/lib/csv/csv-helpers.ts`
  - [x] Pure functions: `escapeCsvCell(value: string): string`, `prefixUtf8Bom(csv: string): string`.
  - [x] Both used by Task 1 + Task 2 helpers.
  - [x] Unit tests directly on the helpers (BOM-only test, escape-only test) — orthogonal to the per-domain export tests.

- [x] **Task 4 — Create `<ExportCsvButton>` component** (AC: 3, 7) — `src/components/custom/ai/ExportCsvButton.tsx` + tests
  - [x] Props: `{ csvContent: string; fileName: string; label?: string; disabled?: boolean }`.
  - [x] Default label "Скачать CSV" + lucide-react `<Download>` icon.
  - [x] `aria-label={label}` for icon-button mode; explicit label text rendered next to icon for normal mode.
  - [x] On click: `new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })` → `URL.createObjectURL` → synthetic `<a>` with `download={fileName}` → `.click()` → `URL.revokeObjectURL`.
  - [x] Disabled state: `disabled` prop OR `csvContent` empty/BOM-only.
  - [x] Tests in `src/components/custom/ai/__tests__/ExportCsvButton.test.tsx`:
    - Click creates Blob (via URL.createObjectURL spy).
    - Download attribute set on synthetic anchor.
    - `URL.revokeObjectURL` called for cleanup.
    - Disabled when prop true OR csvContent empty.
    - aria-label correct.

- [x] **Task 5 — Integrate into EvaluationsList page** (AC: 4) — `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx`
  - [x] Import `exportEvaluationsToCsv` + `<ExportCsvButton>`.
  - [x] Render button in page header (next to title or summary stats).
  - [x] Filename: `evaluations-${modelId}-${data?.evaluatedAt?.slice(0,10) ?? todayString}.csv` (YYYY-MM-DD prefix).
  - [x] csvContent: `exportEvaluationsToCsv(data?.evaluations ?? [], { evaluatedAt: data?.evaluatedAt })`.
  - [x] Disabled when `data?.evaluations?.length === 0` or data not yet loaded.

- [x] **Task 6 — Integrate into SKU accuracy overview page** (AC: 5) — `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyOverview.tsx`
  - [x] Same pattern as Task 5; filename `sku-accuracy-${modelId}-${todayString}.csv`.
  - [x] csvContent: `exportSkuAccuracyToCsv(data?.skuAccuracies ?? [])`.
  - [x] Disabled when empty.

- [x] **Task 7 — File Epic 110-FE retrospective** (AC: 9) — `_bmad-output/implementation-artifacts/epic-110-fe-retro-2026-05-19.md`
  - [x] Follow format of `epic-109-fe-retro-2026-05-17.md` (Story 109.6 precedent).
  - [x] Sections: Summary, Scope shipped (5 stories one-line each), What went well, What went poorly, Discipline observations (3-pass review streak preserved at 55+; char-count meta-pattern surfaced), Action items for Epic 111, Test-count progression (Epic start 7591 floor → 7808 close, +217 net).
  - [x] Captured 3rd-pass char-count meta-pattern → `scripts/check-lessons-length.sh` action item.
  - [x] Captured backend coordination wins (Story 110.2 F-1 `?modelId=` filter mid-story; Story 110.3 request #166 pre-emptive).

- [x] **Task 8 — Sprint-status close-out + Change Log** (AC: 10, all)
  - [x] Flip story Status: `in-progress → review`.
  - [x] Flip sprint-status.yaml: `110-5-fe-csv-export-retrospective: in-progress → review`.
  - [x] Change Log row added (implementation complete, awaiting 2-pass review).

- [x] **Task 9 — 2-pass adversarial review** (AC: 12)
  - [x] 1st pass (fresh context, code-reviewer agent, Opus). 11 findings (3 HIGH, 5 MEDIUM, 3 LOW) — all resolved.
  - [x] 2nd pass (fresh context, independent). 9 NEW findings of different defect classes (4 HIGH, 5 MEDIUM, 1 LOW deferred) — all resolved.
  - [x] Streak extends to 55+ at Epic 110-FE close (50+ at Epic 109 close + 5 stories in Epic 110).

## Dev Notes

### Pre-Flight Verification Results (Story 105.2-FE, verified 2026-05-19)

Pre-flight grep showed **partial foundation already shipped**:

**Already exists** (precedent — extend, don't duplicate):
- `src/app/(dashboard)/analytics/unit-economics/unit-economics-csv-export.ts` (47 lines, Story 77.5) — CSV download pattern. **Limitations**: no UTF-8 BOM, no Russian-locale formatters (uses `toFixed(1)`), conflates string-build with side-effect download.
- `src/lib/utils.ts:17-48` — `formatCurrency`, `formatDate`, `formatNumber`, `formatPercentage` (Russian locale).
- `src/types/ai/evaluations.ts` — `EvaluationEntry` with all 12 fields including `predictedRevenue`, `actualRevenue`, `horizonDays`, `evaluationDate` (Story 110.2 F-1 + Story 110.3 3rd-pass F-1 additions).
- `src/types/ai/evaluations.ts:43-78` — `SkuAccuracyEntry`, `SkuAccuracyHistoryEntry` with `naiveBaseline`, `naiveAccuracyPercent`, `evaluationCount`.
- Epic retro template: `_bmad-output/implementation-artifacts/epic-109-fe-retro-2026-05-17.md` (Story 109.6 precedent, 213 lines).

**Needs creation** (Story 110.5-FE work):
- 2 pure-function helpers (evaluations + sku-accuracy) with UTF-8 BOM + Russian-locale formatting
- 1 shared `csv-helpers.ts` for escape + BOM utilities
- 1 `<ExportCsvButton>` component
- 2 integrations (EvaluationsList page + SkuAccuracyOverview page)
- 1 Epic 110-FE retrospective file
- Sprint-status close-out (epic flip + retro flip + Story 110.5 flip)

**Pre-flight grep output (2026-05-19)**:
```
grep -rn "exportEvaluationsToCsv\|ExportCsvButton" src/ → 0 hits (confirms not yet implemented)
grep -rn "csv-export\|toCsv" src/ → 1 hit (Story 77.5 unit-economics-csv-export.ts only)
grep -n "formatCurrency\|formatDate\|formatNumber\|formatPercentage" src/lib/utils.ts → 4 helper exports confirmed
```

### Architecture Patterns to Follow

- **Pure-function discipline** (CLAUDE.md user memory: "Pure functions over hook mocking"): separate `exportXxxToCsv` (returns string, pure) from `<ExportCsvButton>` (does the download, side-effectful). Story 77.5 conflated them — 110.5 fixes the pattern.
- **Boundary Normalizer Pattern** (already applied in Story 110.2 F-1): all `EvaluationEntry` and `SkuAccuracyEntry` data already normalized via `normalizeAiEvaluationListResponse` + `normalizeSkuAccuracyListResponse`. CSV helpers consume the normalized shape — no defensive coercion needed.
- **Anti-Pattern #8** (CLAUDE.md): null mapeUnits / mapeRevenue / avg* / accuracy % → `—` (em-dash, U+2014). NEVER `?? 0`. Counts (`evaluationCount`, `predictedUnits`, `actualUnits`, `horizonDays`) → `formatNumber(x)` (semantic-zero allowed).
- **Russian locale** (CLAUDE.md § Formatters): `formatPercentage(12.5)` → `'12,5 %'` (Intl.NumberFormat ru-RU); `formatDate(date)` → `'DD.MM.YYYY'`; `formatCurrency(1000)` → `'1 000,00 ₽'`. Use these exclusively; do NOT `.toFixed()` or template-literal-percent.
- **UTF-8 BOM** (`﻿`): MUST be first character. Excel auto-detects UTF-8 only when BOM present; without it, Cyrillic characters render as gibberish.
- **WCAG 2.1 AA** (Story 110.4 F-9 precedent): icon-only buttons need `aria-label`. `<Download>` icon + "Скачать CSV" label both rendered.
- **Defensive Frontend Principle** (CLAUDE.md): if any helper receives unexpected data shape (e.g., null evaluation array), return BOM + empty headers — don't throw. Component should gate disabled state on empty data.
- **File-size cap**: each pure helper ≤80 lines target (well under 200 cap); ExportCsvButton ≤80 lines; test files ≤300 lines target.
- **Empty-state UX**: button disabled when no data; consider tooltip "Нет данных для экспорта" — defer to component test result.

### File Structure Plan

```
src/
├── lib/csv/                                              ← NEW directory
│   ├── csv-helpers.ts                                    ← NEW (Task 3) — shared escape + BOM
│   ├── evaluations-csv-export.ts                         ← NEW (Task 1)
│   ├── sku-accuracy-csv-export.ts                        ← NEW (Task 2)
│   └── __tests__/
│       ├── csv-helpers.test.ts                           ← NEW
│       ├── evaluations-csv-export.test.ts                ← NEW
│       └── sku-accuracy-csv-export.test.ts               ← NEW
├── components/
│   └── custom/
│       └── ai/
│           ├── ExportCsvButton.tsx                       ← NEW (Task 4)
│           └── __tests__/
│               └── ExportCsvButton.test.tsx              ← NEW
└── app/(dashboard)/analytics/models/[id]/evaluations/
    ├── components/
    │   └── EvaluationsList.tsx                           ← MODIFIED (Task 5)
    └── sku-accuracy/components/
        └── SkuAccuracyOverview.tsx                       ← MODIFIED (Task 6)

_bmad-output/implementation-artifacts/
└── epic-110-fe-retro-2026-05-19.md                       ← NEW (Task 7)
```

### Testing Standards

- Vitest + React Testing Library (project standard).
- Pure-function tests: direct `expect(exportXxxToCsv(fixture)).toContain('...')` — no mocks needed.
- BOM assertion: `expect(csv.charCodeAt(0)).toBe(0xFEFF)`.
- Cell-escape edge cases: explicit fixtures with comma / quote / newline in vendorCode field.
- Locale-correct assertions: use regex `/12,5\s*%/` not exact string `"12,5 %"` (non-breaking-space variability per Story 110.2 F-2 precedent).
- Component test for ExportCsvButton: mock `URL.createObjectURL`, spy on `Blob` constructor, mock anchor `.click()`, verify `URL.revokeObjectURL` called.

### Defensive Frontend Considerations (CLAUDE.md § Defensive Frontend Principle)

- Empty evaluations array → return BOM + headers only (no error). Component gates disabled state on empty data.
- Null entries inside array → defensive skip OR raise warning + skip (avoid crash). Defaults via normalizer should prevent this, but defensive guard is cheap.
- File-name edge cases: modelId UUID is safe for filenames; if `evaluatedAt` is null, fall back to `todayString` (`new Date().toISOString().slice(0,10)`).
- Browser compat: `Blob` + `URL.createObjectURL` supported in all target browsers (Chrome / Firefox / Safari / Edge); no IE concerns.

### Epic 110-FE retrospective structure (Task 7 — follow Story 109.6 retro precedent)

Section outline:
1. **Summary** — 1-paragraph epic overview (goal: complete AI module's Evaluations + Feedback + CSV deliverables).
2. **Scope Shipped** — Stories 110.1-110.5 one-line summaries.
3. **What Went Well** — backend coordination mid-Epic (Story 110.2 F-1 `?modelId=` filter), pre-flight verification finding substantial foundation (Stories 108.1 / 110.1), 3-pass review on 110.3 + 110.4 catching real defects.
4. **What Went Poorly** — story-file Lessons line char-count escaped 2 fresh-context passes (3rd-pass meta-pattern); Epic spec text drift from actual backend contract (Story 110.4 `thumbsUp: boolean` vs `feedbackType` enum).
5. **Discipline Observations** — 55+ streak preserved; ~10 backend-related decisions across the epic (F-1 contract gap, #166 request); fix-block propagation discipline (Story 97.1-FE) applied successfully on Story 110.3 + 110.4 (F-1 + F-8 propagated to Story 110.2 EvaluationsTable).
6. **Test-count progression** — Epic start floor ~7591 → Epic close ~7808 (+217 net).
7. **Action Items for Epic 111** — `scripts/check-lessons-length.sh` mechanical validator (3rd-pass meta-pattern); Story 110.4 F-1 invalidation scoping decision (when to invalidate `['ai']` root vs domain-specific) — consider explicit scoping decision tree.
8. **Quality Gate Final State** — ESLint 0E/112w, type-check 0, vitest ~7808 passing, check-docs 22 broken (baseline maintained throughout Epic).

### References

- **Source**: `_bmad-output/planning-artifacts/epics-110-fe.md` § Story 110.5-FE (lines 125-141).
- **Foundation**:
  - `src/app/(dashboard)/analytics/unit-economics/unit-economics-csv-export.ts:1-47` (Story 77.5 precedent — extend with BOM + locale)
  - `src/lib/utils.ts:17-48` (formatCurrency, formatDate, formatNumber, formatPercentage)
  - `src/types/ai/evaluations.ts` (EvaluationEntry, SkuAccuracyEntry, SkuAccuracyHistoryEntry)
- **Patterns**: `frontend/CLAUDE.md` (Anti-Pattern #8, Two-pass review, Accepted Baselines, Defensive Frontend Principle, Russian-locale formatters), `frontend/CLAUDE-PATTERNS.md` (Boundary Normalizer, AP#8 Exceptions taxonomy)
- **Precedent stories**:
  - Story 77.5-FE — CSV export pattern (extend with BOM + locale)
  - Story 109.6-FE — Epic retrospective template (`epic-109-fe-retro-2026-05-17.md`)
  - Story 110.2-FE — EvaluationsList integration target; F-1 backend coordination precedent
  - Story 110.3-FE — SkuAccuracyOverview integration target; F-8 `String(nmId)` precedent for opaque IDs; 3rd-pass char-count meta-pattern
  - Story 110.4-FE — `<FeedbackButtons>` component location precedent (`src/components/custom/ai/`); 3rd-pass Lessons-line char-count discipline
  - Story 94.4-FE — Lessons-line convention (≤120 chars per lesson)
  - Story 94.6-FE — Epic-close cleanliness check (git status clean before flipping epic-110-fe → done)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- ExportCsvButton: `vi.spyOn(global, 'Blob')` fails with "Class constructor cannot be invoked without new" — resolved by using URL.createObjectURL spy + anchor.click mock instead (no Blob constructor spy needed).
- `formatNumber` lives in `src/lib/fbs-analytics-formatters.ts`, not `src/lib/utils.ts` — fixed import paths in both CSV helpers.

### Completion Notes List

- Task 1: `exportEvaluationsToCsv` pure helper + 14 tests. BOM verified (charCodeAt(0) === 0xFEFF). AP#8 null MAPE → '—'. Russian-locale percentage regex `/12,5\s*%/`. Cell escape: comma/quote/newline all covered.
- Task 2: `exportSkuAccuracyToCsv` pure helper + 14 tests. Same BOM + AP#8 discipline. `String(nmId)` opaque ID (no locale separator). `evaluationCount = 0` → '0' (semantic-zero, not em-dash).
- Task 3: `csv-helpers.ts` (escape + BOM) + 9 orthogonal tests.
- Task 4: `<ExportCsvButton>` component (61 lines) + 13 tests. Disabled on empty CSV or BOM-only. `URL.revokeObjectURL` cleanup verified.
- Task 5: `EvaluationsList.tsx` integration — ExportCsvButton in CardHeader flex-row. Filename uses `evaluatedAt?.slice(0,10) ?? todayString`.
- Task 6: `SkuAccuracyOverview.tsx` integration — ExportCsvButton in CardHeader. `CardHeader` import added. Filename uses `todayString`.
- Task 7: Epic 110-FE retrospective — 189 lines. All spec sections present. Test count: 7591→7799 (+208). Streak: 55+ (authoritative source: epic-109-fe-retro-2026-05-17.md line 25 — closed at 50+; +5 stories in Epic 110).
- Task 8: Status flipped to review. Sprint-status updated. Change Log row added.

### File List

| File | Lines | Status |
|---|---|---|
| `src/lib/csv/csv-helpers.ts` | 25 | NEW |
| `src/lib/csv/evaluations-csv-export.ts` | 62 | NEW |
| `src/lib/csv/sku-accuracy-csv-export.ts` | 52 | NEW |
| `src/lib/csv/__tests__/csv-helpers.test.ts` | 116 | NEW |
| `src/lib/csv/__tests__/evaluations-csv-export.test.ts` | 167 | NEW |
| `src/lib/csv/__tests__/sku-accuracy-csv-export.test.ts` | 158 | NEW |
| `src/components/custom/ai/ExportCsvButton.tsx` | 62 | NEW |
| `src/components/custom/ai/__tests__/ExportCsvButton.test.tsx` | 209 | NEW |
| `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx` | 204 | MODIFIED |
| `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyOverview.tsx` | 97 | MODIFIED |
| `_bmad-output/implementation-artifacts/epic-110-fe-retro-2026-05-19.md` | 187 | NEW |
| `src/lib/utils.ts` | 164 | MODIFIED |
| `src/lib/fbs-analytics-formatters.ts` | 136 | MODIFIED |

### Change Log

| Date | Change |
|---|---|
| 2026-05-19 | Story created via `/bmad:bmm:workflows:create-story` (BMad Master). Spec source: `_bmad-output/planning-artifacts/epics-110-fe.md` § Story 110.5-FE (lines 125-141). Pre-flight verification confirmed Story 77.5 CSV export precedent exists but lacks UTF-8 BOM + Russian-locale formatters — Story 110.5 extends the pattern + adds pure-function separation. Scope: 2 pure helpers + shared csv-helpers + ExportCsvButton + 2 integrations + Epic 110-FE retrospective + sprint-status epic-close cleanliness check (Story 94.6-FE). FINAL story of Epic 110-FE. Estimate: ~0.5 SP. |
| 2026-05-19 | Implementation complete via dev-story workflow. Shipped: `src/lib/csv/` directory (3 pure helpers + 3 test files, 50 tests), `<ExportCsvButton>` component + 13 tests, integrations into EvaluationsList + SkuAccuracyOverview, Epic 110-FE retrospective (189 lines). Final gates: ESLint 0E/112w, type-check 0 errors, vitest 7799 passing (+50 from 7749 floor), check-docs 22 broken (baseline). Status: in-progress → review. Awaiting 2-pass adversarial review. |
| 2026-05-19 | 2-pass adversarial review complete. 11 1st-pass + 9 2nd-pass findings resolved across different defect classes (spec drift, RFC 4180 CRLF, cross-domain coupling, memory leak, useMemo, weak Blob assertion, streak attestation, retro lessons length, type="button", task hygiene, line-count drift; then fix-block propagation × 3, attestation × 2, derivative CRLF escape, dead-code branch, retro count, useMemo dep churn, file-size deferral). Final gates: ESLint 0E/112w, type-check 0, vitest 7810 passing (+219 from Epic 109 close 7591), check-docs 22 broken (baseline). **Lessons:** (1) UTF-8 BOM + CRLF + Russian-locale formatters is the canonical CSV-for-Excel recipe; Story 77.5 lacked all three. (2) Pure-function separation (string-build vs side-effect download) enables test isolation + useMemo optimization. (3) Cross-domain imports (FBS formatters → generic CSV) signal misplaced ownership — promote shared helpers to utils.ts. Status: review → done. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Each lesson ≤120 chars per Story 110.4-FE 3rd-pass char-count discipline (verify via python `len()`). Earlier rows DO NOT require Lessons. -->

### Post-1st-pass-review fixes (2026-05-19)

- F-1 (HIGH): Spec drift fixed — Task 1 sub-task now uses `x !== null ? formatPercentage(x) : '—'` (impl was already correct). File: story file only.
- F-2 (HIGH): CSV line endings changed from `\n` to `\r\n` per RFC 4180. CRLF tests added to csv-helpers.test.ts; existing tests updated to split on `\r\n`. Files: evaluations-csv-export.ts, sku-accuracy-csv-export.ts, csv-helpers.test.ts, evaluations-csv-export.test.ts, sku-accuracy-csv-export.test.ts.
- F-3 (HIGH): `formatNumber` moved from `fbs-analytics-formatters.ts` to `utils.ts`; re-export preserved in fbs-analytics-formatters.ts for backward compat; CSV helpers now import from `utils.ts`. Files: utils.ts, fbs-analytics-formatters.ts, evaluations-csv-export.ts, sku-accuracy-csv-export.ts.
- F-4 (MEDIUM): Synthetic `<a>` now uses `appendChild` + `click` + `remove` (memory leak fix per Story 77.5 precedent). Tests assert appendChild call-count delta + removeSpy called. Files: ExportCsvButton.tsx, ExportCsvButton.test.tsx.
- F-5 (MEDIUM): Wrapped `csvContent` + `csvFileName` computations in `useMemo` on EvaluationsList and SkuAccuracyOverview. Files: EvaluationsList.tsx, SkuAccuracyOverview.tsx.
- F-6 (MEDIUM): ExportCsvButton test now captures Blob argument and asserts MIME type (`text/csv;charset=utf-8;`) + non-zero size. Note: jsdom `Blob.text()` unsupported — size assertion used instead of content. File: ExportCsvButton.test.tsx.
- F-7 (MEDIUM): Streak reconciled to 55+ (authoritative source: `epic-109-fe-retro-2026-05-17.md` line 25 — Epic 109 closed at 50+; +5 stories in Epic 110 = 55+). Updated story file AC 12, Task 9 sub-task, Completion Notes, and retro (Delivery, Metrics table, Team Acknowledgement). Files: story file, epic-110-fe-retro-2026-05-19.md.
- F-8 (MEDIUM): Reformatted Epic 110 retro Lessons section — all 3 lessons now ≤120 chars (verified via `python3 len()`). File: epic-110-fe-retro-2026-05-19.md.
- F-9 (LOW): `type="button"` added explicitly to `<Button>` in ExportCsvButton.tsx — shadcn Button does not set it by default (confirmed: `src/components/ui/button.tsx` spreads `...props` with no type default). Test added asserting `getAttribute('type') === 'button'`. Files: ExportCsvButton.tsx, ExportCsvButton.test.tsx.
- F-10 (LOW): No action — Task 9 sub-checkboxes intentionally unchecked pending 2nd-pass review.
- F-11 (LOW): File List line counts updated to match actual `wc -l` output (post-fix). Two new files added to list: utils.ts (164 lines) and fbs-analytics-formatters.ts (136 lines). File: story file.

**Validation**: ESLint 0E/112w, type-check 0 errors, vitest 7808 passing (+9 from 7799 baseline), check-docs exit 0 / 22 broken (baseline match).
**Streak**: 2-pass review discipline applied — 1st pass complete; awaiting 2nd pass. Streak at epic close will be 55+.

### Post-2nd-pass-review fixes (2026-05-19)

- F-1 (HIGH): Propagated streak `54+` → `55+` to remaining sites in story file (lines 83 + 188). Grep verified zero `54+` sites remain. File: story file.
- F-2 (HIGH): Reconciled stale test counts in story AC 9 (line 23) + Task 7 outline (line 189) + Quality Gate line (191) — `7749/+158` → `7808/+217` matching current actual. File: story file.
- F-3 (HIGH): Updated retro Vitest baseline from stale `7799` to current `7808` at all 5 sites (lines 22, 40, 41, 168, 177, 187); `+208` → `+217` (7591→7808 = +217 net for Epic). File: epic-110-fe-retro-2026-05-19.md.
- F-4 (HIGH): No action — `**Lessons:**` final-row Change Log entry is parent-session responsibility on `review → done` flip (per Story 94.4-FE convention).
- F-5 (MEDIUM): `escapeCsvCell` now detects `\r` per RFC 4180 § 2.6 (catches legacy Mac line endings + accidental backend artifacts). Added test for bare `\r` cell. Files: csv-helpers.ts, csv-helpers.test.ts.
- F-6 (MEDIUM): Rewrote `isCsvEmpty` to detect realistic "headers-only" state (BOM + headerRow → 1 line after CRLF split → disabled) instead of literal-BOM-only tautology. Tests now exercise actual helper output: `HEADERS_ONLY_CSV` (BOM+headers, no CRLF → disabled) vs `VALID_CSV` (BOM+headers+CRLF+data row → enabled). Files: ExportCsvButton.tsx, ExportCsvButton.test.tsx.
- F-7 (MEDIUM): Updated retro metric row "2-pass review fix commits: 4 → 5" reflecting Story 110.5's own 2-pass review. File: epic-110-fe-retro-2026-05-19.md.
- F-8 (MEDIUM): Moved `todayString` computation INSIDE useMemo to eliminate per-render Date allocation. Deps array trimmed: EvaluationsList `[modelId, evaluatedAt]`, SkuAccuracyOverview `[modelId]`. Files: EvaluationsList.tsx, SkuAccuracyOverview.tsx.
- F-9 (LOW — DEFERRED): EvaluationsList.tsx at 204 raw lines (under effective ESLint cap with skipBlankLines+skipComments). Captured as Epic 111 action item A-5 in retro: extract `<EvaluationsHeaderCard>` presenter to drop file to ~150 lines before next feature addition. File: retro.
- F-10 (LOW — subsumed by F-1+F-2).
- F-11 (informational — no defect).

**Validation**: ESLint 0E/112w, type-check 0, vitest 7810 passing (+2 from 7808: F-5 `\r` test + F-6 headers-only test), check-docs exit 0 / 22 broken (baseline match).
**Streak**: 2-pass discipline complete. Both passes found defects of DIFFERENT classes (1st pass: spec drift, CRLF, cross-domain coupling, memory leak, useMemo, weak Blob assertion, streak math, retro lessons length, type="button", task hygiene, line-count drift; 2nd pass: fix-block propagation × 3, attestation × 2, derivative-defects × 2, retro count, useMemo dep churn, file-size deferral). Streak extends to 55+ at Epic 110-FE close (after parent session flips Status to done).
