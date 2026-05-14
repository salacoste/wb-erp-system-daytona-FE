# Backend Analysis Summary: Requests #53, #54, #55

**Date**: 2025-12-09
**Analyzed By**: Backend Team

---

## Executive Summary

Frontend team запросила три новых API endpoints для расширенной аналитики:
- **#53** Unit Economics - Структура затрат по SKU
- **#54** Supply Planning - Планирование закупок
- **#55** Liquidity Analysis - Анализ ликвидности запасов

### Результат анализа

| Request | Epic | Priority | Effort | Can Start? |
|---------|------|----------|--------|------------|
| **#53 Unit Economics** | Epic 27 | 🔴 P0 | 13 SP | ✅ **YES** |
| **#54 Supply Planning** | Epic 28 | 🟡 P1 | 25 SP | ⚠️ After WB Stocks API |
| **#55 Liquidity Analysis** | Epic 29 | 🟠 P2 | 19 SP | ❌ After Epic 28 |

**Total Effort**: 57 Story Points

---

## Backend Team Response
**Status**: RESOLVED
**Resolution**: Backend analyzed three frontend analytics requests (Unit Economics #53, Supply Planning #54, Liquidity Analysis #55), assessed feasibility, created dependency graph, and assigned priorities with story point estimates. Unit Economics (P0) can start immediately; Supply Planning (P1) requires WB Stocks API first; Liquidity (P2) depends on Supply Planning.
**Frontend Action**: No further action needed unless noted above.

```
                    EXISTING INFRASTRUCTURE
                    ═══════════════════════
                    │
                    ├── weekly_margin_fact (Epic 26) ✅
                    ├── cogs (Epic 10) ✅
                    ├── wb_finance_raw ✅
                    └── Auth & Guards ✅
                            │
        ┌───────────────────┼───────────────────────┐
        │                   │                       │
        ▼                   │                       │
┌───────────────┐           │                       │
│ Epic 27       │           │                       │
│ Unit Economics│           │                       │
│ (13 SP)       │           │                       │
│ CAN START NOW │           │                       │
└───────────────┘           │                       │
                            │                       │
                    ┌───────▼───────────────┐       │
                    │  NEW: WB Stocks API   │       │
                    │  Integration Required │       │
                    └───────────────────────┘       │
                            │                       │
                            ▼                       │
                    ┌───────────────┐               │
                    │ Epic 28       │               │
                    │ Supply Planning│              │
                    │ (25 SP)       │               │
                    │ BLOCKED       │               │
                    └───────┬───────┘               │
                            │                       │
                            │ depends on            │
                            ▼                       │
                    ┌───────────────┐               │
                    │ Epic 29       │               │
                    │ Liquidity     │◄──────────────┘
                    │ (19 SP)       │   uses COGS
                    │ BLOCKED       │
                    └───────────────┘
```

---

## Implementation Roadmap

### Phase 1: Epic 27 - Unit Economics (NOW)
**Duration**: ~2 weeks
**No blockers** - can start immediately

```
Stories:
  27.1 Database & Service Layer (5 SP)
  27.2 API Controller & DTOs (3 SP)
  27.3 Caching & Performance (2 SP)
  27.4 Testing & Documentation (3 SP)
```

### Phase 2: Epic 28 - Supply Planning
**Duration**: ~4 weeks
**Blocker**: WB Stocks API integration

```
Stories:
  28.1 WB Stocks API Integration (5 SP) ← BLOCKER
  28.2 Database Schema & Migration (3 SP)
  28.3 Daily Stocks Sync Job (3 SP)
  28.4 Sales Velocity Calculation (3 SP)
  28.5 Supply Planning Service (5 SP)
  28.6 API Controller & DTOs (3 SP)
  28.7 Testing & Documentation (3 SP)
```

### Phase 3: Epic 29 - Liquidity Analysis
**Duration**: ~3 weeks
**Blocker**: Epic 28 completion

```
Stories:
  29.1 Liquidity Calculation Service (5 SP)
  29.2 Liquidation Scenario Calculator (3 SP)
  29.3 Main Liquidity Endpoint (3 SP)
  29.4 Liquidity Trends Endpoint (3 SP)
  29.5 Caching & Performance (2 SP)
  29.6 Testing & Documentation (3 SP)
```

---

## New Infrastructure Required

### Epic 27 (Unit Economics)
- **NEW**: `UnitEconomicsService`
- **NEW**: `unit-economics.controller.ts`
- **NEW**: Profitability classifier helper
- **REUSE**: Existing `weekly_margin_fact` data

### Epic 28 (Supply Planning)
- **NEW**: `inventory_snapshot` table
- **NEW**: `in_transit_shipment` table
- **NEW**: WB Stocks API integration
- **NEW**: Daily stocks sync cron job
- **NEW**: `VelocityCalculationService`
- **NEW**: `SupplyPlanningService`

### Epic 29 (Liquidity Analysis)
- **NEW**: `LiquidityAnalysisService`
- **NEW**: `LiquidationCalculator`
- **NEW**: `/v1/analytics/liquidity/trends` endpoint
- **REUSE**: Stock data from Epic 28
- **REUSE**: COGS data for frozen capital

---

## API Endpoints Summary

| Endpoint | Epic | Status |
|----------|------|--------|
| `GET /v1/analytics/unit-economics` | 27 | 📋 Planned |
| `GET /v1/analytics/supply-planning` | 28 | ⏳ Blocked |
| `GET /v1/analytics/liquidity` | 29 | ⏳ Blocked |
| `GET /v1/analytics/liquidity/trends` | 29 | ⏳ Blocked |

---

## Risk Assessment

### Epic 27 (Low Risk)
- All data exists ✅
- Simple calculations ✅
- No external dependencies ✅

### Epic 28 (Medium-High Risk)
- **WB API Rate Limits**: Need careful pagination
- **Large Catalogs**: 10k+ SKUs performance concern
- **Data Freshness**: Daily sync may not be enough for some use cases

### Epic 29 (Medium Risk)
- **COGS Coverage**: Some products may lack COGS
- **Price Elasticity Model**: Assumptions may not match reality
- **Historical Data**: Limited without historical stock snapshots

---

## Frontend Recommendations

### For Epic 27 (Unit Economics)
- ✅ Start frontend development now
- API will be available in ~2 weeks

### For Epic 28 (Supply Planning)
- ⚠️ Use mock data for frontend development
- API availability: ~4-6 weeks
- Show `stocks_updated_at` in UI for data freshness

### For Epic 29 (Liquidity Analysis)
- ⚠️ Use mock data for frontend development
- API availability: ~7-9 weeks
- Handle null `frozen_capital` for products without COGS

---

## Documents Created

| Document | Path |
|----------|------|
| Epic 27 | `docs/epics/epic-27-unit-economics-analytics.md` |
| Epic 28 | `docs/epics/epic-28-supply-planning-analytics.md` |
| Epic 29 | `docs/epics/epic-29-liquidity-analysis-api.md` |
| Response #53 | `frontend/docs/request-backend/53-...-backend-response.md` |
| Response #54 | `frontend/docs/request-backend/54-...-backend-response.md` |
| Response #55 | `frontend/docs/request-backend/55-...-backend-response.md` |

---

## Next Steps

1. ✅ **Epic 27**: Ready to start development
2. 📋 **Epic 28**: Research WB SDK Stocks module (Context7)
3. ⏳ **Epic 29**: Wait for Epic 28 infrastructure

---

## Contact

Backend Team ready to answer questions about API contracts and implementation details.
