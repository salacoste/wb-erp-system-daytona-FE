# TDD Валидация: Интеграция UX компонентов

**Epic 60-FE: Dashboard & Analytics UX Improvements**
**Дата:** 2026-01-30
**Автор:** QR Architect / TDD Specialist

Этот документ предоставляет детальный план TDD (Test-Driven Development) для интеграции новых UX компонентов в существующую систему.

---

## Задача 1: Интеграция CogsMissingState → MetricCardEnhanced

### Контекст
Интегрировать компонент `CogsMissingState` в `MetricCardEnhanced` для отображения предупреждения когда COGS не назначены и маржа не может быть рассчитана.

**Файлы:**
- Целевой: `/src/components/custom/MetricCardEnhanced.tsx`
- Новый компонент: `/src/components/custom/CogsMissingState.tsx`
- Использование: `/src/app/(dashboard)/dashboard/components/DashboardContent.tsx:148-155`

---

### Test-First: Список тестов

#### Unit тесты (до интеграции)

**Файл:** `src/components/custom/__tests__/MetricCardEnhanced.cogs-integration.test.tsx`

```typescript
describe('Story 60.3-FE: COGS Integration', () => {
  describe('showCogsWarning prop', () => {
    // Тест 1: Базовая функциональность
    it('should render CogsMissingState when showCogsWarning=true', () => {})

    // Тест 2: Не показывать когда флаг false
    it('should not render CogsMissingState when showCogsWarning=false', () => {})

    // Тест 3: Передача пропсов покрытия
    it('should pass cogs coverage props to CogsMissingState', () => {})

    // Тест 4: Loading state
    it('should show loading skeleton for CogsMissingState when isLoading=true', () => {})
  })

  describe('conditional rendering logic', () => {
    // Тест 5: Приоритет ошибки над COGS warning
    it('should show error message instead of CogsMissingState when error exists', () => {})

    // Тест 6: Приоритет loading над COGS warning
    it('should show loading skeleton instead of CogsMissingState when isLoading=true', () => {})

    // Тест 7: Показывать warning вместо значения когда value=null
    it('should show CogsMissingState when value is null and showCogsWarning=true', () => {})

    // Тест 8: Не показывать warning когда value имеет значение
    it('should show normal value when value exists and showCogsWarning=true', () => {})
  })

  describe('props interface', () => {
    // Тест 9: Типизация новых пропсов
    it('should accept showCogsWarning prop', () => {})

    it('should accept cogsCoverage prop', () => {})

    it('should accept productsWithCogs prop', () => {})

    it('should accept totalProducts prop', () => {})

    it('should accept onAssignCogs callback prop', () => {})
  })
})
```

---

### Red Phase (ожидаемые failures)

**Что упадет ПЕРЕД интеграцией:**

| Тест | Ожидаемая ошибка | Причина |
|------|------------------|---------|
| Тест 1 | `Property 'showCogsWarning' does not exist` | Проп尚未 добавлен в интерфейс |
| Тест 2 | `Property 'showCogsWarning' does not exist` | Проп尚未 добавлен в интерфейс |
| Тест 3 | `Property 'cogsCoverage' does not exist` | Пропы COGS尚未 добавлены |
| Тест 4 | `Property 'cogsCoverage' does not exist` | Пропы COGS尚未 добавлены |
| Тест 5 | Компонент не существует | CogsMissingState еще не импортирован |
| Тест 6 | Логика не реализована | Условный рендеринг отсутствует |
| Тест 7 | Логика не реализована | Значение null обрабатывается по старому |
| Тест 8 | Логика не реализована | Значение показывается всегда |
| Тест 9+ | TypeScript errors | Интерфейс не расширен |

**Запуск тестов:**
```bash
npm test -- MetricCardEnhanced.cogs-integration.test.tsx
```

**Ожидаемый результат:** 10+ failures

---

### Green Phase (implementation)

**Шаг 1: Расширить интерфейс**
```typescript
// src/components/custom/MetricCardEnhanced.tsx

export interface MetricCardEnhancedProps {
  title: string
  value: number | null | undefined
  previousValue?: number | null
  format?: MetricFormat
  icon?: React.ComponentType<{ className?: string }>
  tooltip?: string
  isLoading?: boolean
  error?: string | null
  invertComparison?: boolean
  className?: string
  onClick?: () => void

  // NEW: COGS integration props
  showCogsWarning?: boolean
  cogsCoverage?: number
  productsWithCogs?: number
  totalProducts?: number
  onAssignCogs?: () => void
}
```

**Шаг 2: Добавить импорт**
```typescript
import { CogsMissingState } from './CogsMissingState'
```

**Шаг 3: Реализовать условный рендеринг**
```typescript
export function MetricCardEnhanced(props: MetricCardEnhancedProps): React.ReactElement {
  const {
    showCogsWarning = false,
    cogsCoverage,
    productsWithCogs,
    totalProducts,
    onAssignCogs,
    ...restProps
  } = props

  // Early return for loading state (existing logic)
  if (isLoading) {
    return <SkeletonCard />
  }

  // Show CogsMissingState when value is null and warning is enabled
  if (showCogsWarning && value === null && !error) {
    return (
      <Card>
        <CardContent className="p-4">
          <CardHeader title={title} icon={Icon} tooltip={tooltip} />
          <CogsMissingState
            productsWithCogs={productsWithCogs}
            totalProducts={totalProducts}
            coverage={cogsCoverage}
            onAssignCogs={onAssignCogs}
          />
        </CardContent>
      </Card>
    )
  }

  // Existing logic for normal/error states
  // ...
}
```

**Шаг 4: Обработать приоритеты состояний**
```typescript
// Priority order:
// 1. Loading (highest)
// 2. Error
// 3. CogsMissingState (when value=null + showCogsWarning=true)
// 4. Normal value display (lowest)
```

**Запуск тестов после реализации:**
```bash
npm test -- MetricCardEnhanced.cogs-integration.test.tsx
```

**Ожидаемый результат:** All tests pass ✅

---

### Refactor Phase

**Возможные улучшения:**

1. **Extract component** - Вынести логику warning в отдельный компонент:
   ```typescript
   function MetricCardWithWarning({ value, showWarning, warningComponent, children }) {
     if (showWarning && value === null) {
       return warningComponent
     }
     return children
   }
   ```

2. **Simplify conditions** - Использовать единый объект для COGS пропсов:
   ```typescript
   interface CogsWarningProps {
     enabled: boolean
     coverage?: number
     productsWithCogs?: number
     totalProducts?: number
     onAssignCogs?: () => void
   }
   ```

3. **Add default values** - Установить разумные defaults для undefined values

**Рефакторинг ТОЛЬКО после green phase!**

---

## Задача 2: Интеграция AdvertisingEmptyState → AdvertisingDashboardWidget

### Контекст
Интегрировать `AdvertisingEmptyState` в `AdvertisingDashboardWidget` для отображения состояния когда нет данных рекламы за выбранный период.

**Файлы:**
- Целевой: `/src/components/custom/AdvertisingDashboardWidget.tsx`
- Новый компонент: `/src/components/custom/AdvertisingEmptyState.tsx`
- Хук: `/src/hooks/useAdvertisingAnalytics.ts`

---

### Test-First: Список тестов

#### Unit тесты (до интеграции)

**Файл:** `src/components/custom/__tests__/AdvertisingDashboardWidget.empty-state.test.tsx`

```typescript
describe('Story 60.6-FE: Advertising Empty State Integration', () => {
  describe('empty state detection', () => {
    // Тест 1: Нет данных вообще
    it('should render AdvertisingEmptyState when data.summary is null', () => {})

    // Тест 2: Нет данных за период
    it('should render AdvertisingEmptyState when data.summary has no items', () => {})

    // Тест 3: Есть данные
    it('should not render AdvertisingEmptyState when data.summary exists', () => {})
  })

  describe('available range prop', () => {
    // Тест 4: Передача availableRange
    it('should pass availableRange from data to AdvertisingEmptyState', () => {})

    // Тест 5: Передача requestedRange
    it('should pass requestedRange from props to AdvertisingEmptyState', () => {})
  })

  describe('date range change callback', () => {
    // Тест 6: Обработка выбора периода
    it('should call onDateRangeChange when user selects period in empty state', () => {})

    // Тест 7: Обновление данных после выбора периода
    it('should refetch advertising data after period selection', () => {})
  })

  describe('loading and error states', () => {
    // Тест 8: Loading state в empty state
    it('should show loading state in AdvertisingEmptyState when refetching', () => {})

    // Тест 9: Error state
    it('should show error message instead of empty state on API error', () => {})

    // Тест 10: Приоритет error над empty state
    it('should prioritize error display over empty state', () => {})
  })

  describe('integration with useAdvertisingAnalytics', () => {
    // Тест 11: Mock API response
    it('should handle API response with empty summary array', () => {})

    // Тест 12: API response with available range
    it('should extract available range from API response', () => {})
  })
})
```

#### Integration тесты

**Файл:** `src/components/custom/__tests__/AdvertisingDashboardWidget.integration.test.tsx`

```typescript
describe('Story 60.6-FE: Full Integration Flow', () => {
  describe('user flow: no data → select period → show data', () => {
    // Тест 13: Полный flow
    it('should complete flow from empty state to data display', async () => {
      // 1. Рендер с пустыми данными
      // 2. Проверка empty state
      // 3. Выбор периода
      // 4. Refetch данных
      // 5. Проверка отображения данных
    })
  })
})
```

#### E2E тесты

**Файл:** `e2e/advertising-empty-state.spec.ts`

```typescript
test.describe('Story 60.6-FE: E2E Empty State Flow', () => {
  // Тест 14: Полный flow в браузере
  test('should navigate from empty state to data display', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="advertising-empty-state"]')).toBeVisible()
    await page.selectOption('select', '7d')
    await expect(page.locator('[data-testid="advertising-widget"]')).toContainText('ROAS')
  })
})
```

---

### Red Phase (ожидаемые failures)

**Что упадет ПЕРЕД интеграцией:**

| Тест | Ожидаемая ошибка | Причина |
|------|------------------|---------|
| Тест 1 | Component not found | AdvertisingEmptyState не импортирован |
| Тест 2 | Component not found | Логика не реализована |
| Тест 3 | Component should not exist | Условный рендеринг отсутствует |
| Тест 4 | Props not passed | Пропы не передаются |
| Тест 5 | Props not passed | Пропы не передаются |
| Тест 6 | Callback not wired | Обработчик не подключен |
| Тест 7 | Refetch not triggered | Логика отсутствует |
| Тест 8 | Loading state not shown | Логика отсутствует |
| Тест 9 | Error prioritization missing | Логика отсутствует |
| Тест 10 | Error prioritization missing | Логика отсутствует |
| Тест 11 | Mock data structure | API response не обработан |
| Тест 12 | Range extraction | Логика отсутствует |
| Тест 13 | Full flow | Полная интеграция отсутствует |
| Тест 14 | E2E flow | Функциональность не реализована |

**Запуск тестов:**
```bash
# Unit
npm test -- AdvertisingDashboardWidget.empty-state.test.tsx

# Integration
npm test -- AdvertisingDashboardWidget.integration.test.tsx

# E2E
npm run test:e2e -- advertising-empty-state
```

**Ожидаемый результат:** 14 failures

---

### Green Phase (implementation)

**Шаг 1: Добавить импорт**
```typescript
// src/components/custom/AdvertisingDashboardWidget.tsx

import { AdvertisingEmptyState } from './AdvertisingEmptyState'
import type { DateRange } from './AdvertisingEmptyState'
```

**Шаг 2: Добавить проп в интерфейс**
```typescript
interface AdvertisingDashboardWidgetProps {
  className?: string
  dateRange?: DateRange
  hideLocalSelector?: boolean

  // NEW: Props for empty state integration
  requestedRange?: DateRange
  onDateRangeChange?: (range: DateRange) => void
}
```

**Шаг 3: Реализовать определение empty state**
```typescript
export function AdvertisingDashboardWidget(props: AdvertisingDashboardWidgetProps) {
  const { data, isLoading, error, refetch } = useAdvertisingAnalytics(...)

  // Detect empty state conditions
  const isEmpty = !data || !data.summary || data.summary.total_sales === 0

  // Extract available range from API response
  const availableRange = data?.available_range
    ? {
        from: data.available_range.from,
        to: data.available_range.to,
      }
    : undefined

  // Loading state (existing logic)
  if (isLoading) {
    return <WidgetSkeleton />
  }

  // Error state (existing logic)
  if (error) {
    return <ErrorCard />
  }

  // NEW: Empty state
  if (isEmpty) {
    return (
      <AdvertisingEmptyState
        availableRange={availableRange}
        requestedRange={requestedRange}
        isLoading={isLoading}
        onDateRangeChange={handlePeriodChange}
      />
    )
  }

  // Normal state (existing logic)
  return <NormalWidget />
}
```

**Шаг 4: Обработать изменение периода**
```typescript
const handlePeriodChange = (range: DateRange) => {
  if (onDateRangeChange) {
    onDateRangeChange(range)
  }
  // Refetch data with new range
  refetch()
}
```

**Шаг 5: Mock данные для тестов**
```typescript
// src/test/fixtures/advertising-analytics.ts

export const mockEmptyAdvertisingResponse = {
  summary: null,
  available_range: {
    from: '2025-12-01',
    to: '2026-01-28',
  },
}

export const mockAdvertisingResponse = {
  summary: {
    total_sales: 100000,
    avg_organic_contribution: 75,
    overall_roas: 3.5,
  },
  available_range: {
    from: '2025-12-01',
    to: '2026-01-28',
  },
}
```

**Запуск тестов после реализации:**
```bash
npm test -- AdvertisingDashboardWidget.empty-state.test.tsx
npm test -- AdvertisingDashboardWidget.integration.test.tsx
npm run test:e2e -- advertising-empty-state
```

**Ожидаемый результат:** All tests pass ✅

---

### Refactor Phase

**Возможные улучшения:**

1. **Extract hook** - Вынести логику определения empty state:
   ```typescript
   function useAdvertisingEmptyState(data, isLoading, error) {
     const isEmpty = !data || !data.summary || data.summary.total_sales === 0
     const availableRange = data?.available_range

     return { isEmpty, availableRange }
   }
   ```

2. **Component composition** - Использовать render props:
   ```typescript
   <AdvertisingDashboardWidget
     emptyStateComponent={(props) => <AdvertisingEmptyState {...props} />}
   />
   ```

3. **Simplify condition chain** - Использовать паттерм matcher:
   ```typescript
   const state = match({ isLoading, error, isEmpty })
     .with({ isLoading: true }, () => 'loading')
     .with({ error: { _ } }, () => 'error')
     .with({ isEmpty: true }, () => 'empty')
     .otherwise(() => 'data')
   ```

---

## Задача 3: Обновление логики Margin %

### Контекст
Исправить баг с falsy check для margin = 0%. Текущий код использует `grossProfit == null` что правильно, но нужно убедиться что margin = 0% корректно обрабатывается.

**Файл:** `/src/app/(dashboard)/dashboard/components/DashboardContent.tsx:213`

---

### Test-First: Список тестов

#### Unit тесты для calculateMarginPercentage

**Файл:** `src/app/(dashboard)/dashboard/components/__tests__/DashboardContent.margin.test.tsx`

```typescript
describe('DashboardContent: Margin % Calculation', () => {
  describe('calculateMarginPercentage function', () => {
    // Тест 1: Margin = 0% (критический случай!)
    it('should return 0 when grossProfit = 0 and revenue > 0', () => {
      expect(calculateMarginPercentage(0, 100)).toBe(0)
    })

    // Тест 2: Margin > 0%
    it('should calculate positive margin correctly', () => {
      expect(calculateMarginPercentage(20, 100)).toBe(20)
    })

    // Тест 3: Margin < 0% (убыток)
    it('should calculate negative margin correctly', () => {
      expect(calculateMarginPercentage(-10, 100)).toBe(-10)
    })

    // Тест 4: grossProfit = null
    it('should return null when grossProfit is null', () => {
      expect(calculateMarginPercentage(null, 100)).toBeNull()
    })

    // Тест 5: grossProfit = undefined
    it('should return null when grossProfit is undefined', () => {
      expect(calculateMarginPercentage(undefined, 100)).toBeNull()
    })

    // Тест 6: revenue = null
    it('should return null when revenue is null', () => {
      expect(calculateMarginPercentage(20, null)).toBeNull()
    })

    // Тест 7: revenue = undefined
    it('should return null when revenue is undefined', () => {
      expect(calculateMarginPercentage(20, undefined)).toBeNull()
    })

    // Тест 8: revenue = 0 (division by zero)
    it('should return null when revenue is 0', () => {
      expect(calculateMarginPercentage(20, 0)).toBeNull()
    })

    // Тест 9: Оба null
    it('should return null when both values are null', () => {
      expect(calculateMarginPercentage(null, null)).toBeNull()
    })

    // Тест 10: Точное значение с дробями
    it('should calculate precise margin with decimals', () => {
      expect(calculateMarginPercentage(15.5, 100)).toBe(15.5)
    })
  })

  describe('integration with MetricCardEnhanced', () => {
    // Тест 11: Margin 0% отображается как "0,0 %"
    it('should display "0,0 %" when margin is 0', () => {})

    // Тест 12: Margin null отображается как "—"
    it('should display "—" when margin is null', () => {})

    // Тест 13: Margin > 0% отображается с зеленым цветом
    it('should display positive margin with green color', () => {})

    // Тест 14: Margin < 0% отображается с красным цветом
    it('should display negative margin with red color', () => {})
  })
})
```

---

### Red Phase (ожидаемые failures)

**Анализ текущего кода:**

```typescript
// Текущий код (DashboardContent.tsx:213)
function calculateMarginPercentage(
  grossProfit: number | null | undefined,
  revenue: number | null | undefined
): number | null {
  if (grossProfit == null || revenue == null || revenue === 0) return null
  return (grossProfit / revenue) * 100
}
```

**Проблема:** Используется `grossProfit == null` что включает проверку на `undefined`, НО:
- `grossProfit == null` возвращает `true` для `null` И `undefined` ✅
- `revenue === 0` проверяет точное равенство нулю ✅

**Вердикт:** Код ПРАВИЛЬНЫЙ для falsy check! Но нужно добавить тесты для подтверждения.

**Что упадет ПЕРЕД добавлением тестов:**

| Тест | Ожидаемая ошибка | Причина |
|------|------------------|---------|
| Тест 1-10 | Test file not found | Тесты еще не созданы |
| Тест 11-14 | Integration test missing | Тесты еще не созданы |

**Запуск тестов:**
```bash
npm test -- DashboardContent.margin.test.tsx
```

**Ожидаемый результат:** 14 failures (файл не существует)

---

### Green Phase (implementation)

**Шаг 1: Создать тестовый файл**

**Шаг 2: Экспортировать функцию для тестирования**
```typescript
// src/app/(dashboard)/dashboard/components/DashboardContent.tsx

export function calculateMarginPercentage(
  grossProfit: number | null | undefined,
  revenue: number | null | undefined
): number | null {
  if (grossProfit == null || revenue == null || revenue === 0) return null
  return (grossProfit / revenue) * 100
}
```

**Шаг 3: Запустить тесты**
```bash
npm test -- DashboardContent.margin.test.tsx
```

**Ожидаемый результат:** All tests pass ✅ (код уже правильный!)

**Если тесты упадут:**
```typescript
// Исправленная версия (если нужна)
export function calculateMarginPercentage(
  grossProfit: number | null | undefined,
  revenue: number | null | undefined
): number | null {
  // Explicit nullish check (null OR undefined)
  if (grossProfit === null || grossProfit === undefined) return null
  if (revenue === null || revenue === undefined) return null
  if (revenue === 0) return null // Division by zero

  return (grossProfit / revenue) * 100
}
```

---

### Refactor Phase

**Возможные улучшения:**

1. **Add JSDoc** - Документация функции:
   ```typescript
   /**
    * Calculate margin percentage from gross profit and revenue.
    *
    * @param grossProfit - Gross profit value (can be null/undefined)
    * @param revenue - Total revenue (can be null/undefined)
    * @returns Margin percentage (0-100) or null if cannot calculate
    *
    * @example
    * calculateMarginPercentage(20, 100) // 20
    * calculateMarginPercentage(0, 100)  // 0
    * calculateMarginPercentage(null, 100) // null
    */
   ```

2. **Extract to utils** - Перенести в `/src/lib/margin-utils.ts`:
   ```typescript
   // src/lib/margin-utils.ts
   export function calculateMarginPercentage(...)
   ```

3. **Add validation** - Проверка диапазонов:
   ```typescript
   if (margin < -100 || margin > 100) {
     console.warn('Margin percentage outside expected range:', margin)
   }
   ```

---

## Общие рекомендации по TDD

### Процесс

1. **Red Phase** (30% времени):
   - Написать тесты ДО реализации
   - Убедиться что тесты падают
   - Документировать ожидаемые failures

2. **Green Phase** (50% времени):
   - Минимальная реализация для прохождения тестов
   - Не оптимизировать prematurely
   - Фокус на функциональности

3. **Refactor Phase** (20% времени):
   - Улучшение кода БЕЗ изменения функциональности
   - Все тесты должны проходить
   - Применение паттернов и best practices

### Инструменты

```bash
# Unit тесты
npm test -- <test-file-pattern>

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# E2E тесты
npm run test:e2e -- <spec-file>

# E2E с UI
npm run test:e2e -- --ui
```

### Метрики

**Целевые показатели покрытия:**
- Unit тесты: >80%
- Integration тесты: >60%
- E2E тесты: >40%
- Overall: >70%

---

## Чеклист валидации

### Перед началом работы
- [ ] Созданы все тестовые файлы
- [ ] Тесты падают (Red phase подтвержден)
- [ ] Документированы ожидаемые failures

### После реализации
- [ ] Все unit тесты проходят
- [ ] Все integration тесты проходят
- [ ] E2E тесты проходят
- [ ] Coverage >70%
- [ ] Code review проведен
- [ ] Документация обновлена

### Перед деплоем
- [ ] Линтинг проходит (`npm run lint`)
- [ ] Типизация проходит (`npm run type-check`)
- [ ] Форматирование проходит (`npm run format:check`)
- [ ] E2E тесты на Chrome проходят
- [ ] Performance budget соблюдается
- [ ] Accessibility (Lighthouse) >90

---

## Заключение

Этот план TDD обеспечивает:

1. **Полноту покрытия** - Unit, integration, E2E тесты
2. **Постоянную валидацию** - Red-Green-Refactor цикл
3. **Документирование** - Тесты как документация
4. **Качество** - Высокий coverage и метрики

**Следующие шаги:**
1. Создать тестовые файлы по спецификации
2. Запустить Red phase и зафиксировать failures
3. Реализовать функциональность (Green phase)
4. Рефакторинг и оптимизация (Refactor phase)
5. Code review и merge

---

**Автор:** QR Architect / TDD Specialist
**Дата:** 2026-01-30
**Версия:** 1.0
