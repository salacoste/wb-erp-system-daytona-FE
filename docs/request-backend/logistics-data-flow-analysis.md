# Logistics Data Flow Analysis - Price Calculator

**Date**: 2026-01-24
**Epic**: 43 (Price Calculator)
**Status**: Production Ready (10/10 stories complete)
**Target Audience**: Frontend Developers, System Architects

---

## Executive Summary

This document provides comprehensive **data flow diagrams**, **decision trees**, and **sequence diagrams** for the Price Calculator logistics feature. It explains how data flows from Frontend → Backend → WB SDK → Frontend for both forward logistics (auto-fill capable) and reverse logistics (manual input only).

**Key Insight**:
- **Forward Logistics** = Auto-fill from WB SDK OR manual input
- **Reverse Logistics** = ALWAYS manual input from user

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [Decision Trees](#decision-trees)
4. [Sequence Diagrams](#sequence-diagrams)
5. [Data Transformation Pipeline](#data-transformation-pipeline)
6. [State Management (Frontend)](#state-management)
7. [Cache Strategy](#cache-strategy)

---

## 1. Architecture Overview<a name="architecture-overview"></a>

### System Components

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend      │     │   Backend API    │     │   WB SDK    │
│  (Next.js 15)   │────▶│  (NestJS/TS)     │────▶│  (v2.4.3)    │
│  Port: 3100     │     │  Port: 3000      │     │  External    │
└─────────────────┘     └──────────────────┘     └─────────────┘
         │                       │                        │
         │                       │                        │
    ┌────▼────┐            ┌─────▼─────┐         ┌──────▼──────┐
    │  Redis  │            │ PostgreSQL│         │ WB API     │
    │  Cache  │            │   (DB)    │         │  External   │
    └─────────┘            └───────────┘         └─────────────┘
```

### Key Services

**Backend Services:**
- `PriceCalculatorService` - Main calculation logic
- `WarehousesTariffsService` - WB SDK integration + aggregation
- `TariffsSettingsService` - Global configuration/fallback

**Frontend Components:**
- Price Calculator Form
- Warehouse Selector
- Volume/Dimensions Input
- Cost Breakdown Display

---

## 2. Data Flow Diagrams<a name="data-flow-diagrams"></a>

### 2.1 Complete Data Flow (Manual Input Mode)

```
┌──────────────┐
│   Frontend   │
│  User Input  │
└──────┬───────┘
       │
       │  POST /v1/products/price-calculator
       │  {
       │    target_margin_pct: 20,
       │    cogs_rub: 1500,
       │    logistics_forward_rub: 200,    ← MANUAL
       │    logistics_reverse_rub: 150,    ← MANUAL
       │    buyback_pct: 98,
       │    advertising_pct: 5,
       │    storage_rub: 50                 ← MANUAL
       │  }
       ▼
┌─────────────────────────────────────────┐
│         Backend API                     │
│  PriceCalculatorService.calculate()    │
│                                         │
│  1. Validate inputs                    │
│  2. Calculate reverse logistics:       │
│     return_rate = 100 - 98 = 2%        │
│     reverse_effective = 150 × 0.02     │
│  3. Sum fixed costs:                   │
│     fixed = 1500 + 200 + 3 + 50        │
│  4. Calculate price:                   │
│     price = 1753 / (1 - 0.568)         │
└─────────────────────────────────────────┘
       │
       │  Response:
       │  {
       │    result: {recommended_price: 4057.87},
       │    cost_breakdown: {
       │      logistics_forward: 200.00,
       │      logistics_reverse_effective: 3.00,
       │      logistics_total: 203.00
       │    }
       │  }
       ▼
┌──────────────┐
│   Frontend   │
│  Display     │
│  Results     │
└──────────────┘
```

### 2.2 Complete Data Flow (Auto-fill Mode)

```
┌──────────────┐
│   Frontend   │
│  User Input  │
└──────┬───────┘
       │
       │  POST /v1/products/price-calculator
       │  {
       │    target_margin_pct: 20,
       │    cogs_rub: 500,
       │    warehouse_name: "Коледино",   ← TRIGGER
       │    volume_liters: 2.5,
       │    delivery_type: "fbs",
       │    storage_days: 30,
       │    logistics_reverse_rub: 50,     ← STILL MANUAL!
       │    buyback_pct: 98,
       │    advertising_pct: 5
       │  }
       ▼
┌─────────────────────────────────────────┐
│         Backend API                     │
│  PriceCalculatorService.calculate()    │
│                                         │
│  1. Detect warehouse_name → auto-fill   │
│  2. Resolve volume: 2.5 (explicit)     │
│  3. Fetch warehouses (cache: 1h)       │
│     ┌─────────────────────────────┐   │
│     │ WarehousesTariffsService    │   │
│     │   .getWarehousesWithTariffs()│   │
│     │         │                   │   │
│     │         ▼                   │   │
│     │  ┌────────────────────┐     │   │
│     │  │    WB SDK          │     │   │
│     │  │  offices()         │     │   │
│     │  │  getTariffsBox()   │     │   │
│     │  └────────────────────┘     │   │
│     │         │                   │   │
│     │         ▼                   │   │
│     │  Match warehouse by name     │   │
│     │  Transform tariffs          │   │
│     └─────────────────────────────┘   │
│  4. Match: "Коледино"                │
│  5. Calculate forward logistics:     │
│     (46 + max(0, 2.5-1) × 14) × 1.15│
│  6. Calculate storage:               │
│     ((0.07 + 1.5 × 0.05) × 1) × 30  │
│  7. Calculate reverse logistics:     │
│     50 × (100-98)/100 = 1           │
│  8. Calculate price                  │
└─────────────────────────────────────────┘
       │
       │  Response:
       │  {
       │    result: {recommended_price: 1625.80},
       │    cost_breakdown: {
       │      logistics_forward: 74.40,    ← AUTO
       │      logistics_reverse_effective: 1.00,
       │      logistics_total: 75.40,
       │      storage: 4.35                 ← AUTO
       │    },
       │    auto_fill: {
       │      warehouse_name: "Коледино",
       │      logistics_source: "auto",
       │      storage_source: "auto",
       │      tariff_date: "2026-01-19"
       │    }
       │  }
       ▼
┌──────────────┐
│   Frontend   │
│  Display     │
│  Results     │
│  + "Auto"    │
│  Badges      │
└──────────────┘
```

### 2.3 Complete Data Flow (Dimensions Auto-calculation)

```
┌──────────────┐
│   Frontend   │
│  User Input  │
└──────┬───────┘
       │
       │  POST /v1/products/price-calculator
       │  {
       │    warehouse_name: "Коледино",
       │    dimensions: {                   ← DIMENSIONS
       │      length_cm: 30,
       │      width_cm: 20,
       │      height_cm: 15
       │    },
       │    ...
       │  }
       ▼
┌─────────────────────────────────────────┐
│         Backend API                     │
│                                         │
│  1. Resolve volume from dimensions:    │
│     volume = (30 × 20 × 15) / 1000     │
│             = 9.0 liters                │
│  2. Detect cargo type:                 │
│     max_dimension = max(30, 20, 15)    │
│                  = 30 cm               │
│     cargo_type = "MGT" (≤60cm)         │
│  3. Check KGT: 30 ≤ 120 ✅             │
│  4. Fetch warehouse tariffs            │
│  5. Calculate logistics:                │
│     (46 + max(0, 9-1) × 14) × 1.15    │
└─────────────────────────────────────────┘
       │
       │  Response:
       │  {
       │    dimensions_calculation: {
       │      dimensions_cm: {length: 30, width: 20, height: 15},
       │      calculated_volume_liters: 9.0,
       │      detected_cargo_type: "MGT",
       │      volume_source: "dimensions"
       │    },
       │    cost_breakdown: {
       │      logistics_forward: 167.50
       │    }
       │  }
       ▼
┌──────────────┐
│   Frontend   │
│  Display     │
│  "9.0 L"     │
│  "(из габаритов)"                    │
│  [MGT] badge │
└──────────────┘
```

---

## 3. Decision Trees<a name="decision-trees"></a>

### 3.1 Auto-fill Trigger Decision Tree

```
START: User submits form
        │
        ▼
   ┌──────────────────────┐
   │ warehouse_name       │
   │ provided?            │
   └──────┬───────────────┘
          │
     NO   │   YES
   ┌──────┴──────┐
   │             │
   ▼             ▼
┌─────────┐  ┌─────────────────────────┐
│ Manual  │  │ Fetch warehouse tariffs │
│ Input   │  │ from WB SDK (cache 1h)  │
│ Mode    │  └──────────┬──────────────┘
└─────────┘             │
                  YES   │   NO
              ┌─────────┴──────────┐
              │                    │
              ▼                    ▼
       ┌─────────────┐      ┌──────────────┐
       │ Match       │      │ Return Error │
       │ warehouse   │      │ WAREHOUSE_   │
       │ by name     │      │ NOT_FOUND    │
       └──────┬──────┘      └──────────────┘
              │
         YES   │   NO
     ┌─────────┴─────────┐
     │                   │
     ▼                   ▼
┌─────────────┐   ┌──────────────┐
│ Get tariffs │   │ Return Error │
│ Calculate   │   │ TARIFFS_     │
│ logistics   │   │ NOT_AVAILABLE│
└──────┬──────┘   └──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ logistics_forward_rub           │
│ provided explicitly?            │
└────────┬────────────────────────┘
         │
    YES  │  NO
  ┌──────┴──────┐
  │             │
  ▼             ▼
┌────────┐  ┌────────────┐
│ Manual │  │ Use        │
│ Value  │  │ Auto-fill  │
│ (override)│  │ Value      │
└────────┘  └────────────┘
```

### 3.2 Volume Resolution Decision Tree

```
START: Need volume for calculation
        │
        ▼
┌─────────────────────────────┐
│ volume_liters provided?     │
└────────┬────────────────────┘
         │
    YES  │  NO
  ┌──────┴──────┐
  │             │
  ▼             ▼
┌────────┐  ┌─────────────────────┐
│ Use    │  │ dimensions provided?│
│ volume │  └────────┬────────────┘
└────────┘           │
                YES │  NO
            ┌──────┴──────┐
            │             │
            ▼             ▼
     ┌─────────────┐  ┌────────┐
     │ Calculate   │  │ Use    │
     │ volume from │  │ default│
     │ dimensions  │  │ 1L     │
     └──────┬──────┘  └────────┘
            │
            ▼
     ┌─────────────────────┐
     │ Calculate volume:   │
     │ (L×W×H) / 1000      │
     └────────┬────────────┘
              │
              ▼
     ┌─────────────────────┐
     │ Detect cargo type:  │
     │ max(L,W,H) → cargo  │
     └────────┬────────────┘
              │
              ▼
     ┌─────────────────────┐
     │ cargo_type == KGT?  │
     │ (>120cm)            │
     └────────┬────────────┘
              │
        YES   │   NO
     ┌─────────┴─────────┐
     │                   │
     ▼                   ▼
┌─────────────┐   ┌──────────────┐
│ Return Error│   │ Use volume & │
│ KGT_NOT_    │   │ cargo_type   │
│ SUPPORTED   │   │ for calc     │
└─────────────┘   └──────────────┘
```

### 3.3 Storage Calculation Decision Tree

```
START: Calculate storage cost
        │
        ▼
┌─────────────────────────────┐
│ warehouse_name provided?    │
└────────┬────────────────────┘
         │
    YES  │  NO
  ┌──────┴──────┐
  │             │
  ▼             ▼
┌─────────────┐  ┌────────┐
│ storage_rub │  │ storage │
│ provided?   │  │ = 0    │
└──────┬──────┘  └────────┘
       │
  YES  │  NO
┌──────┴──────┐
│            │
▼            ▼
┌────────┐ ┌─────────────────────────┐
│ Manual │ │ storage_days provided?   │
│ Value  │ └────────┬────────────────┘
└────────┘          │
               YES │  NO
           ┌──────┴──────┐
           │             │
           ▼             ▼
    ┌────────────┐  ┌────────┐
    │ Fetch       │  │storage │
    │ warehouse   │  │ = 0    │
    │ tariffs    │  └────────┘
    └─────┬──────┘
          │
          ▼
    ┌─────────────────────┐
    │ warehouse rates     │
    │ available?         │
    └────────┬────────────┘
         │
    YES  │  NO
  ┌──────┴──────┐
  │             │
  ▼             ▼
┌────────┐  ┌─────────────────┐
│ Use    │  │ Use global      │
│ warehouse│  │ defaults from  │
│ rates   │  │ DB (Story 43.12)│
└────────┘  └─────────────────┘
```

---

## 4. Sequence Diagrams<a name="sequence-diagrams"></a>

### 4.1 Scenario 1: Manual Input Mode

```
User          Frontend        Backend         WB SDK
 │              │               │               │
 │─────────────▶│               │               │ Fill form
 │              │               │               │ (all manual)
 │              │               │               │
 │─────────────▶│ POST /calculate │               │ Submit
 │              │───────────────▶│               │
 │              │               │               │
 │              │               │──validate()    │
 │              │               │               │
 │              │               │──calc_reverse()│
 │              │               │               │
 │              │               │──sum_costs()   │
 │              │               │               │
 │              │               │──calc_price()  │
 │              │               │               │
 │              │◀───────────────│ Response       │
 │◀─────────────│               │               │ Display
 │              │               │               │
```

### 4.2 Scenario 2: Auto-fill (Warehouse + Volume)

```
User          Frontend        Backend         WB SDK
 │              │               │               │
 │─────────────▶│               │               │ Select warehouse
 │              │               │               │ + enter volume
 │              │               │               │
 │─────────────▶│ POST /calculate │               │ Submit
 │              │───────────────▶│               │
 │              │               │               │
 │              │               │─────getWarehouses()──────▶│
 │              │               │               │ offices()
 │              │               │               │ tariffs()
 │              │               │◀──────────────────────────│
 │              │               │               │
 │              │               │──matchWarehouse()│       │
 │              │               │               │
 │              │               │──calcLogistics()│       │
 │              │               │               │
 │              │               │──calcStorage()  │       │
 │              │               │               │
 │              │               │──calc_reverse() │       │
 │              │               │               │
 │              │               │──calc_price()   │       │
 │              │◀───────────────│ Response       │
 │              │    (auto_fill:  │               │
 │              │     "auto")    │               │
 │◀─────────────│               │               │ Display + "Auto"
 │              │               │               │  badges
 │              │               │               │
```

### 4.3 Scenario 3: Auto-fill (Warehouse + Dimensions)

```
User          Frontend        Backend         WB SDK
 │              │               │               │
 │─────────────▶│               │               │ Select warehouse
 │              │               │               │ + enter dims
 │              │               │               │ (L×W×H)
 │              │               │               │
 │─────────────▶│ POST /calculate │               │ Submit
 │              │───────────────▶│               │
 │              │               │               │
 │              │               │──calcVolume()   │
 │              │               │    = (L×W×H)/1000│
 │              │               │               │
 │              │               │──detectCargo()  │
 │              │               │    = max(L,W,H) │
 │              │               │               │
 │              │               │─────getWarehouses()──────▶│
 │              │               │               │
 │              │               │◀──────────────────────────│
 │              │               │               │
 │              │               │──calcLogistics()│       │
 │              │               │               │
 │              │◀───────────────│ Response       │
 │              │ (dimensions_calc)│               │
 │◀─────────────│               │               │ Display:
 │              │               │               │ "9.0 L (from
 │              │               │               │  dimensions)"
 │              │               │               │ + [MGT] badge
 │              │               │               │
```

### 4.4 Scenario 4: Manual Override

```
User          Frontend        Backend         WB SDK
 │              │               │               │
 │─────────────▶│               │               │ Auto-fill
 │              │               │               │ triggered
 │              │               │               │
 │              │◀───────────────│ auto_filled    │ Show auto value
 │              │    logistics: 74.4              │
 │              │               │               │
 │─────────────▶│               │               │ User edits
 │              │ POST /calculate │               │  logistics: 100
 │              │  (with explicit │               │
 │              │   logistics_   │               │
 │              │   forward_rub) │               │
 │              │───────────────▶│               │
 │              │               │               │
 │              │               │──detect: explicit│
 │              │               │    value provided│
 │              │               │               │
 │              │               │──use: 100       │
 │              │               │    (override)   │
 │              │               │               │
 │              │◀───────────────│ Response       │
 │              │ (auto_fill:     │               │
 │              │  logistics_source:│             │
 │              │   "manual")     │               │
 │◀─────────────│               │               │ Display:
 │              │               │               │ logistics: 100
 │              │               │               │ (Manual badge)
 │              │               │               │
```

---

## 5. Data Transformation Pipeline<a name="data-transformation-pipeline"></a>

### 5.1 WB SDK Raw Data → Backend Format

```
┌────────────────────────────────────────────────────────────────┐
│                    WB SDK Raw Response                         │
│  getTariffsBox({date})                                          │
│  ────────────────────────────────────────────────────────────  │
│  {                                                            │
│    "warehouseList": [{                                         │
│      "warehouseName": "Коледино",                              │
│      "boxDeliveryBase": "46",           ← STRING!             │
│      "boxDeliveryLiter": "14",          ← STRING!             │
│      "boxDeliveryCoefExpr": "115",       ← STRING! "115" = 1.15│
│      "boxDeliveryMarketplaceBase": "46",                      │
│      "boxDeliveryMarketplaceLiter": "14",                     │
│      "boxDeliveryMarketplaceCoefExpr": "115",                  │
│      "boxStorageBase": "0.07",                                │
│      "boxStorageLiter": "0.05",                               │
│      "boxStorageCoefExpr": "100"        ← "100" = 1.0        │
│    }]                                                          │
│  }                                                            │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              Transformation (parseCoefficient)                   │
│  ────────────────────────────────────────────────────────────  │
│  Input: "115" (string)                                         │
│  Process: parseFloat("115") / 100                             │
│  Output: 1.15 (number)                                         │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              TransformedTariffsDto (Backend Format)             │
│  ────────────────────────────────────────────────────────────  │
│  {                                                            │
│    fbo: {                                                      │
│      delivery_base_rub: 46,           ← number                 │
│      delivery_liter_rub: 14,           ← number                 │
│      logistics_coefficient: 1.15       ← number (SDK/100)      │
│    },                                                          │
│    fbs: {                                                      │
│      delivery_base_rub: 46,                                  │
│      delivery_liter_rub: 14,                                  │
│      logistics_coefficient: 1.15                             │
│    },                                                          │
│    storage: {                                                  │
│      base_per_day_rub: 0.07,                                 │
│      liter_per_day_rub: 0.05,                                │
│      coefficient: 1.0                                         │
│    },                                                          │
│    effective_from: "2026-02-01",                              │
│    effective_until: "2026-01-31"                             │
│  }                                                            │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              Logistics Calculation Formula                      │
│  ────────────────────────────────────────────────────────────  │
│  volume = max(volume_liters, 1)                               │
│  baseCost = delivery_base_rub + max(0, volume - 1) × delivery_liter_rub│
│  logistics = round(baseCost × logistics_coefficient × 100) / 100│
│                                                                │
│  Example (volume=2.5L, FBS, "Коледино"):                      │
│  baseCost = 46 + max(0, 2.5-1) × 14                           │
│          = 46 + 21 = 67                                        │
│  logistics = round(67 × 1.15 × 100) / 100                      │
│           = 77.05 ₽                                           │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              Frontend Response Format                          │
│  ────────────────────────────────────────────────────────────  │
│  {                                                            │
│    cost_breakdown: {                                          │
│      logistics_forward: 77.05,                                │
│      logistics_reverse_effective: 1.00,                       │
│      logistics_total: 78.05                                   │
│    },                                                          │
│    auto_fill: {                                                │
│      warehouse_name: "Коледино",                              │
│      logistics_source: "auto",                                │
│      tariff_date: "2026-02-01"                                │
│    }                                                           │
│  }                                                            │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Volume + Cargo Type Transformation

```
┌────────────────────────────────────────────────────────────────┐
│                    User Input (Dimensions)                     │
│  ────────────────────────────────────────────────────────────  │
│  {                                                            │
│    dimensions: {                                              │
│      length_cm: 30,                                           │
│      width_cm: 20,                                            │
│      height_cm: 15                                            │
│    }                                                           │
│  }                                                            │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              Volume Calculation                                │
│  ────────────────────────────────────────────────────────────  │
│  volume_cm3 = 30 × 20 × 15 = 9000                            │
│  volume_liters = 9000 / 1000 = 9.0                           │
│  volume_liters = round(9.0 × 100) / 100 = 9.0                │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              Cargo Type Detection                             │
│  ────────────────────────────────────────────────────────────  │
│  max_dimension = max(30, 20, 15) = 30                        │
│                                                                │
│  IF max_dimension ≤ 60:  → "MGT" (green)                     │
│  ELSE IF max_dimension ≤ 120: → "SGT" (yellow)                │
│  ELSE: → "KGT" (red → ERROR)                                 │
│                                                                │
│  Result: "MGT" (30 ≤ 60)                                     │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              Frontend Response Format                          │
│  ────────────────────────────────────────────────────────────  │
│  {                                                            │
│    dimensions_calculation: {                                  │
│      dimensions_cm: {length: 30, width: 20, height: 15},      │
│      calculated_volume_liters: 9.0,                           │
│      detected_cargo_type: "MGT",                              │
│      volume_source: "dimensions",                             │
│      max_dimension_cm: 30                                     │
│    }                                                           │
│  }                                                            │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. State Management (Frontend)<a name="state-management"></a>

### 6.1 Recommended State Structure

```typescript
interface PriceCalculatorState {
  // Input state
  targetMarginPct: number;
  cogsRub: number;
  logisticsReverseRub: number;  // ALWAYS manual
  buybackPct: number;
  advertisingPct: number;

  // Auto-fill state
  warehouseName?: string;
  volumeLiters?: number;
  dimensions?: {
    length_cm: number;
    width_cm: number;
    height_cm: number;
  };
  deliveryType: 'fbo' | 'fbs';
  storageDays?: number;

  // Manual override state
  logisticsForwardRub?: number;  // Explicit value overrides auto-fill
  storageRub?: number;           // Explicit value overrides auto-fill

  // Computed/UI state
  calculatedVolume?: number;
  detectedCargoType?: 'MGT' | 'SGT' | 'KGT';
  volumeSource?: 'manual' | 'dimensions';

  // Response state
  result?: {
    recommended_price: number;
    actual_margin_rub: number;
    actual_margin_pct: number;
  };
  costBreakdown?: {
    logistics_forward: number;
    logistics_reverse_effective: number;
    logistics_total: number;
    storage: number;
  };
  autoFill?: {
    warehouse_name?: string;
    logistics_source: 'auto' | 'manual';
    storage_source: 'auto' | 'manual';
    tariff_date?: string;
  };
  dimensionsCalculation?: {
    calculated_volume_liters: number;
    detected_cargo_type: 'MGT' | 'SGT' | 'KGT';
    max_dimension_cm: number;
  };

  // UI state
  isLoading: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### 6.2 React Query Keys Pattern

```typescript
// Query keys for cache invalidation
export const priceCalculatorQueryKeys = {
  all: ['price-calculator'] as const,
  calculate: (params: PriceCalculatorRequest) =>
    ['price-calculator', 'calculate', params] as const,

  // Supporting data
  warehouses: ['warehouses'] as const,
  settings: ['tariffs', 'settings'] as const,
  warehouseTariffs: (date?: string, cargoType?: string) =>
    ['warehouses', 'tariffs', date, cargoType] as const,
};

// Usage example
const { data: warehouses } = useQuery({
  queryKey: priceCalculatorQueryKeys.warehouses,
  queryFn: () => apiClient.get('/v1/tariffs/warehouses'),
  staleTime: 24 * 60 * 60 * 1000, // 24 hours
});

// Invalidate on warehouse change
const calculateMutation = useMutation({
  mutationFn: (request) => apiClient.post('/v1/products/price-calculator', request),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: priceCalculatorQueryKeys.warehouses
    });
  },
});
```

### 6.3 Form State Management (react-hook-form)

```typescript
// Form validation schema
const schema = z.object({
  target_margin_pct: z.number().min(0).max(100),
  cogs_rub: z.number().min(0),
  logistics_reverse_rub: z.number().min(0),  // ALWAYS required
  buyback_pct: z.number().min(0).max(100),
  advertising_pct: z.number().min(0).max(100),

  // Optional auto-fill fields
  warehouse_name: z.string().optional(),
  volume_liters: z.number().min(0).optional(),
  delivery_type: z.enum(['fbo', 'fbs']).optional(),
  storage_days: z.number().int().min(0).optional(),

  // Optional dimensions
  dimensions: z.object({
    length_cm: z.number().min(0),
    width_cm: z.number().min(0),
    height_cm: z.number().min(0),
  }).optional(),

  // Manual overrides
  logistics_forward_rub: z.number().min(0).optional(),
  storage_rub: z.number().min(0).optional(),
});

// Form setup
const { control, handleSubmit, watch, setValue } = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    target_margin_pct: 20,
    buyback_pct: 98,
    advertising_pct: 0,
    vat_pct: 20,
    acquiring_pct: 1.8,
    delivery_type: 'fbs',
  },
});

// Watch for warehouse changes to trigger auto-fill
const warehouseName = watch('warehouse_name');
const dimensions = watch('dimensions');

useEffect(() => {
  if (warehouseName && dimensions) {
    // Auto-calculate volume from dimensions
    const volume = (dimensions.length_cm * dimensions.width_cm * dimensions.height_cm) / 1000;
    setValue('volumeLiters', volume, { shouldValidate: false });

    // Detect cargo type
    const maxDim = Math.max(dimensions.length_cm, dimensions.width_cm, dimensions.height_cm);
    const cargoType = maxDim <= 60 ? 'MGT' : maxDim <= 120 ? 'SGT' : 'KGT';

    // Warn if KGT
    if (cargoType === 'KGT') {
      setError('dimensions', {
        type: 'KGT_NOT_SUPPORTED',
        message: 'Крупногабаритный груз требует ручного ввода логистики',
      });
    }
  }
}, [warehouseName, dimensions]);
```

---

## 7. Cache Strategy<a name="cache-strategy"></a>

### 7.1 Backend Cache (Redis)

| Data Type | Cache Key Pattern | TTL | Invalidation Trigger |
|-----------|------------------|-----|---------------------|
| Warehouse list | `tariffs:offices:{cabinetId}` | 24h | Manual refresh |
| Box tariffs | `tariffs:box:{cabinetId}:{date}` | 1h | Daily auto-update |
| Aggregated data | `tariffs:warehouses-with-tariffs:{id}:{date}` | 1h | Manual refresh |
| Global settings | N/A (DB) | N/A | Admin update |

### 7.2 Frontend Cache (TanStack Query)

| Data Type | Query Key | staleTime | gcTime | Refetch On |
|-----------|-----------|-----------|--------|------------|
| Warehouses list | `['warehouses']` | 24h | 24h | Window focus |
| Tariffs settings | `['tariffs', 'settings']` | 24h | 24h | Window focus |
| Warehouse tariffs | `['warehouses', 'tariffs', date]` | 1h | 24h | Manual trigger |

### 7.3 Cache Coordination Flow

```
User Action → Frontend Cache Check → API Request → Backend Cache Check → WB SDK
     │                  │                    │                    │
     │              MISS?                 │                  MISS?
     │                  │                    │                    │
     ▼                  ▼                    ▼                    ▼
  Display stale    Send request        Check Redis        Fetch from WB
  data            (with cached)       (return if hit)     (fresh data)
                                         │
                                         ▼
                                    Store in Redis
                                    (TTL: 1h)
                                         │
                                         ▼
                                    Return to Frontend
                                         │
                                         ▼
                                    Store in Query Cache
                                    (staleTime: 1h)
```

### 7.4 Cache Invalidation Triggers

**Automatic (Backend):**
- WB SDK data updates daily (scheduled job)
- Tariffs expire after 1h (Redis TTL)

**Manual (Frontend):**
- User clicks "Refresh" button
- Warehouse selection changes
- Explicit re-fetch button on error

**Code Example:**
```typescript
// Manual refresh function
const { refetch } = useQuery({
  queryKey: priceCalculatorQueryKeys.warehouses,
  queryFn: () => apiClient.get('/v1/tariffs/warehouses'),
  staleTime: 24 * 60 * 60 * 1000,
});

// Refresh on button click
const handleRefresh = () => {
  refetch({ cancelRefetch: false });
};
```

---

## 8. Quick Reference Summary<a name="quick-reference"></a>

### Key Decision Points

1. **Auto-fill triggers when**: `warehouse_name` + (`volume_liters` OR `dimensions`)
2. **Reverse logistics**: ALWAYS manual input (`logistics_reverse_rub` required)
3. **Manual override**: Explicit value > auto-fill > default
4. **Volume priority**: Explicit > Calculated from dims > Default (1L)
5. **Cargo type**: MGT ≤60cm, SGT ≤120cm, KGT >120cm (ERROR)

### State Management Checklist

- [ ] Store form state in react-hook-form with zod validation
- [ ] Cache warehouses list (24h staleTime)
- [ ] Watch warehouse changes for auto-fill triggers
- [ ] Calculate volume from dimensions automatically
- [ ] Detect cargo type and warn for KGT
- [ ] Show "Auto" badges when auto_fill source = "auto"
- [ ] Allow manual override of auto-filled values
- [ ] Cache calculation results to prevent redundant API calls

### Error Handling Priority

1. **WAREHOUSE_NOT_FOUND** → Show available warehouses list
2. **KGT_NOT_SUPPORTED** → Show manual input fields
3. **TARIFFS_NOT_AVAILABLE** → Suggest manual input mode
4. **VALIDATION_ERROR** → Client-side validation before request
5. **TOTAL_PERCENTAGE_RATE_EXCEEDS_100** → Reduce margin or costs

---

## Related Documentation

- `backend-logistics-analysis.md` (980 lines) - Backend implementation details
- `api-logistics-endpoints-analysis.md` (804 lines) - API contracts
- `PRICE-CALCULATOR-LOGISTICS-GUIDE.md` (1139 lines) - Frontend integration
- `src/products/services/price-calculator.service.ts` - Main service (720 lines)
- `src/tariffs/warehouses-tariffs.service.ts` - WB SDK integration
- `test-api/15-price-calculator.http` - API examples (1230 lines)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
**Status**: Production Ready
