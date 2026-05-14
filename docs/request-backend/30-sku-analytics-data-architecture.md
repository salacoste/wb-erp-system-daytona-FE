# Guide #30: SKU Analytics Data Architecture & UNKNOWN nm_id Handling

**Date**: 2025-11-28
**Type**: 📊 **TECHNICAL GUIDE**
**Component**: Backend Analytics + Frontend Display

---

## Executive Summary

Документация архитектуры данных для SKU-аналитики, включая:
- Обработку строк без артикула (nm_id = 'UNKNOWN')
- Формулу маржи по SKU и её ограничения
- Схему распределения данных из WB Excel

---

## SKU Margin Formula

### Формула расчёта

```
Маржа по SKU = (Выручка - Себестоимость) / Выручка × 100%
```

### Важное ограничение

⚠️ **Маржа по SKU НЕ включает операционные расходы:**
- Логистика (доставка, возврат)
- Хранение на складе WB
- Штрафы и удержания
- Платная приёмка

**Операционные расходы вычитаются на уровне недельного `payout_total`**, а не на уровне отдельных товаров.

### UI Recommendation

Показывать пользователю пояснение в Info Banner:

```
Формула расчёта: Маржа % = (Выручка - Себестоимость) / Выручка × 100%
⚠️ Не включает операционные расходы (логистика, хранение, штрафы) —
   они вычитаются на уровне недельной сводки payout_total
```

---

## Data Flow: WB Excel → Analytics

### Схема распределения данных

```
                        WB Excel Report
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
      qty=1 (Product)   qty=0 (Service)  qty=2 (Transport)
      nm_id = артикул   nm_id = UNKNOWN  nm_id = UNKNOWN
             │               │               │
             ▼               ▼               ▼
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │ SKU Analytics│  │ Excluded     │  │ Informational│
      │ ✅ включено  │  │ from SKU     │  │ KPI only     │
      └──────────────┘  └──────────────┘  └──────────────┘
             │               │               │
             └───────────────┼───────────────┘
                             ▼
                    weekly_payout_summary
                   (все строки включены)
```

### Категории строк

| qty | nm_id | Тип операции | SKU Analytics | Payout Total |
|-----|-------|--------------|---------------|--------------|
| 1 | артикул | Продажа/Возврат товара | ✅ Включено | ✅ Включено |
| 0 | UNKNOWN | Сервисные услуги | ❌ Исключено | ✅ Включено |
| 2 | UNKNOWN | Возмещение перевозки | ❌ Исключено | ✅ (как KPI) |

---

## UNKNOWN nm_id: Что это?

### Источник

Строки без артикула появляются при импорте WB Excel файлов. Парсер (`row-classifier.service.ts`) устанавливает `nm_id = 'UNKNOWN'` когда:

```typescript
const nmId = this.extractField(row, 'nm_id', columnMapping) || 'UNKNOWN';
```

### Типы сервисных операций (UNKNOWN)

| Тип операции | Примерное кол-во | Финансовое влияние |
|--------------|------------------|-------------------|
| Возмещение издержек по перевозке | ~13,500 | +46,725₽ к выплате |
| Возмещение за выдачу/возврат на ПВЗ | ~6,300 | Информационный KPI |
| Хранение (общее по складу) | ~100 | -45,487₽ удержание |
| Удержания | ~30 | Переменная сумма |
| Штрафы (административные) | ~2 | -10,000₽ удержание |

### Важно

- **net_for_pay = 0** для всех UNKNOWN строк
- **gross = 0** для всех UNKNOWN строк
- Финансовые суммы находятся в специфичных колонках (transport_reimbursement, storage, penalties)

---

## Backend Filter Implementation

### SQL Filter в by-sku endpoint

```sql
SELECT ...
FROM wb_finance_raw
WHERE cabinet_id = ${cabinetId}::uuid
  AND sale_dt >= ${dateFrom}
  AND sale_dt <= ${dateTo}
  AND nm_id != 'UNKNOWN'  -- Exclude service rows without product ID
GROUP BY nm_id, sa_name
```

### Где реализовано

- **File**: `src/analytics/weekly-analytics.service.ts`
- **Method**: `getWeeklyBySkuData()`

---

## missing_cogs_flag Fix (2025-11-28)

### Проблема

Товары с продажами, но без назначенного COGS показывали:
- Себестоимость: 0,00₽ (вместо "Не назначена")
- Маржа: 100% (некорректно)

### Корневая причина

В `margin-calculation.service.ts` при расчёте маржи:
- `cogsUnitCostRub = null` когда COGS не назначен ✅
- `cogsRub = Decimal(0)` когда COGS не назначен ❌ (NOT NULL!)

```typescript
// margin-calculation.service.ts:105-110
const cogs = cogsBySku.get(nmId) || {
  nmId,
  unitCostRub: null,        // ← NULL когда нет COGS
  cogsRub: new Decimal(0),  // ← Decimal(0), NOT NULL!
  missingCogsUnits: revenue.quantitySold,
};
```

### Исправление

Проверять `cogsUnitCostRub` (который реально NULL) вместо `cogsRub`:

```typescript
// weekly-analytics.service.ts:438
// НЕПРАВИЛЬНО: cogsRub всегда 0 или больше (не NULL)
const hasCogs = margin.cogsRub !== null; // ❌ всегда true!

// ПРАВИЛЬНО: cogsUnitCostRub реально NULL когда COGS не назначен
const hasCogs = margin.cogsUnitCostRub !== null; // ✅
```

### Статистика после исправления (W46)

```
Total products: 17
NULL cogs_unit_cost_rub (COGS NOT assigned): 10 → missing_cogs_flag=true
HAS cogs_unit_cost_rub (COGS IS assigned): 7 → missing_cogs_flag=false
```

### Таблица поведения

| Ситуация | cogs_unit_cost_rub | missing_cogs_flag | UI показывает |
|----------|-------------------|-------------------|---------------|
| COGS назначен (> 0₽) | число | `false` | Значение COGS |
| COGS назначен (= 0₽) | 0 | `false` | 0,00₽ |
| COGS не назначен | `null` | `true` | "Не назначена" |

### Затронутые файлы

1. **`src/analytics/weekly-analytics.service.ts:415-438`**
   - Single-week query: добавлен `cogsUnitCostRub` в select
   - Проверка `margin.cogsUnitCostRub !== null`

2. **`src/analytics/weekly-analytics.service.ts:1771-1775`**
   - Date range query: используется `weeks_with_cogs > 0`
   - `weeks_with_cogs` считает недели с `cogs_rub > 0`

---

## Related Documentation

- [Guide #24: Margin & COGS Integration](./24-margin-cogs-integration-guide.md)
- [Guide #29: COGS Temporal Versioning](./29-cogs-temporal-versioning-and-margin-calculation.md)
- [Request #19: Margin Without COGS Fix](./19-margin-returned-without-cogs-backend.md)
- [CLAUDE.md: Row Classification Rules](../../../CLAUDE.md)

---

**Last Updated**: 2025-11-28

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-11-28
- **Summary**: Data architecture documentation for SKU analytics, covering how sales data flows through the system, row classification rules, and the relationship between COGS, margin, and analytics tables. This guide documents the data layer that underpins all SKU-level analytics endpoints.
- **Remaining frontend action**: Use this as a reference when implementing SKU-level analytics components to understand data provenance and reliability.
