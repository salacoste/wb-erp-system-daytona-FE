# Анализ интеграции с бэкендом

**Дата**: 2026-01-30
**Роль**: Backend Integration Analyst
**Цель**: Понять что есть на бэкенде и что нужно интегрировать на фронтенде

---

## Текущее состояние

### Margin% (Маржинальность)

**Статус**: Частично интегрирован ✅

**Текущий код**:
- ✅ Компонент `MetricCardEnhanced` поддерживает отображение margin% (строка 148-155 в `DashboardContent.tsx`)
- ✅ Используется `calculateMarginPercentage()` для расчёта из `gross_profit` и `sale_gross_total`
- ✅ Поддержка `CogsMissingState` компонента для состояния отсутствия COGS
- ✅ `useFinancialSummary` хук получает `cogs_total`, `gross_profit`, `cogs_coverage_pct` из API
- ✅ `DashboardContent` использует данные для карточки "Маржа %" (карточка #3)

**Что работает**:
- ✅ Fetch данных из `/v1/analytics/weekly/finance-summary`
- ✅ Агрегация данных за месяц из недельных сводок
- ✅ Отображение покрытия COGS (`cogsCoverage`)
- ✅ Отображение `CogsMissingState` в `MetricCardEnhanced` при `value === null`

**Что нужно улучшить**:
- ⚠️ **Интеграция `CogsMissingState` не полная**: Компонент передан в `MetricCardEnhanced` как проп (`showCogsWarning`), но НЕ используется для карточки "Маржа %" в `DashboardContent`
- ⚠️ Логика `calculateMarginPercentage()` возвращает `null` когда `gross_profit === null`, но компонент НЕ показывает `CogsMissingState` для этого случая
- ⚠️ `MetricCardEnhanced` проверяет `showCogsWarning && value === null` (строка 121), но в `DashboardContent` `showCogsWarning` не передаётся

**Файлы**:
- `/src/app/(dashboard)/dashboard/components/DashboardContent.tsx` (строки 147-155)
- `/src/components/custom/MetricCardEnhanced.tsx` (строки 119-127)
- `/src/hooks/useFinancialSummary.ts`
- `/src/components/custom/CogsMissingState.tsx`

---

### Advertising (Реклама)

**Статус**: Полностью интегрирован ✅

**Текущий код**:
- ✅ Компонент `AdvertisingDashboardWidget` с поддержкой period selector
- ✅ Hook `useAdvertisingAnalytics` для получения данных
- ✅ Hook `useAdvertisingEmptyState` для определения пустого состояния
- ✅ Компонент `AdvertisingEmptyState` для отображения состояния отсутствия данных
- ✅ Интеграция с глобальным периодом (Story 60.6-FE)

**Что работает**:
- ✅ Fetch данных из `/v1/analytics/advertising?from=DATE&to=DATE`
- ✅ Определение empty state: `total_sales === 0`
- ✅ Отображение `AdvertisingEmptyState` с доступным диапазоном дат
- ✅ Predefined ranges (7d, 14d, 30d) с фильтрацией по доступным данным
- ✅ Синхронизация с `DashboardPeriodContext` при передаче `dateRange` пропа

**Файлы**:
- `/src/components/custom/AdvertisingDashboardWidget.tsx`
- `/src/hooks/useAdvertisingAnalytics.ts`
- `/src/hooks/useAdvertisingEmptyState.ts`
- `/src/components/custom/AdvertisingEmptyState.tsx`

---

## Разрывы интеграции

### Разрыв 1: CogsMissingState не показывается для Margin% карточки

**Описание**:
Карточка "Маржа %" показывает "—" когда `gross_profit === null`, но НЕ показывает `CogsMissingState` для информирования пользователя о необходимости назначения COGS.

**Текущее поведение**:
```tsx
// DashboardContent.tsx:147-155
<MetricCardEnhanced
  title="Маржа %"
  value={calculateMarginPercentage(summary?.gross_profit, summary?.sale_gross_total)}
  format="percentage"
  icon={Percent}
  tooltip="Валовая маржа = (Выручка - COGS) / Выручка"
  isLoading={summaryLoading}
/>
```

**Проблема**:
- `calculateMarginPercentage()` возвращает `null` когда `gross_profit === null`
- `MetricCardEnhanced` показывает "—" для `null` значений
- НО `showCogsWarning` prop НЕ передаётся, поэтому `CogsMissingState` НЕ рендерится

**Решение**:
Передать пропы `showCogsWarning`, `productsWithCogs`, `totalProducts`, `cogsCoverage`, `onAssignCogs` в `MetricCardEnhanced` для карточки "Маржа %".

**Файлы**:
- `/src/app/(dashboard)/dashboard/components/DashboardContent.tsx`

---

### Разрыв 2: Логика определения необходимости CogsMissingState не полная

**Описание**:
`MetricCardEnhanced` проверяет `showCogsWarning && value === null`, но `showCogsWarning` - это внешний проп который нужно вычислять на основе данных API.

**Текущее поведение**:
```tsx
// MetricCardEnhanced.tsx:119-127
{error ? (
  <div className="mt-2 text-sm text-destructive">{error}</div>
) : showCogsWarning && value === null ? (
  <CogsMissingState
    productsWithCogs={productsWithCogs}
    totalProducts={totalProducts}
    coverage={cogsCoverage}
    onAssignCogs={onAssignCogs}
  />
) : (
  // Normal content
)}
```

**Проблема**:
- Компонент зависит от внешнего пропа `showCogsWarning`
- Нет автоматического определения на основе данных

**Решение**:
Вариант A: Вычислять `showCogsWarning` в `DashboardContent` на основе `cogsCoverage < 100`
Вариант B: Добавить логику автоматического определения внутрь `MetricCardEnhanced`

**Рекомендация**: Вариант A для более явного контроля

**Файлы**:
- `/src/components/custom/MetricCardEnhanced.tsx`
- `/src/app/(dashboard)/dashboard/components/DashboardContent.tsx`

---

### Разрыв 3: Нет загрузки доступного диапазона дат для Advertising

**Описание**:
Бэкенд предоставляет `/v1/analytics/advertising/sync-status` с `dataAvailableFrom` и `dataAvailableTo`, но фронтенд НЕ использует этот эндпоинт.

**Текущее поведение**:
```tsx
// AdvertisingDashboardWidget.tsx:259-270
// NO fetch of sync-status endpoint
// Empty state component uses availableRange from data.meta.date_range
```

**Проблема**:
- Доступный диапазон извлекается из `data.meta.date_range` ответа analytics
- Если данных нет вообще, `availableRange` будет `undefined`
- Нет отдельного эндпоинта для проверки доступности данных ПЕРЕД запросом

**Решение**:
Добавить hook `useAdvertisingSyncStatus` для получения доступного диапазона:
```tsx
// Before fetching analytics, get sync status
const { data: syncStatus } = useAdvertisingSyncStatus()
const availableRange = syncStatus ? {
  from: syncStatus.dataAvailableFrom,
  to: syncStatus.dataAvailableTo
} : undefined
```

**Файлы**:
- `/src/hooks/useAdvertisingAnalytics.ts`
- `/src/components/custom/AdvertisingDashboardWidget.tsx`

---

### Разрыв 4: Нет валидации диапазона дат для Advertising

**Описание**:
Согласно Request #116, бэкенд рекомендует валидировать диапазон дат ПЕРЕД запросом к API, но фронтенд делает запрос напрямую.

**Текущее поведение**:
```tsx
// Direct request without validation
const { data } = useAdvertisingAnalytics({
  from: advertisingDateRange.from,
  to: advertisingDateRange.to,
})
```

**Проблема**:
- Если пользователь выберет даты вне доступного диапазона, API вернёт пустые данные
- Нет preemptive валидации и предупреждения пользователю
- Wasted API calls для заведомо пустых периодов

**Решение**:
Добавить `validateAdvertisingDateRange()` функцию и использовать её для показа предупреждения ПЕРЕД запросом.

**Файлы**:
- `/src/lib/date-utils.ts` (новая функция)
- `/src/hooks/useAdvertisingAnalytics.ts`
- `/src/components/custom/DashboardPeriodSelector.tsx`

---

## Рекомендации

### Приоритет 1: Исправить отображение CogsMissingState для Margin%

**Задачи**:
1. В `DashboardContent.tsx` для карточки "Маржа %" (строки 147-155):
   - Добавить `showCogsWarning={cogsCoverage < 100}`
   - Добавить `productsWithCogs={productsWithCogs}`
   - Добавить `totalProducts={totalProducts}`
   - Добавить `cogsCoverage={cogsCoverage}`
   - Добавить `onAssignCogs={() => router.push('/products')}`

**Ожидаемый результат**:
Когда `gross_profit === null` и `cogsCoverage < 100`, карточка "Маржа %" покажет `CogsMissingState` вместо просто "—".

---

### Приоритет 2: Добавить useAdvertisingSyncStatus hook

**Задачи**:
1. Создать `/src/hooks/useAdvertisingSyncStatus.ts`:
   ```tsx
   export function useAdvertisingSyncStatus() {
     return useQuery({
       queryKey: ['advertising-sync-status'],
       queryFn: () => apiClient.get('/v1/analytics/advertising/sync-status'),
       staleTime: 5 * 60 * 1000, // 5 minutes
     })
   }
   ```

2. Использовать в `AdvertisingDashboardWidget`:
   - Получить `dataAvailableFrom` и `dataAvailableTo` из sync status
   - Передать в `AdvertisingEmptyState` как `availableRange`

**Ожидаемый результат**:
Empty state всегда будет показывать корректный доступный диапазон, даже если нет данных в ответе analytics.

---

### Приоритет 3: Добавить валидацию диапазона дат для Advertising

**Задачи**:
1. Добавить `/src/lib/advertising-utils.ts`:
   ```tsx
   export function validateAdvertisingDateRange(
     from: string,
     to: string,
     availableFrom: string,
     availableTo: string
   ): { isValid: boolean; hasOverlap: boolean; error?: string; warning?: string }
   ```

2. Использовать валидацию в `DashboardContent`:
   - Проверять `advertisingDateRange` против `availableRange`
   - Показывать toast warning если диапазон не валиден
   - Отключить запрос если нет overlap

**Ожидаемый результат**:
Меньше wasted API calls, лучший UX с preemptive предупреждениями.

---

### Приоритет 4 (опциональный): Улучшить автоматическое определение CogsMissingState

**Задачи**:
1. В `MetricCardEnhanced` добавить автоматическое определение:
   ```tsx
   const shouldShowCogsWarning = showCogsWarning ||
     (value === null && cogsCoverage < 100 && coverage !== undefined)
   ```

2. Убрать необходимость передавать `showCogsWarning` для margin карточек

**Ожидаемый результат**:
Менше шаблонного кода в `DashboardContent`, более умный компонент.

---

## Карта интеграции

### Margin% Data Flow

```
API: /v1/analytics/weekly/finance-summary
  ↓
useFinancialSummary (hook)
  ↓ extract: cogs_total, gross_profit, cogs_coverage_pct, products_with_cogs, products_total
DashboardContent (component)
  ↓ calculate: margin = gross_profit / revenue
MetricCardEnhanced (component)
  ↓ if showCogsWarning && value === null:
    → CogsMissingState
  ↓ else:
    → display value
```

**Текущий статус**: ✅ Работает, ⚠️ CogsMissingState не показывается

---

### Advertising Data Flow

```
API: /v1/analytics/advertising?from=DATE&to=DATE
  ↓
useAdvertisingAnalytics (hook)
  ↓ select: isEmpty, summary
AdvertisingDashboardWidget (component)
  ↓ if isEmpty:
    → AdvertisingEmptyState
  ↓ else:
    → display metrics
```

**Текущий статус**: ✅ Полностью работает

**Отсутствует**:
- ❌ useAdvertisingSyncStatus hook
- ❌ Валидация диапазона дат

---

## Заключение

**Margin% интеграция**:
- ✅ Данные получаются корректно
- ✅ Компоненты созданы и работают
- ⚠️ НЕ показывается `CogsMissingState` для пользователей с неполным COGS покрытием
- **Требуемые действия**: Передать пропы `showCogsWarning`, `productsWithCogs`, `totalProducts`, `cogsCoverage`, `onAssignCogs` в `MetricCardEnhanced` для карточки "Маржа %"

**Advertising интеграция**:
- ✅ Полностью функциональна
- ✅ Empty state обрабатывается корректно
- ⚠️ Можно улучшить добавив `useAdvertisingSyncStatus` и валидацию диапазона
- **Требуемые действия**: Опционально, для улучшения UX

---

**Автор**: Backend Integration Analyst
**Дата**: 2026-01-30
**Статус**: ✅ Анализ завершён
