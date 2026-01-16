# Backend Response: Request #55 - Liquidity Analysis API Endpoint

**Date**: 2025-12-09
**Status**: 📋 PLANNED - Depends on Epic 28
**Epic Created**: [Epic 29 - Liquidity Analysis API](/docs/epics/epic-29-liquidity-analysis-api.md)
**Priority**: 🟠 P2 - MEDIUM
**Estimated Delivery**: 19 Story Points
**Blocked By**: Epic 28 (Stock Snapshots Infrastructure)

---

## Analysis Summary

### Current State Assessment

| Requirement | Status | Notes |
|-------------|--------|-------|
| Stock snapshots | ❌ **MISSING** | Depends on Epic 28 |
| Sales velocity | ⚠️ **PARTIAL** | Epic 28 will provide |
| COGS data | ✅ **READY** | For frozen capital calculation |
| Turnover calculation | ❌ **MISSING** | Need to implement |
| Liquidation scenarios | ❌ **MISSING** | Need to implement |
| Trends endpoint | ❌ **MISSING** | Need to implement |

**Assessment**: ~10% of required infrastructure exists. Heavily dependent on Epic 28.

---

## ⚠️ Dependency Chain

```
Epic 28 (Supply Planning)
    └── Story 28.1: WB Stocks API  ───┐
    └── Story 28.2: Database Schema ──┤
    └── Story 28.3: Daily Sync Job ───┼──► Epic 29 (Liquidity)
    └── Story 28.4: Velocity Calc ────┘      └── Story 29.1: Liquidity Service
                                             └── Story 29.2: Liquidation Calc
                                             └── Story 29.3-29.6: API & Testing
```

**Epic 29 CANNOT start until Epic 28 Stories 28.1-28.4 are complete.**

---

## Backend Epic & Stories

### Epic 29: Liquidity Analysis API

| Story | Points | Description | Status | Depends On |
|-------|--------|-------------|--------|------------|
| 29.1 | 5 | Liquidity Calculation Service | Planned | Epic 28 |
| 29.2 | 3 | Liquidation Scenario Calculator | Planned | 29.1 |
| 29.3 | 3 | Main Liquidity Endpoint | Planned | 29.1 |
| 29.4 | 3 | Liquidity Trends Endpoint | Planned | 29.3 |
| 29.5 | 2 | Caching & Performance | Planned | 29.3-29.4 |
| 29.6 | 3 | Testing & Documentation | Planned | All |
| **Total** | **19** | | | |

---

## API Contract Confirmation

### Endpoint 1: Main Liquidity Analysis
```
GET /v1/analytics/liquidity
```

### Endpoint 2: Liquidity Trends
```
GET /v1/analytics/liquidity/trends
```

### ✅ Confirmed Query Parameters (Main)

| Parameter | Type | Default | Confirmed |
|-----------|------|---------|-----------|
| `week` | string | current | ✅ |
| `turnover_weeks` | number | 4 | ✅ |
| `view_by` | enum | "sku" | ✅ |
| `liquidity_filter` | enum | "all" | ✅ |
| `sort_by` | string | "frozen_capital" | ✅ |
| `limit` | number | 100 | ✅ |

### ✅ Confirmed Response Structure

Response will match the contract from Request #55.

---

## Key Formulas

### Turnover Days (Inventory Days)

```
turnover_days = (average_stock / total_units_sold) × days_in_period

where:
  average_stock = (opening_stock + closing_stock) / 2
  total_units_sold = SUM(qty) from sales
  days_in_period = turnover_weeks × 7
```

### Frozen Capital

```
frozen_capital = current_stock × unit_cost

where:
  unit_cost = COGS.unit_cost_rub (Week Midpoint strategy)
```

### Liquidation Recovery (per discount scenario)

```
recovery_amount = stock × unit_cost × (1 - discount_pct)
days_to_clear = stock / adjusted_daily_velocity
adjusted_daily_velocity = base_velocity × (1 + elasticity × discount_pct)
```

---

## Liquidity Classification

| Status | Turnover Days | Color |
|--------|---------------|-------|
| `highly_liquid` | 0-14 days | Green (#22C55E) |
| `medium` | 15-30 days | Light Green (#84CC16) |
| `low` | 31-60 days | Yellow (#EAB308) |
| `illiquid` | > 60 days | Red (#EF4444) |

---

## Implementation Notes

### Products Without COGS

For frozen capital calculation when COGS missing:
1. Option A: Use average category COGS
2. Option B: Flag as `frozen_capital: null, missing_cogs: true`
3. **Decision**: Option B (more accurate, no assumptions)

### Price Elasticity Model

Default elasticity = 1.5 (configurable):
- 20% discount → +30% velocity
- 50% discount → +75% velocity

### Edge Cases

| Case | Handling |
|------|----------|
| Zero velocity | `turnover_days: null, liquidity_status: "frozen"` |
| Zero stock | Exclude from results |
| Missing COGS | Include with `frozen_capital: null` |
| New products | `liquidity_status: "new", turnover_days: null` |

---

## Implementation Timeline

Given dependency on Epic 28:

```
[Epic 28 must complete first: ~4 weeks]
           │
           ▼
Week 1: Story 29.1 (Liquidity Service) + 29.2 (Liquidation)
Week 2: Story 29.3 (Main API) + 29.4 (Trends API)
Week 3: Story 29.5 (Caching) + 29.6 (Testing)
```

**Estimated Completion**: 3 weeks after Epic 28

---

## Questions/Clarifications

| Question | Resolution |
|----------|------------|
| Price elasticity configurable? | Yes, per-cabinet setting possible |
| Historical liquidation tracking? | Phase 2 - `liquidation_plans` table |
| Category-level COGS fallback? | No - flag as missing instead |

---

## Frontend Integration Notes

1. **API NOT AVAILABLE YET** - Blocked by Epic 28
2. **Sequential dependency** - Start after Epic 28 + Epic 29 stories 29.1-29.2
3. **Mock data recommended** while backend develops
4. **Graceful handling** for products without COGS (null frozen capital)

---

## Action Items

- [x] Create Epic 29 document
- [x] Create backend response document
- [ ] **Wait for Epic 28 completion**
- [ ] Implement liquidity calculation service
- [ ] Implement liquidation scenarios
- [ ] Notify frontend when API ready

---

## References

- Request: `frontend/docs/request-backend/55-liquidity-api-endpoint.md`
- Epic: `docs/epics/epic-29-liquidity-analysis-api.md`
- Frontend Epic: `frontend/docs/stories/7.0.liquidity-analysis-epic.md`
- Dependency: `docs/epics/epic-28-supply-planning-analytics.md`
