# Request #108: Two Tariff Systems Guide - Frontend Documentation

**Date**: 2026-01-25
**Status**: ✅ PRODUCTION READY
**Priority**: P1 - CRITICAL FOR FRONTEND
**Related Epic**: Epic 43 (Price Calculator), Epic 44-FE (Price Calculator UI)
**Backend Stories**: 43.5, 43.9

---

## Executive Summary

**Wildberries has TWO different tariff systems**, both **already implemented** in the backend:

| System | Purpose | SDK Method | Service | Endpoint |
|--------|---------|------------|--------|----------|
| **Inventory (остатки)** | Actual storage costs | `sdk.tariffs.getTariffsBox()` | `WarehousesTariffsService` | `GET /v1/tariffs/warehouses-with-tariffs` |
| **Supply (поставка)** | Planning 14 days ahead | `sdk.ordersFBW.getAcceptanceCoefficients()` | `AcceptanceCoefficientsService` | `GET /v1/tariffs/acceptance/coefficients` |

**Key Insight**: The difference between Marketplace rates (higher) and our API rates (lower) is because:
- Marketplace shows **Supply rates** (for planning future deliveries)
- Our API returns **Inventory rates** (current actual costs)

**This is correct behavior** - the systems serve different purposes.

---

## Inventory Tariff System (Actual Costs)

### Purpose
- **Current actual costs** for storage and logistics
- Used for calculating **real expenses** in financial reports
- Reflects what you **actually pay** for stored goods

### API Endpoint
```
GET /v1/tariffs/warehouses-with-tariffs
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string (YYYY-MM-DD) | No | Today | Tariff date |
| `cargo_type` | string | No | all | Filter: MGT, SGT, KGT |
| `refresh` | boolean | No | false | Bypass cache |

### Response Structure
```json
{
  "data": {
    "warehouses": [
      {
        "id": 507,
        "name": "Краснодар",
        "city": "Краснодар",
        "federal_district": "Южный ФО",
        "coordinates": { "lat": 45.0355, "lon": 38.9753 },
        "cargo_type": "MGT",
        "delivery_types": ["FBS"],
        "tariffs": {
          "fbo": {
            "delivery_base_rub": 46.0,
            "delivery_liter_rub": 14.0,
            "logistics_coefficient": 1.2
          },
          "fbs": {
            "delivery_base_rub": 50.0,
            "delivery_liter_rub": 15.0,
            "logistics_coefficient": 1.25
          },
          "storage": {
            "base_per_day_rub": 0.07,
            "liter_per_day_rub": 0.05,
            "coefficient": 1.0
          },
          "effective_from": "2026-01-20",
          "effective_until": "2026-02-03"
        }
      }
    ],
    "meta": {
      "total_warehouses": 50,
      "with_tariffs": 48,
      "without_tariffs": 2,
      "tariff_date": "2026-01-25",
      "fetched_at": "2026-01-25T10:00:00Z",
      "cache_ttl_seconds": 3600
    }
  }
}
```

### When to Use Inventory System

✅ **USE FOR:**
- Calculating **actual storage costs** in financial reports
- Displaying **current logistics rates** in Price Calculator
- Computing **real expenses** for profitability analysis
- Any **historical** or **current cost** calculations

❌ **DO NOT USE FOR:**
- Planning future deliveries (use Supply system instead)
- Estimating acceptance costs for upcoming shipments

---

## Supply Tariff System (Planning)

### Purpose
- **Forward-looking planning** for the next 14 days
- Used for **supply planning** and cost estimation
- Shows **future acceptance availability** and rates

### API Endpoints

#### 1. Get All Acceptance Coefficients (Discovery)
```
GET /v1/tariffs/acceptance/coefficients/all
```

**Purpose**: Discover all warehouses and their 14-day coefficients

**Response**:
```json
{
  "coefficients": [
    {
      "warehouseId": 507,
      "warehouseName": "Краснодар",
      "date": "2026-01-20",
      "coefficient": 1,
      "isAvailable": true,
      "allowUnload": true,
      "boxTypeId": 2,
      "boxTypeName": "Boxes",
      "delivery": {
        "coefficient": 1.2,
        "baseLiterRub": 46.0,
        "additionalLiterRub": 14.0
      },
      "storage": {
        "coefficient": 1.0,
        "baseLiterRub": 0.07,
        "additionalLiterRub": 0.05
      },
      "isSortingCenter": false
    }
    // ... 250 entries total (all warehouses × 14 days × box types)
  ],
  "meta": {
    "total": 250,
    "available": 200,
    "unavailable": 50,
    "cache_ttl_seconds": 3600
  }
}
```

#### 2. Get Acceptance Coefficients by Warehouse
```
GET /v1/tariffs/acceptance/coefficients?warehouseId=507
```

**Purpose**: Get 14-day forecast for specific warehouse

#### 3. Validate Warehouse ID
```
GET /v1/tariffs/acceptance/coefficients/validate?warehouseId=507
```

**Purpose**: Check if warehouse ID exists and get list of all available warehouses

### Coefficient Interpretation

| Value | Meaning | UI Recommendation |
|-------|---------|-------------------|
| `-1` | Acceptance unavailable | Show "Unavailable", disabled |
| `0` | Free acceptance | Show "Free" badge |
| `1` | Standard cost | Normal display |
| `>1` | Increased cost | Show warning (×1.5 = 150%) |

### When to Use Supply System

✅ **USE FOR:**
- **Planning future deliveries** (up to 14 days ahead)
- **Supply planning** features
- **Estimating acceptance costs** for upcoming shipments
- **Warehouse availability** checks for future dates

❌ **DO NOT USE FOR:**
- Calculating actual historical costs (use Inventory system instead)
- Financial reporting of real expenses

---

## Decision Matrix: Which System to Use?

| Scenario | Use System | Endpoint | Reason |
|----------|-----------|----------|--------|
| **Price Calculator** (current costs) | Inventory | `/warehouses-with-tariffs` | Actual rates for today |
| **Price Calculator** (future delivery) | Supply | `/acceptance/coefficients` | Plan delivery 14 days ahead |
| **Financial Reports** | Inventory | `/warehouses-with-tariffs` | Real expenses incurred |
| **Supply Planning** | Supply | `/acceptance/coefficients/all` | 14-day forecast |
| **Storage Cost Analysis** | Inventory | `/warehouses-with-tariffs` | Actual storage costs |
| **Warehouse Selection** (today) | Inventory | `/warehouses-with-tariffs` | Current rates |
| **Warehouse Selection** (future) | Supply | `/acceptance/coefficients/all` | Future availability |
| **Margin Calculator** | Inventory | `/warehouses-with-tariffs` | Real costs matter |
| **Acceptance Cost Estimator** | Supply | `/acceptance/coefficients` | Future delivery planning |

---

## Rate Difference Explanation

### Why Marketplace Shows Higher Rates?

**Question**: "Marketplace tariff is 120 ₽, but API returns 80 ₽. Is this wrong?"

**Answer**: **No, this is correct!** Here's why:

1. **Marketplace UI** → Shows Supply tariffs (planning rates, typically higher)
2. **Our API** → Returns Inventory tariffs (actual costs, typically lower)

**Example Scenario**:
```
Marketplace display:  "120 ₽ for delivery to warehouse X"
   ↓ (using Supply system)
Our API returns:    "80 ₽ for delivery to warehouse X"
   ↓ (using Inventory system)
```

Both are correct - they serve different purposes!

### Business Context

| Context | Tariff Type | Rate Level | Reason |
|---------|-------------|------------|--------|
| **Planning delivery** | Supply (Marketplace) | Higher | Conservative estimate for budgeting |
| **Actual cost** | Inventory (API) | Lower | Real amount you'll be charged |

---

## Frontend Integration Examples

### Example 1: Price Calculator (Current Costs)

```typescript
// Use Inventory system for actual costs
import { useWarehousesWithTariffs } from '@/hooks/useWarehouses';

function PriceCalculator({ warehouseId }: { warehouseId: number }) {
  const { data: warehouses } = useWarehousesWithTariffs();

  const warehouse = warehouses?.warehouses.find(w => w.id === warehouseId);

  if (!warehouse?.tariffs) {
    return <div>No tariff data available</div>;
  }

  // Calculate with ACTUAL costs (Inventory system)
  const deliveryCost = warehouse.tariffs.fbo.delivery_base_rub;
  const storageCost = warehouse.tariffs.storage.base_per_day_rub;

  return (
    <div>
      <p>Delivery: {deliveryCost} ₽ (actual cost)</p>
      <p>Storage: {storageCost} ₽/day (actual cost)</p>
    </div>
  );
}
```

### Example 2: Supply Planning (Future Delivery)

```typescript
// Use Supply system for planning
import { useAcceptanceCoefficients } from '@/hooks/useAcceptanceCoefficients';

function SupplyPlanning({ deliveryDate }: { deliveryDate: string }) {
  const { data: coefficients } = useAcceptanceCoefficients();

  // Filter by delivery date (14-day window)
  const futureCoefficients = coefficients?.coefficients.filter(
    c => c.date === deliveryDate && c.isAvailable
  );

  // Sort by coefficient (cheapest first)
  const sortedWarehouses = futureCoefficients?.sort(
    (a, b) => a.coefficient - b.coefficient
  );

  return (
    <div>
      <h3>Warehouses available on {deliveryDate}</h3>
      {sortedWarehouses?.map(w => (
        <WarehouseOption
          key={w.warehouseId}
          name={w.warehouseName}
          coefficient={w.coefficient}
          deliveryCost={w.delivery.baseLiterRub}
        />
      ))}
    </div>
  );
}
```

### Example 3: Warehouse Availability Badge

```typescript
function AvailabilityBadge({ coefficient }: { coefficient: number }) {
  if (coefficient === -1) {
    return <Badge variant="destructive">Unavailable</Badge>;
  }
  if (coefficient === 0) {
    return <Badge variant="success">Free Acceptance</Badge>;
  }
  if (coefficient > 1) {
    return <Badge variant="warning">×{coefficient} Rate</Badge>;
  }
  return <Badge variant="default">Standard Rate</Badge>;
}
```

---

## Cache Strategy

| System | Cache TTL | Cache Key | Refresh Strategy |
|--------|-----------|-----------|------------------|
| **Inventory** | 1 hour | `tariffs:warehouses-with-tariffs:{cabinetId}:{date}:{cargo_type}` | Use `?refresh=true` to bypass |
| **Supply** | 1 hour | `tariffs:acceptance:all:{cabinetId}` | Use `?refresh=true` to bypass |

**Note**: Both systems use 1-hour cache because tariffs are updated daily by WB.

---

## Rate Limits

| System | Scope | Limit | Window |
|--------|-------|-------|--------|
| **Inventory** | `tariffs` | 10 req/min | 60s |
| **Supply** | `orders_fbw` | 6 req/min | 60s |

**Important**: Supply system has stricter rate limits (6 req/min vs 10 req/min).

---

## Common Questions

### Q1: Why do rates differ between systems?

**A**: They serve different purposes:
- **Inventory** = Actual costs (what you pay)
- **Supply** = Planning rates (conservative estimates)

### Q2: Which system should I use for Price Calculator?

**A**: Use **Inventory system** (`/warehouses-with-tariffs`) for current actual costs.

### Q3: Can I use Supply system for historical data?

**A**: No, Supply system only provides 14-day forward-looking data. Use Inventory for historical costs.

### Q4: How do I know if a warehouse will accept delivery on a specific date?

**A**: Use Supply system (`/acceptance/coefficients/all`), filter by date, check `isAvailable === true`.

### Q5: What does coefficient -1 mean?

**A**: Acceptance is unavailable on that date. Show as "Unavailable" in UI.

---

## TypeScript Types

```typescript
// Inventory System Types
interface AggregatedWarehouse {
  id: number;
  name: string;
  city: string;
  federal_district: string | null;
  coordinates: { lat: number; lon: number };
  cargo_type: 'MGT' | 'SGT' | 'KGT';
  delivery_types: string[];
  tariffs: {
    fbo: {
      delivery_base_rub: number;
      delivery_liter_rub: number;
      logistics_coefficient: number;
    };
    fbs: {
      delivery_base_rub: number;
      delivery_liter_rub: number;
      logistics_coefficient: number;
    };
    storage: {
      base_per_day_rub: number;
      liter_per_day_rub: number;
      coefficient: number;
    };
    effective_from: string;
    effective_until: string;
  } | null;
}

// Supply System Types
interface AcceptanceCoefficient {
  warehouseId: number;
  warehouseName: string;
  date: string;
  coefficient: number;        // -1 | 0 | ≥1
  isAvailable: boolean;
  allowUnload: boolean;
  boxTypeId: 2 | 5 | 6;       // 2=Boxes, 5=Pallets, 6=Supersafe
  boxTypeName: string;
  delivery: {
    coefficient: number;
    baseLiterRub: number;
    additionalLiterRub: number;
  };
  storage: {
    coefficient: number;
    baseLiterRub: number;
    additionalLiterRub: number;
  };
  isSortingCenter: boolean;
}
```

---

## Quick Reference Card

### Inventory System (Actual Costs)
- **Endpoint**: `GET /v1/tariffs/warehouses-with-tariffs`
- **Purpose**: Current actual storage/logistics costs
- **Use Case**: Financial reports, margin calculator
- **Rate Limit**: 10 req/min
- **Cache**: 1 hour

### Supply System (Planning)
- **Endpoint**: `GET /v1/tariffs/acceptance/coefficients/all`
- **Purpose**: 14-day forward-looking planning
- **Use Case**: Supply planning, future delivery estimation
- **Rate Limit**: 6 req/min (stricter!)
- **Cache**: 1 hour

---

## Backend Documentation References

- **Story 43.5**: `docs/stories/epic-43/story-43.5-warehouses-tariffs-service.md`
- **Story 43.9**: `docs/stories/epic-43/story-43.9-acceptance-coefficients-service.md`
- **Source Code**: `src/tariffs/warehouses-tariffs.service.ts`
- **Source Code**: `src/tariffs/acceptance-coefficients.service.ts`
- **API Tests**: `test-api/18-tariffs.http`

---

**Status**: ✅ PRODUCTION READY
**Last Updated**: 2026-01-25
**Author**: Backend Team
**Review**: Frontend Team - Please integrate this guide into Price Calculator UI
