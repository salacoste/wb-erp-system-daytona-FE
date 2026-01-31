# Story: Standardize null vs undefined Usage Across Dashboard Components

**Epic**: 61-FE Dashboard Data Integration
**Status**: 📋 Ready for Dev
**Priority**: P2 (Medium)
**Estimate**: 5 SP

---

## Title

Стандартизировать использование null и undefined для обозначения отсутствующих данных

---

## Problem Statement

В коде Dashboard неконсистентно используются `null` и `undefined` для обозначения отсутствующих данных. Это создает проблемы с предсказуемостью поведения и может приводить к ошибкам.

### Примеры проблемы

**В DashboardContent.tsx (строки 107-119):**

```typescript
// previousPeriodData использует null:
const previousPeriodData = useMemo<PreviousPeriodData | undefined>(() => {
  return {
    ordersAmount: ordersQuery.previous?.totalAmount ?? null,
    ordersCogs: null,          // null для отсутствующих данных
    salesAmount: null,         // null
    salesCogs: null,           // null
    advertisingSpend: advertisingQuery.previous?.summary?.total_spend ?? null,
    logisticsCost: null,
    storageCost: null,
    theoreticalProfit: null,
  }
}, [ordersQuery.previous, advertisingQuery.previous])
```

**В DashboardMetricsGrid.tsx (строки 47-67):**

```typescript
export interface DashboardMetricsGridProps {
  ordersAmount: number | undefined      // undefined в props
  ordersCount: number | undefined       // undefined в props
  ordersCogs: number | undefined        // undefined в props
  salesAmount: number | undefined       // undefined в props
  // ...
}
```

**В DashboardContent.tsx (строки 164-183):**

```typescript
<DashboardMetricsGrid
  ordersAmount={ordersQuery.current?.totalAmount}     // может быть undefined
  ordersCount={ordersQuery.current?.totalOrders}      // может быть undefined
  ordersCogs={ordersCogs.data?.cogsTotal}             // может быть undefined
  salesAmount={undefined}                              // явно undefined
  salesCogs={undefined}                                // явно undefined
  // ...
/>
```

### Почему это проблема

| Проверка | `null` | `undefined` | `0` | `""` |
|----------|--------|-------------|-----|------|
| `value == null` | ✅ true | ✅ true | false | false |
| `value === null` | ✅ true | ❌ false | false | false |
| `value === undefined` | ❌ false | ✅ true | false | false |
| `!value` | ✅ true | ✅ true | ✅ true | ✅ true |
| `value ?? default` | ✅ default | ✅ default | 0 | "" |

**Риски:**
1. Разработчики могут использовать `=== null` и пропустить `undefined` значения
2. TypeScript типы становятся несогласованными (`T | null` vs `T | undefined`)
3. Разные компоненты могут по-разному обрабатывать отсутствующие данные
4. Усложняется code review и понимание кода

---

## Рекомендация: Использовать `null`

**Обоснование:**
1. `null` — явное указание на "отсутствие значения" (intentional absence)
2. `undefined` — означает "значение не было присвоено" (uninitialized)
3. JSON не поддерживает `undefined`, API возвращает `null`
4. `null` более явно в JavaScript/TypeScript семантике
5. Соответствует паттернам в `src/types/*.ts` (200+ случаев `| null`)

---

## Acceptance Criteria

- [ ] **AC1**: Определить стандарт: `null` для отсутствующих данных
- [ ] **AC2**: Обновить `DashboardMetricsGridProps` — использовать `| null` вместо `| undefined`
- [ ] **AC3**: Обновить `PreviousPeriodData` — оставить `| null` (уже правильно)
- [ ] **AC4**: Обновить `DashboardContent.tsx` — использовать `null` вместо `undefined`
- [ ] **AC5**: Проверить и обновить все Dashboard-компоненты
- [ ] **AC6**: Добавить ESLint правило для предотвращения `| undefined` в типах данных
- [ ] **AC7**: Обновить документацию с конвенцией
- [ ] **AC8**: Все существующие тесты проходят
- [ ] **AC9**: Нет регрессий в UI

---

## Technical Implementation

### 1. Обновить типы в DashboardMetricsGrid.tsx

```typescript
// BEFORE
export interface DashboardMetricsGridProps {
  ordersAmount: number | undefined
  ordersCount: number | undefined
  ordersCogs: number | undefined
  salesAmount: number | undefined
  salesCogs: number | undefined
  advertisingSpend: number | undefined
  logisticsCost: number | undefined
  storageCost: number | undefined
  revenueTotal: number | undefined
  theoreticalProfit: TheoreticalProfitResult | undefined
  // ...
}

// AFTER
export interface DashboardMetricsGridProps {
  ordersAmount: number | null
  ordersCount: number | null
  ordersCogs: number | null
  salesAmount: number | null
  salesCogs: number | null
  advertisingSpend: number | null
  logisticsCost: number | null
  storageCost: number | null
  revenueTotal: number | null
  theoreticalProfit: TheoreticalProfitResult | null
  // ...
}
```

### 2. Обновить DashboardContent.tsx

```typescript
// BEFORE
<DashboardMetricsGrid
  ordersAmount={ordersQuery.current?.totalAmount}
  salesAmount={undefined}  // ❌ undefined
  salesCogs={undefined}    // ❌ undefined
  // ...
/>

// AFTER
<DashboardMetricsGrid
  ordersAmount={ordersQuery.current?.totalAmount ?? null}
  salesAmount={null}       // ✅ null
  salesCogs={null}         // ✅ null
  // ...
/>
```

### 3. Обновить проверки в компонентах

```typescript
// BEFORE (может пропустить null)
if (value === undefined) {
  return <Loading />
}

// AFTER (ловит и null, и undefined)
if (value == null) {
  return <Loading />
}

// ИЛИ более явно:
if (value === null) {
  return <Loading />
}
```

### 4. Создать ESLint правило

```javascript
// .eslintrc.js (или eslint.config.js)
{
  rules: {
    // Запретить `| undefined` в типах данных API
    '@typescript-eslint/no-invalid-void-type': 'off',
    // Использовать кастомное правило или плагин
  }
}
```

### 5. Документировать конвенцию

Добавить в `CLAUDE.md` раздел:

```markdown
## Null vs Undefined Convention

**Standard**: Use `null` for missing data values.

| Context | Use | Example |
|---------|-----|---------|
| Missing API data | `null` | `revenue: number \| null` |
| Optional props | `undefined` | `className?: string` |
| Optional params | `undefined` | `function foo(bar?: string)` |
| Uninitialized state | `undefined` | `const [data, setData] = useState<T>()` |

**Rationale**:
- `null` is explicit "no value"
- JSON APIs return `null`, not `undefined`
- Consistent with existing types in `src/types/*.ts`
```

---

## Files to Check and Update

### Critical (Direct Dashboard)

| File | Current Issue | Fix |
|------|---------------|-----|
| `src/components/custom/dashboard/DashboardMetricsGrid.tsx` | Props use `\| undefined` | Change to `\| null` |
| `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` | Mixes null and undefined | Standardize to null |

### Types

| File | Lines to Check |
|------|----------------|
| `src/types/api.ts` | Already uses `\| null` ✅ |
| `src/types/analytics.ts` | Already uses `\| null` ✅ |
| `src/types/daily-metrics.ts` | Uses required numbers |
| `src/types/orders-volume.ts` | Check for consistency |
| `src/types/orders-cogs.ts` | Check for consistency |

### Dashboard Components

| File | Check |
|------|-------|
| `src/components/custom/dashboard/OrdersMetricCard.tsx` | Props nullability |
| `src/components/custom/dashboard/OrdersCogsMetricCard.tsx` | Props nullability |
| `src/components/custom/dashboard/TheoreticalProfitCard.tsx` | Props nullability |
| `src/components/custom/dashboard/AdvertisingMetricCard.tsx` | Props nullability |
| `src/components/custom/dashboard/LogisticsMetricCard.tsx` | Props nullability |
| `src/components/custom/dashboard/StorageMetricCard.tsx` | Props nullability |
| `src/components/custom/dashboard/SalesMetricCard.tsx` | Props nullability |
| `src/components/custom/dashboard/SalesCogsMetricCard.tsx` | Props nullability |
| `src/components/custom/dashboard/PlaceholderMetricCard.tsx` | Props nullability |

### Hooks

| File | Check |
|------|-------|
| `src/hooks/useOrdersVolume.ts` | Return type nullability |
| `src/hooks/useOrdersCogs.ts` | Return type nullability |
| `src/hooks/useFinancialSummary.ts` | Return type nullability |
| `src/hooks/useAdvertisingAnalytics.ts` | Return type nullability |
| `src/hooks/useDailyMetrics.ts` | Return type nullability |

---

## Testing Checklist

- [ ] All existing unit tests pass
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Dashboard renders correctly with null values
- [ ] Dashboard renders correctly with valid values
- [ ] Loading states work correctly
- [ ] Error states work correctly
- [ ] No TypeScript errors after changes

---

## Definition of Done

- [ ] `null` стандартизирован для отсутствующих данных во всех Dashboard-компонентах
- [ ] TypeScript компилируется без ошибок
- [ ] Все unit-тесты проходят
- [ ] Все E2E-тесты проходят
- [ ] Документация обновлена
- [ ] Code review approved

---

## Impact Analysis

### Low Risk
- Изменение типов не влияет на runtime поведение
- `??` оператор работает одинаково для null и undefined
- Большинство проверок уже используют `== null`

### Medium Risk
- Компоненты, использующие `=== undefined`, потребуют обновления
- Возможны TypeScript ошибки после изменения типов

### Mitigation
- Делать изменения постепенно, файл за файлом
- Запускать тесты после каждого изменения
- Использовать TypeScript для обнаружения несовместимостей

---

## References

- Research: Code analysis (2026-01-31)
- Related: All Dashboard stories in Epic 61-FE, 62-FE, 63-FE
- TypeScript Handbook: [Null and Undefined](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing)
