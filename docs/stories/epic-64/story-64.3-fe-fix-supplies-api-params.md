# Story 64.3-FE: Fix Supplies API — Remove Unsupported Sort Params

**Epic**: [64-FE UI Validation & Business Logic Fixes](./README.md)
**Status**: ✅ Complete
**Completed**: 2026-02-21
**Priority**: P0
**Points**: 2

---

## User Story

**As a** seller viewing the Supplies Management page
**I want** the page to load without API errors
**So that** I can manage my FBS supplies

---

## Background

The `/supplies` page returned HTTP 400 because the frontend sent `sort_by` and `sort_order` parameters which the backend DTO does not support. Sort UI was preserved with client-side sorting.

---

## Acceptance Criteria

### AC1: Page loads without errors
Given I navigate to /supplies
When the page loads
Then the supplies list displays correctly

### AC2: Client-side sorting works
Given the supplies page is loaded
When I click a sortable column header
Then the data sorts locally without API call

---

## Technical Implementation

### Files Modified
| File | Change |
|------|--------|
| `src/types/supplies.ts` | Removed `sort_by` and `sort_order` from `SuppliesListParams` |
| `src/app/(dashboard)/supplies/page.tsx` | Removed sort params from API call, added `sortSupplies()` client-side sort, removed sort from URL sync |
| `src/test/fixtures/supplies.ts` | Removed sort params from mock fixtures |

---

## Definition of Done
- [x] TypeScript compiles without errors
- [x] ESLint passes
- [x] /supplies page loads successfully
- [x] Column sorting works client-side

*Created: 2026-02-21*
