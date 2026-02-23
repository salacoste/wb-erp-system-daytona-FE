# Story 64.2-FE: Fix Time-Period API — Remove Unsupported Params

**Epic**: [64-FE UI Validation & Business Logic Fixes](./README.md)
**Status**: ✅ Complete
**Completed**: 2026-02-21
**Priority**: P0
**Points**: 1

---

## User Story

**As a** seller viewing the Margin Analysis by Time Period page
**I want** the page to load without API errors
**So that** I can view margin trends over time

---

## Background

The `/analytics/time-period` page returned HTTP 400 because the frontend sent `includeCogs` parameter to `/v1/analytics/weekly/margin-trends` which the backend DTO does not support.

---

## Acceptance Criteria

### AC1: Page loads without errors
Given I navigate to /analytics/time-period
When the page loads
Then the margin trend chart displays correctly

---

## Technical Implementation

### Files Modified
| File | Change |
|------|--------|
| `src/hooks-v1/useMarginTrends.ts` | Removed `includeCogs` from interface, destructuring, queryKey, URL params |
| `src/app/(dashboard)/analytics/time-period/page.tsx` | Removed `includeCogs: true` from `MarginTrendChart` queryParams |
| `src/hooks/useMarginTrends.test.tsx` | Removed `includeCogs` from test hook calls |

---

## Definition of Done
- [x] TypeScript compiles without errors
- [x] ESLint passes
- [x] /analytics/time-period page loads successfully

*Created: 2026-02-21*
