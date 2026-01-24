# Backend Logistics Implementation Analysis

**Date**: 2026-01-24
**Analyzer**: Backend Implementation Analyst
**Scope**: Price Calculator Logistics Flow (Epic 43, Stories 43.2, 43.5, 43.6, 43.7, 43.12)

---

## Executive Summary

This document traces the complete logistics implementation flow in the Price Calculator feature, including:
1. **Forward Logistics** calculation via warehouse tariffs
2. **Reverse Logistics** effective rate processing
3. **Auto-fill Logic** triggered by `warehouse_name` + `volume_liters`
4. **WB SDK Integration** points and data structures
5. **Cargo Type** determination (MGT/SGT/KGT)
6. **All Formulas** with file:line references

---

## 1. Forward Logistics Calculation

### 1.1 Data Flow

```
Request (warehouse_name + volume/dimensions)
    → WarehousesTariffsService.getWarehousesWithTariffs()
    → WB SDK: sdk.products.offices() + sdk.tariffs.getTariffsBox()
    → Match warehouse by normalized name
    → PriceCalculatorService.calculateLogisticsCost()
    → Result: logistics_forward_rub
```

### 1.2 Auto-fill Trigger Conditions

**File**: `src/products/services/price-calculator.service.ts`

**Trigger** (line 449-455):
```typescript
if (request.warehouse_name) {
  autoFillResult = await this.resolveAutoFillValues(cabinetId, request);

  // Use auto-filled values unless manually overridden
  effectiveLogistics = request.logistics_forward_rub ?? autoFillResult.logistics_forward_rub;
  effectiveStorage = request.storage_rub ?? autoFillResult.storage_cost_rub;
}
```

**Conditions**:
- `warehouse_name` is provided in request
- If `logistics_forward_rub` is NOT provided, auto-fill is used
- Manual override takes precedence if both provided

### 1.3 Volume Resolution Priority (Story 43.7)

**File**: `src/products/services/price-calculator.service.ts:228-264`

**Priority Order**:
1. **Explicit `volume_liters`** (line 233-241) - Takes highest priority
2. **Calculated from `dimensions`** (line 242-260) - Second priority
3. **Default 1 liter** (line 261-264) - Fallback if neither provided

**Code**:
```typescript
if (request.volume_liters !== undefined) {
  // Explicit volume takes priority
  effectiveVolume = request.volume_liters;
  dimensionCalc = {
    volume_liters: request.volume_liters,
    cargo_type: 'MGT', // Default when volume is manual
    max_dimension_cm: 0,
    volume_source: 'manual',
  };
} else if (request.dimensions) {
  // Calculate from dimensions (Story 43.7)
  dimensionCalc = this.calculateVolumeFromDimensions(request.dimensions);

  // Check for KGT (not supported yet)
  if (dimensionCalc.cargo_type === 'KGT') {
    throw new BadRequestException({
      code: 'KGT_NOT_SUPPORTED',
      message: 'Для крупногабаритных товаров (КГТ) автоматический расчёт тарифов недоступен...',
    });
  }

  effectiveVolume = dimensionCalc.volume_liters;
} else {
  // Default to 1 liter if neither provided
  effectiveVolume = 1;
}
```

### 1.4 Warehouse Matching Logic

**File**: `src/products/services/price-calculator.service.ts:277-291`

**Process**:
```typescript
const normalizedWarehouseName = this.normalizeWarehouseName(request.warehouse_name!);
const matchedWarehouse = warehousesResult.data.warehouses.find(
  (w) => this.normalizeWarehouseName(w.name) === normalizedWarehouseName,
);

if (!matchedWarehouse) {
  throw new BadRequestException({
    code: 'WAREHOUSE_NOT_FOUND',
    message: `Склад "${request.warehouse_name}" не найден`,
    details: {
      warehouse_name: request.warehouse_name,
      available_warehouses: warehousesResult.data.warehouses.map((w) => w.name),
    },
  });
}
```

**Normalization** (line 423-430):
```typescript
private normalizeWarehouseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\wа-яё\s-]/gi, '')
    .replace(/\s*-\s*/g, '-');
}
```

---

## 2. Forward Logistics Formula

### 2.1 Core Formula

**File**: `src/products/services/price-calculator.service.ts:324-345`

**Formula**:
```
logistics = (base + max(0, volume - 1) × per_liter) × coefficient
```

**Implementation**:
```typescript
private calculateLogisticsCost(
  tariffs: TransformedTariffsDto,
  volumeLiters: number,
  deliveryType: 'fbo' | 'fbs',
): number {
  const tariff = tariffs[deliveryType];
  const volume = Math.max(volumeLiters, 1);

  const baseCost = tariff.delivery_base_rub + Math.max(0, volume - 1) * tariff.delivery_liter_rub;

  return Math.round(baseCost * tariff.logistics_coefficient * 100) / 100;
}
```

### 2.2 Tariff Data Structure

**File**: `src/products/services/price-calculator.service.ts:28` (imported)

**TransformedTariffsDto**:
```typescript
interface TransformedTariffsDto {
  fbo: {
    delivery_base_rub: number;      // Base delivery rate
    delivery_liter_rub: number;      // Per-liter rate after first liter
    logistics_coefficient: number;   // Multiplier (SDK/100)
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
}
```

### 2.3 Delivery Type Selection

**File**: `src/products/services/price-calculator.service.ts:305-307`

```typescript
const deliveryType = request.delivery_type || 'fbs';
const tariffs = matchedWarehouse.tariffs;
const logistics = this.calculateLogisticsCost(tariffs, effectiveVolume, deliveryType);
```

- Default: `fbs` if not specified
- Valid values: `'fbo'` | `'fbs'`

---

## 3. Reverse Logistics Processing

### 3.1 Effective Reverse Logistics Formula

**File**: `src/products/services/price-calculator.service.ts:481-482`

**Formula**:
```
logistics_effective = logistics_forward + logistics_reverse × (return_rate_pct / 100)
```

**Where**:
```
return_rate_pct = 100 - buyback_pct
```

**Implementation**:
```typescript
// Calculate intermediate values
const return_rate_pct = 100 - request.buyback_pct;
const logistics_effective = effectiveLogistics + request.logistics_reverse_rub * (return_rate_pct / 100);
```

### 3.2 Cost Breakdown

**File**: `src/products/services/price-calculator.service.ts:505-512`

```typescript
const cost_breakdown: FixedCostsDto = {
  cogs: request.cogs_rub,
  logistics_forward: effectiveLogistics,
  logistics_reverse_effective: Math.round(((request.logistics_reverse_rub * return_rate_pct) / 100) * 100) / 100,
  logistics_total: Math.round(logistics_effective * 100) / 100,
  storage: effectiveStorage,
  fixed_total: Math.round(fixed_total * 100) / 100,
};
```

**Key Points**:
- `logistics_reverse_effective` = reverse logistics adjusted by return rate
- `logistics_total` = forward + effective reverse
- User must provide `logistics_reverse_rub` manually (not auto-filled)
- User must provide `buyback_pct` (typically 95-99%)

### 3.3 Example Calculation

**From PRD** (lines 41-50):
```
cogs_rub = 1500
logistics_forward = 200
logistics_reverse = 150
buyback_pct = 98

return_rate_pct = 100 - 98 = 2%
logistics_effective = 200 + (150 × 0.02) = 203
```

---

## 4. Storage Cost Calculation

### 4.1 Storage Formula (with Fallback)

**File**: `src/products/services/price-calculator.service.ts:364-392`

**Formula**:
```
storage = ((base + max(0, volume - 1) × per_liter) × coefficient) × days
```

**Implementation** (Story 43.12 with fallback):
```typescript
private async calculateStorageCostWithFallback(
  tariffs: TransformedTariffsDto,
  volumeLiters: number,
  days: number,
): Promise<number> {
  const storage = tariffs.storage;
  const volume = Math.max(volumeLiters, 1);

  // Story 43.12: Check if warehouse-specific rates are available
  let baseRate = storage.base_per_day_rub;
  let literRate = storage.liter_per_day_rub;
  let coefficient = storage.coefficient;

  // Fallback to global defaults if warehouse rates are unavailable (null, undefined, or 0)
  if (!baseRate || baseRate === 0 || !literRate || literRate === 0) {
    this.logger.debug(
      `Warehouse storage rates unavailable (base=${baseRate}, liter=${literRate}), using global defaults`,
    );

    const globalSettings = await this.getTariffSettings();
    baseRate = globalSettings.storage_box_base_per_day;
    literRate = globalSettings.storage_box_liter_per_day;
    coefficient = 1.0; // Default coefficient when using global fallback
  }

  const dailyCost = (baseRate + Math.max(0, volume - 1) * literRate) * coefficient;

  return Math.round(dailyCost * days * 100) / 100;
}
```

### 4.2 Storage Trigger

**File**: `src/products/services/price-calculator.service.ts:309-313`

```typescript
// Step 5: Calculate storage (if days provided)
// Story 43.12: Use fallback method that checks for null/zero warehouse rates
const storage = request.storage_days
  ? await this.calculateStorageCostWithFallback(tariffs, effectiveVolume, request.storage_days)
  : 0;
```

- Only calculated if `storage_days` is provided
- Defaults to 0 if not provided
- Uses warehouse-specific rates or global fallback

---

## 5. WB SDK Integration

### 5.1 SDK Methods Called

**File**: `src/tariffs/warehouses-tariffs.service.ts`

#### 5.1.1 Get Offices (Warehouses)

**Lines 167-169**:
```typescript
this.logger.debug('Calling WB API sdk.products.offices()');
const response = await (sdk.products as unknown as ProductsModuleMethods).offices();
offices = response.data || [];
```

**SDK Method**: `sdk.products.offices()`

**Response Interface** (lines 30-41):
```typescript
interface Office {
  id?: number;
  name?: string;
  address?: string;
  city?: string;
  federalDistrict?: string;
  latitude?: number;
  longitude?: number;
  cargoType?: 1 | 2 | 3;           // 1=MGT, 2=SGT, 3=KGT
  deliveryType?: 1 | 2 | 3 | 5 | 6; // 1=FBS, 2=DBS, 3=DBW, 5=CC, 6=EDBS
  selected?: boolean;
}
```

#### 5.1.2 Get Box Tariffs

**Lines 230-237**:
```typescript
this.logger.debug(`Calling WB API sdk.tariffs.getTariffsBox({ date: ${effectiveDate} })`);
const response = await (sdk.tariffs as unknown as TariffsModuleMethods).getTariffsBox({ date: effectiveDate });
const data = response.response?.data;
result = {
  warehouseList: data?.warehouseList || [],
  dtNextBox: data?.dtNextBox,
  dtTillMax: data?.dtTillMax,
};
```

**SDK Method**: `sdk.tariffs.getTariffsBox({ date: string })`

**Response Interface** (lines 47-59):
```typescript
interface ModelsWarehouseBoxRates {
  warehouseName?: string;
  geoName?: string;

  // FBO rates
  boxDeliveryBase?: string;           // Base FBO delivery
  boxDeliveryLiter?: string;           // FBO per-liter rate
  boxDeliveryCoefExpr?: string;        // FBO coefficient

  // FBS rates
  boxDeliveryMarketplaceBase?: string;     // Base FBS delivery
  boxDeliveryMarketplaceLiter?: string;    // FBS per-liter rate
  boxDeliveryMarketplaceCoefExpr?: string; // FBS coefficient

  // Storage rates
  boxStorageBase?: string;             // Base storage rate
  boxStorageLiter?: string;            // Storage per-liter rate
  boxStorageCoefExpr?: string;         // Storage coefficient
}
```

### 5.2 Data Transformation

**File**: `src/tariffs/warehouses-tariffs.service.ts:429-449`

**String → Number Conversion**:
```typescript
private transformTariffs(raw: ModelsWarehouseBoxRates, dtNextBox?: string, dtTillMax?: string): TransformedTariffsDto {
  return {
    fbo: {
      delivery_base_rub: this.parseNumeric(raw.boxDeliveryBase),
      delivery_liter_rub: this.parseNumeric(raw.boxDeliveryLiter),
      logistics_coefficient: this.parseCoefficient(raw.boxDeliveryCoefExpr),
    },
    fbs: {
      delivery_base_rub: this.parseNumeric(raw.boxDeliveryMarketplaceBase),
      delivery_liter_rub: this.parseNumeric(raw.boxDeliveryMarketplaceLiter),
      logistics_coefficient: this.parseCoefficient(raw.boxDeliveryMarketplaceCoefExpr),
    },
    storage: {
      base_per_day_rub: this.parseNumeric(raw.boxStorageBase),
      liter_per_day_rub: this.parseNumeric(raw.boxStorageLiter),
      coefficient: this.parseCoefficient(raw.boxStorageCoefExpr),
    },
    effective_from: dtNextBox || '',
    effective_until: dtTillMax || '',
  };
}
```

**Parsing Methods** (lines 518-531):
```typescript
private parseNumeric(value: string | undefined, defaultValue = 0): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

private parseCoefficient(value: string | undefined): number {
  const parsed = parseFloat(value || '100');
  return isNaN(parsed) ? 1.0 : parsed / 100;  // SDK returns "100" = 100% = 1.0
}
```

### 5.3 Warehouse Matching

**File**: `src/tariffs/warehouses-tariffs.service.ts:379-405`

**Three-tier Matching**:
```typescript
private matchWarehouseToTariff(office: Office, tariffs: ModelsWarehouseBoxRates[]): ModelsWarehouseBoxRates | null {
  const officeName = this.normalizeWarehouseName(office.name);
  if (!officeName) return null;

  // 1. Exact match
  let match = tariffs.find((t) => this.normalizeWarehouseName(t.warehouseName) === officeName);
  if (match) return match;

  // 2. Contains match
  match = tariffs.find((t) => {
    const tariffName = this.normalizeWarehouseName(t.warehouseName);
    return tariffName.includes(officeName) || officeName.includes(tariffName);
  });
  if (match) return match;

  // 3. StartsWith match
  match = tariffs.find((t) => {
    const tariffName = this.normalizeWarehouseName(t.warehouseName);
    return tariffName.startsWith(officeName) || officeName.startsWith(tariffName);
  });

  if (!match) {
    this.logger.warn(`No tariff match for warehouse "${office.name}" (id=${office.id})`);
  }

  return match || null;
}
```

---

## 6. Cargo Type Determination

### 6.1 Cargo Type Thresholds

**File**: `src/products/services/price-calculator.service.ts:86-87`

```typescript
private readonly CARGO_TYPE_MGT_THRESHOLD = 60; // Small goods
private readonly CARGO_TYPE_SGT_THRESHOLD = 120; // Oversized goods
```

### 6.2 Cargo Type Detection Logic

**File**: `src/products/services/price-calculator.service.ts:184-213`

**Formula**:
```
volume_liters = (length_cm × width_cm × height_cm) / 1000
max_dimension = max(length_cm, width_cm, height_cm)

if max_dimension <= 60:
    cargo_type = 'MGT'  // Small goods (Мелкогабаритный товар)
else if max_dimension <= 120:
    cargo_type = 'SGT'  // Oversized goods (Сверхгабаритный товар)
else:
    cargo_type = 'KGT'  // Large goods (Крупногабаритный товар)
```

**Implementation**:
```typescript
private calculateVolumeFromDimensions(dimensions: DimensionsDto): DimensionCalculationResult {
  const { length_cm, width_cm, height_cm } = dimensions;

  // Calculate volume in liters (1 liter = 1000 cm³)
  const volume_cm3 = length_cm * width_cm * height_cm;
  const volume_liters = Math.round((volume_cm3 / 1000) * 100) / 100;

  // Determine cargo type by max dimension
  const max_dimension = Math.max(length_cm, width_cm, height_cm);

  let cargo_type: 'MGT' | 'SGT' | 'KGT';
  if (max_dimension <= this.CARGO_TYPE_MGT_THRESHOLD) {
    cargo_type = 'MGT'; // Small goods (≤60×60×60 cm)
  } else if (max_dimension <= this.CARGO_TYPE_SGT_THRESHOLD) {
    cargo_type = 'SGT'; // Oversized goods (≤120 cm)
  } else {
    cargo_type = 'KGT'; // Large goods (>120 cm)
  }

  this.logger.debug(
    `Dimensions: ${length_cm}×${width_cm}×${height_cm} cm → Volume: ${volume_liters}L, Cargo: ${cargo_type}`,
  );

  return {
    volume_liters,
    cargo_type,
    max_dimension_cm: max_dimension,
    volume_source: 'dimensions',
  };
}
```

### 6.3 SDK Cargo Type Mapping

**File**: `src/tariffs/warehouses-tariffs.service.ts:77-81`

```typescript
const CARGO_TYPE_MAP: Record<number, CargoType> = {
  1: CargoType.MGT,  // Small goods
  2: CargoType.SGT,  // Oversized goods
  3: CargoType.KGT,  // Large goods
};
```

### 6.4 Cargo Type Filtering

**File**: `src/products/services/price-calculator.service.ts:267-274`

```typescript
// Step 2: Get warehouse tariffs (optional cargo_type filtering)
const cargoTypeFilter: CargoType | undefined =
  dimensionCalc?.cargo_type === 'MGT' || dimensionCalc?.cargo_type === 'SGT'
    ? (dimensionCalc.cargo_type as CargoType)
    : undefined;

const warehousesResult = await this.warehousesTariffsService.getWarehousesWithTariffs(cabinetId, {
  cargo_type: cargoTypeFilter,
});
```

**Filtering Logic** (warehouses-tariffs.service.ts:307-309):
```typescript
// Filter by cargo_type if specified
let filteredWarehouses = aggregatedWarehouses;
if (params.cargo_type) {
  filteredWarehouses = aggregatedWarehouses.filter((w) => w.cargo_type === params.cargo_type);
}
```

### 6.5 KGT Limitation

**File**: `src/products/services/price-calculator.service.ts:246-258**

```typescript
// Check for KGT (not supported yet)
if (dimensionCalc.cargo_type === 'KGT') {
  throw new BadRequestException({
    code: 'KGT_NOT_SUPPORTED',
    message: 'Для крупногабаритных товаров (КГТ) автоматический расчёт тарифов недоступен. Введите стоимость логистики вручную.',
    details: {
      max_dimension_cm: dimensionCalc.max_dimension_cm,
      detected_cargo_type: 'KGT',
      suggestion: 'Укажите logistics_forward_rub и storage_cost_rub вручную',
    },
  });
}
```

---

## 7. Complete Formulas Reference

### 7.1 Volume Calculation

**File**: `src/products/services/price-calculator.service.ts:188`

```
volume_liters = (length_cm × width_cm × height_cm) / 1000
```

### 7.2 Forward Logistics

**File**: `src/products/services/price-calculator.service.ts:342`

```
logistics_forward = (delivery_base_rub + max(0, volume - 1) × delivery_liter_rub) × logistics_coefficient
```

### 7.3 Effective Reverse Logistics

**File**: `src/products/services/price-calculator.service.ts:481-482`

```
return_rate_pct = 100 - buyback_pct
logistics_effective = logistics_forward + logistics_reverse × (return_rate_pct / 100)
```

### 7.4 Storage Cost

**File**: `src/products/services/price-calculator.service.ts:389`

```
daily_storage = (base_per_day_rub + max(0, volume - 1) × liter_per_day_rub) × coefficient
storage = daily_storage × days
```

### 7.5 Fixed Costs Total

**File**: `src/products/services/price-calculator.service.ts:485`

```
fixed_total = cogs_rub + logistics_effective + storage
```

### 7.6 Core Pricing Formula

**File**: `src/products/services/price-calculator.service.ts:499`

```
price = fixed_total / (1 - total_percentage_rate / 100)
```

Where:
```
total_percentage_rate = commission_pct + acquiring_pct + advertising_pct + vat_pct + target_margin_pct
```

---

## 8. Field Mapping Summary

### 8.1 API Request → Service

| Request Field | Type | Required | Auto-fill Source |
|--------------|------|----------|------------------|
| `warehouse_name` | string | Conditional (for auto-fill) | User input |
| `volume_liters` | number | No | User input or calculated from dimensions |
| `dimensions` | DimensionsDto | No | User input |
| `delivery_type` | 'fbo'\|'fbs' | No | Default: 'fbs' |
| `logistics_forward_rub` | number | Conditional | Auto-filled if warehouse_name provided |
| `logistics_reverse_rub` | number | Yes | User input only |
| `storage_days` | number | No | User input |
| `storage_rub` | number | No | Auto-filled if warehouse_name + storage_days |
| `buyback_pct` | number | Yes | User input |

### 8.2 Service → SDK

| Service Field | SDK Source Field | Transformation |
|---------------|------------------|----------------|
| `tariffs.fbo.delivery_base_rub` | `boxDeliveryBase` | parseFloat() |
| `tariffs.fbo.delivery_liter_rub` | `boxDeliveryLiter` | parseFloat() |
| `tariffs.fbo.logistics_coefficient` | `boxDeliveryCoefExpr` | parseFloat() / 100 |
| `tariffs.fbs.delivery_base_rub` | `boxDeliveryMarketplaceBase` | parseFloat() |
| `tariffs.fbs.delivery_liter_rub` | `boxDeliveryMarketplaceLiter` | parseFloat() |
| `tariffs.fbs.logistics_coefficient` | `boxDeliveryMarketplaceCoefExpr` | parseFloat() / 100 |
| `tariffs.storage.base_per_day_rub` | `boxStorageBase` | parseFloat() |
| `tariffs.storage.liter_per_day_rub` | `boxStorageLiter` | parseFloat() |
| `tariffs.storage.coefficient` | `boxStorageCoefExpr` | parseFloat() / 100 |

### 8.3 Response Structure

**File**: `src/products/dto/response/price-calculator-response.dto.ts`

```typescript
{
  meta: {
    cabinet_id: string;
    calculated_at: string;
  };
  result: {
    recommended_price: number;
    target_margin_pct: number;
    actual_margin_rub: number;
    actual_margin_pct: number;
  };
  cost_breakdown: {
    cogs: number;
    logistics_forward: number;
    logistics_reverse_effective: number;
    logistics_total: number;
    storage: number;
    fixed_total: number;
  };
  auto_fill?: {
    warehouse_name: string;
    logistics_source: 'auto' | 'manual';
    storage_source: 'auto' | 'manual';
    tariff_date: string;
  };
  dimensions_calculation?: {
    dimensions_cm: DimensionsDto;
    calculated_volume_liters: number;
    detected_cargo_type: 'MGT' | 'SGT' | 'KGT';
    volume_source: 'dimensions' | 'manual';
    max_dimension_cm: number;
  };
}
```

---

## 9. Cache Strategy

### 9.1 Cache TTLs

**File**: `src/tariffs/warehouses-tariffs.service.ts:112-119`

```typescript
private readonly OFFICES_CACHE_TTL = 86400;      // 24 hours
private readonly TARIFFS_CACHE_TTL = 3600;       // 1 hour
private readonly AGGREGATED_CACHE_TTL = 3600;    // 1 hour
```

### 9.2 Cache Keys

**File**: `src/tariffs/warehouses-tariffs.service.ts:556-567**

```typescript
private getOfficesCacheKey(cabinetId: string): string {
  return `tariffs:offices:${cabinetId}`;
}

private getTariffsBoxCacheKey(cabinetId: string, date: string): string {
  return `tariffs:box:${cabinetId}:${date}`;
}

private getAggregatedCacheKey(cabinetId: string, date: string, cargoType?: CargoType): string {
  const suffix = cargoType ? `:${cargoType}` : '';
  return `tariffs:warehouses-with-tariffs:${cabinetId}:${date}${suffix}`;
}
```

---

## 10. Error Handling

### 10.1 KGT Error

**Code**: `KGT_NOT_SUPPORTED`

**File**: `src/products/services/price-calculator.service.ts:248-257`

```typescript
throw new BadRequestException({
  code: 'KGT_NOT_SUPPORTED',
  message: 'Для крупногабаритных товаров (КГТ) автоматический расчёт тарифов недоступен. Введите стоимость логистики вручную.',
  details: {
    max_dimension_cm: dimensionCalc.max_dimension_cm,
    detected_cargo_type: 'KGT',
    suggestion: 'Укажите logistics_forward_rub и storage_cost_rub вручную',
  },
});
```

### 10.2 Warehouse Not Found Error

**Code**: `WAREHOUSE_NOT_FOUND`

**File**: `src/products/services/price-calculator.service.ts:283-290`

```typescript
throw new BadRequestException({
  code: 'WAREHOUSE_NOT_FOUND',
  message: `Склад "${request.warehouse_name}" не найден`,
  details: {
    warehouse_name: request.warehouse_name,
    available_warehouses: warehousesResult.data.warehouses.map((w) => w.name),
  },
});
```

### 10.3 Tariffs Not Available Error

**Code**: `TARIFFS_NOT_AVAILABLE`

**File**: `src/products/services/price-calculator.service.ts:294-302`

```typescript
throw new BadRequestException({
  code: 'TARIFFS_NOT_AVAILABLE',
  message: `Тарифы для склада "${request.warehouse_name}" недоступны. Введите стоимость логистики вручную.`,
  details: {
    warehouse_name: request.warehouse_name,
    suggestion: 'Укажите logistics_forward_rub и storage_cost_rub вручную',
  },
});
```

---

## 11. Fallback Logic (Story 43.12)

### 11.1 Warehouse Storage Rates Fallback

**File**: `src/products/services/price-calculator.service.ts:378-387`

**Trigger**: When warehouse storage rates are `null`, `undefined`, or `0`

```typescript
// Fallback to global defaults if warehouse rates are unavailable (null, undefined, or 0)
if (!baseRate || baseRate === 0 || !literRate || literRate === 0) {
  this.logger.debug(
    `Warehouse storage rates unavailable (base=${baseRate}, liter=${literRate}), using global defaults`,
  );

  const globalSettings = await this.getTariffSettings();
  baseRate = globalSettings.storage_box_base_per_day;
  literRate = globalSettings.storage_box_liter_per_day;
  coefficient = 1.0; // Default coefficient when using global fallback
}
```

### 11.2 Offices API Fallback

**File**: `src/tariffs/warehouses-tariffs.service.ts:288-300`

**Trigger**: When `sdk.products.offices()` returns empty

```typescript
const effectiveOffices = offices.length === 0 && tariffsData.warehouseList.length > 0
  ? this.createOfficesFromTariffs(cabinetId, tariffsData.warehouseList)
  : offices;

if (offices.length === 0 && effectiveOffices.length > 0) {
  this.logger.warn(
    `Offices API returned empty, using ${effectiveOffices.length} offices from tariffs data as fallback. ` +
    `This may indicate the WB API token lacks permissions for offices() endpoint.`
  );
}
```

---

## 12. Summary of Key Insights

### 12.1 Logistics Calculation Flow

```
1. User provides: warehouse_name + (volume_liters OR dimensions)
2. Service calculates volume if dimensions provided
3. Service detects cargo type (MGT/SGT/KGT)
4. Service fetches warehouses from WB SDK (offices + tariffs)
5. Service matches warehouse by normalized name
6. Service filters by cargo_type (if detected)
7. Service selects FBO or FBS tariff
8. Service calculates: (base + max(0,volume-1)×liter) × coefficient
9. Service returns logistics_forward_rub
```

### 12.2 Reverse Logistics Flow

```
1. User provides: logistics_reverse_rub + buyback_pct
2. Service calculates: return_rate_pct = 100 - buyback_pct
3. Service calculates: logistics_effective = forward + reverse × (return_rate_pct / 100)
4. Service includes logistics_effective in fixed_total
```

### 12.3 Storage Calculation Flow

```
1. User provides: storage_days
2. Service checks warehouse-specific storage rates
3. If rates unavailable, fallback to global defaults
4. Service calculates: ((base + max(0,volume-1)×liter) × coefficient) × days
5. Service returns storage_cost_rub
```

---

## 13. Code Snippet Reference

### 13.1 Complete Auto-fill Flow

```typescript
// Step 1: Resolve volume (Story 43.7)
let effectiveVolume: number;
let dimensionCalc: DimensionCalculationResult | null = null;

if (request.volume_liters !== undefined) {
  effectiveVolume = request.volume_liters;
} else if (request.dimensions) {
  dimensionCalc = this.calculateVolumeFromDimensions(request.dimensions);
  if (dimensionCalc.cargo_type === 'KGT') {
    throw new BadRequestException({ code: 'KGT_NOT_SUPPORTED', ... });
  }
  effectiveVolume = dimensionCalc.volume_liters;
} else {
  effectiveVolume = 1;
}

// Step 2: Get warehouse tariffs (optional cargo_type filtering)
const cargoTypeFilter: CargoType | undefined =
  dimensionCalc?.cargo_type === 'MGT' || dimensionCalc?.cargo_type === 'SGT'
    ? (dimensionCalc.cargo_type as CargoType)
    : undefined;

const warehousesResult = await this.warehousesTariffsService.getWarehousesWithTariffs(cabinetId, {
  cargo_type: cargoTypeFilter,
});

// Step 3: Find matching warehouse
const normalizedWarehouseName = this.normalizeWarehouseName(request.warehouse_name!);
const matchedWarehouse = warehousesResult.data.warehouses.find(
  (w) => this.normalizeWarehouseName(w.name) === normalizedWarehouseName,
);

// Step 4: Calculate logistics
const deliveryType = request.delivery_type || 'fbs';
const tariffs = matchedWarehouse.tariffs;
const logistics = this.calculateLogisticsCost(tariffs, effectiveVolume, deliveryType);

// Step 5: Calculate storage
const storage = request.storage_days
  ? await this.calculateStorageCostWithFallback(tariffs, effectiveVolume, request.storage_days)
  : 0;
```

### 13.2 Complete Logistics Formula

```typescript
// Forward logistics
const volume = Math.max(volumeLiters, 1);
const baseCost = tariff.delivery_base_rub + Math.max(0, volume - 1) * tariff.delivery_liter_rub;
const logistics_forward = Math.round(baseCost * tariff.logistics_coefficient * 100) / 100;

// Effective reverse logistics
const return_rate_pct = 100 - request.buyback_pct;
const logistics_effective = logistics_forward + request.logistics_reverse_rub * (return_rate_pct / 100);

// Storage
const dailyCost = (baseRate + Math.max(0, volume - 1) * literRate) * coefficient;
const storage = Math.round(dailyCost * days * 100) / 100;

// Fixed total
const fixed_total = request.cogs_rub + logistics_effective + storage;

// Core formula
const price = fixed_total / (1 - total_percentage_rate / 100);
```

---

## 14. Related Documentation

| Document | Description |
|----------|-------------|
| `docs/stories/epic-43/story-43.2-price-calculator-service.md` | Core service implementation |
| `docs/stories/epic-43/story-43.5-warehouses-tariffs-service.md` | Warehouse tariffs aggregation |
| `docs/stories/epic-43/story-43.6-autofill-integration.md` | Auto-fill integration logic |
| `docs/stories/epic-43/story-43.7-dimension-logistics.md` | Dimension-based logistics |
| `docs/stories/epic-43/story-43.12-default-box-storage-rates.md` | Storage fallback logic |
| `docs/reference/PRICE-CALCULATOR-GUIDE.md` | Complete usage guide |
| `docs/BUSINESS-LOGIC-REFERENCE.md` | Business formulas and rules |

---

**End of Analysis**
