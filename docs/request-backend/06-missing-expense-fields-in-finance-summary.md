# Request #06: Missing Expense Fields in Finance Summary Response

**Date**: 2025-11-22
**Priority**: Medium
**Status**: ✅ **RESOLVED** (2025-01-22)
**Component**: Backend API - Analytics Module
**Endpoint**: `GET /v1/analytics/weekly/finance-summary`

---

## Problem Description

Frontend получает от endpoint `/v1/analytics/weekly/finance-summary` неполный набор полей расходов в объекте `summary_total`. Отсутствуют поля для 2 из 9 категорий расходов, которые должны присутствовать согласно SDK → DB mapping.

**Отсутствующие поля:**
1. `acquiring_fee_total` (Эквайринг) - возвращается `undefined`
2. `commission_sales_total` (Комиссия продаж) - возвращается `undefined`

**Дополнительно:** Несколько полей возвращают `0` вместо отсутствия значения, что может быть корректным поведением для данной недели, но требует подтверждения.

---

## Expected Behavior

Endpoint `/v1/analytics/weekly/finance-summary` должен возвращать в объекте `summary_total` ВСЕ 9 полей категорий расходов согласно SDK → DB mapping:

```typescript
{
  summary_total: {
    week: "2025-W48",
    // ... other fields ...

    // Expense category fields (all should be present):
    logistics_cost_total: number,           // ✅ Currently working
    storage_cost_total: number,             // ✅ Currently working
    paid_acceptance_cost_total: number,     // ✅ Returns 0 (may be correct)
    penalties_total: number,                // ✅ Returns 0 (may be correct)
    wb_commission_adj_total: number,        // ✅ Currently working
    loyalty_fee_total: number,              // ✅ Returns 0 (may be correct)
    loyalty_points_withheld_total: number,  // ✅ Returns 0 (may be correct)
    acquiring_fee_total: number,            // ❌ MISSING (undefined)
    commission_sales_total: number,         // ❌ MISSING (undefined)

    payout_total: number
  },
  summary_rus: { /* ... */ },
  summary_eaeu: { /* ... */ },
  meta: { /* ... */ }
}
```

**Примечание**: Значение `0` для категории расходов корректно, если в данной неделе не было трат в этой категории. Но поле должно присутствовать в ответе (не `undefined`).

---

## Actual Behavior

**Real API Response** (captured from browser console):

```json
{
  "summary_total": {
    "logistics_cost_total": 32470.1,
    "storage_cost_total": 1849.69,
    "paid_acceptance_cost_total": 0,
    "penalties_total": 0,
    "wb_commission_adj_total": 20859.42,
    "loyalty_fee_total": 0,
    "loyalty_points_withheld_total": 0,
    // acquiring_fee_total: MISSING (undefined)
    // commission_sales_total: MISSING (undefined)
    "payout_total": 900000
  }
}
```

**Console Log Evidence**:
```
[Expenses] DEBUG - All summary fields: {
  logistics_cost_total: 32470.1,
  storage_cost_total: 1849.69,
  paid_acceptance_cost_total: 0,
  penalties_total: 0,
  wb_commission_adj_total: 20859.42,
  loyalty_fee_total: 0,
  loyalty_points_withheld_total: 0,
  acquiring_fee_total: undefined,        // ❌ MISSING
  commission_sales_total: undefined,     // ❌ MISSING
}
```

---

## Steps to Reproduce

### Backend Side (for verification):

1. **Query Database** for latest week in `weekly_payout_summary`:
   ```sql
   SELECT
     week,
     logistics_cost_total,
     storage_cost_total,
     paid_acceptance_cost_total,
     penalties_total,
     wb_commission_adj_total,
     loyalty_fee_total,
     loyalty_points_withheld_total,
     acquiring_fee_total,         -- Check if this column exists
     commission_sales_total,      -- Check if this column exists
     payout_total
   FROM weekly_payout_summary
   WHERE report_type = 'основной'
   ORDER BY week DESC
   LIMIT 1;
   ```

2. **Check API Response Serialization**:
   - Verify DTO/serializer includes all expense fields
   - Check if fields are omitted when value is `0` vs `null`

3. **Test Endpoint**:
   ```bash
   curl -X GET "http://localhost:3100/v1/analytics/weekly/finance-summary?week=2025-W48" \
     -H "Authorization: Bearer <token>" \
     -H "X-Cabinet-Id: <cabinet_id>" \
     | jq '.summary_total'
   ```

### Frontend Side (already done):

1. Open browser DevTools Console (F12 → Console)
2. Navigate to `http://localhost:3100/dashboard`
3. Look for log entry: `[Expenses] DEBUG - All summary fields:`
4. Observe `acquiring_fee_total: undefined` and `commission_sales_total: undefined`

**Impact on UI**: Expense breakdown chart shows only 3 categories (Логистика, Хранение, Корректировка комиссии WB) instead of all expense categories.

---

## Reference Documentation

### SDK → DB Mapping (from PRD/backend docs):

| Category (Russian)              | SDK Field               | DB Field (summary_total) |
|---------------------------------|-------------------------|--------------------------|
| Логистика                       | logistics_cost          | logistics_cost_total     |
| Хранение                        | storage_cost            | storage_cost_total       |
| Платная приёмка                 | paid_acceptance_cost    | paid_acceptance_cost_total |
| Штрафы                          | penalties               | penalties_total          |
| Корректировка комиссии WB (прочие) | wb_commission_adj (commission_other only) | wb_commission_adj_total |
| Комиссия лояльности             | loyalty_fee             | loyalty_fee_total        |
| Удержание баллов лояльности     | loyalty_points_withheld | loyalty_points_withheld_total |
| **Эквайринг**                   | **acquiring_fee**       | **acquiring_fee_total** ✅ |
| **Комиссия продаж**             | **commission_sales**    | **commission_sales_total** ✅ |

**Source**:
- Backend PRD: `CLAUDE.md` (SDK → DB mapping section)
- Epic 10 Stories: Documentation confirms these fields should exist

---

## Impact

**Severity**: Medium

**User Impact**:
- Frontend expense breakdown chart incomplete (missing 2 of 9 categories)
- Users cannot see full breakdown of their expenses
- Analytics dashboard provides incomplete financial picture

**Business Impact**:
- Reduced transparency into expense structure
- Potential user complaints about "missing data"
- Incomplete financial reporting

**Technical Impact**:
- Frontend correctly implements all 9 categories
- Frontend tests expect 9 categories (all passing)
- Data contract mismatch between frontend and backend

---

## Proposed Solution

### Option 1: Add Missing Fields to Response (Recommended)

**Backend Changes:**
1. Verify DB schema has `acquiring_fee_total` and `commission_sales_total` columns
2. Update DTO/serializer to include these fields
3. Ensure fields return `0` (not `null` or omitted) when no expenses in category
4. Add tests for complete expense field set

**Verification:**
```typescript
// All fields should be present in response:
response.summary_total.acquiring_fee_total !== undefined     // Should be true
response.summary_total.commission_sales_total !== undefined  // Should be true
```

### Option 2: Document Field Absence (If Intentional)

If these fields are intentionally excluded (e.g., not implemented in MVP):
1. Document in API specification which expense fields are available
2. Update SDK → DB mapping documentation
3. Frontend will adjust expectations accordingly

---

## Additional Context

### Related Files (Frontend):

- `src/hooks/useExpenses.ts:77-95` - DEBUG logging code
- `src/hooks/useDashboard.ts:10-40` - FinanceSummary interface definition
- `src/components/custom/ExpenseChart.tsx` - Expense visualization component
- `docs/stories/3.3.expense-breakdown-visualization.md` - Story documentation

### Recent Changes:

- **2025-11-22**: Story 3.3 enhanced to display all 9 expense categories
- **2025-11-22**: Added comprehensive logging to debug missing fields
- Frontend implementation complete and tested (15/15 tests passing)

### Questions for Backend Team:

1. ✅ **RESOLVED** - `acquiring_fee_total` and `commission_sales_total` columns added to `weekly_payout_summary` and `weekly_payout_total` tables
2. ✅ **RESOLVED** - Fields now included in API response (Request #06 implementation complete)
3. ✅ **RESOLVED** - Columns added via migration `20251122000000_add_acquiring_fee_and_commission_sales_totals`
4. ✅ **RESOLVED** - All expense fields return `0` (not `null` or `undefined`) when no expenses in category

### Backend Response & Implementation (2025-01-22)

**Status**: ✅ **COMPLETED**

**Implementation Summary**:
- ✅ Added `acquiring_fee_total` and `commission_sales_total` columns to database schema
- ✅ Updated SQL aggregation to separately calculate `acquiring_fee` and `commission_sales`
- ✅ **Important**: `wb_commission_adj` now contains only `commission_other` (does NOT include `commission_sales`)
- ✅ Updated DTOs and mapping logic to include new fields in API response
- ✅ All 9 expense categories are now tracked separately

**Key Changes**:
- **Commission Calculation Fix**: `wb_commission_adj` now correctly contains only `commission_other`. `commission_sales` is tracked separately as `commission_sales_total`
- **Complete Expense Breakdown**: All 9 expense categories are now available in API response:
  1. `logistics_cost` / `logistics_cost_total`
  2. `storage_cost` / `storage_cost_total`
  3. `paid_acceptance_cost` / `paid_acceptance_cost_total`
  4. `penalties_total`
  5. `wb_commission_adj` / `wb_commission_adj_total` (commission_other only)
  6. `acquiring_fee_total` (NEW - Request #06)
  7. `commission_sales_total` (NEW - Request #06)
  8. `loyalty_fee` / `loyalty_fee_total`
  9. `loyalty_points_withheld` / `loyalty_points_withheld_total`

**Documentation**:
- See `docs/backend-response-06-implementation-complete.md` for full implementation details
- See `docs/backend-response-06-documentation-update.md` for all documentation changes

**Migration**:
- Migration file: `prisma/migrations/20251122000000_add_acquiring_fee_and_commission_sales_totals/migration.sql`
- Historical data: Fields will return `0` until re-aggregation (optional, use `scripts/recalculate-direct.ts`)

---

## Contact

**Reporter**: Frontend Team (Dev Agent)
**Stakeholders**: Frontend, Backend, Product
**Related Stories**: Story 3.3 (Expense Breakdown Visualization), Epic 10 (Financial Calculations)

---

## Status Updates

### 2025-11-22 - Issue Reported
- Identified missing fields via browser console debugging
- Added comprehensive logging to capture API response
- Documented complete field set expectations
- Frontend implementation ready, waiting for backend fix

### 2025-01-22 - ✅ RESOLVED
- Backend team implemented all requested changes
- Added `acquiring_fee_total` and `commission_sales_total` to database schema and API response
- Fixed commission calculation: `wb_commission_adj` now contains only `commission_other` (separate from `commission_sales`)
- All 9 expense categories are now tracked separately
- Frontend can now display complete expense breakdown
- Migration applied, fields available in all API responses
- Historical data recalculation available via `scripts/recalculate-direct.ts` (optional)
