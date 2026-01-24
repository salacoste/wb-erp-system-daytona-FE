# Request Workflow & Integration Guides

[< Back to Index](./README.md) | [< Previous: Margin & Products](./README-SHARD-05-margin-products.md) | [Next: Status & Auth >](./README-SHARD-07-status-auth.md)

---

This shard contains the request workflow process, file organization, and integration guides.

---

## Request Workflow

### Frontend Team -> Backend Team

1. **Discovery**: Frontend finds issue during development/testing
2. **Investigation**: Root cause analysis (frontend vs backend)
3. **Documentation**: Create detailed request file in `frontend/docs/request-backend/`
4. **Notification**: Inform backend team (Slack/GitHub/email)
5. **Implementation**: Backend team implements solution
6. **Backend Response**: Backend team documents fix (creates `*-backend.md` or updates original file)
7. **Testing**: Frontend team validates fix
8. **Closure**: Update request status to RESOLVED

### Request Template

```markdown
# Request #XX: [Title]

**Date**: YYYY-MM-DD
**Priority**: HIGH / Medium / Low
**Status**: Investigation / In Progress / Resolved
**Component**: Backend API - [Module Name]

## Executive Summary
[Brief description of problem and recommended solution]

## Problem Description
[Current vs Expected behavior with examples]

## Investigation Results
[Evidence: logs, API responses, test results]

## Proposed Solution
[Detailed solution with code examples]

## Acceptance Criteria
[Checklist for testing]

## Recommended Next Steps
[Action items for backend team]
```

---

## File Organization

```
frontend/docs/request-backend/
├── README.md                                    # Index (this file)
├── README-SHARD-01-*.md                        # Recently resolved epics
├── README-SHARD-02-*.md                        # Pending requests
├── README-SHARD-03-*.md                        # Resolved financial
├── README-SHARD-04-*.md                        # COGS & analytics
├── README-SHARD-05-*.md                        # Margin & products
├── README-SHARD-06-*.md                        # Workflow & guides
├── README-SHARD-07-*.md                        # Status & auth
├── 00-[special-document].md                    # Special documents
├── XX-[request-title].md                       # Original frontend requests
├── XX-[request-title]-backend.md               # Backend implementation responses
└── XX-[request-title]-[type].md                # Backend summaries
```

**Naming Convention**:
- Original requests: `XX-[kebab-case-title].md`
- Backend responses: `XX-[kebab-case-title]-backend.md`
- Backend summaries: `XX-[kebab-case-title]-[type].md` (e.g., `15-add-includecogs-to-product-list-endpoint-completion-summary.md`)
- Special documents: `00-[title].md` (e.g., `00-documentation-update-2025-01-26.md`)

---

## Integration Guides

### Guide #24: Margin & COGS Integration Guide

**Date**: 2025-01-27
**Type**: COMPREHENSIVE GUIDE
**Component**: Backend API - Products + Analytics + COGS Modules

**Description**: Complete guide for margin and COGS integration for frontend. Contains:
- Data architecture (tables, formulas)
- All API endpoints with request/response examples
- 5 response scenarios (A-E) with UI recommendations
- `missing_data_reason` values reference
- Week calculation logic (ISO week)
- Polling strategy after COGS assignment
- HTTP status codes and errors
- Frontend checklist

**Documentation**:
- **[24-margin-cogs-integration-guide.md](./24-margin-cogs-integration-guide.md)** - START HERE
- Backend source: [docs/MARGIN-COGS-INTEGRATION-GUIDE.md](../../../docs/MARGIN-COGS-INTEGRATION-GUIDE.md)

---

### Guide #30: SKU Analytics Data Architecture

**Date**: 2025-11-28
**Type**: TECHNICAL GUIDE
**Component**: Backend Analytics + Frontend Display

**Description**: Documentation of data architecture for SKU analytics:
- Handling rows without article (nm_id = 'UNKNOWN')
- SKU margin formula and its limitations
- Data distribution schema from WB Excel
- Fix for `missing_cogs_flag` (showed 0 instead of "Not assigned")

**Key Schema**:
```
WB Excel -> qty=1 (Product) -> SKU Analytics YES
         -> qty=0 (Service) -> Excluded from SKU NO
         -> qty=2 (Transport) -> Informational KPI NO
         -> All rows -> weekly_payout_summary YES
```

**UI Recommendation**: Show user that SKU margin does not include operating expenses.

**Documentation**:
- **[30-sku-analytics-data-architecture.md](./30-sku-analytics-data-architecture.md)** - START HERE

---

### Request #31: COGS Display Improvement - Show Applicable COGS (PROPOSED)

**Date**: 2025-11-28
**Priority**: Medium - UX Improvement
**Status**: PROPOSED - Waiting for implementation
**Component**: Backend API + Frontend Display

**Problem**: When latest COGS is assigned with date after current week midpoint:
- UI shows only latest COGS (e.g., 11 RUB)
- Message "COGS with future date" doesn't explain which COGS is actually applied
- User doesn't understand that for current week previous COGS (e.g., 121 RUB) is used

**Proposed Solution**:
```
Current UI:         11.00 RUB from 23.11.2025
                    (COGS with future date)

Improved UI:        11.00 RUB from 23.11.2025
                    [i] For W46 used: 121 RUB
                    [i] New COGS (11 RUB) applies from W48
```

**Documentation**:
- **[31-cogs-display-improvement-show-applicable-cogs-backend.md](./31-cogs-display-improvement-show-applicable-cogs-backend.md)** - BACKEND REQUEST
- [31-cogs-display-improvement-show-applicable-cogs.md](./31-cogs-display-improvement-show-applicable-cogs.md) - Overview
- [Guide #29: COGS Temporal Versioning](./29-cogs-temporal-versioning-and-margin-calculation.md)

---

### Guide #29: COGS Temporal Versioning & Margin Calculation

**Date**: 2025-11-28
**Type**: TECHNICAL GUIDE
**Component**: Backend API - COGS Module + Analytics Module

**Description**: Detailed explanation of COGS selection logic for margin calculation:
- **Week Midpoint Strategy** - system uses week midpoint (~Thursday) to determine applicable COGS
- Temporal versioning model (`valid_from` / `valid_to`)
- 4 COGS application scenarios with visual diagrams
- Margin calculation example with real data
- Automatic recalculation algorithm on COGS change
- UX recommendations for displaying COGS history
- Edge cases and FAQ

**Key Conclusion**: If COGS is changed on Fri-Sun of current week, it will only apply from **next week**.

**Documentation**:
- **[29-cogs-temporal-versioning-and-margin-calculation.md](./29-cogs-temporal-versioning-and-margin-calculation.md)** - START HERE

---

## Related Documentation

**Backend Documentation**:
- `docs/stories/` - Backend epic stories and requirements
- `docs/architecture/` - System architecture documentation
- `docs/PRODUCTS-API-GUIDE.md` - Products API guide
- `docs/MARGIN-COGS-INTEGRATION-GUIDE.md` - Margin & COGS Integration Guide

**Frontend Documentation**:
- `frontend/docs/stories/` - Frontend epic stories and requirements
- `frontend/docs/api-integration-guide.md` - Frontend integration guide

**Documentation Updates**:
- [Documentation Update Summary (2025-01-26)](./00-documentation-update-2025-01-26.md) - Summary of recent documentation cleanup and corrections

---

## Complete Summary

**[Request #23: All Requests Completed Summary](./23-all-requests-completed-summary.md)** - START HERE

Comprehensive summary of all 22 completed requests with:
- Implementation status for each request
- Key API endpoints added/enhanced
- `missing_data_reason` values reference
- Frontend stories unblocked
- Documentation references

---

[< Back to Index](./README.md) | [< Previous: Margin & Products](./README-SHARD-05-margin-products.md) | [Next: Status & Auth >](./README-SHARD-07-status-auth.md)
