# Epic 75-FE Retrospective: Reference Data Management — Box Types & SKU Packaging

**Date**: 2026-03-11
**Status**: Complete
**Facilitator**: Bob (Scrum Master)
**Participants**: Alice (PO), Charlie (Dev Lead), Dana (QA Lead), Elena (Junior Dev), R2d2 (Project Lead)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| **Stories** | 4 (75.1 through 75.4) |
| **Story Points** | 16 SP |
| **Completion** | 4/4 (100%) |
| **New Components** | 12 (BoxTypesPage, SkuPackagingPage, CRUD dialogs, etc.) |
| **New Hooks** | 4 (useBoxTypes, useSkuPackaging with CRUD mutations) |
| **New API Modules** | 2 (box-types-api.ts, sku-packaging-api.ts) |
| **New Types** | 1 file (shipment-cost.ts — 10 interfaces/types) |
| **Test Suites** | 97 passing |
| **Code Review Issues Found** | 16 across 3 reviews (75.2: 5, 75.3: 5, 75.4: 6) |
| **Code Review Issues Fixed** | 16/16 (100% auto-fixed) |
| **ESLint Violations** | 0 |
| **TypeScript Errors** | 0 |
| **Production Build** | Successful |
| **Files >200 Lines** | 0 |
| **Production Incidents** | 0 |

---

## Previous Retro Follow-Through (Epic 74-FE)

| Action Item | Status | Notes |
|-------------|--------|-------|
| Create ESLint rule for `'use client'` on files with React hooks | ❌ Not created | No `'use client'` issues surfaced in 75-FE — pattern was followed correctly without automation |
| Add max-lines warning threshold at 180 lines | ❌ Not created | All new files stayed well under 200 lines; no boundary violations |
| Document parallel agent guard rails | N/A | No parallel agent strategy used in 75-FE (only 4 stories) |

**Follow-through rate**: 0/2 applicable items — Neither ESLint rule was created, but no issues arose because 75-FE was greenfield (new components, not refactoring). The risk remains for future refactoring epics.

---

## What Went Well

1. **Clean greenfield architecture** — Building new CRUD pages from scratch allowed clean separation of concerns: page → dialogs → hooks → API → types, all following established project patterns
2. **ProductCombobox with debounced search** — 300ms debounce via useEffect+setTimeout with cached selectedLabel prevents display loss during re-renders; reusable for future features
3. **BulkAddDialog multi-format parsing** — CSV, tab-separated, and semicolon-separated input all handled with single regex parser; 3-step wizard (input → preview → results) gives users confidence before submitting
4. **Code reviews found 16 real issues across 3 reviews** — Every review produced actionable findings. No rubber stamps. Recurring patterns (ARIA, pending state testing) identified early
5. **100% auto-fix success rate** — All 16 code review issues were auto-fixable without manual intervention, saving significant time
6. **Mutable mock variable pattern** — Discovered that `vi.doMock()` is ineffective with static imports; established `let mockX = false` with getter pattern in `vi.mock()` factory as the standard approach
7. **200-line compliance from day one** — All new files designed within the limit; no extraction needed post-creation

---

## What Didn't Go Well

1. **ARIA accessibility was the #1 recurring code review finding** — Found in 75.2 (missing aria-label on icon buttons), 75.3 (missing aria-describedby + aria-invalid on form inputs), and 75.4 (weak assertions for accessibility). Same class of issue in 3/3 reviewed stories.
2. **AlertDialogAction anti-pattern** — Used in SkuPackagingDeleteDialog initially; auto-closes dialog before async mutation completes. Had to switch to regular `<Button>` with manual close. This pattern trap exists in every Radix AlertDialog usage.
3. **vi.doMock() wasted time** — BoxTypeSelect tests initially used `vi.doMock()` for loading state, which is ineffective with ESM static imports. Test appeared to pass but wasn't actually testing the loading branch. Caught in 75.4 code review.
4. **Test assertions sometimes tested implementation, not behavior** — `comboboxes.length >= 2` is fragile; replaced with specific text checks (`'Выберите товар...'`, `'Выберите тип коробки'`). Behavioral assertions are more resilient to refactoring.
5. **No E2E tests written** — 75.4 story scope covered unit tests only. CRUD workflows (create → edit → delete box types, bulk add SKU packaging) are ideal E2E candidates but remain untested at that level.

---

## Key Insights

1. **ARIA accessibility needs automation, not vigilance** — Same finding across 3 consecutive code reviews. An ESLint plugin (eslint-plugin-jsx-a11y) could catch missing aria-label on icon-only buttons automatically. Human reviewers shouldn't be the primary defense.
2. **Greenfield is faster than refactoring** — 16 SP for 4 stories with 12 new components + full test coverage vs. 34 SP for 74-FE's 9 refactoring stories. Building new is ~2x more productive per SP than splitting existing code.
3. **Code review auto-fix is a productivity multiplier** — 16/16 issues auto-fixed means zero back-and-forth. The pattern of "find issues → present options → auto-fix all" is highly efficient.
4. **Mock patterns should be documented in test utils** — The mutable variable + getter pattern for vi.mock is non-obvious. A documented example in test-utils.tsx or a comment pattern would prevent future developers from trying vi.doMock().

---

## Action Items

### Process Improvements

| # | Action | Owner | Priority | Success Criteria |
|---|--------|-------|----------|-----------------|
| 1 | Add eslint-plugin-jsx-a11y rule for aria-label on icon-only buttons | Charlie (Dev Lead) | HIGH | ESLint catches missing aria-label on `<Button size="icon">` without text content |
| 2 | Document mutable mock variable pattern in test-utils or CLAUDE.md | Dana (QA Lead) | MEDIUM | Example of `let mockX` + getter in vi.mock visible in test utility docs |
| 3 | Add note about AlertDialogAction anti-pattern to component docs | Elena (Junior Dev) | LOW | Warning in relevant component files about async + auto-close conflict |

### Technical Debt

| # | Item | Priority | Impact |
|---|------|----------|--------|
| 1 | No E2E tests for Box Types and SKU Packaging CRUD flows | MEDIUM | Regression risk for critical data management pages |
| 2 | ESLint rule for `'use client'` still not created (carried from 74-FE) | LOW | No impact for greenfield, risk remains for refactoring |

### Team Agreements

1. All icon-only buttons MUST have `aria-label` — enforced in code review until ESLint rule exists
2. Form validation errors MUST set `aria-describedby` and `aria-invalid` on the input element
3. Never use `AlertDialogAction` for async operations — use `<Button>` with manual dialog close
4. Test assertions should verify user-visible behavior, not implementation details (text content > element count)
5. Use mutable variable + getter pattern for mock state, never `vi.doMock()` with static imports

---

## Readiness Assessment

| Area | Status |
|------|--------|
| Testing & Quality | ✅ 97 suites passing, 0 failures |
| ESLint | ✅ 0 warnings, 0 errors |
| TypeScript | ✅ `tsc --noEmit` clean |
| Production Build | ✅ `npm run build` successful |
| File Size Compliance | ✅ 0 source files >200 lines |
| ARIA Accessibility | ✅ All issues fixed in code review |
| Deployment | ✅ Production-ready on main branch |

**Assessment**: Epic 75-FE is fully complete with all quality gates passing. No critical items outstanding.

---

## Next Epic Preview: 76-FE — Shipment Planning & Cost Calculation (24 SP)

| Aspect | Details |
|--------|---------|
| Stories | 6 (76.1 through 76.6) |
| Story Points | 24 SP |
| Complexity | HIGH — Nested resources (Shipment → Pallet → BoxLine), multi-step validation pipeline, cost calculation with backend integration |
| Key Challenges | Real-time validation before calculate, accordion UI for nested pallets, pre-flight warnings system, readonly confirmed state |
| API Endpoints | 13 new endpoints (CRUD + calculate + confirm + recalculate) |
| Dependencies | Epic 75-FE (box types, SKU packaging) — ✅ Complete |
| Risk | Backend API for shipment cost calculation may not be fully implemented yet — verify before starting 76.1 |

### Recommendations for 76-FE

1. **Verify backend API readiness** before creating 76.1 story — check if shipment CRUD + calculate endpoints exist
2. **Start with 76.1 (list page)** — establishes types, API client, and routing foundation
3. **76.2 (detail + accordion) is the complexity peak** — consider splitting if >8 SP equivalent
4. **Reuse patterns from 75-FE** — CRUD dialogs, form validation, hook structure are directly applicable

---

## Critical Rules Established

1. Icon-only buttons require `aria-label` — no exceptions
2. Form errors must set `aria-describedby` + `aria-invalid` on inputs
3. Never use `AlertDialogAction` for async mutations — use `Button` + manual close
4. Use mutable variable + getter in `vi.mock()` factory, never `vi.doMock()` with static imports
5. Test behavior (visible text), not implementation (element counts)
6. All files must stay under 200 lines (ESLint enforced)
7. CRUD pages follow: Page → FormDialog → DeleteDialog → hooks → API → types

---

## Cumulative Retrospective Stats (Epics 71-75)

| Metric | Epic 71 | Epic 72 | Epic 73 | Epic 74 | Epic 75 | Total |
|--------|---------|---------|---------|---------|---------|-------|
| Stories | 8 | 6 | 9 | 9 | 4 | 36 |
| Story Points | 21 | 10 | 26 | 34 | 16 | 107 |
| Production Incidents | 0 | 0 | 0 | 0 | 0 | 0 |
| Code Review Pass Rate | 100% | 100% | 100% | 100% | 100% | 100% |
| Code Review Issues Found | — | — | — | — | 16 | — |
| Code Review Auto-Fix Rate | — | — | — | — | 100% | — |
