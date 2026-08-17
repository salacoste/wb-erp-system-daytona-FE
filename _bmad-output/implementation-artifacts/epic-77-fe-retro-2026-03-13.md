# Epic 77-FE Retrospective: Shipment Cost Dashboard Integration & Tech Debt Cleanup

**Date**: 2026-03-13
**Facilitator**: Bob (Scrum Master)
**Participants**: Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer), Elena (Junior Dev), R2d2 (Project Lead)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| Stories | 6/6 completed (100%) |
| Story Points | 15 SP |
| Scope | Tech debt cleanup (77.1-77.2) + Dashboard integration (77.3-77.6) |
| Unit Tests Added | 80 (53 from 77.4-77.5, 27 from 77.6) |
| E2E Tests Added | 75 across 4 specs |
| Total Test Suite | 6,512+ unit tests, 0 failures |
| Code Reviews | 5 stories reviewed, 100% auto-fix rate |
| ESLint Errors | 0 |
| TypeScript Errors | 0 |
| Production Incidents | 0 |
| Previous Retro Follow-Through | 5/5 action items (100%), 5/5 agreements (100%) |

### Story Breakdown

| Story | SP | Title | Key Deliverable |
|-------|-----|-------|----------------|
| 77.1 | 2 | Resolve hooks symlink & enable jsx-a11y | Eliminated 3-epic tech debt, zero a11y violations |
| 77.2 | 3 | Shipment E2E tests | 4 Playwright specs (75 tests), gold-standard pattern |
| 77.3 | 1 | Backend request — FCU aggregation endpoint | Request #162 documented with SQL sketch |
| 77.4 | 3 | Unit economics types & waterfall — delivery cost | `delivery_to_warehouse` end-to-end integration |
| 77.5 | 3 | Dashboard table — FCU column | Delivery column, summary card, health score |
| 77.6 | 3 | Tests & polish | 27 new tests, 3 code review fixes, full coverage |

---

## Previous Retrospective Follow-Through (Epic 76-FE)

### Action Items: 5/5 Completed (100%)

| Action Item | Status | Evidence |
|-------------|--------|----------|
| Resolve hooks symlink (high-priority tech debt) | ✅ Done | 77.1: removed symlink, renamed `hooks-v1/` → `hooks/` |
| Enable eslint-plugin-jsx-a11y | ✅ Done | 77.1: added `plugin:jsx-a11y/recommended`, zero violations |
| Define Epic 77-FE scope (dashboard integration) | ✅ Done | Combined tech debt + FCU dashboard integration |
| Consider E2E test epic | ✅ Done | 77.2: 4 Playwright specs mirroring `e2e/supplies/` pattern |
| Backend API contract review before new stories | ✅ Done | 77.3: Request #162 with full endpoint spec |

### Team Agreements: 5/5 Honored (100%)

| Agreement | Evidence in Epic 77-FE |
|-----------|----------------------|
| Never use `as` casts — widen types or add fallbacks | 77.4: optional fields (`?:`) with `?? 0` guards throughout |
| Always use `mockRejectedValueOnce` for error tests | All test files follow pattern consistently |
| 2-line pattern for optional async callbacks | No violations found across 6 stories |
| Proactive component extraction at ~150 lines | 77.5: extracted `UnitEconomicsTableRow` when table hit 191 lines |
| Backend code normalization via mapping tables | 77.4: `mergeDeliveryCosts()` maps `nmId` ↔ `sku_id` |

**Assessment**: Best retro follow-through in project history. All commitments honored, resulting in measurably cleaner code and fewer surprises during implementation.

---

## What Went Well

### 1. Dual-Scope Epic Design
Combining tech debt (77.1-77.2) with feature work (77.3-77.6) ensured unglamorous cleanup was prioritized first. The hooks symlink had been carried across 74→75→76 retros — resolving it in 77.1 unblocked jsx-a11y and eliminated persistent ESLint parsing noise.

### 2. Pure Function Extraction Pattern
Epic 77-FE produced 5 exported pure functions ideal for direct unit testing:
- `mergeDeliveryCosts()` — FCU data matching (8 tests)
- `computeDeliveryMetrics()` — summary card calculations (3 tests)
- `deliveryNullsLastSort()` — null-safe client-side sorting (3 tests)
- `aggregatePortfolioCosts()` — weighted portfolio delivery avg (4 tests)
- `transformToWaterfallData()` — chart-level waterfall rendering (7 tests)

This pattern eliminated the need for fragile hook mocking and should be the default approach going forward.

### 3. E2E Gold-Standard Template
Story 77.2 established a reusable 4-spec pattern (list, detail, lifecycle, a11y) mirroring `e2e/supplies/`. Future CRUD features can scaffold from this template, saving significant setup effort.

### 4. Zero jsx-a11y Violations
Prior ARIA work in Epics 75-76 (20+ aria-labels) meant enabling the accessibility linter produced zero violations. Investment in progressive accessibility pays compound dividends.

### 5. Code Review Quality
100% auto-fix rate across 5 reviews. Notable catches:
- RFC 4180 CSV quote escaping (77.5 H1)
- getSortIcon direction verification (77.6 M1)
- ₽ symbol locale assertion (77.6 M2)
- Truck icon SVG presence (77.6 M3)

### 6. Backward-Compatible Type Design
`delivery_to_warehouse?: number` as optional field ensured zero breaking changes to existing unit economics consumers while enabling new functionality.

---

## What Didn't Go Well

### 1. E2E Selector Fragility (77.2)
Live E2E execution required 8 post-review fixes:
- CSS icon selectors broke (replaced with `getByRole`)
- Strict mode h1 violation (two h1 on page)
- API URL path mismatch (`/v1/shipments` vs `/v1/shipment-cost/shipments`)
- `isVisible()` timing issues (replaced with `await expect().toBeVisible({ timeout })`)

**Root cause**: E2E specs written against assumed DOM structure rather than verified live page.
**Lesson**: Always run E2E specs against live app before marking story complete.

### 2. Two `transformToWaterfallData` Functions Confusion (77.6)
Initial 77.6 testing strategy was confused by two separate transform functions:
- `unit-economics-utils.ts` → `WaterfallDataPoint` (runningTotal, color, value as RUB)
- `waterfall-chart-utils.ts` → `WaterfallChartDataPoint` (start/end, fill, percentage)

**Root cause**: Functions share the same name but serve different layers (shared lib vs component).
**Lesson**: When two functions share a name, document the distinction in Dev Notes for future stories.

### 3. Russian Locale Formatting Gotchas (77.5, 77.6)
`formatCurrency(1234.5)` rounds to 1235 (not 1234) due to `maximumFractionDigits: 0`. Multiple test assertions needed rewriting after discovering locale behavior.

**Root cause**: Formatter behavior not documented in test fixtures.
**Lesson**: Add a "Locale Formatting Cheat Sheet" comment block to `test-utils.tsx` showing actual outputs.

### 4. File Size Pressure (77.5)
`UnitEconomicsTable.tsx` hit 191 lines before row extraction. While proactive extraction at ~150 lines was the agreement, the table still reached 191 before the decision was made.

**Root cause**: Feature additions accumulated without monitoring line count.
**Lesson**: Check file line count *before* adding new features, not after.

---

## Key Insights

### 1. Tech Debt + Feature Epics Work Well Together
The dual-scope approach (77.1-77.2 tech debt + 77.3-77.6 features) ensured cleanup happened because it was on the critical path, not because someone volunteered. This pattern should be repeated when tech debt items are prerequisites for new features.

### 2. Pure Functions > Hook Mocking
Every testable behavior extracted as a pure function had higher test quality and lower maintenance cost than hook-level mocking. The `aggregatePortfolioCosts` export (77.6) is the exemplar — originally private, exported for testing, with zero negative side effects.

### 3. Request Documents Save Implementation Time
Story 77.3 (1 SP) produced Request #162 with SQL sketch, response types, and index recommendations. This front-loaded specification prevented 77.4-77.5 from discovering API shape surprises mid-implementation — the biggest velocity drag identified in 76-FE retro.

### 4. Code Review Adversarial Mode Catches Real Issues
The adversarial review approach (minimum 3 findings) caught subtle issues that would have become production bugs:
- Missing RFC 4180 CSV escaping would corrupt data with commas/quotes
- Unverified sort icon direction could mask a broken sort UX
- Missing ₽ symbol assertion could miss locale regression

### 5. Rolling Knowledge Transfer via Dev Notes Continues to Excel
Pattern established in 76-FE and refined in 77-FE: each story's Dev Notes section prevents the next story from repeating mistakes. The "Previous Story Intelligence" section in 77.6 directly referenced 77.5 learnings (ESLint hook, locale formatting, CSV interception).

---

## Technical Debt Status

### Resolved in This Epic
| Item | Origin | Resolution |
|------|--------|------------|
| `src/hooks` symlink to `hooks-v1/` | Epic 74-FE | 77.1: directory renamed, symlink removed |
| Missing jsx-a11y ESLint plugin | Epic 74-FE | 77.1: plugin configured, zero violations |
| No shipment E2E tests | Epic 76-FE | 77.2: 4 Playwright specs (75 tests) |

### Intentionally Pre-Wired (Not Debt)
| Item | Status | Notes |
|------|--------|-------|
| `calculateHealthScore()` with delivery bonus | Complete, no UI caller | Pre-wired for future health score widget |
| `deliveryCoverageRatio` in page state | Computed, not rendered | Pre-wired for future delivery coverage indicator |

### New Debt: None
Epic 77-FE introduced no new technical debt items.

---

## Team Agreements (Carried Forward + New)

### Carried Forward from 76-FE (All Still Active)
1. Never use `as` casts — widen types or add fallbacks
2. Always use `mockRejectedValueOnce` for error tests
3. 2-line pattern for optional async callbacks
4. Proactive component extraction at ~150 lines
5. Backend code normalization via mapping tables

### New Agreements from 77-FE
6. **Run E2E specs against live app** before marking E2E stories complete (prevents selector fragility — 8 fixes needed in 77.2)
7. **Export pure functions from hooks** for direct unit testing instead of mocking hook internals (established in 77.4-77.6)
8. **Document same-name function distinctions** in Dev Notes when two functions share a name across different modules (waterfall confusion in 77.6)
9. **Use regex assertions for locale-formatted values** in tests (`/₽/`, `/\d+/`) rather than exact string matching (formatting gotchas in 77.5-77.6)

---

## Action Items

### Process Improvements

1. **Add locale formatting cheat sheet to test-utils.tsx**
   - Owner: Dev team (next story touching test-utils)
   - Success criteria: Comment block showing `formatCurrency()`, `formatPercentage()` actual outputs
   - Priority: Low (prevents test assertion mistakes)

2. **Establish pre-feature line count check**
   - Owner: Dev team (all future stories)
   - Success criteria: Check file line count before adding features, extract proactively at 150 lines
   - Priority: Medium (agreement #4 reinforcement)

### Documentation

3. **Update CLAUDE.md with new team agreements (#6-#9)**
   - Owner: Dev team (next session)
   - Success criteria: Agreements documented in project instructions
   - Priority: Low

---

## Readiness Assessment

| Dimension | Status | Notes |
|-----------|--------|-------|
| Testing & Quality | ✅ Green | 80 unit tests, 75 E2E tests, 0 failures, 0 lint errors |
| Deployment | ✅ Ready | Build succeeds, all quality gates passing |
| Technical Health | ✅ Solid | No new debt, 3 legacy items resolved, strict TypeScript |
| Unresolved Blockers | ✅ None | FCU endpoint (Request #162) pending backend but frontend gracefully handles absence |
| Stakeholder Acceptance | ⏳ Pending | Dashboard enhancement live but formal acceptance TBD |

**Overall**: Epic 77-FE is production-ready. The codebase is in excellent health — cleaner than when the epic started thanks to tech debt resolution.

---

## Retrospective Meta-Analysis

### Epic-over-Epic Improvement Trend

| Metric | Epic 75-FE | Epic 76-FE | Epic 77-FE | Trend |
|--------|-----------|-----------|-----------|-------|
| Stories | 4 | 6 | 6 | Stable |
| Story Points | 16 | 24 | 15 | Right-sized |
| Retro Follow-Through | N/A | First retro | 100% (5/5) | Excellent |
| Code Review Auto-Fix | N/A | 100% (13/13) | 100% (16/16) | Consistent |
| Production Incidents | 0 | 0 | 0 | Clean streak |
| New Tech Debt | 2 items | 1 item | 0 items | Improving |

### What's Different About This Epic
- **First epic with 100% retro follow-through** — proves the retrospective process works
- **First epic with zero new tech debt** — all pre-wired code is intentional and documented
- **First dual-scope epic** — combining tech debt with features ensured cleanup actually happened

---

## Next Steps

1. Review this retrospective summary
2. No next epic (78-FE) currently defined — plan when ready
3. When planning next epic, carry forward all 9 team agreements
4. Consider: health score UI widget, delivery coverage indicator (pre-wired code ready)
5. Backend: monitor Request #162 (FCU aggregation endpoint) deployment status

---

**Retrospective Status**: ✅ Complete
**Sprint Status Updated**: `epic-77-fe-retrospective: optional → done`
