# Epic 76-FE Retrospective: Shipment Planning & Cost Calculation

**Date**: 2026-03-11
**Status**: Complete
**Facilitator**: Bob (Scrum Master)
**Participants**: Alice (PO), Charlie (Dev Lead), Dana (QA Lead), Elena (Junior Dev), R2d2 (Project Lead)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| **Stories** | 6 (76.1 through 76.6) |
| **Story Points** | 24 SP |
| **Completion** | 6/6 (100%) |
| **Total Tasks** | 54 (all completed) |
| **New Components** | 15 (ShipmentsTable, CreateShipmentDialog, ShipmentDetailHeader, PalletAccordion, PalletAccordionItem, BoxLineTable, BoxLineForm, PreflightWarnings, ValidationErrorItem, ValidationErrorPanel, CalculationResults, ShipmentActions, ShipmentDeleteDialog, ShipmentsEmptyState, shipments-columns) |
| **New Hooks** | 6 (use-shipments, use-shipment-detail, use-box-lines, use-shipment-calculations, useShipmentsPageState, plus query keys factory) |
| **New API Modules** | 3 (shipments-api, box-lines-api, shipment-calculations-api) |
| **New Types** | 3 interfaces + 1 enum added to shipment-cost.ts |
| **Tests Added** | ~207 across all stories |
| **Final Test Suite** | 420 suites, 7,231 tests, 0 failures |
| **Code Reviews** | 2 formal reviews (76.4, 76.6) |
| **Code Review Issues Found** | 13 total (76.4: 8, 76.6: 5) |
| **Code Review Issues Fixed** | 13/13 (100% auto-fixed) |
| **ESLint Violations** | 0 |
| **TypeScript Errors** | 0 |
| **Production Build** | Successful |
| **Files >200 Lines** | 0 |
| **Production Incidents** | 0 |

---

## Previous Retro Follow-Through (Epic 75-FE)

| # | Action Item | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Add eslint-plugin-jsx-a11y rule for aria-label on icon-only buttons | ❌ Not created | Manually enforced via code review — 20 aria-labels across 10 shipment files verified in 76.6 Task 8 |
| 2 | Document mutable mock variable pattern in test-utils | ❌ Not created | Pattern was documented in 76.6 Dev Notes instead; used correctly in all new test files |
| 3 | Add note about AlertDialogAction anti-pattern | ✅ Applied | ShipmentDeleteDialog (76.5) and PalletAccordionItem (76.2) both use `<Button>` + manual close, never AlertDialogAction for async operations |

**Follow-through rate**: 1/3 items explicitly addressed. However, all 3 underlying issues were handled correctly during implementation:
- ARIA: All new components have proper aria-labels (verified in 76.6 quality gates)
- Mock pattern: Mutable variable + getter used in all new test files consistently
- AlertDialogAction: Avoided throughout all 76-FE dialogs

**Assessment**: The team internalized the lessons even though the tooling automation wasn't created. Risk remains for new contributors who don't know the patterns.

---

## What Went Well

1. **Component extraction chain managed complexity** — ShipmentDetailHeader grew from 133 lines (76.2) to 195 lines (76.4 — near limit), then was proactively refactored down to 81 lines (76.5) by extracting ShipmentActions (197 lines) and ShipmentDeleteDialog (52 lines). No file ever exceeded 200 lines.

2. **Previous Story Intelligence sections** — Each story's Dev Notes documented anti-patterns, gotchas, and patterns for the next story. This created a rolling knowledge base: 76.2 warned about PUT-not-PATCH, 76.3 documented asymmetric API paths, 76.4 captured the `src/hooks` symlink issue, 76.5 documented optional chaining short-circuit. Each subsequent story built on these.

3. **9-point validation error system** — The collect-all validation approach (ValidationErrorPanel + ValidationErrorItem + validation-error-config) with navigation links to COGS and SKU Packaging pages was well-architected. Backend code normalization via BACKEND_CODE_MAP handles both raw backend codes and frontend enum values cleanly.

4. **Dual cache invalidation pattern** — Established in 76.1 and consistently applied across all 6 stories: every mutation invalidates both `shipmentsQueryKeys.byId(id)` AND `shipmentsQueryKeys.all()`. Verified with explicit tests in 76.6.

5. **Code review continued at 100% auto-fix rate** — 13 issues across 2 reviews, all auto-fixed. Key catches: unsafe `as` casts on ValidationError.code (76.4), `mockRejectedValue` leak across tests (76.6), missing onCalculateStart callback to clear stale results (76.4).

6. **Comprehensive test coverage** — 207+ new tests covering all CRUD operations, error propagation, cache invalidation, role-based access (4 roles), 9 validation error codes, component interactions, and page state management. Final: 7,231 tests passing.

7. **Asymmetric API paths handled correctly** — Box line CREATE uses 3-level nesting (`/pallets/:palletId/box-lines`), while UPDATE/DELETE use 2-level (`/box-lines/:boxLineId`). Documented in story 76.3 Dev Notes and correctly implemented in box-lines-api.ts.

---

## What Didn't Go Well

1. **`src/hooks` symlink to `src/hooks-v1` causes persistent ESLint noise** — Every edit to files in `src/hooks-v1/__tests__/` triggers ESLint parsing warnings ("TSConfig does not include this file"). Tests pass fine via Vitest, but the noise is distracting and makes it harder to spot real errors. This has been a known issue since at least Epic 75-FE.

2. **Optional chaining short-circuit on async callbacks** — `onCallback?.(await asyncFn())` silently skips the async call entirely if `onCallback` is undefined. Discovered in 76.5 and required the 2-line pattern: `const result = await asyncFn(); onCallback?.(result)`. This is a subtle JavaScript gotcha that isn't caught by TypeScript.

3. **`mockRejectedValue` vs `mockRejectedValueOnce`** — Three error propagation tests in use-box-lines.test.ts used permanent `mockRejectedValue()` instead of one-shot `mockRejectedValueOnce()`. This meant rejected state leaked into subsequent tests. Caught in 76.6 code review, but could have caused flaky tests if test order changed.

4. **Sub-agent partial completion in 76.6** — Task 5 agent for use-box-lines tests only added 1 of 4 needed tests. The remaining 3 error propagation tests had to be written manually. Sub-agents occasionally under-deliver on multi-item tasks.

5. **Unsafe `as` casts slipped through initial implementation** — Story 76.4 used `as ValidationError[]` and `as ValidationErrorCode` casts that bypassed type safety. Code review caught both, but the pattern suggests a tendency to reach for `as` when types don't align rather than fixing the underlying type definition.

---

## Key Insights

1. **Proactive extraction > reactive splitting** — The ShipmentDetailHeader extraction chain (133 → 195 → 81 lines) worked because the team extracted components *before* hitting the 200-line limit, not after. Story 76.5 made extraction a primary task, not an afterthought. Compare with Epic 74-FE where 34 SP was spent on reactive file splitting.

2. **Code review catches type safety issues that TypeScript doesn't** — The `as` cast findings in 76.4 are invisible to `tsc --noEmit` but create real risks. Changing `ValidationError.code` from `ValidationErrorCode` to `string` (and handling unknown codes with a fallback) was the correct fix that the type system couldn't enforce.

3. **Rolling knowledge transfer via Dev Notes is highly effective** — The "Previous Story Intelligence" pattern where each story's Dev Notes feed into the next story prevented repeated mistakes across 76.1→76.6. This is more effective than a single document because each lesson is contextualized with the specific code it applies to.

4. **extractValidationErrors() helper demonstrates DRY evolution** — Error extraction logic appeared in calculate (76.4), then confirm and recalculate (76.5). Rather than copy-pasting, a shared helper was created. This organic DRY evolution (duplicate → extract) is healthier than premature abstraction.

5. **Backend API shape surprises are the biggest velocity drag** — Asymmetric box-line paths (76.3), PUT-not-PATCH (76.2), non-updatable deliveryMode returning 409 (76.2), and `/calculate` returning numbers not Decimal strings (76.4) all required investigation. A backend API contract review before starting would have saved discovery time.

---

## Action Items

### Process Improvements

| # | Action | Owner | Priority | Success Criteria |
|---|--------|-------|----------|-----------------|
| 1 | Resolve `src/hooks` → `src/hooks-v1` symlink (rename directory or update tsconfig) | Charlie (Dev Lead) | HIGH | ESLint no longer warns on hooks-v1/ files; import paths still work |
| 2 | Add eslint-plugin-jsx-a11y (carried from 75-FE) | Charlie (Dev Lead) | HIGH | ESLint catches missing aria-label on icon-only buttons automatically |
| 3 | Add "avoid `as` casts" to code review checklist — prefer widening types or adding fallbacks | Dana (QA Lead) | MEDIUM | Code reviews explicitly flag `as` usage; 76-FE patterns serve as reference |
| 4 | Document optional chaining short-circuit gotcha in CLAUDE.md or test-utils | Elena (Junior Dev) | MEDIUM | Warning about `onCallback?.(await asyncFn())` visible in project docs |
| 5 | Conduct backend API contract review before starting new epics | Alice (PO) | MEDIUM | API shapes validated before story 1; reduces discovery time during implementation |

### Technical Debt

| # | Item | Priority | Impact |
|---|------|----------|--------|
| 1 | `src/hooks` → `src/hooks-v1` symlink causes ESLint parsing errors | HIGH | Developer experience: noisy warnings on every hooks-v1/ edit |
| 2 | No E2E tests for shipment workflows (carried from 75-FE) | MEDIUM | Full CRUD + calculate + confirm flow untested at integration level |
| 3 | eslint-plugin-jsx-a11y not yet installed (carried from 74-FE → 75-FE → 76-FE) | HIGH | ARIA accessibility relies on manual review instead of automation |
| 4 | Mutable mock variable pattern still not documented in test-utils | LOW | New developers may try vi.doMock() and waste time |

### Team Agreements

1. **Never use `as` casts** — widen the type or add runtime fallbacks instead. `as` masks type mismatches.
2. **Always use `mockRejectedValueOnce`** for error tests — `mockRejectedValue` (permanent) leaks across tests.
3. **2-line pattern for optional async callbacks** — `const result = await fn(); callback?.(result)` — never `callback?.(await fn())`.
4. **Proactive component extraction at ~150 lines** — don't wait until 200-line limit forces reactive splitting.
5. Previous agreements from 75-FE remain in effect: aria-labels on icon buttons, no AlertDialogAction for async, behavioral test assertions, mutable mock variable pattern.

---

## Readiness Assessment

| Area | Status |
|------|--------|
| Testing & Quality | 420 suites, 7,231 tests, 0 failures |
| ESLint | 0 warnings, 0 errors |
| TypeScript | `tsc --noEmit` clean |
| Production Build | `npm run build` successful |
| File Size Compliance | 0 source files >200 lines |
| ARIA Accessibility | 20 aria-labels across 10 shipment files |
| Code Reviews | 13/13 issues auto-fixed (100%) |
| Deployment | Production-ready on main branch |

**Assessment**: Epic 76-FE is fully complete with all quality gates passing. Shipment planning and cost calculation feature is production-ready with comprehensive test coverage and accessibility compliance.

---

## Next Epic Preview

Epic 77-FE is not yet fully defined. Based on references in the Epic 75-76 specification:

| Aspect | Details |
|--------|---------|
| **Likely Scope** | Dashboard integration of shipment cost data (FCU into unit economics) |
| **Reference** | "Dashboard integration → Defer to Epic 77" from epic-75-76 decision table |
| **Dependencies** | Epic 76-FE shipment cost calculation (complete) |
| **Preparation Needed** | Define epic scope, create stories, verify backend APIs for dashboard aggregation |

### Recommendations for Next Epic

1. **Define Epic 77-FE scope** before starting — the deferred "dashboard integration" may need product discovery
2. **Address HIGH-priority tech debt first** — resolve the hooks symlink and add eslint-plugin-jsx-a11y before new feature work
3. **Consider E2E test epic** — shipment CRUD + calculate + confirm is an ideal E2E candidate, and debt has been carried for 3 epics
4. **Backend API contract review** — validate any new endpoints before story creation to avoid discovery delays

---

## Critical Rules Established (Cumulative)

### New in 76-FE
1. Never use `as` casts — widen types or add runtime fallbacks
2. Always use `mockRejectedValueOnce` (not `mockRejectedValue`) for error tests
3. Use 2-line pattern for optional async callbacks
4. Proactive component extraction at ~150 lines
5. Backend code normalization via mapping tables (BACKEND_CODE_MAP pattern)
6. `extractValidationErrors()` helper pattern for DRY error handling across multiple mutation hooks

### Carried from 75-FE
7. Icon-only buttons require `aria-label`
8. Form errors must set `aria-describedby` + `aria-invalid`
9. Never use `AlertDialogAction` for async mutations
10. Use mutable variable + getter in `vi.mock()` factory
11. Test behavior (visible text), not implementation (element counts)
12. All files must stay under 200 lines

---

## Cumulative Retrospective Stats (Epics 71-76)

| Metric | Epic 71 | Epic 72 | Epic 73 | Epic 74 | Epic 75 | Epic 76 | Total |
|--------|---------|---------|---------|---------|---------|---------|-------|
| Stories | 8 | 6 | 9 | 9 | 4 | 6 | 42 |
| Story Points | 21 | 10 | 26 | 34 | 16 | 24 | 131 |
| Production Incidents | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Code Review Pass Rate | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| Code Review Issues Found | — | — | — | — | 16 | 13 | 29+ |
| Code Review Auto-Fix Rate | — | — | — | — | 100% | 100% | 100% |
| Final Test Count | — | — | — | — | — | 7,231 | 7,231 |
