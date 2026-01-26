# Epic 44-FE Story Audit Report

**Date**: 2026-01-26
**Auditor**: Product Manager
**Epic**: 44-FE - Price Calculator UI
**Trigger**: Discrepancies discovered between frontend implementation and updated backend API documentation

---

## Executive Summary

Epic 44-FE was marked as **100% Complete (27/27 stories)** in the Stories Status Report dated 2026-01-23. However, analysis of the recent backend API documentation updates reveals **critical gaps** that require new stories or revisions to existing stories.

**Key Finding**: The Epic is actually at **96% (27/28)** with **Story 44.40-FE** already created to address the most critical issue (Two Tariff Systems). Additional gaps identified require attention.

---

## Section 1: Existing Stories Status

### Phase 1: Core Calculator (6/6 Complete)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| 44.1-FE | TypeScript Types & API Client | Done | No revision needed |
| 44.2-FE | Input Form Component | Done | No revision needed |
| 44.3-FE | Results Display Component | Done | No revision needed |
| 44.4-FE | Page Layout & Integration | Done | No revision needed |
| 44.5-FE | Real-time Calculation & UX | Done | No revision needed |
| 44.6-FE | Testing & Documentation | Done | No revision needed |

### Phase 2: Enhanced Logistics (4/4 Complete)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| 44.7-FE | Dimension-Based Volume Calculation | Done | No revision needed |
| 44.8-FE | Logistics Tariff Calculation | Done | **NEEDS REVIEW** - May need updates for SUPPLY tariffs |
| 44.9-FE | Logistics Coefficients UI | Done | **NEEDS REVIEW** - Affected by Two Tariff Systems |
| 44.10-FE | Return Logistics Calculation | Done | No revision needed |

### Phase 3: Warehouse & Tariffs (5/5 Complete)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| 44.12-FE | Warehouse Selection Dropdown | Done | **NEEDS REVISION** - Box Type ID not handled |
| 44.13-FE | Auto-fill Coefficients | Done | **NEEDS REVISION** - Must support SUPPLY system |
| 44.14-FE | Storage Cost Calculation | Done (DEPRECATED) | Superseded by 44.32 |
| 44.27-FE | Warehouse & Coefficients Integration | Done | **AC8 INCOMPLETE** - SUPPLY system not integrated |

### Phase 4: V2 Enhancements (6/6 Complete)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| 44.15-FE | FBO/FBS Fulfillment Type Selection | Done | No revision needed |
| 44.16-FE | Category Selection with Search | Done | No revision needed |
| 44.17-FE | Tax Configuration | Done | No revision needed |
| 44.18-FE | DRR Input (Advertising %) | Done | No revision needed |
| 44.19-FE | SPP Display (Customer Price) | Done | No revision needed |
| 44.20-FE | Two-Level Pricing Display | Done | No revision needed |

### Phase 5: Bug Fixes & Improvements (7/7 Complete)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| 44.32-FE | Missing Price Calculator Fields | Done | Box Type implemented but not integrated with backend properly |
| 44.33-FE | Type Mismatch & Field Name Fixes | Done | No revision needed |
| 44.34-FE | Debounce Warehouse Selection | Done | No revision needed |
| 44.35-FE | FBO/FBS Toggle Crash Fix | Done | No revision needed |
| 44.36-FE | API Field Mismatch | Done | Removed invalid fields |
| 44.37-FE | API Field Mismatch Warehouse | Done | Removed invalid fields |
| 44.38-FE | Units Per Package | Done | No revision needed |

### Phase 6: Two Tariff Systems (0/1 Ready)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| **44.40-FE** | **Two Tariff Systems Integration** | **READY FOR DEV** | **NEW** - Created 2026-01-26 |

---

## Section 2: Issues Analysis

### Issue 1: Storage Tariffs Showing 0 RUB (CRITICAL)

**Symptoms**:
- UI shows "0.00 RUB/day" for storage cost
- Backend API returns `storage.baseLiterRub: 0` for some warehouse configurations

**Root Cause Analysis**:

1. **Box Type ID Mismatch**: Backend returns different tariffs for different `boxTypeId`:
   - `boxTypeId: 2` (Boxes) - Standard pricing
   - `boxTypeId: 5` (Pallets) - `additionalLiterRub = 0` (fixed rate)
   - `boxTypeId: 6` (Supersafe) - Standard pricing

2. **SUPPLY System Returns Real Tariffs**: Backend test shows SUPPLY system returns `storage.baseLiterRub: 41.25` for Pallets, while we may be seeing 0 from INVENTORY system or wrong boxTypeId.

**Covered by Existing Stories**: PARTIALLY
- Story 44.32-FE implemented `BoxTypeSelector` component
- Story 44.40-FE addresses SUPPLY vs INVENTORY tariff source
- **GAP**: No story handles the boxTypeId → backend tariff mapping

**Recommendation**:
- Add acceptance criteria to Story 44.40-FE: "AC10: When fetching tariffs, pass boxTypeId to filter by correct cargo type"
- OR create new Story 44.41-FE: "Box Type Tariff Integration"

---

### Issue 2: Box Type (boxTypeId) Not Handled in API Requests (HIGH)

**Symptoms**:
- User selects "Korab" (Box) or "Monopaleta" (Pallet) in UI
- This selection is NOT sent to backend API
- Backend cannot return correct tariffs for the selected box type

**Root Cause**:
- Story 44.36-FE and 44.37-FE **removed** `box_type` from API request as unsupported
- Backend API was not ready to receive this field at the time
- Backend has since been updated with `boxTypeId` support in SUPPLY system

**Covered by Existing Stories**: NO
- Story 44.32-FE creates UI component only
- Story 44.36-FE explicitly removes the field from API request
- No story re-enables sending boxTypeId to backend

**Recommendation**: Create new Story 44.41-FE: "Re-enable boxTypeId in API Request"

---

### Issue 3: Warehouse ID Mismatch (ALREADY FIXED)

**Symptoms**: Warehouse ID for "Krasnodar" differed between INVENTORY and SUPPLY systems

**Status**: ALREADY FIXED in Story 44.27-FE
- Frontend now uses SUPPLY warehouses exclusively
- Example: Krasnodar uses SUPPLY ID 130744 (not INVENTORY ID 507)

**Covered by Existing Stories**: YES - Story 44.27-FE

---

### Issue 4: Formula Verification (MEDIUM)

**Symptoms**: Potential discrepancy in storage cost calculation formulas

**Current Formula** (Story 44.14):
```typescript
daily_cost = (base_per_day + (volume - 1) * per_liter_per_day) * coefficient
```

**Backend Formula**:
```typescript
dailyStorage = (baseLiterRub + max(0, volume-1) * additionalLiterRub) * storageCoef
```

**Analysis**:
- Formula structure is correct
- `max(0, volume-1)` ensures no negative additional liters
- Frontend uses `Math.max(0, volumeLiters - 1)` in existing code

**Covered by Existing Stories**: YES - Story 44.14-FE (formulas correct)

---

### Issue 5: Two Tariff Systems (CRITICAL - ADDRESSED)

**Symptoms**:
- Calculator uses INVENTORY tariffs statically
- Future delivery dates require SUPPLY tariffs
- Cost estimates for future deliveries are inaccurate

**Covered by Existing Stories**: YES - Story 44.40-FE (Ready for Dev)

---

## Section 3: Gap Analysis

### Gaps NOT Covered by Existing Stories

| Gap ID | Description | Impact | Recommended Action |
|--------|-------------|--------|-------------------|
| **GAP-1** | boxTypeId not sent in API request | HIGH - Causes 0 RUB storage tariffs | New story or update 44.40-FE |
| **GAP-2** | No boxTypeId filter when fetching SUPPLY tariffs | HIGH - Returns wrong tariff data | Add to 44.40-FE AC |
| **GAP-3** | Acceptance coefficient not used in calculations | MEDIUM - Coefficient value -1/0/>=1 not factored | Add note to README |

### Existing Stories Needing Revision

| Story | Revision Needed | Priority |
|-------|-----------------|----------|
| **44.40-FE** | Add AC for boxTypeId handling | P0 |
| 44.12-FE | Document boxTypeId flow | P2 |
| 44.27-FE | Complete AC8 (SUPPLY integration) | P0 |
| 44.13-FE | Update for SUPPLY system support | P1 |

---

## Section 4: Recommendations

### Immediate Actions (P0)

1. **Update Story 44.40-FE** to include boxTypeId handling:
   - Add AC10: "Include boxTypeId in SUPPLY tariff fetch request"
   - Add AC11: "Filter tariff response by user-selected box type (Box=2, Pallet=5)"

2. **Review Story 44.37-FE removal of fields**:
   - `box_type` was removed because backend didn't support it
   - Backend now supports `boxTypeId` in SUPPLY system
   - Decision: Re-enable in 44.40-FE scope OR create new story

### Short-term Actions (P1)

3. **Verify storage tariff API response**:
   - Test what boxTypeId returns non-zero storage tariffs
   - Document correct filter parameters

4. **Update Story 44.27-FE documentation**:
   - Mark AC8 as incomplete pending 44.40-FE
   - Add note about SUPPLY system requirement

### Documentation Updates (P2)

5. **Update Epic 44-FE README.md**:
   - Change status from "100% Complete" to "96% Complete (27/28)"
   - Document Phase 6 requirement
   - Add Two Tariff Systems section (already present)

---

## Section 5: Status Summary

### Current Epic Status

| Metric | Value |
|--------|-------|
| Total Stories | 28 |
| Completed | 27 (96%) |
| Ready for Dev | 1 (Story 44.40-FE) |
| Needs Revision | 3-4 stories |
| New Stories Required | 0-1 (depends on 44.40-FE scope) |

### Stories Requiring Attention

| Story | Current Status | Action Required |
|-------|----------------|-----------------|
| **44.40-FE** | Ready for Dev | Add boxTypeId ACs, then implement |
| 44.27-FE | Done | Mark AC8 incomplete, complete in 44.40-FE |
| 44.13-FE | Done | Review after 44.40-FE implementation |
| 44.12-FE | Done | Documentation update only |

---

## Appendix: Reference Documents

- `docs/stories/epic-44/ANALYSIS-PRICE-CALCULATOR-SYNC-2026-01-26.md` - Detailed technical analysis
- `docs/stories/epic-44/story-44.40-fe-two-tariff-systems-integration.md` - New story for critical fix
- `docs/request-backend/108-two-tariff-systems-guide.md` - Backend documentation
- `docs/request-backend/95-epic-43-price-calculator-api.md` - Backend API reference
- `docs/request-backend/98-warehouses-tariffs-coefficients-api.md` - Tariffs API reference

---

**Audit Completed**: 2026-01-26
**Next Review**: After Story 44.40-FE implementation
**Report Version**: 1.0
