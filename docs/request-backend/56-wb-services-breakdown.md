# Request #56: WB Services Expenses Visibility

**Status**: ✅ VERIFIED & DEPLOYED
**Date**: 2025-12-13
**Priority**: High

## Problem Statement

WB services costs (WB.Promotion, Джем subscription, etc.) exist in the database but are hidden within the `other_adjustments_net` aggregate. Users cannot see these costs separately in the analytics dashboard.

## Solution

Break down `other_adjustments_net` into visible categories while maintaining backward compatibility.

## Implementation

### Database Schema Changes

Added 4 new fields to `weekly_payout_summary` and `weekly_payout_total` tables:

```sql
-- weekly_payout_summary
wb_services_cost      DECIMAL(15,2) NOT NULL DEFAULT 0  -- Total WB services
wb_promotion_cost     DECIMAL(15,2) NOT NULL DEFAULT 0  -- WB.Продвижение
wb_jam_cost           DECIMAL(15,2) NOT NULL DEFAULT 0  -- Джем subscription
wb_other_services_cost DECIMAL(15,2) NOT NULL DEFAULT 0 -- Other (утилизация, etc.)

-- weekly_payout_total (with "_total" suffix)
wb_services_cost_total, wb_promotion_cost_total, wb_jam_cost_total, wb_other_services_cost_total
```

### Data Source

Data is extracted from `wb_finance_raw.corrections` field where:
- `reason = 'Удержание'`
- `payload_json->>'bonus_type_name'` matches service patterns

### Pattern Matching (PostgreSQL)

```sql
-- WB.Promotion (covers both WB and ВБ variants)
payload_json->>'bonus_type_name' ~* 'продвижен'
-- Matches: "Оказание услуг «WB Продвижение»", "Оказание услуг «ВБ.Продвижение»"

-- Джем subscription
payload_json->>'bonus_type_name' ~* 'джем'
-- Matches: "Предоставление услуг по подписке «Джем»"

-- Other WB services (утилизация, etc.)
payload_json->>'bonus_type_name' ~* 'утилиза'
-- Or anything not matching above patterns
```

### API Response

Finance Summary endpoint now includes:

```json
{
  "summary_rus": {
    "week": "2025-W49",
    "other_adjustments_net": 51063.00,

    "wb_services_cost": 51063.00,
    "wb_promotion_cost": 32073.00,
    "wb_jam_cost": 18990.00,
    "wb_other_services_cost": 0.00
  }
}
```

Cabinet Summary adds breakdown object:

```json
{
  "summary": {
    "totals": {
      "wb_services_cost": 51063.00,
      "wb_services_breakdown": {
        "promotion": 32073.00,
        "jam": 18990.00,
        "other": 0.00
      }
    }
  }
}
```

## Files Modified

1. **Prisma Schema**: `prisma/schema.prisma`
   - Added 4 fields to WeeklyPayoutSummary
   - Added 4 fields to WeeklyPayoutTotal

2. **Migration**: `prisma/migrations/20251213000000_add_wb_services_breakdown/migration.sql`

3. **Aggregation Service**: `src/aggregation/weekly-payout-aggregator.service.ts`
   - Added SQL CASE statements for pattern matching
   - Updated interfaces (RawAggregationRow, WeeklySummaryData)
   - Updated upsert methods

4. **DTOs**:
   - `src/analytics/dto/weekly-payout-summary.dto.ts`
   - `src/analytics/dto/weekly-payout-total.dto.ts`
   - `src/analytics/dto/response/cabinet-summary-response.dto.ts`

5. **Analytics Service**: `src/analytics/weekly-analytics.service.ts`
   - Updated field mappings
   - Added cabinet summary extraction

## Verification

After server restart, run:

```bash
npx ts-node scripts/verify-wb-services.ts
```

Or manually trigger re-aggregation:

```bash
curl -X POST http://localhost:3000/v1/test/aggregation/trigger \
  -H "Content-Type: application/json" \
  -H "X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e" \
  -d "{}"
```

## Business Rules

1. **Included in other_adjustments_net**: WB services costs are **already part of** `other_adjustments_net`
2. **No formula change**: The payout_total formula remains unchanged
3. **Visibility only**: New fields provide visibility into what's already being deducted
4. **Backward compatible**: All existing calculations remain valid

## Related Documentation

- Architecture: `docs/architecture/adjustment-categorization-system.md`
- WB Dashboard Metrics: `docs/WB-DASHBOARD-METRICS.md`

## Example Data (W49)

| Service | Amount (₽) | Pattern |
|---------|------------|---------|
| WB.Promotion | 32,073 | `Оказание услуг «WB Продвижение»` |
| Джем | 18,990 | `Предоставление услуг по подписке «Джем»` |
| **Total** | **51,063** | = other_adjustments_net |
