# План исправления технического долга тестов

**Дата анализа:** 2026-01-30
**Версия:** 1.0
**Ответственный:** QA Team

---

## Общая статистика

| Метрика | Значение |
|---------|----------|
| **Всего тестов** | 9 208 |
| **Passing** | 4 734 (51.4%) |
| **Failing** | 78 (0.8%) |
| **Skipped** | 597 (6.5%) |
| **Todo** | 3 799 (41.3%) |
| **Процент прохождения** | 98.3% (без todo) |

**Файлы с ошибками:** 8 из 276 (2.9%)

---

## Категории failing тестов

### 1. DateRangePickerExtended (14 failing)

**Файл:** `src/components/custom/__tests__/DateRangePickerExtended.test.tsx`

**Связь с Epic:** Epic 51 (FBS Historical Analytics UI - 365 Days)

#### Проблема

Тесты используют неспецифичные селекторы, которые находят несколько элементов:

1. **Text selector "15"** - находит несколько элементов с текстом "15" (дни в календаре)
2. **Role "grid"** - находит несколько элементов с role="grid" (календарные таблицы)
3. **Assertion errors** - ожидания не соответствуют фактическому поведению

#### Корневая причина

Компонент `DayPicker` из библиотеки `react-day-picker` рендерит несколько календарных сеток (текущий месяц + навигационные элементы), и тестовые селекторы не учитывают эту структуру.

#### Сложность: **Medium**
#### Время: **2-3 часа**
#### Приоритет: **P1**
#### Риск: **Средний**

#### Решение

**Шаг 1: Обновить тестовые селекторы (1 час)**

Заменить неспецифичные селекторы на более точные:

```typescript
// Было (неправильно):
screen.getByText('15')

// Стало (правильно):
screen.getByRole('button', { name: /^15$/ })

// Было (неправильно):
screen.getByRole('grid')

// Стало (правильно):
within(screen.getByRole('grid')).getByRole('button', { name: /20 января/ })
```

**Шаг 2: Обновить assertions для keyboard navigation (30 мин)**

Использовать `waitFor` для асинхронных обновлений фокуса:

```typescript
await waitFor(() => {
  expect(triggerButton).toHaveFocus()
})
```

**Шаг 3: Обновить тесты для close-on-click-outside (30 мин)**

Использовать правильную структуру для клика вне popover:

```typescript
userEvent.click(document.body)
await waitFor(() => {
  expect(onChange).not.toHaveBeenCalled()
})
```

**Шаг 4: Проверить Russian Locale тесты (30 мин)**

Обновить селекторы для русских названий дней недели:

```typescript
// Использовать data-testid вместо текста
expect(screen.getByTestId('day-names')).toHaveTextContent(/Пн Вт Ср/)
```

**Шаг 5: Обновить aggregation suggestion тесты (30 мин)**

Проверить логику отображения "Агрегация: Ежемесячно" для 365 дней.

---

### 2. OrderDetailsModal (26 failing)

**Файл:** `src/components/custom/orders/__tests__/OrderDetailsModal.test.tsx`

**Связь с Epic:** Epic 40-FE (Orders UI & WB Native Status History)

#### Проблема

**Mock configuration error** - тесты не мокают `ordersQueryKeys` экспорт из `@/lib/api/orders`.

**Error message:**
```
No "ordersQueryKeys" export is defined on the "@/lib/api/orders" mock.
Did you forget to return it from "vi.mock"?
```

#### Корневая причина

Тесты используют `vi.mock()` для мокания API модуля, но не экспортируют `ordersQueryKeys`, которые используются в компоненте `OrderDetailsModal`.

#### Сложность: **Low**
#### Время: **1 час**
#### Приоритет: **P0** (блокирует Epic 40)
#### Риск: **Низкий**

#### Решение

**Шаг 1: Обновить mock configuration (30 мин)**

Добавить `ordersQueryKeys` в mock:

```typescript
// src/components/custom/orders/__tests__/OrderDetailsModal.test.tsx

vi.mock('@/lib/api/orders', () => ({
  getOrderDetails: (orderId: string) => mockGetOrderDetails(orderId),
  getFullHistory: (orderId: string) => mockGetFullHistory(orderId),
  getWbHistory: (orderId: string) => mockGetWbHistory(orderId),
  getLocalHistory: (orderId: string) => mockGetLocalHistory(orderId),
  ordersQueryKeys: {
    all: ['orders'],
    detail: (orderId: string) => ['orders', 'detail', orderId],
  },
}))
```

**Шаг 2: Проверить остальные mock exports (15 мин)**

Убедиться, что все экспортируемые сущности из `@/lib/api/orders` замоканы.

**Шаг 3: Запустить тесты и проверить (15 мин)**

```bash
npm test -- OrderDetailsModal.test.tsx
```

---

### 3. OrderHistoryTabs (27 failing)

**Файл:** `src/components/custom/orders/__tests__/OrderHistoryTabs.test.tsx`

**Связь с Epic:** Epic 40-FE (Orders UI & WB Native Status History)

#### Проблема

Аналогичная проблема с mock configuration - отсутствует `ordersQueryKeys` в mock.

#### Корневая причина

Тесты используют те же API моки, что и `OrderDetailsModal`, и имеют ту же проблему.

#### Сложность: **Low**
#### Время: **30 мин**
#### Приоритет: **P0** (блокирует Epic 40)
#### Риск: **Низкий**

#### Решение

**Шаг 1: Применить аналогичное исправление mock (15 мин)**

```typescript
// src/components/custom/orders/__tests__/OrderHistoryTabs.test.tsx

vi.mock('@/lib/api/orders', () => ({
  getFullHistory: (orderId: string) => mockGetFullHistory(orderId),
  getWbHistory: (orderId: string) => mockGetWbHistory(orderId),
  getLocalHistory: (orderId: string) => mockGetLocalHistory(orderId),
  ordersQueryKeys: {
    all: ['orders'],
    history: (orderId: string) => ['orders', 'history', orderId],
    wbHistory: (orderId: string) => ['orders', 'wb-history', orderId],
    fullHistory: (orderId: string) => ['orders', 'full-history', orderId],
  },
}))
```

**Шаг 2: Запустить тесты (15 мин)**

```bash
npm test -- OrderHistoryTabs.test.tsx
```

---

### 4. Price Calculator Tests (7 failing)

**Файлы:**
- `src/components/custom/price-calculator/__tests__/CostBreakdownChart.test.tsx` (4 failing)
- `src/components/custom/price-calculator/__tests__/PriceCalculatorResults.test.tsx` (1 failing)
- `src/components/custom/price-calculator/__tests__/TwoLevelPricingDisplay.story-44.20.test.tsx` (2 failing)
- `src/components/custom/price-calculator/__tests__/TwoLevelPricingDisplay.test.tsx` (2 failing)
- `src/components/custom/price-calculator/__tests__/WarehouseSection.story-44.27.test.tsx` (1 failing)

**Связь с Epic:** Epic 44 (Price Calculator)

#### Проблема

1. **Missing text "Структура затрат"** - компонент изменился, заголовок теперь в другом месте
2. **MarginSection component** - тесты ожидают рендеринг MarginSection, но он отсутствует или изменился
3. **WarehouseSection** - тесты для Story 44.27 могут быть устаревшими

#### Корневая причина

Компоненты `PriceCalculatorResults` и `TwoLevelPricingDisplay` были рефакторены в Story 44.20, и тесты не были обновлены.

#### Сложность: **Medium**
#### Время: **4-6 часов**
#### Приоритет: **P2**
#### Риск: **Средний**

#### Решение

**Шаг 1: Анализ текущей структуры компонентов (1 час)**

Изучить текущую реализацию:
- `PriceCalculatorResults` - какие компоненты рендерит
- `TwoLevelPricingDisplay` - содержит ли MarginSection
- `CostBreakdownChart` - где находится заголовок "Структура затрат"

**Шаг 2: Обновить тесты PriceCalculatorResults (1 час)**

```typescript
// Обновить ожидание для "Структура затрат"
it('renders cost breakdown chart section', () => {
  render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

  // CostBreakdownChart теперь рендерит заголовок внутри
  const chart = screen.getByTestId('cost-breakdown-chart')
  expect(chart).toBeInTheDocument()
  expect(chart).toHaveTextContent(/Структура затрат/i)
})
```

**Шаг 3: Обновить тесты TwoLevelPricingDisplay (2 часа)**

Проверить, что MarginSection рендерится внутри collapsible:

```typescript
it('renders MarginSection', () => {
  render(
    <TwoLevelPricingDisplay
      result={mockTwoLevelResult}
      fulfillmentType="FBO"
      taxType="income"
      taxRatePct={6}
      sppPct={10}
    />
  )

  // MarginSection внутри collapsible
  expect(screen.getByTestId('margin-section')).toBeInTheDocument()
})

it('passes tax info to MarginSection', () => {
  render(
    <TwoLevelPricingDisplay
      result={mockTwoLevelResult}
      fulfillmentType="FBO"
      taxType="income"
      taxRatePct={6}
      sppPct={10}
    />
  )

  // Проверить, что налоговая информация передана
  const marginSection = screen.getByTestId('margin-section')
  expect(marginSection).toHaveTextContent(/Налог:/)
  expect(marginSection).toHaveTextContent(/6%/)
})
```

**Шаг 4: Обновить тесты CostBreakdownChart (1 час)**

Проверить рендеринг легенды и accessibility:

```typescript
it('renders all legend items', () => {
  render(<CostBreakdownChart data={mockData} inputParams={mockInputParams} />)

  // Использовать data-testid вместо текста
  expect(screen.getAllByTestId(/legend-item/)).toHaveLength(5)
})
```

**Шаг 5: Обновить тесты WarehouseSection (1 час)**

Проверить Story 44.27 - коэффициент логистики:

```typescript
it('should allow manual override of logistics coefficient', async () => {
  render(<WarehouseSection {...defaultProps} />)

  const overrideToggle = screen.getByRole('switch', { name: /ручной коэффициент/i })
  await userEvent.click(overrideToggle)

  const input = screen.getByRole('spinbutton', { name: /коэффициент логистики/i })
  await userEvent.type(input, '1.5')

  expect(input).toHaveValue(1.5)
})
```

---

## Резюме по категориям

| Категория | Failing | Сложность | Время | Приоритет | Риск |
|-----------|---------|-----------|-------|-----------|------|
| **DateRangePickerExtended** | 14 | Medium | 2-3 ч | P1 | Средний |
| **OrderDetailsModal** | 26 | Low | 1 ч | P0 | Низкий |
| **OrderHistoryTabs** | 27 | Low | 0.5 ч | P0 | Низкий |
| **Price Calculator** | 7 | Medium | 4-6 ч | P2 | Средний |
| **ИТОГО** | **78** | - | **8-11 ч** | - | - |

---

## Рекомендации

### Немедленные действия (P0) - **1.5 часа**

1. **OrderDetailsModal** (1 час)
   - Добавить `ordersQueryKeys` в mock
   - Проверить все экспорты API модуля

2. **OrderHistoryTabs** (30 мин)
   - Добавить `ordersQueryKeys` в mock
   - Запустить тесты

**Ожидаемый результат:** 53 теста из 78 пройдут (68% → 100%)

### Короткий срок (P1, 1-2 дня) - **2-3 часа**

1. **DateRangePickerExtended** (2-3 часа)
   - Обновить селекторы для calendar grids
   - Исправить keyboard navigation тесты
   - Проверить Russian locale тесты

**Ожидаемый результат:** 14 тестов пройдут (82% → 100%)

### Средний срок (P2, 1 неделя) - **4-6 часов**

1. **Price Calculator** (4-6 часов)
   - Анализ текущей структуры компонентов
   - Обновить тесты для рефакторенных компонентов
   - Проверить Story 44.27

**Ожидаемый результат:** 7 тестов пройдут (100%)

---

## План выполнения

### Неделя 1

| День | Задача | Время | Ответственный |
|------|--------|-------|---------------|
| Пн | OrderDetailsModal (P0) | 1 ч | Frontend Dev |
| Пн | OrderHistoryTabs (P0) | 0.5 ч | Frontend Dev |
| Вт-Чт | DateRangePickerExtended (P1) | 2-3 ч | Frontend Dev |
| Пт | Code review + regression | 2 ч | QA Team |

### Неделя 2

| День | Задача | Время | Ответственный |
|------|--------|-------|---------------|
| Пн-Вт | Price Calculator анализ | 2 ч | Frontend Dev |
| Ср-Чт | Price Calculator исправления | 4-6 ч | Frontend Dev |
| Пт | Full regression + documentation | 4 ч | QA Team |

---

## Риски и митигация

### Риск 1: Проблемы с react-day-picker selectors
**Вероятность:** Средняя
**Влияние:** Высокое

**Митигация:**
- Использовать `data-testid` атрибуты вместо role/text селекторов
- Координироваться с библиотекой `react-day-picker` для best practices

### Риск 2: Изменения в компонентах во время исправления
**Вероятность:** Низкая
**Влияние:** Среднее

**Митигация:**
- Создать feature branch для исправлений
- Связаться с разработчиками компонентов
- Использовать snapshot тесты для быстрой проверки

### Риск 3: Недостаточное покрытие edge cases
**Вероятность:** Средняя
**Влияние:** Среднее

**Митигация:**
- Добавить дополнительные тесты для edge cases
- Использовать property-based testing (fast-check)
- Проверить accessibility с axe-core

---

## Критерии завершения

### Успешное выполнение

- [ ] Все 78 failing тестов проходят
- [ ] Процент прохождения тестов ≥ 99.5%
- [ ] Нет новых failing тестов
- [ ] Code review завершен
- [ ] Regression testing пройден

### Проверка качества

```bash
# Запустить все тесты
npm test -- --run

# Проверить покрытие
npm run test:coverage

# Проверить типы
npm run type-check

# Проверить lint
npm run lint
```

---

## Дополнительные ресурсы

### Документация

- **Epic 40:** `docs/epics/epic-40-fe-orders-ui.md`
- **Epic 44:** `docs/epics/epic-44-price-calculator.md`
- **Epic 51:** `docs/epics/epic-51-fbs-historical-analytics.md`
- **Testing Guide:** `docs/TESTING-GUIDE.md`

### Инструменты

- **Vitest:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/
- **react-day-picker:** https://daypicker.dev/
- **axe-core:** https://www.deque.com/axe/

---

## Контакты

**QA Lead:** [Имя]
**Frontend Lead:** [Имя]
**Project Manager:** [Имя]

---

**Последнее обновление:** 2026-01-30
**Статус:** В ожидании утверждения
