# Data Sources Reference: Known Discrepancies & Business Logic

Validated: 2026-02-23 (frontend validation + backend confirmation)

This document explains expected data differences between WB APIs and why they are **not bugs**.

---

## 1. ROAS: Advertising API vs Finance Summary

### Two different ROAS metrics with different business meaning

#### Advertising ROAS (Dashboard) — "Эффективность рекламных инвестиций"

- **Source**: Advertising API (`GET /v1/advertising/analytics/summary`)
- **Formula**: `overall_roas = ad_attributed_revenue / ad_spend`
- **Numerator** (`ad_attributed_revenue`): Revenue from orders that WB attributes to advertising campaigns. WB determines attribution — if a buyer saw an ad, clicked, and ordered, that order is attributed to the campaign. **Organic sales are NOT included.**
- **Denominator** (`ad_spend`): Budget spent on advertising campaigns, from WB PromotionAPI (`adv_daily_stats.spend`). Updated daily, tied to specific campaigns.
- **Example (W07)**: `87,120 / 13,200 = 6.60x` — note: `87,120` is order_sum (gross, before returns/cancellations)

#### Finance-Derived ROAS — "Общая отдача от продвижения"

- **Source**: Finance Summary API (`GET /v1/analytics/weekly/finance-summary`)
- **Formula**: `sale_gross / wb_promotion`
- **Numerator** (`sale_gross`): ALL net sales (organic + ad-driven + direct links), after returns. This is **net sales**, not gross orders.
- **Denominator** (`wb_promotion`): WB deductions for promotion services from the weekly financial report. Updated weekly at report close.
- **Example (W07)**: `78,891.52 / 13,126.92 = 6.01x`

#### Why the numbers differ

| Factor | Advertising ROAS | Finance ROAS |
|--------|-----------------|--------------|
| **Numerator** | `order_sum` = gross orders attributed to ads | `sale_gross` = net sales (all channels, after returns) |
| **Denominator** | `ad_spend` from campaign budgets (PromotionAPI) | `wb_promotion` from weekly report deductions |
| **Data source** | `adv_daily_stats` table | `wb_finance_raw` table |
| **Update frequency** | Daily (real-time campaign data) | Weekly (at report close) |
| **Business question** | "How much revenue does each ad ruble generate?" | "What's the ratio of total sales to promotion costs?" |

**Key insight**: `order_sum` (87,120) can be LARGER than `sale_gross` (78,891) — this is NOT a paradox. `order_sum` is gross orders (before returns/cancellations), while `sale_gross` is net sales (after returns, across ALL channels).

#### ad_spend vs wb_promotion — why they differ (~73 RUB)

- `ad_spend` (13,200) — campaign spending from the advertising dashboard, updated in real-time
- `wb_promotion` (13,127) — deductions from weekly financial report, finalized at report close
- Difference is normal: advertising dashboard records spend in real-time, financial report records deductions with possible end-of-period adjustments

### Revenue Source Isolation (Request #75)

Backend guarantees separation: `advertising-analytics.service.ts` uses ONLY data from `adv_daily_stats` for ROAS calculation, NOT from `wb_finance_raw`. This prevents mixing ad-attributed revenue with total sales.

### Multi-Campaign SKU Deduplication (Story 35.3)

When one product (nmId) is in multiple campaigns simultaneously, profit is deduplicated:
- Profit is taken ONCE from `weekly_margin_fact`
- Ad spend is summed across all campaigns for that SKU
- `actual_roi = (profit - total_spend) / total_spend` — no double-counting

---

## 2. Storage: Paid Storage API vs Weekly Report

### Two different storage cost sources with different methodology

#### Paid Storage API (primary source for SKU analytics)

- **WB Endpoint**: `api/v1/paid_storage` (daily data)
- **Backend aggregation**: SUM of `warehouse_price` per SKU per day for the period
- **Table**: `paid_storage_daily`
- **Granularity**: Daily, per SKU, per warehouse
- **Update frequency**: Daily (with ~1-2 day delay)
- **Used for**: SKU-level storage table, trend charts, top consumers analysis

#### Weekly Report (for P&L and finance summary)

- **Source**: Weekly financial report from WB
- **Field**: `storage` from `wb_finance_raw` / finance-summary
- **Table**: `wb_finance_raw`
- **Granularity**: Aggregate total for the week
- **Update frequency**: Once per week (at report finalization)
- **Used for**: P&L calculations, payout totals, financial summary

#### Why values differ (~1-3%)

| Factor | Paid Storage API | Weekly Report |
|--------|-----------------|---------------|
| **Rounding** | Per SKU/day level | Aggregate for entire week |
| **Adjustments** | No final adjustments | WB final corrections at period close |
| **Tariff recalculations** | Current tariffs at time of recording | Final tariffs at report close date |
| **Data staleness** | Updated daily with ~1-2 day delay | Finalized once per week |

#### Validation threshold

- `analytics-utils.ts:329-333` — difference <3% = "ok" status
- Typical observed difference: 1-3%
- W07 observed: ~1.8% — within normal range

#### Backend cross-reference

The `cabinet-expenses` endpoint provides both sources for comparison:
- `storage` — from Paid Storage API
- `storage_weekly_report` — from weekly report
- `storage_difference` — calculated difference between the two

#### Business recommendation

- **Financial reporting (P&L)**: Use Weekly Report data (finalized WB numbers)
- **Operational monitoring & SKU analytics**: Use Paid Storage API (daily granularity per SKU)

---

## 3. wb_promotion Pattern Matching

### How backend identifies promotion costs in finance report

```sql
-- weekly-payout-aggregator.service.ts:391-396
SUM(CASE
  WHEN reason = 'Удержание'
    AND payload_json->>'bonus_type_name' ~* 'продвижен'
  THEN ABS(corrections)
  ELSE 0
END) as wb_promotion_cost
```

**Covers** (case-insensitive regex `~* 'продвижен'`):
- `WB.Продвижение` — old format (before 2025)
- `ВБ.Продвижение` — new format (after WB → ВБ rebrand)
- `Продвижение товаров` — alternative WB format
- Any case: `ПРОДВИЖЕНИЕ`, `продвижение`, etc.

**Separate categories** (NOT included in wb_promotion):
- `~* 'джем'` → `wb_jam_cost` (subscription "Джем")
- `~* 'минимальн'` → `wb_min_payment_cost` (minimum payment fee)
- Everything else → `wb_other_services_cost` (utilization, compensations, etc.)

**Business meaning**: Sellers need to see promotion costs separately from subscriptions and other WB service costs. All are deductions (`reason = 'Удержание'`), but have different business implications.

---

## Validation Summary

| Check | Result |
|-------|--------|
| `ad_spend` and `wb_promotion` from different tables? | `adv_daily_stats` vs `wb_finance_raw` |
| Revenue for ROAS strictly from advertising API? | Request #75 confirmed |
| No double-counting of spend across campaigns? | Story 35.3 deduplication |
| No double-counting of profit? | Story 35.3 deduplication |
| Pattern matching covers all WB formats? | Case-insensitive regex on Russian word |
| Data sources never mixed? | Full grep across codebase confirmed |

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-23 | Claude + Backend team | Initial document — ROAS, Storage, wb_promotion explanations |
