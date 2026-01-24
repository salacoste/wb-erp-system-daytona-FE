# API Logistics Endpoints Analysis
## Price Calculator - Logistics Data Flow

**Analysis Date**: 2026-01-24
**Epic**: 43 (Price Calculator)
**Status**: Production Ready (10/10 stories complete)

---

## Executive Summary

This document provides a comprehensive analysis of logistics-related API endpoints for the Price Calculator feature. It covers the main calculation endpoint, related warehouse and tariffs endpoints, and all usage scenarios including auto-fill capabilities.

**Key Endpoints**:
1. `POST /v1/products/price-calculator` - Main price calculation with logistics
2. `GET /v1/tariffs/warehouses` - Warehouse list for auto-fill
3. `GET /v1/tariffs/settings` - Global tariff configuration

---

## Table of Contents

1. [Main Endpoint: POST /v1/products/price-calculator](#main-endpoint)
2. [Request Fields: Logistics Parameters](#request-fields)
3. [Response Fields: Cost Breakdown](#response-fields)
4. [Usage Scenarios](#usage-scenarios)
5. [Related Endpoints](#related-endpoints)
6. [Error Handling](#error-handling)
7. [Formulas and Calculations](#formulas)

---

## 1. Main Endpoint: POST /v1/products/price-calculator<a name="main-endpoint"></a>

### Endpoint Details

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/v1/products/price-calculator` |
| **Authentication** | Bearer JWT + X-Cabinet-Id header |
| **Rate Limit** | 600 req/min (burst 1200) |
| **Stories** | 43.2, 43.3, 43.6, 43.7 |

### Request Headers

```http
POST /v1/products/price-calculator HTTP/1.1
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json
```

### Access Control

| Role | Access |
|------|--------|
| Owner | ✅ Allowed |
| Manager | ✅ Allowed |
| Service | ✅ Allowed |
| Analyst | ❌ Forbidden (403) |

---

## 2. Request Fields: Logistics Parameters<a name="request-fields"></a>

### Required Fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `target_margin_pct` | number | 0-100 | Target margin percentage |
| `cogs_rub` | number | ≥0 | Cost of Goods Sold in RUB |
| `logistics_reverse_rub` | number | ≥0 | Reverse logistics (return from customer) in RUB |
| `buyback_pct` | number | 0-100 | Buyback rate % (98 = 2% returns) |
| `advertising_pct` | number | 0-100 | Advertising spend as % of selling price |

### Logistics Input Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `logistics_forward_rub` | number | Conditional* | - | Forward logistics (delivery to warehouse) in RUB |
| `warehouse_name` | string | Optional | - | Warehouse name for auto-fill (e.g., "Коледино") |
| `volume_liters` | number | Optional** | - | Product volume in liters |
| `dimensions.length_cm` | number | Optional*** | - | Length in centimeters |
| `dimensions.width_cm` | number | Optional*** | - | Width in centimeters |
| `dimensions.height_cm` | number | Optional*** | - | Height in centimeters |
| `delivery_type` | enum | Optional | "fbs" | Delivery type: "fbo" or "fbs" |
| `storage_days` | number | Optional | - | Storage period in days |

**\* `logistics_forward_rub` is REQUIRED unless `warehouse_name` + `volume_liters` (or dimensions) are provided for auto-fill**
**\*\* `volume_liters` is optional - can be calculated from dimensions**
**\*\*\* All three dimension fields required if any dimension is provided**

### Other Optional Fields

| Field | Type | Range | Default | Description |
|-------|------|-------|---------|-------------|
| `storage_rub` | number | ≥0 | 0 | Storage cost per unit in RUB |
| `vat_pct` | number | 0-100 | 20 | VAT rate % |
| `acquiring_pct` | number | 0-100 | 1.8 | Payment acquiring fee % |
| `commission_pct` | number | 0-100 | 10 | Wildberries commission % (manual override) |
| `overrides.nm_id` | string | - | - | Product article for commission lookup |
| `overrides.commission_pct` | number | 0-100 | - | Manual commission override (highest priority) |

---

## 3. Response Fields: Cost Breakdown<a name="response-fields"></a>

### Response Structure

```json
{
  "meta": { ... },
  "result": { ... },
  "cost_breakdown": { ... },
  "percentage_breakdown": { ... },
  "intermediate_values": { ... },
  "warnings": [],
  "auto_fill": { ... },
  "dimensions_calculation": { ... }
}
```

### meta - Calculation Metadata

| Field | Type | Description |
|-------|------|-------------|
| `cabinet_id` | string | Cabinet ID for which calculation was performed |
| `calculated_at` | string | ISO timestamp when calculation was performed |

### result - Calculation Result

| Field | Type | Description |
|-------|------|-------------|
| `recommended_price` | number | Recommended selling price in RUB (2 decimals) |
| `target_margin_pct` | number | Target margin % used in calculation |
| `actual_margin_rub` | number | Actual margin amount in RUB |
| `actual_margin_pct` | number | Actual margin % at recommended price |

### cost_breakdown - Fixed Costs

| Field | Type | Description |
|-------|------|-------------|
| `cogs` | number | Cost of Goods Sold in RUB |
| `logistics_forward` | number | Forward logistics cost in RUB (delivery to warehouse) |
| `logistics_reverse_effective` | number | Reverse logistics (effective): `reverse × (1 - return_rate/100)` |
| `logistics_total` | number | Total logistics: `forward + reverse_effective` |
| `storage` | number | Storage cost per unit in RUB |
| `fixed_total` | number | Sum of all fixed costs: `cogs + logistics_total + storage` |

### percentage_breakdown - Percentage Costs

| Field | Type | Description |
|-------|------|-------------|
| `commission_wb` | number | Wildberries commission amount in RUB |
| `commission_pct` | number | Commission percentage used |
| `acquiring` | number | Payment acquiring fee amount in RUB |
| `advertising` | number | Advertising spend amount in RUB |
| `vat` | number | VAT amount in RUB |
| `margin` | number | Target margin amount in RUB |
| `percentage_total` | number | Sum of all percentage-based costs in RUB |

### intermediate_values - Intermediate Steps

| Field | Type | Description |
|-------|------|-------------|
| `return_rate_pct` | number | Return rate: `100 - buyback_pct` |
| `logistics_effective` | number | Effective logistics cost |
| `total_percentage_rate` | number | Sum of all percentage rates |

### auto_fill - Auto-fill Metadata (Story 43.6)

**Present when**: `warehouse_name` is provided in request

| Field | Type | Description |
|-------|------|-------------|
| `warehouse_name` | string | Warehouse name used for auto-fill |
| `logistics_source` | enum | "auto" (from warehouse) or "manual" (explicit value) |
| `storage_source` | enum | "auto" (from warehouse) or "manual" (explicit value) |
| `tariff_date` | string | Tariff effective date (YYYY-MM-DD) |

### dimensions_calculation - Dimension Results (Story 43.7)

**Present when**: `dimensions` are provided in request

| Field | Type | Description |
|-------|------|-------------|
| `dimensions_cm` | object | Input dimensions: `{ length_cm, width_cm, height_cm }` |
| `calculated_volume_liters` | number | Calculated volume: `(length × width × height) / 1000` |
| `detected_cargo_type` | enum | "MGT" (≤60cm), "SGT" (≤120cm), "KGT" (>120cm) |
| `volume_source` | enum | "dimensions" (calculated) or "manual" (explicit volume_liters) |
| `max_dimension_cm` | number | Maximum dimension in centimeters |

---

## 4. Usage Scenarios<a name="usage-scenarios"></a>

### Scenario 1: Manual Input (No Auto-fill)

**Use Case**: User knows exact logistics costs and wants manual control.

**Request**:
```json
POST /v1/products/price-calculator
{
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  "logistics_forward_rub": 200,
  "logistics_reverse_rub": 150,
  "buyback_pct": 98,
  "advertising_pct": 5,
  "storage_rub": 50,
  "commission_pct": 10,
  "vat_pct": 20,
  "acquiring_pct": 1.8
}
```

**Response Highlights**:
```json
{
  "result": {
    "recommended_price": 4057.87,
    "actual_margin_rub": 811.57,
    "actual_margin_pct": 20
  },
  "cost_breakdown": {
    "cogs": 1500.00,
    "logistics_forward": 200.00,
    "logistics_reverse_effective": 3.00,
    "logistics_total": 203.00,
    "storage": 50.00,
    "fixed_total": 1753.00
  }
}
```

**Notes**:
- No `auto_fill` field in response (no warehouse provided)
- All logistics values are explicit user inputs

---

### Scenario 2: Auto-fill (Warehouse + Volume)

**Use Case**: User selects warehouse and provides volume for automatic tariff calculation.

**Request**:
```json
POST /v1/products/price-calculator
{
  "target_margin_pct": 20,
  "cogs_rub": 500,
  "warehouse_name": "Коледино",
  "volume_liters": 2.5,
  "delivery_type": "fbs",
  "storage_days": 30,
  "logistics_reverse_rub": 50,
  "buyback_pct": 98,
  "advertising_pct": 5,
  "acquiring_pct": 1.5
}
```

**Response Highlights**:
```json
{
  "result": {
    "recommended_price": 1625.80,
    "actual_margin_rub": 325.16,
    "actual_margin_pct": 20.0
  },
  "cost_breakdown": {
    "cogs": 500.00,
    "logistics_forward": 74.40,
    "logistics_reverse_effective": 1.00,
    "logistics_total": 75.40,
    "storage": 4.35,
    "fixed_total": 579.75
  },
  "auto_fill": {
    "warehouse_name": "Коледино",
    "logistics_source": "auto",
    "storage_source": "auto",
    "tariff_date": "2026-01-19"
  }
}
```

**Auto-fill Formulas Applied**:
- `logistics_forward = (base + max(0, volume - 1) × per_liter) × coefficient`
- `storage_per_day = (base + max(0, volume - 1) × per_liter) × coefficient`
- `storage_total = storage_per_day × storage_days`

**Notes**:
- `logistics_forward_rub` becomes OPTIONAL when warehouse + volume provided
- `storage_rub` becomes OPTIONAL when warehouse + volume + storage_days provided
- Tariff rates fetched from WB API (cached 1 hour in Redis)

---

### Scenario 3: Auto-fill (Warehouse + Dimensions)

**Use Case**: User provides product dimensions instead of volume.

**Request**:
```json
POST /v1/products/price-calculator
{
  "target_margin_pct": 20,
  "cogs_rub": 500,
  "warehouse_name": "Коледино",
  "dimensions": {
    "length_cm": 30,
    "width_cm": 20,
    "height_cm": 15
  },
  "delivery_type": "fbs",
  "storage_days": 30,
  "logistics_reverse_rub": 50,
  "buyback_pct": 98,
  "advertising_pct": 5,
  "acquiring_pct": 1.5
}
```

**Response Highlights**:
```json
{
  "result": {
    "recommended_price": 1618.90,
    "actual_margin_rub": 323.78,
    "actual_margin_pct": 20.0
  },
  "cost_breakdown": {
    "cogs": 500.00,
    "logistics_forward": 67.50,
    "logistics_reverse_effective": 1.00,
    "logistics_total": 68.50,
    "storage": 3.96,
    "fixed_total": 572.46
  },
  "auto_fill": {
    "warehouse_name": "Коледино",
    "logistics_source": "auto",
    "storage_source": "auto",
    "tariff_date": "2026-01-19"
  },
  "dimensions_calculation": {
    "dimensions_cm": {
      "length_cm": 30,
      "width_cm": 20,
      "height_cm": 15
    },
    "calculated_volume_liters": 9.0,
    "detected_cargo_type": "MGT",
    "volume_source": "dimensions",
    "max_dimension_cm": 30
  }
}
```

**Dimension Calculations**:
- `volume_liters = (30 × 20 × 15) / 1000 = 9.0 liters`
- `max_dimension = max(30, 20, 15) = 30 cm`
- `cargo_type = "MGT"` (since 30 ≤ 60)

**Cargo Type Detection**:
| Max Dimension | Cargo Type | Description |
|---------------|------------|-------------|
| ≤ 60 cm | MGT | Small goods (Малогабаритный товар) |
| ≤ 120 cm | SGT | Oversized goods (Сверхгабаритный товар) |
| > 120 cm | KGT | Large goods (Крупногабаритный товар) - ERROR in MVP |

---

### Scenario 4: Manual Override (Auto-fill + Explicit Value)

**Use Case**: User wants warehouse auto-fill for storage but manual logistics cost.

**Request**:
```json
POST /v1/products/price-calculator
{
  "target_margin_pct": 20,
  "cogs_rub": 500,
  "warehouse_name": "Коледино",
  "volume_liters": 2.5,
  "logistics_forward_rub": 100,
  "delivery_type": "fbs",
  "storage_days": 30,
  "buyback_pct": 98,
  "advertising_pct": 5,
  "acquiring_pct": 1.5
}
```

**Response Highlights**:
```json
{
  "cost_breakdown": {
    "cogs": 500.00,
    "logistics_forward": 100.00,
    "logistics_reverse_effective": 1.00,
    "logistics_total": 101.00,
    "storage": 4.35,
    "fixed_total": 605.35
  },
  "auto_fill": {
    "warehouse_name": "Коледино",
    "logistics_source": "manual",
    "storage_source": "auto",
    "tariff_date": "2026-01-19"
  }
}
```

**Override Priority**:
- Explicit `logistics_forward_rub` overrides auto-filled value
- `auto_fill.logistics_source` shows "manual"
- `auto_fill.storage_source` shows "auto" (still auto-filled)

---

## 5. Related Endpoints<a name="related-endpoints"></a>

### GET /v1/tariffs/warehouses

**Purpose**: Get list of warehouses for warehouse_name auto-fill selection.

**Endpoint Details**:
| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/v1/tariffs/warehouses` |
| **Cache** | 24 hours |
| **Rate Limit** | 10 req/min |

**Request**:
```http
GET /v1/tariffs/warehouses HTTP/1.1
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

**Response**:
```json
{
  "data": {
    "warehouses": [
      {
        "id": 507,
        "name": "Краснодар",
        "city": "Краснодар",
        "federalDistrict": "Южный ФО"
      },
      {
        "id": 117501,
        "name": "Коледино",
        "city": "Подольск",
        "federalDistrict": "Центральный ФО"
      }
    ],
    "updated_at": "2026-01-22T10:30:45.123Z"
  }
}
```

**Use Case**: Frontend dropdown for warehouse selection in price calculator form.

---

### GET /v1/tariffs/settings

**Purpose**: Get global tariff configuration (database defaults/fallback values).

**Endpoint Details**:
| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/v1/tariffs/settings` |
| **Cache** | 24 hours |
| **Rate Limit** | None (local DB) |

**Request**:
```http
GET /v1/tariffs/settings HTTP/1.1
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

**Response**:
```json
{
  "default_commission_fbo_pct": 25.0,
  "default_commission_fbs_pct": 28.0,
  "acceptance_box_rate_per_liter": 1.70,
  "acceptance_pallet_rate": 500.0,
  "logistics_volume_tiers": [
    { "min": 0.001, "max": 0.200, "rate": 23.0 },
    { "min": 0.201, "max": 0.400, "rate": 26.0 },
    { "min": 0.401, "max": 0.600, "rate": 29.0 },
    { "min": 0.601, "max": 0.800, "rate": 30.0 },
    { "min": 0.801, "max": 1.000, "rate": 32.0 }
  ],
  "logistics_large_first_liter_rate": 46.0,
  "logistics_large_additional_liter_rate": 14.0,
  "return_logistics_fbo_rate": 50.0,
  "return_logistics_fbs_rate": 50.0,
  "storage_free_days": 60,
  "fbs_uses_fbo_logistics_rates": true,
  "effective_from": "2025-09-01T00:00:00Z"
}
```

**Important**: These are DATABASE DEFAULTS (fallback when WB API unavailable). Actual per-warehouse rates vary significantly and are fetched from WB API dynamically.

---

### GET /v1/tariffs/warehouses-with-tariffs

**Purpose**: Get aggregated warehouse + tariff data in single request.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | string (YYYY-MM-DD) | today | Tariff effective date |
| `cargo_type` | enum (MGT|SGT|KGT) | - | Filter by cargo type |
| `refresh` | boolean | false | Force cache refresh |

**Request**:
```http
GET /v1/tariffs/warehouses-with-tariffs?date=2026-01-22&cargo_type=MGT HTTP/1.1
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

**Response**:
```json
{
  "data": {
    "warehouses": [
      {
        "id": 507,
        "name": "Краснодар",
        "city": "Краснодар",
        "federal_district": "Южный ФО",
        "coordinates": { "lat": 45.0355, "lon": 38.975 },
        "cargo_type": "MGT",
        "delivery_types": ["FBS"],
        "tariffs": {
          "fbo": {
            "delivery_base_rub": 46.0,
            "delivery_liter_rub": 14.0,
            "logistics_coefficient": 1.2
          },
          "fbs": {
            "delivery_base_rub": 46.0,
            "delivery_liter_rub": 14.0,
            "logistics_coefficient": 1.2
          },
          "storage": {
            "base_per_day_rub": 0.07,
            "liter_per_day_rub": 0.05,
            "coefficient": 1.0
          },
          "effective_from": "2026-02-01",
          "effective_until": "2026-01-31"
        }
      }
    ],
    "meta": {
      "total_warehouses": 45,
      "with_tariffs": 42,
      "without_tariffs": 3,
      "tariff_date": "2026-01-22",
      "fetched_at": "2026-01-22T10:30:00Z",
      "cache_ttl_seconds": 3600
    }
  }
}
```

---

## 6. Error Handling<a name="error-handling"></a>

### 400 Bad Request - Validation Errors

**Error Response Structure**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "target_margin_pct", "issue": "must be between 0 and 100" },
    { "field": "cogs_rub", "issue": "must be a positive number" }
  ]
}
```

### Common Error Codes

| Code | Description | Scenario |
|------|-------------|----------|
| `VALIDATION_ERROR` | Invalid input parameters | Negative values, out of range percentages |
| `WAREHOUSE_NOT_FOUND` | Warehouse name not found | Invalid `warehouse_name` in auto-fill |
| `KGT_NOT_SUPPORTED` | KGT cargo type not supported | Dimensions > 120cm on any side |
| `MISSING_LOGISTICS` | Logistics cost required | No warehouse provided and no logistics_forward_rub |
| `PARTIAL_DIMENSIONS` | Incomplete dimensions | Only 1-2 dimension fields provided |

### Warehouse Not Found Example

**Request**:
```json
POST /v1/products/price-calculator
{
  "warehouse_name": "НеизвестныйСклад",
  "volume_liters": 2.5
}
```

**Response**:
```json
{
  "statusCode": 400,
  "message": "Склад \"НеизвестныйСклад\" не найден",
  "error": "Bad Request",
  "code": "WAREHOUSE_NOT_FOUND",
  "details": {
    "warehouse_name": "НеизвестныйСклад",
    "available_warehouses": ["Коледино", "Электросталь", "Слобода", ...]
  }
}
```

### KGT Not Supported Example

**Request**:
```json
POST /v1/products/price-calculator
{
  "warehouse_name": "Коледино",
  "dimensions": {
    "length_cm": 150,
    "width_cm": 60,
    "height_cm": 50
  }
}
```

**Response**:
```json
{
  "statusCode": 400,
  "message": "Для крупногабаритных товаров (КГТ) автоматический расчёт тарифов недоступен. Введите стоимость логистики вручную.",
  "error": "Bad Request",
  "code": "KGT_NOT_SUPPORTED",
  "details": {
    "max_dimension_cm": 150,
    "detected_cargo_type": "KGT",
    "suggestion": "Укажите logistics_forward_rub и storage_rub вручную"
  }
}
```

### 401 Unauthorized

**Response**:
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden

**Response**:
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Access denied to this cabinet"
}
```

---

## 7. Formulas and Calculations<a name="formulas"></a>

### Core Price Formula

```
recommended_price = fixed_total / (1 - total_percentage_rate/100)
```

### Fixed Costs (F)

```
fixed_total = cogs + logistics_total + storage

logistics_total = logistics_forward + logistics_reverse_effective

logistics_reverse_effective = logistics_reverse × (1 - return_rate/100)

return_rate = 100 - buyback_pct
```

### Percentage Rate (P)

```
total_percentage_rate = commission_pct + acquiring_pct + advertising_pct + vat_pct + target_margin_pct
```

### Auto-fill Formulas (Story 43.6)

**Logistics Cost**:
```
logistics_forward = (base + max(0, volume - 1) × per_liter) × coefficient
```

**Storage Cost**:
```
storage_per_day = (base + max(0, volume - 1) × per_liter) × coefficient
storage_total = storage_per_day × storage_days
```

Where:
- `base`: boxDeliveryBase or boxStorageBase from WB API (warehouse-specific)
- `per_liter`: boxDeliveryLiter or boxStorageLiter from WB API
- `coefficient`: boxDeliveryCoefExpr or boxStorageCoefExpr (regional multiplier)

### Dimension Formulas (Story 43.7)

**Volume Calculation**:
```
volume_liters = (length_cm × width_cm × height_cm) / 1000
```

**Cargo Type Detection**:
```
max_dimension = max(length_cm, width_cm, height_cm)

cargo_type = "MGT"  if max_dimension ≤ 60
cargo_type = "SGT"  if max_dimension ≤ 120
cargo_type = "KGT"  if max_dimension > 120  (error in MVP)
```

### Value Priority

**Logistics**:
1. `logistics_forward_rub` (manual) - highest priority
2. Auto-fill from warehouse
3. Required if neither available

**Storage**:
1. `storage_rub` (manual) - highest priority
2. Auto-fill from warehouse
3. Default to 0

**Volume**:
1. `volume_liters` (manual) - highest priority
2. Calculated from dimensions
3. Default to 1L (for warehouse auto-fill)

---

## Rate Limits Summary

| Endpoint | Rate Limit | Scope |
|----------|------------|-------|
| POST /v1/products/price-calculator | 600 req/min | Standard |
| GET /v1/tariffs/warehouses | 10 req/min | tariffs |
| GET /v1/tariffs/settings | None (local DB) | - |
| GET /v1/tariffs/warehouses-with-tariffs | 10 req/min | tariffs |

---

## Cache Keys

| Data | Cache Key Pattern | TTL |
|------|-------------------|-----|
| Commissions | `tariffs:commissions:{cabinetId}` | 24h |
| Offices | `tariffs:offices:{cabinetId}` | 24h |
| Box tariffs | `tariffs:box:{cabinetId}:{date}` | 1h |
| Aggregated warehouses | `tariffs:warehouses-with-tariffs:{id}:{d}` | 1h |

---

## References

- **Epic Overview**: `docs/epics/epic-43-price-calculator.md`
- **Story 43.2**: `docs/stories/epic-43/story-43.2-price-calculator-service.md`
- **Story 43.3**: `docs/stories/epic-43/story-43.3-api-endpoint-dtos.md`
- **Story 43.5**: `docs/stories/epic-43/story-43.5-warehouses-tariffs-service.md`
- **Story 43.6**: `docs/stories/epic-43/story-43.6-autofill-integration.md`
- **Story 43.7**: `docs/stories/epic-43/story-43.7-dimension-logistics.md`
- **API Reference**: `docs/API-PATHS-REFERENCE.md`
- **Test Scripts**: `test-api/15-price-calculator.http`
