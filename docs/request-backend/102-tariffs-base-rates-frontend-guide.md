# Request #102: Tariffs Base Rates - Frontend Integration Guide

**Date**: 2026-01-24
**Status**: REFERENCE DOCUMENT
**Priority**: P1 - CRITICAL for Price Calculator
**Related Epics**: Epic 43 (Price Calculator), Epic 44-FE (Price Calculator UI), Epic 52 (Tariff Settings Admin)
**Last Updated**: 2026-01-24

---

## Purpose

This document provides frontend developers with comprehensive guidance on:
1. Where to get base storage/logistics rates
2. How to calculate costs using coefficients
3. What's currently implemented vs. planned

---

## Quick Reference

| Data Type | Endpoint | Use Case |
|-----------|----------|----------|
| Global settings (fallback rates) | `GET /v1/tariffs/settings` | Default rates when warehouse-specific unavailable |
| Per-warehouse rates + coefficients | `GET /v1/tariffs/acceptance/coefficients` | Warehouse-specific calculations |
| Warehouse list with tariffs | `GET /v1/tariffs/warehouses-with-tariffs` | Warehouse selector with embedded rates |
| Simple warehouse list | `GET /v1/tariffs/warehouses` | Warehouse dropdown (no tariffs) |

---

## Section A: Available Endpoints for Base Rates

### 1. GET /v1/tariffs/settings

**Purpose**: Global tariff settings including base rates for logistics and storage.

**Response**:
```json
{
  "default_commission_fbo_pct": 25.0,
  "default_commission_fbs_pct": 28.0,

  "logistics_large_first_liter_rate": 46.0,
  "logistics_large_additional_liter_rate": 14.0,

  "logistics_volume_tiers": [
    { "min": 0.001, "max": 0.2, "rate": 23 },
    { "min": 0.201, "max": 0.4, "rate": 26 },
    { "min": 0.401, "max": 0.6, "rate": 29 },
    { "min": 0.601, "max": 0.8, "rate": 30 },
    { "min": 0.801, "max": 1.0, "rate": 32 }
  ],

  "acceptance_box_rate_per_liter": 1.7,
  "acceptance_pallet_rate": 500.0,

  "return_logistics_fbo_rate": 50.0,
  "return_logistics_fbs_rate": 50.0,

  "storage_free_days": 60,
  "fbs_uses_fbo_logistics_rates": true,

  "effective_from": "2025-09-01T00:00:00Z"
}
```

**Key Fields Explained**:

| Field | Value | Description |
|-------|-------|-------------|
| `logistics_large_first_liter_rate` | 46 ₽ | Base rate for first liter (items >1L) |
| `logistics_large_additional_liter_rate` | 14 ₽ | Rate per additional liter (items >1L) |
| `logistics_volume_tiers` | Array | Fixed rates for small items (≤1L) |
| `acceptance_box_rate_per_liter` | 1.7 ₽ | Box acceptance rate per liter |
| `acceptance_pallet_rate` | 500 ₽ | Pallet acceptance rate per pallet |
| `storage_free_days` | 60 | Free storage period (days) |

---

### 2. GET /v1/tariffs/acceptance/coefficients

**Purpose**: Per-warehouse coefficients WITH embedded base rates for delivery and storage.

**Query Parameters**:
- `warehouseId` (optional): Single warehouse ID
- `warehouseIds` (optional): Comma-separated list of IDs

**Response**:
```json
{
  "coefficients": [
    {
      "warehouseId": 507,
      "warehouseName": "Краснодар",
      "date": "2026-01-24",

      "coefficient": 1.0,
      "isAvailable": true,
      "allowUnload": true,

      "boxTypeId": 2,
      "boxTypeName": "Boxes",

      "delivery": {
        "coefficient": 1.0,
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
  ],
  "meta": {
    "total": 250,
    "available": 200,
    "unavailable": 50,
    "cache_ttl_seconds": 3600
  }
}
```

**Key Fields Explained**:

| Field | Description |
|-------|-------------|
| `delivery.baseLiterRub` | First liter delivery rate (₽) |
| `delivery.additionalLiterRub` | Per additional liter delivery rate (₽) |
| `delivery.coefficient` | Delivery multiplier for this warehouse |
| `storage.baseLiterRub` | First liter storage rate per day (₽) |
| `storage.additionalLiterRub` | Per additional liter storage rate per day (₽) |
| `storage.coefficient` | Storage multiplier for this warehouse |
| `coefficient` | Acceptance coefficient (-1=unavailable, 0=free, 1=standard, >1=increased) |

---

### 3. GET /v1/tariffs/warehouses-with-tariffs

**Purpose**: Aggregated warehouse data with embedded tariffs.

**Response**:
```json
{
  "warehouses": [
    {
      "id": 507,
      "name": "Коледино",
      "federal_district": "Центральный ФО",
      "tariffs": {
        "fbo": {
          "logistics_coefficient": 1.0,
          "delivery_base_rub": 46.0,
          "delivery_liter_rub": 14.0
        },
        "storage": {
          "coefficient": 1.0,
          "base_per_day_rub": 0.07,
          "liter_per_day_rub": 0.05
        }
      }
    }
  ],
  "updated_at": "2026-01-24T10:00:00Z"
}
```

---

## Section B: Calculation Formulas

### 1. Logistics Cost Calculation

#### For Items >1 Liter (Progressive Formula)

```typescript
function calculateLogisticsCost(
  volumeLiters: number,
  firstLiterRate: number,      // e.g., 46 ₽
  additionalLiterRate: number, // e.g., 14 ₽
  coefficient: number          // e.g., 1.0
): number {
  const baseCost = firstLiterRate + (volumeLiters - 1) * additionalLiterRate;
  return Math.round(baseCost * coefficient * 100) / 100;
}

// Example: 5L item at Коледино (coefficient=1.0)
// cost = (46 + (5-1) * 14) * 1.0 = 46 + 56 = 102 ₽
```

#### For Items ≤1 Liter (Volume Tiers)

```typescript
interface VolumeTier {
  min: number;
  max: number;
  rate: number;
}

function calculateSmallItemLogistics(
  volumeLiters: number,
  volumeTiers: VolumeTier[],
  coefficient: number
): number {
  // Find matching tier
  const tier = volumeTiers.find(
    t => volumeLiters >= t.min && volumeLiters <= t.max
  );

  if (!tier) {
    throw new Error(`No tier found for volume ${volumeLiters}L`);
  }

  return Math.round(tier.rate * coefficient * 100) / 100;
}

// Example: 0.5L item (tier: 0.401-0.600L = 29₽)
// cost = 29 * 1.0 = 29 ₽
```

#### Combined Logistics Calculator

```typescript
function calculateLogistics(
  volumeLiters: number,
  settings: TariffSettings,
  warehouseCoefficient: number = 1.0
): number {
  if (volumeLiters <= 1) {
    // Use volume tiers for small items
    return calculateSmallItemLogistics(
      volumeLiters,
      settings.logistics_volume_tiers,
      warehouseCoefficient
    );
  } else {
    // Use progressive formula for large items
    return calculateLogisticsCost(
      volumeLiters,
      settings.logistics_large_first_liter_rate,
      settings.logistics_large_additional_liter_rate,
      warehouseCoefficient
    );
  }
}
```

---

### 2. Storage Cost Calculation

#### Box Storage (Per Day)

```typescript
function calculateStorageCost(
  volumeLiters: number,
  baseLiterRub: number,         // e.g., 0.07 ₽
  additionalLiterRub: number,   // e.g., 0.05 ₽
  coefficient: number,          // e.g., 1.0
  days: number
): number {
  const volume = Math.max(volumeLiters, 1);
  const dailyCost = (baseLiterRub + Math.max(0, volume - 1) * additionalLiterRub) * coefficient;
  return Math.round(dailyCost * days * 100) / 100;
}

// Example: 10L item stored for 30 days at coefficient=1.0
// dailyCost = (0.07 + 9 * 0.05) * 1.0 = 0.07 + 0.45 = 0.52 ₽/day
// totalCost = 0.52 * 30 = 15.60 ₽
```

#### Free Storage Period

```typescript
function calculateBillableStorageDays(
  daysSinceShipment: number,
  freeStorageDays: number = 60
): number {
  return Math.max(0, daysSinceShipment - freeStorageDays);
}

// Example: Item shipped 75 days ago
// billableDays = max(0, 75 - 60) = 15 days
```

---

### 3. Acceptance Cost Calculation

#### Box Acceptance

```typescript
function calculateBoxAcceptanceCost(
  volumeLiters: number,
  ratePerLiter: number,  // e.g., 1.7 ₽
  coefficient: number    // e.g., 1.0
): number {
  return Math.round(volumeLiters * ratePerLiter * coefficient * 100) / 100;
}

// Example: 5L box at coefficient=1.2
// cost = 5 * 1.7 * 1.2 = 10.20 ₽
```

#### Pallet Acceptance

```typescript
function calculatePalletAcceptanceCost(
  palletCount: number,
  ratePerPallet: number, // e.g., 500 ₽
  coefficient: number    // e.g., 1.0
): number {
  return Math.round(palletCount * ratePerPallet * coefficient * 100) / 100;
}

// Example: 2 pallets at coefficient=1.0
// cost = 2 * 500 * 1.0 = 1000 ₽
```

---

## Section C: What's NOT YET Implemented (Planned)

### Story 43.11: Mono-Pallet Storage Rate

**Status**: Draft (NOT IMPLEMENTED)

**Missing Field**: `mono_pallet_storage_rate_per_day` (23 ₽/day per pallet)

**Formula (from WB PDF)**:
```
mono_pallet_storage_cost = 23 ₽/day × storage_coefficient × pallet_count × storage_days
```

**Workaround**: Currently not calculable via API. Frontend should:
1. Show "Mono-pallet storage calculation coming soon" message
2. Or allow manual entry of storage cost

---

### Story 43.12: Default Box Storage Fallback Rates

**Status**: Draft (NOT IMPLEMENTED)

**Missing Fields**:
- `storage_box_base_per_day` (0.11 ₽/day for first liter)
- `storage_box_liter_per_day` (0.11 ₽/day per additional liter)

**Purpose**: Fallback when warehouse-specific rates are unavailable from WB API.

**Workaround**: If `acceptance/coefficients` returns null for storage rates, use hardcoded defaults:
```typescript
const FALLBACK_STORAGE_RATES = {
  baseLiterRub: 0.11,
  additionalLiterRub: 0.11,
  coefficient: 1.0
};
```

---

## Section D: Integration Examples

### 1. Fetching and Caching Tariff Settings

```typescript
// src/lib/api/tariffs.ts
import { apiClient } from '@/lib/api-client';
import type { TariffSettings } from '@/types/tariffs';

const CACHE_KEY = 'tariff-settings';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let cachedSettings: TariffSettings | null = null;
let cacheTimestamp = 0;

export async function getTariffSettings(): Promise<TariffSettings> {
  const now = Date.now();

  // Return cached if valid
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSettings;
  }

  // Fetch fresh data
  const response = await apiClient.get<TariffSettings>('/v1/tariffs/settings');

  // Update cache
  cachedSettings = response;
  cacheTimestamp = now;

  return response;
}
```

### 2. React Hook for Tariff Settings

```typescript
// src/hooks/useTariffSettings.ts
import { useQuery } from '@tanstack/react-query';
import { getTariffSettings } from '@/lib/api/tariffs';

export const tariffSettingsQueryKeys = {
  all: ['tariff-settings'] as const,
};

export function useTariffSettings() {
  return useQuery({
    queryKey: tariffSettingsQueryKeys.all,
    queryFn: getTariffSettings,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

### 3. Calculating Logistics Cost with Coefficient

```typescript
// src/lib/tariff-calculations.ts
import type { TariffSettings, AcceptanceCoefficient } from '@/types/tariffs';

export function calculateLogisticsCostWithCoefficient(
  volumeLiters: number,
  settings: TariffSettings,
  warehouseData?: AcceptanceCoefficient
): { cost: number; source: 'warehouse' | 'global' } {
  // Use warehouse-specific rates if available
  if (warehouseData?.delivery) {
    const { baseLiterRub, additionalLiterRub, coefficient } = warehouseData.delivery;

    if (volumeLiters <= 1) {
      // For small items, use global tiers but apply warehouse coefficient
      const tier = settings.logistics_volume_tiers.find(
        t => volumeLiters >= t.min && volumeLiters <= t.max
      );
      const baseRate = tier?.rate ?? settings.logistics_volume_tiers[0].rate;
      return {
        cost: Math.round(baseRate * coefficient * 100) / 100,
        source: 'warehouse'
      };
    }

    // For large items, use warehouse rates
    const baseCost = baseLiterRub + (volumeLiters - 1) * additionalLiterRub;
    return {
      cost: Math.round(baseCost * coefficient * 100) / 100,
      source: 'warehouse'
    };
  }

  // Fallback to global settings
  if (volumeLiters <= 1) {
    const tier = settings.logistics_volume_tiers.find(
      t => volumeLiters >= t.min && volumeLiters <= t.max
    );
    return {
      cost: tier?.rate ?? settings.logistics_volume_tiers[0].rate,
      source: 'global'
    };
  }

  const baseCost = settings.logistics_large_first_liter_rate +
    (volumeLiters - 1) * settings.logistics_large_additional_liter_rate;
  return {
    cost: Math.round(baseCost * 100) / 100,
    source: 'global'
  };
}
```

### 4. Calculating Storage Cost with Coefficient

```typescript
// src/lib/tariff-calculations.ts

export function calculateStorageCostWithCoefficient(
  volumeLiters: number,
  days: number,
  warehouseData?: AcceptanceCoefficient,
  freeStorageDays: number = 60
): { cost: number; source: 'warehouse' | 'fallback'; billableDays: number } {
  // Calculate billable days (after free period)
  const billableDays = Math.max(0, days - freeStorageDays);

  if (billableDays === 0) {
    return { cost: 0, source: 'warehouse', billableDays: 0 };
  }

  const volume = Math.max(volumeLiters, 1);

  // Use warehouse-specific rates if available
  if (warehouseData?.storage) {
    const { baseLiterRub, additionalLiterRub, coefficient } = warehouseData.storage;
    const dailyCost = (baseLiterRub + Math.max(0, volume - 1) * additionalLiterRub) * coefficient;
    return {
      cost: Math.round(dailyCost * billableDays * 100) / 100,
      source: 'warehouse',
      billableDays
    };
  }

  // Fallback to default rates (Story 43.12 - when implemented)
  const FALLBACK_BASE = 0.11;
  const FALLBACK_LITER = 0.11;
  const dailyCost = FALLBACK_BASE + Math.max(0, volume - 1) * FALLBACK_LITER;

  return {
    cost: Math.round(dailyCost * billableDays * 100) / 100,
    source: 'fallback',
    billableDays
  };
}
```

### 5. Handling Missing Data Gracefully

```typescript
// src/components/custom/price-calculator/StorageCostDisplay.tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface StorageCostDisplayProps {
  cost: number;
  source: 'warehouse' | 'fallback';
  warehouseName?: string;
}

export function StorageCostDisplay({
  cost,
  source,
  warehouseName
}: StorageCostDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Стоимость хранения:</span>
        <span className="font-semibold">{cost.toFixed(2)} ₽</span>
      </div>

      {source === 'fallback' && (
        <Alert variant="warning" className="py-2">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Используются базовые тарифы (0.11 ₽/л/день).
            {warehouseName && ` Тарифы для "${warehouseName}" недоступны.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### 6. Complete Price Calculator Hook

```typescript
// src/hooks/usePriceCalculatorTariffs.ts
import { useQuery } from '@tanstack/react-query';
import { useTariffSettings } from './useTariffSettings';
import { getAcceptanceCoefficients } from '@/lib/api/tariffs';
import {
  calculateLogisticsCostWithCoefficient,
  calculateStorageCostWithCoefficient
} from '@/lib/tariff-calculations';

interface UsePriceCalculatorTariffsParams {
  warehouseId?: number;
  volumeLiters: number;
  storageDays: number;
}

export function usePriceCalculatorTariffs({
  warehouseId,
  volumeLiters,
  storageDays
}: UsePriceCalculatorTariffsParams) {
  const { data: settings, isLoading: settingsLoading } = useTariffSettings();

  const { data: coefficients, isLoading: coefficientsLoading } = useQuery({
    queryKey: ['acceptance-coefficients', warehouseId],
    queryFn: () => getAcceptanceCoefficients(warehouseId ? [warehouseId] : undefined),
    enabled: !!warehouseId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const warehouseData = coefficients?.coefficients?.find(
    c => c.warehouseId === warehouseId
  );

  const logisticsResult = settings
    ? calculateLogisticsCostWithCoefficient(volumeLiters, settings, warehouseData)
    : null;

  const storageResult = settings
    ? calculateStorageCostWithCoefficient(
        volumeLiters,
        storageDays,
        warehouseData,
        settings.storage_free_days
      )
    : null;

  return {
    isLoading: settingsLoading || (!!warehouseId && coefficientsLoading),
    settings,
    warehouseData,
    logistics: logisticsResult,
    storage: storageResult,
  };
}
```

---

## Section E: TypeScript Types

```typescript
// src/types/tariffs.ts

export interface VolumeTier {
  min: number;
  max: number;
  rate: number;
}

export interface TariffSettings {
  default_commission_fbo_pct: number;
  default_commission_fbs_pct: number;

  logistics_large_first_liter_rate: number;
  logistics_large_additional_liter_rate: number;
  logistics_volume_tiers: VolumeTier[];

  acceptance_box_rate_per_liter: number;
  acceptance_pallet_rate: number;

  return_logistics_fbo_rate: number;
  return_logistics_fbs_rate: number;

  storage_free_days: number;
  fbs_uses_fbo_logistics_rates: boolean;

  effective_from: string;

  // Coming Soon (Story 43.11)
  // mono_pallet_storage_rate_per_day?: number;

  // Coming Soon (Story 43.12)
  // storage_box_base_per_day?: number;
  // storage_box_liter_per_day?: number;
}

export interface DeliveryCoefficient {
  coefficient: number;
  baseLiterRub: number;
  additionalLiterRub: number;
}

export interface StorageCoefficient {
  coefficient: number;
  baseLiterRub: number;
  additionalLiterRub: number;
}

export interface AcceptanceCoefficient {
  warehouseId: number;
  warehouseName: string;
  date: string;
  coefficient: number;
  isAvailable: boolean;
  allowUnload: boolean;
  boxTypeId: number;
  boxTypeName: string;
  delivery: DeliveryCoefficient;
  storage: StorageCoefficient;
  isSortingCenter: boolean;
}

export interface AcceptanceCoefficientsResponse {
  coefficients: AcceptanceCoefficient[];
  meta: {
    total: number;
    available: number;
    unavailable: number;
    cache_ttl_seconds: number;
  };
}
```

---

## Section F: Summary Table

| Cost Type | Formula | Data Source | Fallback |
|-----------|---------|-------------|----------|
| Logistics (≤1L) | `tier_rate × coefficient` | `/settings` tiers + `/acceptance/coefficients` | Global tiers, coefficient=1.0 |
| Logistics (>1L) | `(first_liter + (vol-1) × add_liter) × coef` | `/acceptance/coefficients` delivery | `/settings` rates, coefficient=1.0 |
| Storage (box) | `(base + (vol-1) × add) × coef × days` | `/acceptance/coefficients` storage | 0.11 ₽/L/day (hardcoded) |
| Acceptance (box) | `volume × 1.7 × coef` | `/settings` + `/acceptance/coefficients` | 1.7 ₽/L, coefficient=1.0 |
| Acceptance (pallet) | `count × 500 × coef` | `/settings` + `/acceptance/coefficients` | 500 ₽/pallet, coefficient=1.0 |

---

## Cross-References

- **Endpoint Details**: [98-warehouses-tariffs-coefficients-api.md](./98-warehouses-tariffs-coefficients-api.md)
- **Backend Response**: [98-warehouses-tariffs-BACKEND-RESPONSE.md](./98-warehouses-tariffs-BACKEND-RESPONSE.md)
- **Price Calculator API**: [95-epic-43-price-calculator-api.md](./95-epic-43-price-calculator-api.md)
- **Backend Analysis**: [/docs/WB-TARIFFS-BASE-RATES-ANALYSIS.md](../../../docs/WB-TARIFFS-BASE-RATES-ANALYSIS.md)
- **Story 43.11**: Mono-pallet storage rate (Draft)
- **Story 43.12**: Default box storage rates (Draft)

---

**Created**: 2026-01-24
**Author**: Frontend Integration Guide
**Status**: Reference Document
