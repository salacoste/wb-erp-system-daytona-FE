# План реализации расчёта стоимости приёмки (Acceptance Cost)

## Резюме проблемы

Price Calculator показывает **Приёмка: 0 ₽** потому что:
1. Базовые ставки приёмки НЕ загружаются из API
2. Коэффициент приёмки из календаря НЕ применяется к расчёту
3. Деление на units_per_package НЕ подключено (нечего делить)

## Формулы расчёта

### Приёмка для коробов (box)
```
acceptance_cost = volume_liters × acceptance_box_rate_per_liter × coefficient
acceptance_per_unit = acceptance_cost / units_per_package
```

**Пример**: 5L товар, ставка 1.7 ₽/л, коэффициент 1.2, 10 шт в коробе
- acceptance_cost = 5 × 1.7 × 1.2 = **10.20 ₽** за короб
- acceptance_per_unit = 10.20 / 10 = **1.02 ₽** за единицу

### Приёмка для паллет (pallet)
```
acceptance_cost = acceptance_pallet_rate × coefficient
acceptance_per_unit = acceptance_cost / units_per_package
```

**Пример**: ставка 500 ₽, коэффициент 1.0, 100 шт на паллете
- acceptance_cost = 500 × 1.0 = **500 ₽** за паллету
- acceptance_per_unit = 500 / 100 = **5 ₽** за единицу

---

## Источники данных

### 1. Базовые ставки приёмки
**Endpoint**: `GET /v1/tariffs/settings`
```typescript
{
  acceptance_box_rate_per_liter: 1.7,  // ₽/литр
  acceptance_pallet_rate: 500.0,       // ₽/паллета
}
```
**Hook**: `useTariffSettings()` - УЖЕ СУЩЕСТВУЕТ, но НЕ ВЫЗЫВАЕТСЯ!

### 2. Коэффициент приёмки по дате
**Endpoint**: `GET /v1/tariffs/acceptance/coefficients?warehouseId={id}`
```typescript
{
  date: "2026-01-25",
  coefficient: 1.2,        // Коэффициент приёмки
  boxTypeId: 2,            // 2=boxes, 5=pallets
}
```
**Hook**: `useAcceptanceCoefficients()` - используется для календаря

### 3. Объём товара
Уже рассчитывается: `volumeLiters = (L × W × H) / 1000`

### 4. Количество в упаковке
Уже есть в форме: `units_per_package` (1-1000)

---

## План работ

### Этап 1: Загрузка базовых ставок (useTariffSettings)

**Файл**: `src/components/custom/price-calculator/PriceCalculatorForm.tsx`

**Задача**: Добавить вызов `useTariffSettings()` в форму

```typescript
// Добавить импорт
import { useTariffSettings } from '@/hooks/useTariffSettings'

// В компоненте
const { data: tariffSettings } = useTariffSettings()
```

**Результат**: Доступны `acceptance_box_rate_per_liter` и `acceptance_pallet_rate`

---

### Этап 2: Подключение коэффициента приёмки

**Файл**: `src/components/custom/price-calculator/useWarehouseFormState.ts`

**Задача**: Добавить состояние для acceptance coefficient

```typescript
// Добавить в hook state
const [acceptanceCoefficient, setAcceptanceCoefficient] = useState(1.0)

// Обновить handleDeliveryDateChange
const handleDeliveryDateChange = useCallback(
  (date: string | null, coefficient: number) => {
    setValue('delivery_date', date)
    setAcceptanceCoefficient(coefficient)  // Сохраняем коэффициент приёмки
  },
  [setValue],
)

// Вернуть из hook
return {
  ...existing,
  acceptanceCoefficient,
}
```

---

### Этап 3: Расчёт стоимости приёмки

**Новый файл**: `src/lib/acceptance-cost-utils.ts`

```typescript
export interface AcceptanceTariff {
  boxRatePerLiter: number    // ₽/литр для коробов
  palletRate: number         // ₽ за паллету
}

export interface AcceptanceCostResult {
  totalCost: number          // Полная стоимость за упаковку
  perUnitCost: number        // Стоимость за единицу
  formula: string            // Для отображения
}

export function calculateAcceptanceCost(
  boxType: 'box' | 'pallet',
  volumeLiters: number,
  coefficient: number,
  unitsPerPackage: number,
  tariff: AcceptanceTariff
): AcceptanceCostResult {
  let totalCost: number
  let formula: string

  if (boxType === 'pallet') {
    totalCost = tariff.palletRate * coefficient
    formula = `${tariff.palletRate} ₽ × ${coefficient} = ${totalCost.toFixed(2)} ₽`
  } else {
    totalCost = volumeLiters * tariff.boxRatePerLiter * coefficient
    formula = `${volumeLiters.toFixed(1)} л × ${tariff.boxRatePerLiter} ₽/л × ${coefficient} = ${totalCost.toFixed(2)} ₽`
  }

  const perUnitCost = unitsPerPackage > 0 ? totalCost / unitsPerPackage : totalCost

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    perUnitCost: Math.round(perUnitCost * 100) / 100,
    formula,
  }
}
```

---

### Этап 4: Интеграция в форму

**Файл**: `src/components/custom/price-calculator/useWarehouseFormState.ts`

```typescript
// Добавить расчёт acceptance cost
const acceptanceCost = useMemo(() => {
  if (!tariffSettings || volumeLiters <= 0) return 0

  const result = calculateAcceptanceCost(
    boxType,
    volumeLiters,
    acceptanceCoefficient,
    unitsPerPackage,
    {
      boxRatePerLiter: tariffSettings.acceptance_box_rate_per_liter,
      palletRate: tariffSettings.acceptance_pallet_rate,
    }
  )

  return result.perUnitCost  // Возвращаем стоимость за единицу
}, [boxType, volumeLiters, acceptanceCoefficient, unitsPerPackage, tariffSettings])

// Синхронизировать с формой
useEffect(() => {
  setValue('acceptance_cost', acceptanceCost)
}, [acceptanceCost, setValue])
```

---

### Этап 5: Отображение в результатах

**Файл**: `src/components/custom/price-calculator/FixedCostsBreakdown.tsx`

Уже реализовано отображение acceptance, но показывает 0 ₽ потому что costs.acceptance = 0.

После реализации этапов 1-4, acceptance_cost будет заполняться корректно.

**Дополнительно**: Показать breakdown если units_per_package > 1:
```
└─ Приёмка                    10.20 ₽     2.4%
   (10 шт × 1.02 ₽/шт)
```

---

### Этап 6: Исправление захардкоженных значений

**Файл**: `src/lib/logistics-tariff.ts`

```typescript
// ТЕКУЩЕЕ (неверно)
export const DEFAULT_BOX_TARIFFS: BoxDeliveryTariffs = {
  baseLiterRub: 48,           // ❌ Должно быть 46
  additionalLiterRub: 5,      // ❌ Должно быть 14
  coefficient: 1.0,
}

// ИСПРАВИТЬ НА
export const DEFAULT_BOX_TARIFFS: BoxDeliveryTariffs = {
  baseLiterRub: 46,           // ✅ Из API tariff settings
  additionalLiterRub: 14,     // ✅ Из API tariff settings
  coefficient: 1.0,
}
```

---

## Порядок выполнения

| # | Задача | Файлы | Сложность |
|---|--------|-------|-----------|
| 1 | Создать `acceptance-cost-utils.ts` | Новый файл | Низкая |
| 2 | Добавить `useTariffSettings()` в форму | PriceCalculatorForm.tsx | Низкая |
| 3 | Расширить `useWarehouseFormState` | useWarehouseFormState.ts | Средняя |
| 4 | Подключить acceptance_coefficient | useWarehouseFormState.ts | Средняя |
| 5 | Синхронизировать с формой | PriceCalculatorForm.tsx | Низкая |
| 6 | Исправить DEFAULT_BOX_TARIFFS | logistics-tariff.ts | Низкая |
| 7 | Добавить per-unit display | FixedCostsBreakdown.tsx | Низкая |
| 8 | Тесты | Новые тесты | Средняя |

---

## Зависимости между задачами

```
[1] acceptance-cost-utils.ts
         ↓
[2] useTariffSettings() ──┐
         ↓               │
[3+4] useWarehouseFormState ←┘
         ↓
[5] PriceCalculatorForm (integration)
         ↓
[7] FixedCostsBreakdown (display)

[6] DEFAULT_BOX_TARIFFS (independent fix)
[8] Tests (after all)
```

---

## Ожидаемый результат

После реализации:
- Приёмка рассчитывается: `volume × rate × coefficient`
- Делится на units_per_package для стоимости за единицу
- Отображается в детализации расходов
- Коэффициент из календаря применяется к расчёту
- Базовые ставки загружаются из API (не захардкожены)

**Пример отображения** (5L товар, 10 шт в коробе, коэф 1.2):
```
ФИКСИРОВАННЫЕ ЗАТРАТЫ                    235.62 ₽
├─ Себестоимость (COGS)               111.00 ₽    25.7%
├─ Логистика (прямая)                 110.40 ₽    25.6%
├─ Логистика (возвратная эфф.)          0.00 ₽     0.0%
├─ Хранение                             3.82 ₽     0.9%
└─ Приёмка                             10.20 ₽     2.4%
   (10 шт × 1.02 ₽/шт)
```
