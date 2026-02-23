# Story 64.1-FE: Fix Liquidity API — Remove Unsupported Params

**Epic**: [64-FE UI Validation & Business Logic Fixes](./README.md)
**Status**: ✅ Complete
**Completed**: 2026-02-21
**Priority**: P0
**Points**: 1

---

## User Story

**As a** seller viewing the Liquidity Analysis page
**I want** the page to load without API errors
**So that** I can analyze my inventory liquidity

---

## Background

The `/analytics/liquidity` page returned HTTP 400 because the frontend sent `include_liquidation_scenarios` parameter which the backend DTO does not support. The page was completely broken.

---

## Acceptance Criteria

### AC1: Page loads without errors
Given I navigate to /analytics/liquidity
When the page loads
Then the API returns 200 and data is displayed

---

## Technical Implementation

### Files Modified
| File | Change |
|------|--------|
| `src/lib/api/liquidity.ts` | Removed `include_liquidation_scenarios` param from URL builder |
| `src/types/liquidity.ts` | Removed `include_liquidation_scenarios` from `LiquidityQueryParams` |
| `src/hooks-v1/useLiquidity.ts` | Removed param from JSDoc, `useIlliquidStock`, `useLiquidityByCategory` |
| `src/app/(dashboard)/analytics/liquidity/page.tsx` | Removed param from query params object |
| `src/hooks/__tests__/useLiquidity.test.ts` | Removed param from test fixtures |

---

## Definition of Done
- [x] TypeScript compiles without errors
- [x] ESLint passes
- [x] /analytics/liquidity page loads successfully

*Created: 2026-02-21*
