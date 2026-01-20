# SDK Reference: Warehouses & Tariffs for Price Calculator

**Epic**: 44-FE (Price Calculator UI)
**Phase**: 3 - Warehouse, Storage & Tariffs Integration
**Stories**: 44.12, 44.13, 44.14
**Created**: 2026-01-19
**Status**: Reference Documentation

---

## Overview

Этот документ содержит полную техническую аналитику SDK методов для расчёта стоимости логистики и хранения по складам WB. Используется как reference при реализации Phase 3 Price Calculator.

---

## Table of Contents

1. [SDK Methods Summary](#1-sdk-methods-summary)
2. [Office Interface (Warehouses)](#2-office-interface-warehouses)
3. [BoxRates Interface (Tariffs)](#3-boxrates-interface-tariffs)
4. [PalletRates Interface (КГТ)](#4-palletrates-interface-кгт)
5. [Data Transformations](#5-data-transformations)
6. [Matching Strategy](#6-matching-strategy)
7. [Formulas & Calculations](#7-formulas--calculations)
8. [Frontend Integration Guide](#8-frontend-integration-guide)
9. [API Contract](#9-api-contract)
10. [Known Issues & Edge Cases](#10-known-issues--edge-cases)

---

## 1. SDK Methods Summary

### Available Methods (SDK v2.4.3+)

| Method | Returns | Purpose | Rate Limit |
|--------|---------|---------|------------|
| `sdk.products.offices()` | `Office[]` | Все склады WB (FBO + FBS) | 60/min |
| `sdk.tariffs.getTariffsBox({ date })` | `TariffsBoxResponse` | Тарифы для коробов (МГТ, СГТ) | 60/min |
| `sdk.tariffs.getTariffsPallet({ date })` | `TariffsPalletResponse` | Тарифы для паллет (КГТ) | 60/min |
| `sdk.tariffs.getTariffsReturn({ date })` | `TariffsReturnResponse` | Тарифы возврата | 60/min |
| `sdk.tariffs.getTariffsCommission()` | `CommissionResponse` | Комиссии по категориям | 60/min |

### Method Selection Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                    ЧТО ИСПОЛЬЗОВАТЬ?                           │
├─────────────────────────────────────────────────────────────────┤
│  Нужен список складов?                                         │
│  └── sdk.products.offices()        ✅ ВСЕ склады WB            │
│      (НЕ sdk.products.getWarehouses() — это склады продавца!)  │
│                                                                │
│  Нужны тарифы логистики/хранения?                              │
│  ├── Малогабарит (МГТ) → sdk.tariffs.getTariffsBox()          │
│  ├── Сверхгабарит (СГТ) → sdk.tariffs.getTariffsBox()         │
│  └── Крупногабарит (КГТ) → sdk.tariffs.getTariffsPallet()     │
│                                                                │
│  Нужны тарифы возврата?                                        │
│  └── sdk.tariffs.getTariffsReturn()                           │
│                                                                │
│  Нужна комиссия WB?                                            │
│  └── sdk.tariffs.getTariffsCommission()  ✅ Уже реализовано    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Office Interface (Warehouses)

### SDK Type Definition

```typescript
/**
 * Склад WB
 * Method: sdk.products.offices()
 */
export interface Office {
  /** ID склада */
  id?: number;

  /** Название склада (ключ для matching с тарифами) */
  name?: string;                    // "Коледино", "Казань", "Хабаровск"

  /** Адрес склада */
  address?: string;

  /** Город */
  city?: string;                    // "Подольск", "Казань"

  /** Федеральный округ (null = за пределами РФ) */
  federalDistrict?: string;         // "Центральный ФО", "Приволжский ФО"

  /** Координаты */
  latitude?: number;
  longitude?: number;

  /**
   * Тип товара, который принимает склад:
   * - 1 = МГТ (малогабаритный товар) — до 60×60×60 см
   * - 2 = СГТ (сверхгабаритный товар) — до 120×80×80 см
   * - 3 = КГТ+ (крупногабаритный товар) — более 120 см
   */
  cargoType?: 1 | 2 | 3;

  /**
   * Тип доставки, который поддерживает склад:
   * - 1 = FBS (доставка на склад WB)
   * - 2 = DBS (доставка силами продавца)
   * - 3 = DBW (доставка курьером WB)
   * - 5 = C&C (самовывоз / Click & Collect)
   * - 6 = EDBS (экспресс-доставка силами продавца)
   */
  deliveryType?: 1 | 2 | 3 | 5 | 6;

  /** Признак того, что склад уже выбран продавцом */
  selected?: boolean;
}
```

### Cargo Type Reference

| Code | Name | Description | Max Dimensions | Tariff Method |
|------|------|-------------|----------------|---------------|
| 1 | **МГТ** | Малогабаритный товар | 60×60×60 см | `getTariffsBox()` |
| 2 | **СГТ** | Сверхгабаритный товар | 120×80×80 см | `getTariffsBox()` |
| 3 | **КГТ+** | Крупногабаритный товар | >120 см | `getTariffsPallet()` |

### Delivery Type Reference

| Code | Name | Description | For Calculator |
|------|------|-------------|----------------|
| 1 | **FBS** | Fulfillment by Seller | `boxDeliveryMarketplace*` |
| 2 | **DBS** | Delivery by Seller | N/A (seller logistics) |
| 3 | **DBW** | Delivery by WB | `boxDelivery*` |
| 5 | **C&C** | Click & Collect | N/A |
| 6 | **EDBS** | Express DBS | N/A |

---

## 3. BoxRates Interface (Tariffs)

### SDK Type Definition

```typescript
/**
 * Ответ getTariffsBox()
 */
export interface TariffsBoxResponse {
  response?: {
    data?: ModelsWarehousesBoxRates;
  };
}

export interface ModelsWarehousesBoxRates {
  /** Дата начала следующего тарифа */
  dtNextBox?: string;               // "2026-02-01"

  /** Дата окончания текущего тарифа */
  dtTillMax?: string;               // "2026-01-31"

  /** Список тарифов по складам */
  warehouseList?: ModelsWarehouseBoxRates[];
}

/**
 * Тарифы для одного склада
 */
export interface ModelsWarehouseBoxRates {
  /** Название склада (ключ для matching) */
  warehouseName?: string;           // "Коледино"

  /** Регион (ФО или страна) */
  geoName?: string;                 // "Центральный ФО"

  // ═══════════════════════════════════════════════════════════════
  // FBO ТАРИФЫ (товар на складе WB)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Логистика FBO: базовая ставка за первый литр, ₽
   * @type string — ВНИМАНИЕ: SDK возвращает строку!
   */
  boxDeliveryBase?: string;         // "46"

  /**
   * Логистика FBO: дополнительный литр, ₽
   */
  boxDeliveryLiter?: string;        // "14"

  /**
   * Коэффициент логистики FBO, %
   * ВАЖНО: "125" означает ×1.25, нужно делить на 100!
   * Комментарий SDK: "Уже учтён в тарифах"
   */
  boxDeliveryCoefExpr?: string;     // "100", "125", "150"

  // ═══════════════════════════════════════════════════════════════
  // FBS ТАРИФЫ (товар на складе продавца)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Логистика FBS: базовая ставка за первый литр, ₽
   */
  boxDeliveryMarketplaceBase?: string;    // "50"

  /**
   * Логистика FBS: дополнительный литр, ₽
   */
  boxDeliveryMarketplaceLiter?: string;   // "16"

  /**
   * Коэффициент логистики FBS, %
   */
  boxDeliveryMarketplaceCoefExpr?: string; // "120"

  // ═══════════════════════════════════════════════════════════════
  // ХРАНЕНИЕ
  // ═══════════════════════════════════════════════════════════════

  /**
   * Хранение: базовая ставка за первый литр в день, ₽
   */
  boxStorageBase?: string;          // "0.07"

  /**
   * Хранение: дополнительный литр в день, ₽
   */
  boxStorageLiter?: string;         // "0.05"

  /**
   * Коэффициент хранения, %
   * "80" = ×0.80 (скидка), "150" = ×1.50 (наценка)
   */
  boxStorageCoefExpr?: string;      // "100", "80", "150"
}
```

### Example Raw SDK Response

```json
{
  "response": {
    "data": {
      "dtNextBox": "2026-02-01",
      "dtTillMax": "2026-01-31",
      "warehouseList": [
        {
          "warehouseName": "Коледино",
          "geoName": "Центральный ФО",
          "boxDeliveryBase": "46",
          "boxDeliveryLiter": "14",
          "boxDeliveryCoefExpr": "100",
          "boxDeliveryMarketplaceBase": "50",
          "boxDeliveryMarketplaceLiter": "16",
          "boxDeliveryMarketplaceCoefExpr": "120",
          "boxStorageBase": "0.07",
          "boxStorageLiter": "0.05",
          "boxStorageCoefExpr": "100"
        },
        {
          "warehouseName": "Хабаровск",
          "geoName": "Дальневосточный ФО",
          "boxDeliveryBase": "46",
          "boxDeliveryLiter": "14",
          "boxDeliveryCoefExpr": "150",
          "boxDeliveryMarketplaceBase": "50",
          "boxDeliveryMarketplaceLiter": "16",
          "boxDeliveryMarketplaceCoefExpr": "180",
          "boxStorageBase": "0.07",
          "boxStorageLiter": "0.05",
          "boxStorageCoefExpr": "80"
        }
      ]
    }
  }
}
```

---

## 4. PalletRates Interface (КГТ)

### SDK Type Definition

```typescript
/**
 * Тарифы для монопаллет (КГТ товары)
 * Method: sdk.tariffs.getTariffsPallet({ date })
 */
export interface ModelsWarehousePalletRates {
  /** Название склада */
  warehouseName?: string;

  // ДОСТАВКА
  /** Доставка: первый литр, ₽ */
  palletDeliveryValueBase?: string;

  /** Доставка: дополнительный литр, ₽ */
  palletDeliveryValueLiter?: string;

  /** Коэффициент доставки, % */
  palletDeliveryExpr?: string;

  // ХРАНЕНИЕ
  /** Хранение монопаллеты, ₽/день */
  palletStorageValueExpr?: string;

  /** Коэффициент хранения, % */
  palletStorageExpr?: string;
}
```

### When to Use Pallet Tariffs

```typescript
// Определение типа тарифа по габаритам
function getTariffType(dimensions: { l: number; w: number; h: number }): 'box' | 'pallet' {
  const maxDimension = Math.max(dimensions.l, dimensions.w, dimensions.h);

  // КГТ: любое измерение > 120 см
  if (maxDimension > 120) {
    return 'pallet';
  }

  return 'box';
}
```

---

## 5. Data Transformations

### 5.1 String to Number

**SDK возвращает ВСЕ числовые значения как строки!**

```typescript
// Трансформация
function parseNumericField(value: string | undefined, defaultValue = 0): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Примеры
parseNumericField("46")      // → 46
parseNumericField("0.07")    // → 0.07
parseNumericField("")        // → 0
parseNumericField(undefined) // → 0
```

### 5.2 Coefficient Conversion

**Коэффициенты в SDK — это проценты как целые числа!**

```typescript
// SDK: "125" означает 125% = ×1.25
function parseCoefficient(value: string | undefined): number {
  const parsed = parseFloat(value || '100');
  return isNaN(parsed) ? 1.0 : parsed / 100;
}

// Примеры
parseCoefficient("100")  // → 1.0  (без изменений)
parseCoefficient("125")  // → 1.25 (наценка 25%)
parseCoefficient("80")   // → 0.8  (скидка 20%)
parseCoefficient("150")  // → 1.5  (наценка 50%)
```

### 5.3 Cargo Type Mapping

```typescript
const CARGO_TYPE_MAP: Record<number, string> = {
  1: 'MGT',   // Малогабарит
  2: 'SGT',   // Сверхгабарит
  3: 'KGT',   // Крупногабарит
};

const CARGO_TYPE_LABELS: Record<string, string> = {
  'MGT': 'Малогабаритный товар (до 60×60×60 см)',
  'SGT': 'Сверхгабаритный товар (до 120×80×80 см)',
  'KGT': 'Крупногабаритный товар (более 120 см)',
};
```

### 5.4 Delivery Type Mapping

```typescript
const DELIVERY_TYPE_MAP: Record<number, string> = {
  1: 'FBS',   // Fulfillment by Seller
  2: 'DBS',   // Delivery by Seller
  3: 'DBW',   // Delivery by WB
  5: 'CC',    // Click & Collect
  6: 'EDBS',  // Express DBS
};

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  'FBS':  'FBS — Со склада WB',
  'DBS':  'DBS — Доставка продавцом',
  'DBW':  'DBW — Курьер WB',
  'CC':   'C&C — Самовывоз',
  'EDBS': 'EDBS — Экспресс продавца',
};
```

### 5.5 Complete Transform Function

```typescript
interface TransformedWarehouse {
  id: number;
  name: string;
  city: string;
  federalDistrict: string | null;
  coordinates: { lat: number; lon: number };
  cargoType: 'MGT' | 'SGT' | 'KGT';
  deliveryTypes: string[];
  tariffs: TransformedTariffs | null;
}

interface TransformedTariffs {
  fbo: {
    deliveryBaseRub: number;
    deliveryLiterRub: number;
    logisticsCoefficient: number;
  };
  fbs: {
    deliveryBaseRub: number;
    deliveryLiterRub: number;
    logisticsCoefficient: number;
  };
  storage: {
    basePerDayRub: number;
    literPerDayRub: number;
    coefficient: number;
  };
  effectiveFrom: string;
  effectiveUntil: string;
}

function transformBoxTariff(raw: ModelsWarehouseBoxRates): TransformedTariffs {
  return {
    fbo: {
      deliveryBaseRub: parseNumericField(raw.boxDeliveryBase),
      deliveryLiterRub: parseNumericField(raw.boxDeliveryLiter),
      logisticsCoefficient: parseCoefficient(raw.boxDeliveryCoefExpr),
    },
    fbs: {
      deliveryBaseRub: parseNumericField(raw.boxDeliveryMarketplaceBase),
      deliveryLiterRub: parseNumericField(raw.boxDeliveryMarketplaceLiter),
      logisticsCoefficient: parseCoefficient(raw.boxDeliveryMarketplaceCoefExpr),
    },
    storage: {
      basePerDayRub: parseNumericField(raw.boxStorageBase),
      literPerDayRub: parseNumericField(raw.boxStorageLiter),
      coefficient: parseCoefficient(raw.boxStorageCoefExpr),
    },
    effectiveFrom: raw.dtNextBox || '',
    effectiveUntil: raw.dtTillMax || '',
  };
}
```

---

## 6. Matching Strategy

### Problem Statement

SDK возвращает данные из разных источников:
- `offices()` → `Office.name`
- `getTariffsBox()` → `BoxRates.warehouseName`

Эти названия **должны совпадать**, но возможны расхождения.

### Matching Algorithm

```typescript
/**
 * Нормализация названия склада для matching
 */
function normalizeWarehouseName(name: string | undefined): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // множественные пробелы → один
    .replace(/[^\wа-яё\s-]/gi, '')  // убрать спецсимволы кроме дефиса
    .replace(/\s*-\s*/g, '-');      // нормализовать дефисы
}

/**
 * Поиск тарифа для склада
 */
function findMatchingTariff(
  office: Office,
  tariffs: ModelsWarehouseBoxRates[]
): ModelsWarehouseBoxRates | null {

  const officeName = normalizeWarehouseName(office.name);

  // 1. Exact match (после нормализации)
  let match = tariffs.find(t =>
    normalizeWarehouseName(t.warehouseName) === officeName
  );

  if (match) return match;

  // 2. Contains match (один содержит другой)
  match = tariffs.find(t => {
    const tariffName = normalizeWarehouseName(t.warehouseName);
    return tariffName.includes(officeName) || officeName.includes(tariffName);
  });

  if (match) return match;

  // 3. Начинается с (для случаев "Коледино" vs "Коледино WB")
  match = tariffs.find(t => {
    const tariffName = normalizeWarehouseName(t.warehouseName);
    return tariffName.startsWith(officeName) || officeName.startsWith(tariffName);
  });

  return match || null;
}
```

### Known Matching Issues

| Office.name | BoxRates.warehouseName | Issue | Solution |
|-------------|------------------------|-------|----------|
| "Коледино" | "Коледино" | ✅ Exact | — |
| "Коледино " | "Коледино" | Trailing space | `trim()` |
| "коледино" | "Коледино" | Case | `toLowerCase()` |
| "Коледино WB" | "Коледино" | Suffix | Contains match |
| "Склад Коледино" | "Коледино" | Prefix | Contains match |

### Logging Unmatched

```typescript
// Логировать склады без тарифов для диагностики
const unmatchedWarehouses = offices.filter(o => !findMatchingTariff(o, tariffs));

if (unmatchedWarehouses.length > 0) {
  console.warn('Warehouses without tariffs:', unmatchedWarehouses.map(o => o.name));
}
```

---

## 7. Formulas & Calculations

### 7.1 Logistics Cost (Прямая логистика)

**WB Official Formula:**
```
logistics_cost = (base_rate + (volume - 1) * per_liter_rate) * coefficient
```

**Implementation:**
```typescript
interface LogisticsInput {
  volumeLiters: number;      // Объём товара в литрах
  deliveryBaseRub: number;   // Базовая ставка (первый литр)
  deliveryLiterRub: number;  // Ставка за доп. литр
  coefficient: number;       // Региональный коэффициент (1.0 = 100%)
}

function calculateLogisticsCost(input: LogisticsInput): number {
  const { volumeLiters, deliveryBaseRub, deliveryLiterRub, coefficient } = input;

  // Минимум 1 литр
  const volume = Math.max(volumeLiters, 1);

  // Базовая стоимость + дополнительные литры
  const baseCost = deliveryBaseRub + Math.max(0, volume - 1) * deliveryLiterRub;

  // Применяем коэффициент
  return baseCost * coefficient;
}

// Пример: Коледино, 2.5 литра, FBO
calculateLogisticsCost({
  volumeLiters: 2.5,
  deliveryBaseRub: 46,      // boxDeliveryBase
  deliveryLiterRub: 14,     // boxDeliveryLiter
  coefficient: 1.0,         // boxDeliveryCoefExpr / 100
});
// = (46 + 1.5 * 14) * 1.0 = 67 ₽

// Пример: Хабаровск, 2.5 литра, FBO (коэфф 1.5)
calculateLogisticsCost({
  volumeLiters: 2.5,
  deliveryBaseRub: 46,
  deliveryLiterRub: 14,
  coefficient: 1.5,
});
// = (46 + 1.5 * 14) * 1.5 = 100.5 ₽
```

### 7.2 Storage Cost (Хранение)

**WB Official Formula:**
```
storage_per_day = (base_rate + (volume - 1) * per_liter_rate) * coefficient
total_storage = storage_per_day * days
```

**Implementation:**
```typescript
interface StorageInput {
  volumeLiters: number;
  storageBaseRub: number;     // boxStorageBase
  storageLiterRub: number;    // boxStorageLiter
  coefficient: number;        // boxStorageCoefExpr / 100
  days: number;               // Дней хранения
}

function calculateStorageCost(input: StorageInput): number {
  const { volumeLiters, storageBaseRub, storageLiterRub, coefficient, days } = input;

  const volume = Math.max(volumeLiters, 1);

  // Стоимость хранения за 1 день
  const dailyCost = (storageBaseRub + Math.max(0, volume - 1) * storageLiterRub) * coefficient;

  return dailyCost * days;
}

// Пример: Коледино, 2.5 литра, 30 дней
calculateStorageCost({
  volumeLiters: 2.5,
  storageBaseRub: 0.07,
  storageLiterRub: 0.05,
  coefficient: 1.0,
  days: 30,
});
// = (0.07 + 1.5 * 0.05) * 1.0 * 30 = 4.35 ₽

// Пример: Хабаровск, 2.5 литра, 30 дней (коэфф 0.8 — скидка!)
calculateStorageCost({
  volumeLiters: 2.5,
  storageBaseRub: 0.07,
  storageLiterRub: 0.05,
  coefficient: 0.8,
  days: 30,
});
// = (0.07 + 1.5 * 0.05) * 0.8 * 30 = 3.48 ₽
```

### 7.3 Return Logistics (Обратная логистика)

**With Buyback Rate:**
```typescript
interface ReturnLogisticsInput {
  logisticsForwardRub: number;  // Прямая логистика
  buybackPct: number;           // % выкупа (0-100)
}

function calculateEffectiveReturnLogistics(input: ReturnLogisticsInput): number {
  const { logisticsForwardRub, buybackPct } = input;

  // Вероятность возврата
  const returnRate = (100 - buybackPct) / 100;

  // Обратная логистика применяется только к возвратам
  // Упрощённо: обратная ≈ прямая (в реальности может отличаться)
  return logisticsForwardRub * returnRate;
}

// Пример: логистика 67₽, выкуп 98%
calculateEffectiveReturnLogistics({
  logisticsForwardRub: 67,
  buybackPct: 98,
});
// = 67 * 0.02 = 1.34 ₽ (средние затраты на возврат)
```

### 7.4 Volume Calculation

**From Dimensions:**
```typescript
interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

function calculateVolumeLiters(dimensions: Dimensions): number {
  const { lengthCm, widthCm, heightCm } = dimensions;

  // Объём в см³
  const volumeCm3 = lengthCm * widthCm * heightCm;

  // Конвертация в литры (1 литр = 1000 см³)
  return volumeCm3 / 1000;
}

// Пример: 30×20×15 см
calculateVolumeLiters({ lengthCm: 30, widthCm: 20, heightCm: 15 });
// = 9000 / 1000 = 9 литров
```

---

## 8. Frontend Integration Guide

### 8.1 TypeScript Types (Frontend)

```typescript
// src/types/warehouses-tariffs.ts

export interface Warehouse {
  id: number;
  name: string;
  city: string;
  federalDistrict: string | null;
  coordinates: {
    lat: number;
    lon: number;
  };
  cargoType: 'MGT' | 'SGT' | 'KGT';
  deliveryTypes: ('FBS' | 'DBS' | 'DBW' | 'CC' | 'EDBS')[];
  tariffs: WarehouseTariffs | null;
}

export interface WarehouseTariffs {
  fbo: LogisticsTariff;
  fbs: LogisticsTariff;
  storage: StorageTariff;
  effectiveFrom: string;
  effectiveUntil: string;
}

export interface LogisticsTariff {
  deliveryBaseRub: number;
  deliveryLiterRub: number;
  logisticsCoefficient: number;
}

export interface StorageTariff {
  basePerDayRub: number;
  literPerDayRub: number;
  coefficient: number;
}

export interface WarehousesResponse {
  data: {
    warehouses: Warehouse[];
    meta: {
      totalWarehouses: number;
      withTariffs: number;
      withoutTariffs: number;
      tariffDate: string;
      fetchedAt: string;
      cacheTtlSeconds: number;
    };
  };
}
```

### 8.2 API Client

```typescript
// src/lib/api/warehouses-tariffs.ts

import { apiClient } from '@/lib/api-client';
import type { WarehousesResponse } from '@/types/warehouses-tariffs';

export async function getWarehousesWithTariffs(
  date?: string
): Promise<WarehousesResponse> {
  const params = date ? { date } : {};
  return apiClient.get('/v1/tariffs/warehouses-with-tariffs', { params });
}
```

### 8.3 React Query Hook

```typescript
// src/hooks/useWarehousesTariffs.ts

import { useQuery } from '@tanstack/react-query';
import { getWarehousesWithTariffs } from '@/lib/api/warehouses-tariffs';

export const warehousesQueryKeys = {
  all: ['warehouses'] as const,
  withTariffs: (date?: string) => [...warehousesQueryKeys.all, 'tariffs', date] as const,
};

export function useWarehousesWithTariffs(date?: string) {
  return useQuery({
    queryKey: warehousesQueryKeys.withTariffs(date),
    queryFn: () => getWarehousesWithTariffs(date),
    staleTime: 60 * 60 * 1000, // 1 hour (matches backend cache)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
```

### 8.4 Calculation Hooks

```typescript
// src/hooks/useLogisticsCalculation.ts

import { useMemo } from 'react';
import type { WarehouseTariffs } from '@/types/warehouses-tariffs';

interface LogisticsParams {
  volumeLiters: number;
  tariffs: WarehouseTariffs | null;
  deliveryType: 'fbo' | 'fbs';
}

export function useLogisticsCalculation(params: LogisticsParams) {
  return useMemo(() => {
    const { volumeLiters, tariffs, deliveryType } = params;

    if (!tariffs) {
      return { cost: null, breakdown: null };
    }

    const tariff = tariffs[deliveryType];
    const volume = Math.max(volumeLiters, 1);
    const baseCost = tariff.deliveryBaseRub + Math.max(0, volume - 1) * tariff.deliveryLiterRub;
    const totalCost = baseCost * tariff.logisticsCoefficient;

    return {
      cost: totalCost,
      breakdown: {
        baseRub: tariff.deliveryBaseRub,
        additionalLitersRub: Math.max(0, volume - 1) * tariff.deliveryLiterRub,
        coefficient: tariff.logisticsCoefficient,
        total: totalCost,
      },
    };
  }, [params.volumeLiters, params.tariffs, params.deliveryType]);
}
```

---

## 9. API Contract

### Expected Backend Endpoint

```
GET /v1/tariffs/warehouses-with-tariffs
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | ISO date string | No | today | Дата для тарифов |
| `cargo_type` | `MGT\|SGT\|KGT` | No | all | Фильтр по типу груза |
| `refresh` | boolean | No | false | Принудительное обновление кэша |

### Response Format

See [Section 8.1](#81-typescript-types-frontend) for full TypeScript types.

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_DATE` | Неверный формат даты |
| 401 | `UNAUTHORIZED` | Нет токена |
| 403 | `FORBIDDEN` | Нет доступа к кабинету |
| 429 | `RATE_LIMIT_EXCEEDED` | Превышен лимит запросов |
| 502 | `WB_API_ERROR` | Ошибка WB API |

---

## 10. Known Issues & Edge Cases

### 10.1 Missing Tariffs

**Issue:** Некоторые склады могут не иметь тарифов в ответе `getTariffsBox()`.

**Handling:**
```typescript
if (!warehouse.tariffs) {
  // Показать предупреждение и включить ручной ввод
  showWarning(`Тарифы для склада "${warehouse.name}" недоступны. Введите вручную.`);
}
```

### 10.2 Coefficient Interpretation

**Issue:** SDK комментарий: "Коэффициент уже учтён в тарифах" — неоднозначно.

**Recommendation:** Ожидаем уточнения от Backend. Текущая интерпретация:
- Базовые ставки — чистые значения
- Коэффициент — множитель региона

### 10.3 Date Parameter

**Issue:** Тарифы имеют период действия (`dtNextBox`, `dtTillMax`).

**Handling:**
- Кэшировать с учётом `effective_until`
- Автоматически инвалидировать кэш при смене периода

### 10.4 New Warehouses

**Issue:** WB может добавить новые склады, для которых нет matching в тарифах.

**Handling:**
- Включить в meta поле `withoutTariffs`
- Frontend показывает такие склады с пометкой "Тарифы уточняются"

---

## References

- **Request #98**: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`
- **Backend Response Draft**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE-DRAFT.md`
- **WB Tariffs Documentation**: https://seller.wildberries.ru/dynamic-product-categories/tariffs/logistics
- **WB API Reference**: https://dev.wildberries.ru/openapi/wb-tariffs

---

**Last Updated**: 2026-01-19
