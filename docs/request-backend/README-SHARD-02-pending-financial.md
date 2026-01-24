# Pending Requests - Financial Features

[< Back to Index](./README.md) | [< Previous: Recent Epics](./README-SHARD-01-recently-resolved-epics.md) | [Next: Resolved Financial >](./README-SHARD-03-resolved-financial.md)

---

This shard contains pending and in-progress requests related to financial features and WB column changes.

---

## Request #61: WB Column Rename - Paid Acceptance to Operations at Acceptance

**Date**: 2024-12-15
**Priority**: HIGH - Breaking Change
**Status**: CODE READY - Backward-compatible synonyms added
**Effective Date**: 2024-12-22 (WB reports)
**Component**: Backend - Excel Import Parser
**File**: [61-wb-column-rename-dec-2024.md](./61-wb-column-rename-dec-2024.md)

**Summary**: Wildberries renamed expense categories in financial reports (effective 22.12.2024):

| Old Name | New Name |
|----------|----------|
| `Paid acceptance` (column) | `Operations at acceptance` |
| `Paid acceptance` (reason) | `Product processing` |
| `Paid acceptance MP by boxes` | `Product processing MP by boxes` |
| `Box number for paid acceptance` | `Box number for product processing` |

**Backend Changes**:
- `src/imports/column-mapper/synonym-dictionary.const.ts` - Added new synonyms
- `src/imports/column-mapper/required-columns.const.ts` - Added comments
- `CLAUDE.md` - Updated Column Synonym Dictionary section

**API Impact**: **NONE** - Internal field names unchanged (`paid_acceptance_cost`)

**Full Documentation**: `docs/WB-COLUMN-RENAME-2024-12-22.md`

---

## Request #58: Aggregation retail_price_total (Sum by YOUR prices)

**Date**: 2025-12-14
**Priority**: HIGH - Core Financial Feature
**Status**: AWAITING IMPLEMENTATION
**Component**: Backend - Weekly Aggregation
**Related**: PM Request #02 (Financial Data Presentation Concept)
**File**: [58-retail-price-total-aggregation.md](./58-retail-price-total-aggregation.md)

**Business Need**: Show business owner the complete sales funnel starting from their set price (before WB discounts).

**New Fields**:
- `retail_price_total` = SUM(retail_price) WHERE doc_type='sale' - sum by YOUR prices
- `retail_price_returns` = SUM(retail_price) WHERE doc_type='return' - returns by YOUR prices

**Purpose**: Delta `retail_price_total - sales_gross` will show how much WB discount (SPP/promotions) "ate".

---

[< Back to Index](./README.md) | [< Previous: Recent Epics](./README-SHARD-01-recently-resolved-epics.md) | [Next: Resolved Financial >](./README-SHARD-03-resolved-financial.md)
