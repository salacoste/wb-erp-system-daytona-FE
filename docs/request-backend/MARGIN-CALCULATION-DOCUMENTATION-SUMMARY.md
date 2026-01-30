# Margin % Calculation Documentation - Summary

**Date**: 2026-01-30
**Purpose**: Summary of documentation updates for FrontEnd team's questions about Margin % calculation
**Status**: ✅ **COMPLETE**

---

## Overview

The FrontEnd team asked about Margin % not calculating in the Finance Summary API. Investigation revealed this is **not a bug** but expected behavior when the `weekly_margin_fact` table is empty. This document summarizes all documentation updates created to address this issue.

---

## Issue Summary

### Observation
- **Endpoint**: `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`
- **Response**: `{ "sale_gross_total": 305778.32, "cogs_total": null, "gross_profit": null, "margin_pct": null }`
- **Question**: Why are margin fields returning `null`?

### Root Cause
- The `weekly_margin_fact` table is **EMPTY**
- Data aggregation pipeline (`cogs` → `weekly_margin_fact`) has **NOT been implemented**
- Epic 56 (Historical Inventory Import) completed COGS import but does NOT populate `weekly_margin_fact`

### Finding
**NOT A BUG** - This is expected behavior when `weekly_margin_fact` is empty.

---

## Documentation Updates

### 1. New Documentation Files Created

#### File #113: Margin Calculation Empty State Behavior
**Path**: `/frontend/docs/request-backend/113-margin-calculation-empty-state-behavior.md`
**Size**: 416 lines
**Purpose**: Complete explanation of why margin fields return `null` and how to handle it

**Contents**:
- Problem description with API response examples
- Root cause analysis (empty `weekly_margin_fact` table)
- Backend logic explanation
- FrontEnd handling strategies with code examples
- Data pipeline status and roadmap
- Testing scenarios
- Q&A section

**Key Sections**:
- "Root Cause Analysis" - Database status and pipeline issue
- "FrontEnd Handling" - Three display strategies with component examples
- "Solution Roadmap" - Short-term (FrontEnd) and long-term (Backend) solutions

---

#### File #114: Margin Calculation FrontEnd Quick Reference Guide
**Path**: `/frontend/docs/request-backend/114-margin-calculation-frontend-guide.md`
**Size**: 517 lines
**Purpose**: Quick troubleshooting guide for FrontEnd developers

**Contents**:
- Quick troubleshooting card
- API response examples for all scenarios
- Empty state handling patterns
- Common scenarios with solutions
- Testing scenarios with test code
- Quick reference card for null value handling
- Component props reference
- FAQ section

**Key Sections**:
- "Quick Troubleshooting" - Fast diagnosis and solution
- "Common Scenarios" - New cabinet, partial coverage, calculation in progress
- "Component Props Reference" - Props for `CogsMissingState`, `MissingCogsAlert`, `MetricCardEnhanced`

---

### 2. Existing Documentation Files Updated

#### File #06: Missing Expense Fields in Finance Summary
**Path**: `/frontend/docs/request-backend/06-missing-expense-fields-in-finance-summary.md`
**Update**: Added "Margin Fields Returning Null - Current Behavior" section

**Added Content**:
- Observed response example
- Explanation of why `cogs_total` and `gross_profit` return `null`
- FrontEnd handling guidance
- Data pipeline status table
- Solution reference to Request #113

---

#### File #21: Margin Calculation Status Endpoint
**Path**: `/frontend/docs/request-backend/21-margin-calculation-status-endpoint-backend.md`
**Update**: Added "Current Status (2026-01-30)" section

**Added Content**:
- Implementation status table
- Explanation of why endpoint returns `null`
- Expected behavior when data is available
- Roadmap for margin aggregation Epic
- FrontEnd action required

---

#### File #46: Product COGS Coverage Counting Bug
**Path**: `/frontend/docs/request-backend/46-product-cogs-coverage-counting-bug.md`
**Update**: Added "Resolution Update (2026-01-30)" section

**Added Content**:
- Root cause clarification (data availability issue, not a bug)
- Current status (table empty, COGS records exist)
- FrontEnd action required
- Reference to Request #113 for implementation details

---

## Key Takeaways

### For FrontEnd Developers

1. **Handle Null Values Gracefully**
   - When `cogs_total === null`, display empty state component
   - Show warning: "Недостаточно данных для расчёта маржи"
   - Provide CTA: "Назначить себестоимость товарам"

2. **Use Existing Components**
   - `MissingCogsAlert` - Warning with call-to-action
   - `CogsMissingState` - Full empty state display
   - `MetricCardEnhanced` - Metric cards with empty state support

3. **Check Coverage Percentage**
   - `cogs_coverage_pct: 0` → Empty state
   - `cogs_coverage_pct: 1-99` → Warning banner
   - `cogs_coverage_pct: 100` → Full metrics display

### For Backend Team

1. **Current Status**
   - `weekly_payout_summary` - ✅ Working
   - `cogs` table - ✅ Has 40 records
   - `weekly_margin_fact` - ❌ EMPTY (no aggregation pipeline)

2. **Future Epic Required**
   - Data aggregation pipeline: `cogs` → `weekly_margin_fact`
   - Trigger points: COGS assignment, historical import, weekly scheduled task
   - Aggregation logic: Join tables, apply temporal logic, calculate per product per week

3. **Epic 56 Clarification**
   - Epic 56 (Historical Inventory Import) completed 2026-01-29
   - Epic 56 imports COGS data into `cogs` table
   - Epic 56 does NOT populate `weekly_margin_fact`
   - Separate Epic needed for margin aggregation

---

## File Structure

```
frontend/docs/request-backend/
├── 113-margin-calculation-empty-state-behavior.md          [NEW - 416 lines]
├── 114-margin-calculation-frontend-guide.md                [NEW - 517 lines]
├── 06-missing-expense-fields-in-finance-summary.md         [UPDATED]
├── 21-margin-calculation-status-endpoint-backend.md        [UPDATED]
├── 46-product-cogs-coverage-counting-bug.md                [UPDATED]
└── MARGIN-CALCULATION-DOCUMENTATION-SUMMARY.md             [THIS FILE]
```

---

## Related Documentation

### Backend Documentation
- `docs/epics/epic-56-historical-inventory-import.md` - COGS import implementation
- `docs/epics/epic-20-auto-margin-recalculation.md` - COGS → Margin trigger
- `docs/BUSINESS-LOGIC-REFERENCE.md` - Margin calculation formulas

### FrontEnd Documentation
- `frontend/docs/api-integration-guide.md` - API endpoint catalog
- `frontend/docs/front-end-spec.md` - UI/UX specification
- `frontend/CLAUDE.md` - FrontEnd development guidelines

---

## Action Items

### Immediate (FrontEnd)
- ✅ Documentation created
- ⏳ Implement empty state handling in finance summary components
- ⏳ Update hooks to handle `null` margin values
- ⏳ Add unit tests for empty state scenarios

### Short-term (FrontEnd)
- ⏳ Create E2E tests for margin calculation flow
- ⏳ Update user documentation with margin calculation explanation
- ⏳ Add error boundary for margin calculation failures

### Long-term (Backend)
- ⏳ Plan new Epic for margin data aggregation pipeline
- ⏳ Define aggregation logic: `cogs` → `weekly_margin_fact`
- ⏳ Implement trigger points for automatic aggregation
- ⏳ Add API endpoint for manual aggregation trigger

---

## Testing Checklist

### Unit Tests
- [ ] Test empty state component renders when `cogs_total === null`
- [ ] Test warning banner displays when coverage < 100%
- [ ] Test metrics display when margin data is available
- [ ] Test formatCurrency/formatPercentage with null values

### Integration Tests
- [ ] Test API response parsing with null values
- [ ] Test component state transitions (empty → loading → data)
- [ ] Test error handling when API call fails

### E2E Tests
- [ ] Test complete flow: No COGS → Assign COGS → View margin data
- [ ] Test polling after COGS assignment
- [ ] Test margin status endpoint integration

---

## Questions & Answers

### Q: Is this a bug?
**A**: No, this is expected behavior when `weekly_margin_fact` is empty.

### Q: When will this be fixed?
**A**: This requires a new Epic for the margin data aggregation pipeline. No timeline currently set.

### Q: What should FrontEnd display in the meantime?
**A**: Display an empty state component with call-to-action to assign COGS.

### Q: Can we manually populate `weekly_margin_fact`?
**A**: Yes, as a temporary workaround. Write aggregation script to populate from `cogs` table.

---

## Summary

✅ **2 new documentation files created** (933 total lines)
✅ **3 existing documentation files updated**
✅ **Complete explanation of issue and solutions**
✅ **FrontEnd implementation examples provided**
✅ **Testing scenarios documented**
✅ **Roadmap for future backend work outlined**

**Next Steps**:
1. FrontEnd team should review new documentation files (#113, #114)
2. Implement empty state handling in finance summary components
3. Backend team should plan margin aggregation Epic
4. Schedule follow-up meeting to discuss timeline

---

**Documentation Created By**: Product Manager Agent
**Date**: 2026-01-30
**Status**: ✅ Complete
**Files Created**: 2 new, 3 updated
**Total Lines**: 933 lines of documentation
