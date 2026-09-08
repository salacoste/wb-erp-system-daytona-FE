# Epic 65 — Stories Wave 4: UX-улучшения + Дизайн-система карточек

**Wave 4**: Визуальные улучшения, адаптация UX-паттернов конкурента.

> **Нумерация**: Эпик определяет Wave 4 как 65.15-65.17 (3 истории). При детализации добавлены
> 65.18 (секции) и 65.19 (BaseMetricCard) как необходимые архитектурные компоненты.
> Итого 5 историй: 65.15-65.19.

---

## Story 65.15: Цветовая кодировка фона карточек

**Описание**: Добавить фоновую цветовую индикацию карточек в зависимости от динамики метрики.

**Паттерн конкурента**:

- **Розовый/красный фон** — метрика ухудшилась (расход вырос или доход упал)
- **Зелёный фон** — метрика улучшилась (расход снизился или доход вырос)
- **Нейтральный** — нет данных или нет изменений

**Реализация**:
Используем существующий `TrendDirection` из `comparison-helpers.ts` (значения: `'positive' | 'negative' | 'neutral'`).
Функция `calculateComparison()` уже обрабатывает `invertComparison` — direction=positive означает
"хорошо" (рост для доходов, снижение для расходов). Привязываемся к этой семантике:

```typescript
import type { TrendDirection } from '@/lib/comparison-helpers'

function getCardBackground(direction: TrendDirection): string {
  if (direction === 'neutral') return ''
  return direction === 'positive'
    ? 'bg-green-50 border-green-200'
    : 'bg-red-50 border-red-200'
}
```

> **Обоснование**: Не нужен отдельный параметр `inverted` — `calculateComparison(value, prev, true)`
> уже инвертирует direction для расходных карточек. Цвет фона привязан напрямую к direction.

**AC**:

- [ ] AC-65.15.1: Карточки доходов зелёные при росте, красные при падении
- [ ] AC-65.15.2: Карточки расходов зелёные при снижении, красные при росте
- [ ] AC-65.15.3: Нейтральный фон при отсутствии сравнения или direction=neutral
- [ ] AC-65.15.4: Фон мягкий (`bg-green-50` / `bg-red-50` — Tailwind standard light tints), не мешает чтению
- [ ] AC-65.15.5: WCAG: контрастность текста на цветном фоне ≥4.5:1 (проверить `text-2xl font-bold` значения и `text-xs text-gray-400` субтитры на `bg-green-50`/`bg-red-50`)
- [ ] AC-65.15.6: Поддержка `prefers-reduced-motion`: фон меняется без анимации если пользователь предпочитает
- [ ] AC-65.15.7: Опциональная настройка: можно отключить (зависит от Story 65.8 "Настройка виджетов")
- [ ] AC-65.15.8: Highlighted карточки (PayoutCard, GrossProfitCard, MarginCard) НЕ получают sentiment bg — у них уже есть собственные `bg-gradient-to-br` фоны и `border-2` с динамическим цветом. Sentiment bg применяется ТОЛЬКО к standard variant карточкам

**Файлы**:

- NEW: `src/lib/card-sentiment.ts` — утилита `getCardBackground(direction: TrendDirection)`
- EDIT: `ExpenseMetricCard.tsx` — применить фон через `getCardBackground(comparison?.direction)`
- EDIT: `OrdersCard.tsx`, `SalesNetCard.tsx` — доходные standard карточки
- EDIT: `StorageAcceptanceCard.tsx`, `CostsCard.tsx`, `AdvertisingCard.tsx` — расходные standard карточки (уже inverted)
- SKIP: `PayoutCard.tsx`, `GrossProfitCard.tsx`, `MarginCard.tsx` — highlighted variant, имеют собственные gradient bg (см. AC-65.15.8)

**Маппинг метрик** (сверено с `calculateComparison(value, prev, invertComparison)` в коде):

| Карточка                                   | invertComparison | Рост =               | Текущий код                                     |
| ------------------------------------------ | :--------------: | -------------------- | ----------------------------------------------- |
| Заказы (OrdersCard)                        |     `false`      | Хорошо (зелёный фон) | `calculateComparison(totalOrders, prev, false)` |
| Продажи (SalesNetCard)                     |     `false`      | Хорошо (зелёный фон) | `calculateComparison(saleGross, prev, false)`   |
| Комиссии WB (WbCommissionsCard)            |      `true`      | Плохо (красный фон)  | через `ExpenseMetricCard` (inverted)            |
| Логистика (LogisticsMetricCard)            |      `true`      | Плохо (красный фон)  | через `ExpenseMetricCard` (inverted)            |
| К перечислению (PayoutCard)                |     `false`      | Хорошо (зелёный фон) | `calculateComparison(payout, prev, false)`      |
| Хранение и приёмка (StorageAcceptanceCard) |      `true`      | Плохо (красный фон)  | `calculateComparison(total, prev, true)`        |
| Себестоимость (CostsCard)                  |      `true`      | Плохо (красный фон)  | `calculateComparison(cogs, prev, true)`         |
| Реклама (AdvertisingCard)                  |      `true`      | Плохо (красный фон)  | `calculateComparison(spend, prev, true)`        |
| Валовая прибыль (GrossProfitCard)          |     `false`      | Хорошо (зелёный фон) | `calculateComparison(grossProfit, prev, false)` |
| Маржинальность (MarginCard)                |       N/A        | Хорошо (зелёный фон) | Использует п.п. разницу, не ComparisonBadge     |

> **Примечание по MarginCard**: MarginCard не использует `calculateComparison()` — она вычисляет
> разницу в п.п. напрямую. Для sentiment фона нужно добавить логику: `diff > 0` = positive, `diff < 0` = negative.

**Сложность**: M | **Приоритет**: Medium

---

## Story 65.16: Формат двойного значения `₽ / %`

**Описание**: Все метрики показывают двойное значение: основное + вторичное.

**Паттерн конкурента**:

```
23 748 ₽ / 14,09 %     ← основное значение / % от выручки
-1 907 (-7,43%) ↘       ← сравнение
```

**Текущее состояние** (сверено с кодом):

- `ExpenseMetricCard` — показывает `% от выручки` отдельной строкой (`text-xs text-gray-400`): Логистика, Комиссии WB
- `StorageAcceptanceCard` — показывает `% от продаж` отдельной строкой внизу
- `AdvertisingCard` — показывает `% от продаж` рядом с ROAS в flex-wrap строке
- `SalesNetCard` — показывает "Выкупы X - Возвраты Y" как субтитр
- `OrdersCard` — только "N шт.", нет суммы заказов
- `PayoutCard`, `GrossProfitCard`, `MarginCard` — только одно значение

**Отличие от конкурента**: конкурент показывает оба значения на ОДНОЙ строке через `/` с одинаковым весом. Мы показываем % мелким текстом отдельной строкой.

**AC**:

- [ ] AC-65.16.1: Основное значение и % показаны на одной строке через `/`
- [ ] AC-65.16.2: % от выручки автоматически рассчитывается для расходных карточек (используя `formatPercentage()` из `utils.ts`, которая принимает 0-100 и делит на 100)
- [ ] AC-65.16.3: Доходные карточки: `₽ / шт` (сумма + количество) где применимо
- [ ] AC-65.16.4: Единый компонент `DualValue` для консистентности
- [ ] AC-65.16.5: Вторичное значение визуально менее выделено (`text-muted-foreground`, normal weight)
- [ ] AC-65.16.6: Separator `/` объединён с primary/secondary в одном `<span>` или `<div>` для корректного чтения screen reader'ами (не должен читаться как отдельный элемент)

**Компонент DualValue**:

```typescript
interface DualValueProps {
  primary: string         // "23 748 ₽"
  secondary?: string      // "14,09%" — optional, т.к. не у всех карточек есть
  separator?: string      // " / " (default)
  primaryClass?: string   // default: "text-2xl font-bold" (or "text-4xl font-bold" for highlighted)
  secondaryClass?: string // default: "text-base text-muted-foreground"
}
```

> **Примечание**: `formatPercentage()` в `utils.ts` использует `Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 2 })`
> и делит на 100. Поэтому `formatPercentage(14.09)` вернет `"14,09 %"`. Для вычисления
> используется паттерн из `ExpenseMetricCard`: `(expense / revenue) * 100`.

**Файлы**:

- NEW: `src/components/custom/dashboard/DualValue.tsx`
- EDIT: `ExpenseMetricCard.tsx` — заменить отдельную строку "% от выручки" на DualValue
- EDIT: `StorageAcceptanceCard.tsx` — перенести "% от продаж" в DualValue
- EDIT: `AdvertisingCard.tsx` — перенести "% от продаж" в DualValue (ROAS остается отдельно)
- EDIT: `OrdersCard.tsx`, `SalesNetCard.tsx` — добавить DualValue где есть данные
- NOTE: PayoutCard, GrossProfitCard — highlighted карточки используют `text-4xl`, DualValue должен поддерживать `primaryClass` override

**Сложность**: M | **Приоритет**: Medium

---

## Story 65.17: Адаптивная сетка 3 колонки

**Описание**: Перейти с 2-колоночной на 3-колоночную сетку (как у конкурента).

**Текущее состояние** (сверено с кодом):

- `DashboardMetricsGrid.tsx`: использует `space-y-6` для секций + `sectionGrid = 'grid grid-cols-1 md:grid-cols-2 gap-4'` внутри каждой секции
- `DashboardMetricsGridSkeleton.tsx`: использует `xl:grid-cols-4` (несогласованно с основной сеткой!)
- Конкурент: плоская 3-колоночная сетка с секционными заголовками

**Архитектурное решение**: Текущая структура (5 секций по 2 карточки) должна быть перестроена
в плоскую сетку с секционными заголовками (Story 65.18). Сетка `xl:grid-cols-3` применяется
к общему контейнеру, секционные заголовки занимают `col-span-full`.

**AC**:

- [ ] AC-65.17.1: Desktop (≥1280px): 3 колонки
- [ ] AC-65.17.2: Tablet (768-1279px): 2 колонки
- [ ] AC-65.17.3: Mobile (<768px): 1 колонка
- [ ] AC-65.17.4: Карточки одинаковой высоты в ряду (`items-stretch` на grid container)
- [ ] AC-65.17.5: `DashboardMetricsGridSkeleton` обновлен для соответствия (3 колонки вместо текущих 4)
- [ ] AC-65.17.6: Секции-разделители между логическими группами (см. Story 65.18)

**Файлы**:

- EDIT: `DashboardMetricsGrid.tsx` — плоская сетка `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch`
- EDIT: `DashboardMetricsGridSkeleton.tsx` — исправить `xl:grid-cols-4` на `xl:grid-cols-3`

**Сложность**: S | **Приоритет**: High

---

## Story 65.18: Секционные заголовки

**Описание**: Добавить заголовки секций между группами карточек (как в P&L отчёте).

**Текущее состояние** (сверено с кодом):
В `DashboardMetricsGrid.tsx` секции уже определены комментариями:

1. Секция 1: ВЫРУЧКА — OrdersCard, SalesNetCard
2. Секция 2: РАСХОДЫ WB — WbCommissionsCard, LogisticsMetricCard
3. Секция 3: К ПЕРЕЧИСЛЕНИЮ — PayoutCard, StorageAcceptanceCard
4. Секция 4: СЕБЕСТОИМОСТЬ И РЕКЛАМА — CostsCard, AdvertisingCard
5. Секция 5: ПРИБЫЛЬ — GrossProfitCard, MarginCard

**Целевые секции** (расширение под 33+ метрик из Epic 65):

1. **ПРИБЫЛЬ** — Чистая прибыль, Маржинальность, ROI
2. **ВЫРУЧКА** — Продажи, Реализация, Заказы, Процент выкупа
3. **РАСХОДЫ WB** — Логистика, Реклама, Хранение, Плат. приёмка, Прочие
4. **КОМИССИИ** — Комиссия (нетто), детализация
5. **СЕБЕСТОИМОСТЬ** — Себестоимость, Опер. расходы
6. **ФИНАНСЫ** — К перечислению, Налоги, Штрафы, Компенсации
7. **ОСТАТКИ** — Остатки, Капитализация, Оборачиваемость
8. **СРЕДНИЕ** — Ср. цена, Ср. логистика, Ср. прибыль, Возвраты

> **Примечание**: На первом этапе (с текущими 10 карточками) достаточно 5 текущих секций.
> Расширение до 8 секций произойдёт по мере реализации Wave 1-3.

**Компонент SectionHeader**:

```typescript
interface SectionHeaderProps {
  title: string           // "ВЫРУЧКА"
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}
```

В 3-колоночной сетке используется `col-span-full` для полной ширины заголовка.

**AC**:

- [ ] AC-65.18.1: Заголовки секций с subtle `border-b border-border`
- [ ] AC-65.18.2: Формат: `СЕКЦИЯ` серым uppercase 12px (`text-xs font-medium uppercase tracking-wider text-muted-foreground`)
- [ ] AC-65.18.3: Секции коллапсируемые (ChevronDown/ChevronUp из lucide-react)
- [ ] AC-65.18.4: Состояние collapsed сохраняется в localStorage (ключ: `dashboard-sections-collapsed`)
- [ ] AC-65.18.5: Aria-expanded на кнопке toggle для accessibility
- [ ] AC-65.18.6: Клик по заголовку или chevron — toggle; keyboard Enter/Space — toggle
- [ ] AC-65.18.7: Начальное состояние: все секции expanded (если нет сохранённого в localStorage)
- [ ] AC-65.18.8: На мобильном (<768px) SectionHeader занимает полную ширину (`col-span-full` в grid контексте)

**Файлы**:

- NEW: `src/components/custom/dashboard/SectionHeader.tsx` (< 80 строк)
- EDIT: `DashboardMetricsGrid.tsx` — заменить текущую структуру (5 отдельных div) на единую сетку с SectionHeader + карточки

**Сложность**: M | **Приоритет**: Medium

---

## Story 65.19: Переработка карточек на единый базовый компонент (BaseMetricCard)

**Описание**: Создать `BaseMetricCard` — единый базовый компонент для всех метрик.

**Текущее состояние** (сверено с кодом, 10 карточек):

| Карточка              | Реализация                | Размер текста  |             Граница             |     Фон      | Особенности                         |
| --------------------- | ------------------------- | :------------: | :-----------------------------: | :----------: | ----------------------------------- |
| OrdersCard            | самостоятельная           |   `text-2xl`   |             default             |   default    | `fmtNum()` + "шт."                  |
| SalesNetCard          | самостоятельная           |   `text-2xl`   |             default             |   default    | субтитр "Выкупы - Возвраты"         |
| WbCommissionsCard     | через `ExpenseMetricCard` |   `text-2xl`   |             default             |   default    | `sumNullable()` 6 полей             |
| LogisticsMetricCard   | через `ExpenseMetricCard` |   `text-2xl`   |             default             |   default    | % от выручки                        |
| PayoutCard            | самостоятельная           | **`text-4xl`** | **`border-2 border-green-500`** | **gradient** | **Highlighted**                     |
| StorageAcceptanceCard | самостоятельная           |   `text-2xl`   |             default             |   default    | storage+acceptance субтитр          |
| CostsCard             | самостоятельная           |   `text-2xl`   |             default             |   default    | COGS coverage, CTA "Заполнить"      |
| AdvertisingCard       | самостоятельная           |   `text-2xl`   |             default             |   default    | ROAS badge, % от продаж             |
| GrossProfitCard       | самостоятельная           | **`text-4xl`** |     **`border-2` dynamic**      | **gradient** | **Highlighted**, COGS coverage gate |
| MarginCard            | самостоятельная           | **`text-4xl`** |     **`border-2` dynamic**      | **gradient** | **Highlighted**, п.п. comparison    |

**Ключевые паттерны для абстракции**:

1. **2 варианта**: standard (`text-2xl`, default border) и highlighted (`text-4xl`, `border-2`, gradient)
2. **Общий header**: icon + title + Tooltip (идентичен во всех 10 карточках)
3. **Общий comparison**: `calculateComparison()` + `TrendIndicator` + `ComparisonBadge` (8 из 10)
4. **Загрузка/ошибка**: `StandardMetricSkeleton` / `HighlightedMetricSkeleton` + `MetricCardError`
5. **Доп. контент**: субтитры, бейджи, CTA-кнопки — через slot/children

**Целевая архитектура**:

```typescript
interface BaseMetricCardProps {
  // Identity
  title: string
  tooltip: string
  icon: React.ComponentType<{ className?: string }>  // не LucideIcon — см. текущие типы
  accentColor: string                                 // e.g. "text-blue-500" (icon color)

  // Value
  value: number | null | undefined
  previousValue?: number | null | undefined
  format: 'currency' | 'percent' | 'number' | 'days'
  inverted?: boolean                    // передается в calculateComparison()

  // Dual value (Story 65.16)
  secondaryValue?: string              // "14,09%" — pre-computed, displayed after separator

  // Variant
  variant?: 'standard' | 'highlighted' // default: 'standard'
  valueColor?: string                  // override: e.g. dynamic color based on margin level

  // Sentiment background (Story 65.15)
  sentimentBg?: boolean                // enable bg-green-50 / bg-red-50 based on comparison

  // Slots for custom content
  badge?: React.ReactNode              // ROAS badge, coverage indicator
  actions?: React.ReactNode            // CTA buttons ("Заполнить COGS")
  subtitle?: React.ReactNode           // "Выкупы X - Возвраты Y"
  breakdownCount?: number              // shows "📋 N" icon in header
  onBreakdownClick?: () => void

  // States
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void

  // Testing & styling
  className?: string
  'data-testid'?: string
}
```

> **Отличия от исходного проекта**:
>
> - `icon` тип: `React.ComponentType<{ className?: string }>` (как в `ExpenseMetricCard`), не `LucideIcon`
> - Добавлен `variant` для highlighted карточек (PayoutCard, GrossProfitCard, MarginCard)
> - Добавлен `subtitle` slot для произвольного субтитра (SalesNetCard, StorageAcceptanceCard)
> - Добавлен `valueColor` для динамического цвета (MarginCard: зелёный/жёлтый/красный по уровню)
> - Убран `sentiment` prop — используется `sentimentBg: boolean` + автоматика через comparison.direction
> - Добавлен `data-testid` для тестирования (текущий паттерн в ExpenseMetricCard)

**AC**:

- [ ] AC-65.19.1: BaseMetricCard реализует все паттерны: dual value, comparison, sentiment bg, highlighted variant
- [ ] AC-65.19.2: Все существующие 10 карточек переведены на BaseMetricCard (можно поэтапно)
- [ ] AC-65.19.3: Новые карточки (Wave 1-3) используют BaseMetricCard
- [ ] AC-65.19.4: BaseMetricCard < 150 строк; sub-components в отдельном файле
- [ ] AC-65.19.5: Unit-тесты покрывают: standard variant, highlighted variant, loading, error, comparison, dual value, sentiment bg
- [ ] AC-65.19.6: `ExpenseMetricCard` сохраняется как thin wrapper вокруг BaseMetricCard (обратная совместимость)
- [ ] AC-65.19.7: `MetricCardStates.tsx` (skeleton, error) интегрированы в BaseMetricCard
- [ ] AC-65.19.8: Accessibility: `role="article"`, `aria-label` на data state; `aria-busy="true"` на loading skeleton (NOTE: текущий `StandardMetricSkeleton` использует `aria-busy="true" aria-hidden="true"` одновременно — это анти-паттерн. BaseMetricCard должен использовать только `aria-busy="true"` в loading state, без `aria-hidden`)

**Файлы**:

- NEW: `src/components/custom/dashboard/BaseMetricCard.tsx` (< 150 строк)
- NEW: `src/components/custom/dashboard/BaseMetricCardParts.tsx` — CardHeader, CardValue, CardComparison sub-components
- EDIT: `ExpenseMetricCard.tsx` → тонкий wrapper вокруг BaseMetricCard с `inverted=true`
- EDIT: `OrdersCard.tsx`, `SalesNetCard.tsx`, `PayoutCard.tsx`, `GrossProfitCard.tsx`, `MarginCard.tsx`, `CostsCard.tsx`, `AdvertisingCard.tsx`, `StorageAcceptanceCard.tsx` → упрощение через BaseMetricCard
- NOTE: `WbCommissionsCard.tsx` и `LogisticsMetricCard.tsx` уже используют `ExpenseMetricCard` — каскадный рефакторинг

**Сложность**: L | **Приоритет**: High (блокирует Wave 1-3 и Stories 65.15-65.16)

---

## Дизайн-спецификация карточки метрики

### Анатомия карточки (на основе конкурента + текущих паттернов)

**Standard variant** (OrdersCard, SalesNetCard, ExpenseMetricCard, etc.):

```
┌─────────────────────────────────────────┐
│ [Icon] Название метрики    [ℹ] [📋 N]  │  ← Header: gap-2, items-center, justify-between
│                                          │
│ 23 748 ₽ / 14,09%                       │  ← mt-2, text-2xl bold / text-base muted
│                                          │
│ ↗ +10,5%  vs 21 000 ₽                  │  ← mt-2, TrendIndicator + ComparisonBadge
│                                          │
│ [Доп. контент: subtitle, CTA, etc.]    │  ← mt-1, text-xs text-gray-400
└─────────────────────────────────────────┘
```

**Highlighted variant** (PayoutCard, GrossProfitCard, MarginCard):

```
┌─────────────────────────────────────────┐
│ [Icon] Название метрики    [ℹ]          │  ← border-2 + bg-gradient-to-br
│                                          │
│ 40 794 ₽                                │  ← mt-3, text-4xl bold (larger!)
│                                          │
│ ↗ +10,5%                               │  ← mt-2
│                                          │
│ [Warning/coverage if applicable]        │  ← mt-2, text-xs text-yellow-600
└─────────────────────────────────────────┘
```

### Размеры и отступы (сверено с текущим кодом)

| Элемент          | Standard    | Highlighted   | Tailwind class                                                                                                     |
| ---------------- | ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Card padding     | 16px        | 16px          | `p-4`                                                                                                              |
| Card min-height  | 120px       | 140px         | `min-h-[120px]` / `min-h-[140px]`                                                                                  |
| Card border      | default     | 2px colored   | — / `border-2`                                                                                                     |
| Icon             | 16x16       | 16x16         | `h-4 w-4`                                                                                                          |
| Title            | 14px medium | 14px medium   | `text-sm font-medium text-muted-foreground`                                                                        |
| Primary value mt | mt-2        | mt-3          | `mt-2` / `mt-3`                                                                                                    |
| Primary value    | 24px bold   | **36px bold** | `text-2xl font-bold` / `text-4xl font-bold`                                                                        |
| Secondary value  | 14px muted  | —             | `text-base text-muted-foreground`                                                                                  |
| Comparison gap   | mt-2        | mt-2          | `mt-2 flex items-center gap-1.5` (NOTE: GrossProfitCard currently uses `gap-2` — нужно унифицировать на `gap-1.5`) |
| Subtitle/extras  | mt-1        | mt-1          | `text-xs text-gray-400`                                                                                            |
| Info tooltip     | 14px        | 14px          | TooltipContent `size="md"`                                                                                         |

### Цветовая палитра по метрикам (сверено с текущим кодом)

| Карточка           | Accent (icon + value color) | Текущий CSS класс                                                            |
| ------------------ | --------------------------- | ---------------------------------------------------------------------------- |
| Заказы             | blue                        | `text-blue-500` (icon), `text-blue-600` (value)                              |
| Продажи            | green                       | `text-green-500` (icon), `text-green-600` (value)                            |
| Комиссии WB        | red                         | `text-red-500` (через ExpenseMetricCard)                                     |
| Логистика          | red                         | `text-red-500` (через ExpenseMetricCard)                                     |
| К перечислению     | green                       | `text-green-600`                                                             |
| Хранение и приёмка | red                         | `text-red-500`                                                               |
| Себестоимость      | gray                        | `text-gray-500` (icon), `text-gray-600` (value)                              |
| Реклама            | yellow                      | `text-yellow-600`                                                            |
| Валовая прибыль    | dynamic                     | `text-green-600` (profit >=0) / `text-red-600` (loss)                        |
| Маржинальность     | dynamic                     | `text-green-600` (>=30%) / `text-yellow-600` (>=15%) / `text-red-600` (<15%) |

**Sentiment backgrounds** (Story 65.15):

| Sentiment       | Background    | Border             |
| --------------- | ------------- | ------------------ |
| Positive (good) | `bg-green-50` | `border-green-200` |
| Negative (bad)  | `bg-red-50`   | `border-red-200`   |
| Neutral         | default       | default            |

### Анимации

| Действие                | Анимация        | CSS                                 | Duration        |
| ----------------------- | --------------- | ----------------------------------- | --------------- |
| Hover                   | shadow          | `transition-shadow hover:shadow-md` | 150ms (default) |
| Value change            | Fade-in         | `transition-opacity`                | 300ms           |
| Skeleton to Content     | Fade-in         | `animate-in fade-in`                | 200ms           |
| Breakdown open          | Scale-in + fade | `animate-in zoom-in-95 fade-in`     | 200ms           |
| Background color change | Transition      | `transition-colors`                 | 300ms           |

> **Accessibility**: Все анимации должны уважать `prefers-reduced-motion`. Tailwind 4 поддерживает
> `motion-safe:` и `motion-reduce:` modifiers. ComparisonBadge уже использует `transition-transform hover:scale-105`
> -- нужно обернуть в `motion-safe:`.

### Отличие формата сравнения от конкурента

Конкурент: `-1 907 (-7,43%) ↘` — inline текст с абсолютной и процентной разницей + стрелка.

Наша реализация: `TrendIndicator` (стрелка) + `ComparisonBadge` (процент в badge) + tooltip с абсолютной разницей.

**Решение**: Сохраняем текущий формат ComparisonBadge, т.к. он более компактный и уже протестирован.
При необходимости можно добавить inline-формат как альтернативный вариант в BaseMetricCard через prop.

---

## Зависимости Wave 4

```
65.19 (BaseMetricCard) → ПЕРВЫЙ (блокирует 65.15, 65.16)
65.15 (Цветовая кодировка) → 65.19
65.16 (Dual value) → 65.19
65.17 (3 колонки) → нет зависимостей
65.18 (Секции) → 65.17 (нужна плоская сетка для col-span-full)
```

**Рекомендуемый порядок**: 65.19 → 65.17 → 65.18 → 65.16 → 65.15

**Обоснование порядка**:

1. **65.19 BaseMetricCard** — архитектурный фундамент для всех остальных историй
2. **65.17 Сетка 3 колонки** — простое изменение, нет зависимостей, разблокирует секции
3. **65.18 Секции** — нужна плоская сетка (из 65.17) для `col-span-full` заголовков
4. **65.16 Dual value** — нужен BaseMetricCard для единого DualValue slot
5. **65.15 Цветовая кодировка** — последний, т.к. нужен BaseMetricCard + наиболее субъективный

## Оценка трудозатрат

| Story                      | Размер | Часы      | Зависимость |
| -------------------------- | ------ | --------- | ----------- |
| 65.15 Цветовая кодировка   | M      | 4-6       | 65.19       |
| 65.16 Dual value формат    | M      | 3-4       | 65.19       |
| 65.17 3-колоночная сетка   | S      | 1-2       | —           |
| 65.18 Секционные заголовки | M      | 3-4       | 65.17       |
| 65.19 BaseMetricCard       | L      | 8-12      | ПЕРВЫЙ      |
| **ИТОГО**                  |        | **19-28** |             |

---

## Validation Notes

### Validated by: UX Designer + Product Manager (2026-02-15)

**What was validated**:

1. All 10 existing dashboard card components read and analyzed for patterns
2. Sentiment mapping verified against actual `calculateComparison()` calls in each card
3. Design tokens (colors, sizes, spacing) verified against actual Tailwind classes in code
4. Accessibility patterns verified (ARIA attributes, keyboard navigation)
5. Utility functions reviewed (`formatCurrency`, `formatPercentage`, `calculateComparison`)
6. Existing component hierarchy analyzed (ExpenseMetricCard as partial abstraction)

**Issues found and fixed**:

1. **Story numbering**: Renumbered 65.16-65.20 to 65.15-65.19 to align with epic definition (65.15=color, 65.16=dual value, 65.17=grid)
2. **Sentiment function signature**: Changed from custom `direction: 'up' | 'down' | 'flat'` to existing `TrendDirection` from `comparison-helpers.ts` — eliminates need for separate mapping
3. **MarginCard special case**: Documented that MarginCard does NOT use `calculateComparison()` — it computes p.p. difference directly. Needs separate sentiment logic
4. **Highlighted variant missing from spec**: Added `variant: 'standard' | 'highlighted'` to BaseMetricCard props — 3 of 10 cards (Payout, GrossProfit, Margin) use `text-4xl`, `border-2`, gradients
5. **Icon type**: Changed from `LucideIcon` to `React.ComponentType<{ className?: string }>` to match existing `ExpenseMetricCard` pattern
6. **Grid skeleton inconsistency**: `DashboardMetricsGridSkeleton` uses `xl:grid-cols-4` while main grid uses `md:grid-cols-2` — documented in Story 65.17
7. **Metric mapping enriched**: Added `invertComparison` boolean and current code reference for each card
8. **Хранение naming**: Corrected from "Хранение" to "Хранение и приёмка" (StorageAcceptanceCard combines both)
9. **Accessibility gaps**: Added prefers-reduced-motion support, aria-expanded for collapsible sections, keyboard navigation for section toggles
10. **Comparison format deviation**: Documented that our ComparisonBadge differs from competitor inline format as a deliberate design choice

**Coverage assessment**:

- All 6 competitor UX patterns from epic covered:
  - Color coding of card backgrounds -- Story 65.15
  - Dual value format (`rub / %`) -- Story 65.16
  - Period comparison with arrows -- already implemented (ComparisonBadge + TrendIndicator)
  - Breakdown tooltips -- covered in BaseMetricCard spec (breakdownCount + onBreakdownClick)
  - 3-column grid layout -- Story 65.17
  - Section grouping -- Story 65.18
- Widget settings toggle (pattern #6 from epic) is Story 65.8 (Wave 2), not Wave 4
- Import button on Storage (pattern #5 from epic) is a separate feature, not Wave 4 scope

**No missing stories identified** -- the 5 stories comprehensively cover all Wave 4 UX scope.

---

## PM Final Validation -- 2026-02-15

### Validation Summary

| Story | Verdict              | Notes                                                                                                                                                                                                                                        |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 65.15 | ⚠️ NEEDS FIX (FIXED) | Added AC-65.15.8 for highlighted cards exclusion; removed PayoutCard/GrossProfitCard/MarginCard from EDIT list (they have own gradient bg, sentiment bg conflicts)                                                                           |
| 65.16 | ⚠️ NEEDS FIX (FIXED) | Fixed `formatPercentage(14.09)` output from `"14,1 %"` to `"14,09 %"` (maximumFractionDigits=2, not 1); added AC-65.16.6 for screen reader separator handling                                                                                |
| 65.17 | ✅ READY             | All breakpoints correct (md=768px, xl=1280px); skeleton inconsistency correctly identified; `items-stretch` is valid though it's CSS Grid default                                                                                            |
| 65.18 | ⚠️ NEEDS FIX (FIXED) | Added AC-65.18.7 (initial state: all expanded) and AC-65.18.8 (mobile col-span-full); all other ACs verified against codebase                                                                                                                |
| 65.19 | ⚠️ NEEDS FIX (FIXED) | Fixed accessibility anti-pattern note in AC-65.19.8 (`aria-busy` + `aria-hidden` simultaneous usage); documented `mt-2` vs `mt-3` difference for standard vs highlighted; documented GrossProfitCard `gap-2` deviation (should be `gap-1.5`) |

### Component Inventory Verified

| Component                    | Status    | Path                                                               | Verified                                                                            |
| ---------------------------- | --------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| BaseMetricCard               | to create | `src/components/custom/dashboard/BaseMetricCard.tsx`               | N/A                                                                                 |
| BaseMetricCardParts          | to create | `src/components/custom/dashboard/BaseMetricCardParts.tsx`          | N/A                                                                                 |
| DualValue                    | to create | `src/components/custom/dashboard/DualValue.tsx`                    | N/A                                                                                 |
| SectionHeader                | to create | `src/components/custom/dashboard/SectionHeader.tsx`                | N/A                                                                                 |
| card-sentiment utility       | to create | `src/lib/card-sentiment.ts`                                        | N/A                                                                                 |
| OrdersCard                   | exists    | `src/components/custom/dashboard/OrdersCard.tsx`                   | ✅ 103 lines, uses `calculateComparison(totalOrders, prev, false)`                  |
| SalesNetCard                 | exists    | `src/components/custom/dashboard/SalesNetCard.tsx`                 | ✅ 112 lines, uses `calculateComparison(saleGross, prev, false)`                    |
| PayoutCard                   | exists    | `src/components/custom/dashboard/PayoutCard.tsx`                   | ✅ 108 lines, highlighted, `text-4xl`, `border-2 border-green-500`, gradient        |
| GrossProfitCard              | exists    | `src/components/custom/dashboard/GrossProfitCard.tsx`              | ✅ 147 lines, highlighted, dynamic border/gradient, COGS gate                       |
| MarginCard                   | exists    | `src/components/custom/dashboard/MarginCard.tsx`                   | ✅ 148 lines, highlighted, п.п. comparison (no `calculateComparison`)               |
| CostsCard                    | exists    | `src/components/custom/dashboard/CostsCard.tsx`                    | ✅ 163 lines, uses `calculateComparison(cogs, prev, true)`                          |
| AdvertisingCard              | exists    | `src/components/custom/dashboard/AdvertisingCard.tsx`              | ✅ 123 lines, uses `calculateComparison(spend, prev, true)`                         |
| StorageAcceptanceCard        | exists    | `src/components/custom/dashboard/StorageAcceptanceCard.tsx`        | ✅ 127 lines, uses `calculateComparison(total, prev, true)`                         |
| ExpenseMetricCard            | exists    | `src/components/custom/dashboard/ExpenseMetricCard.tsx`            | ✅ 186 lines, base for WbCommissions + Logistics, `inverted=true`                   |
| WbCommissionsCard            | exists    | `src/components/custom/dashboard/WbCommissionsCard.tsx`            | ✅ 80 lines, thin wrapper over ExpenseMetricCard                                    |
| LogisticsMetricCard          | exists    | `src/components/custom/dashboard/LogisticsMetricCard.tsx`          | ✅ 75 lines, thin wrapper over ExpenseMetricCard                                    |
| DashboardMetricsGrid         | exists    | `src/components/custom/dashboard/DashboardMetricsGrid.tsx`         | ✅ 256 lines, `sectionGrid = 'grid grid-cols-1 md:grid-cols-2 gap-4'`               |
| DashboardMetricsGridSkeleton | exists    | `src/components/custom/dashboard/DashboardMetricsGridSkeleton.tsx` | ✅ 89 lines, BUG: `xl:grid-cols-4` (should be 3)                                    |
| MetricCardStates             | exists    | `src/components/custom/dashboard/MetricCardStates.tsx`             | ✅ 121 lines, StandardMetricSkeleton + HighlightedMetricSkeleton + MetricCardError  |
| TrendIndicator               | exists    | `src/components/custom/TrendIndicator.tsx`                         | ✅ 80 lines, accepts `TrendDirection`                                               |
| ComparisonBadge              | exists    | `src/components/custom/ComparisonBadge.tsx`                        | ✅ 100 lines, `transition-transform hover:scale-105` (needs `motion-safe:` wrap)    |
| comparison-helpers           | exists    | `src/lib/comparison-helpers.ts`                                    | ✅ 115 lines, exports `TrendDirection`, `ComparisonResult`, `calculateComparison()` |
| utils (formatters)           | exists    | `src/lib/utils.ts`                                                 | ✅ 150 lines, exports `formatCurrency`, `formatPercentage`, `cn`                    |

### Type Alignment Verified

| Type                          | Location                                                   | Status                                                                                             |
| ----------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `TrendDirection`              | `src/lib/comparison-helpers.ts:19`                         | ✅ `'positive' \| 'negative' \| 'neutral'` -- matches story refs                                   |
| `ComparisonResult`            | `src/lib/comparison-helpers.ts:24`                         | ✅ `{ percentageChange, formattedPercentage, absoluteDifference, formattedDifference, direction }` |
| `calculateComparison()`       | `src/lib/comparison-helpers.ts:73`                         | ✅ `(current, previous, invertComparison?) => ComparisonResult \| null`                            |
| `formatPercentage()`          | `src/lib/utils.ts:31`                                      | ✅ Divides by 100, uses `Intl.NumberFormat('ru-RU', { style: 'percent', maxFractionDigits: 2 })`   |
| `formatCurrency()`            | `src/lib/utils.ts:17`                                      | ✅ `Intl.NumberFormat('ru-RU', { currency: 'RUB', maxFractionDigits: 2 })`                         |
| `ExpenseMetricCardProps.icon` | `src/components/custom/dashboard/ExpenseMetricCard.tsx:22` | ✅ `React.ComponentType<{ className?: string }>` -- matches BaseMetricCard spec                    |

### Tailwind Classes Verified

| Class                                  | Usage                     | Status                                                           |
| -------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `bg-green-50`                          | Sentiment positive bg     | ✅ Used in 8+ files in codebase                                  |
| `bg-red-50`                            | Sentiment negative bg     | ✅ Used in 15+ files in codebase                                 |
| `border-green-200`                     | Sentiment positive border | ✅ Used in 20+ files in codebase                                 |
| `border-red-200`                       | Sentiment negative border | ✅ Used in 20+ files in codebase                                 |
| `text-muted-foreground`                | Secondary value class     | ✅ CSS var `--muted-foreground` defined in globals.css           |
| `border-border`                        | Section header border     | ✅ CSS var `--border` defined in globals.css                     |
| `tracking-wider`                       | Section header text       | ✅ Standard Tailwind utility, used in 2 existing files           |
| `col-span-full`                        | Section header grid       | ✅ Standard Tailwind utility (not yet used but valid)            |
| `items-stretch`                        | Grid container            | ✅ Standard Tailwind utility (CSS Grid default)                  |
| `transition-shadow hover:shadow-md`    | Card hover                | ✅ Used in all 10+ card components                               |
| `transition-colors`                    | Bg color change animation | ✅ Used in 11 dashboard component files                          |
| `transition-transform hover:scale-105` | ComparisonBadge hover     | ✅ Verified in ComparisonBadge.tsx:77                            |
| `animate-in fade-in`                   | Skeleton transition       | ✅ Provided by `tailwindcss-animate` plugin                      |
| `motion-safe:` / `motion-reduce:`      | Reduced motion            | ✅ Tailwind 4 native modifiers                                   |
| `text-2xl font-bold`                   | Standard value            | ✅ Used in all standard cards                                    |
| `text-4xl font-bold`                   | Highlighted value         | ✅ Used in PayoutCard, GrossProfitCard, MarginCard               |
| `text-sm font-medium`                  | Card title                | ✅ Used in all 10 cards                                          |
| `h-4 w-4`                              | Icon size                 | ✅ Used in all 10 cards                                          |
| `text-xs font-medium uppercase`        | Section header            | ✅ Valid standard Tailwind utilities                             |
| `gap-1.5`                              | Comparison row            | ✅ Used in 7 of 10 cards (GrossProfitCard deviates with `gap-2`) |

### Design System Verified

| Token                 | Spec Value  | Code Value                                                         | Status                                  |
| --------------------- | ----------- | ------------------------------------------------------------------ | --------------------------------------- |
| Tailwind version      | 4           | `^4.0.0` (package.json)                                            | ✅                                      |
| tailwindcss-animate   | required    | `^1.0.7` (package.json)                                            | ✅                                      |
| Global reduced motion | required    | `globals.css` `@media (prefers-reduced-motion)` rule               | ✅ Global rule exists, zeroes durations |
| Card shadow           | `shadow`    | `rounded-xl border bg-card text-card-foreground shadow` (card.tsx) | ✅                                      |
| Card padding          | `p-4`       | `CardContent className="p-4"` in all cards                         | ✅                                      |
| shadcn Tooltip size   | `size="md"` | Custom `size` prop on TooltipContent: sm=180px, md=280px, lg=350px | ✅                                      |

### Accessibility Audit

| Requirement                   | Status        | Evidence                                                                                                                    |
| ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `role="article"` on cards     | ✅            | All 10 cards have `role="article"`                                                                                          |
| `aria-label` on cards         | ✅            | All 10 cards have descriptive `aria-label`                                                                                  |
| `aria-hidden="true"` on icons | ✅            | All card icons have `aria-hidden="true"`                                                                                    |
| `aria-label` on info buttons  | ✅            | All tooltip trigger buttons have Russian `aria-label`                                                                       |
| `aria-busy` on skeleton       | ⚠️ FIX NEEDED | `StandardMetricSkeleton` uses `aria-busy="true" aria-hidden="true"` simultaneously -- anti-pattern documented in AC-65.19.8 |
| `aria-expanded` for sections  | ✅            | Specified in AC-65.18.5                                                                                                     |
| Keyboard navigation           | ✅            | AC-65.18.6 specifies Enter/Space for toggle                                                                                 |
| `prefers-reduced-motion`      | ✅            | Global CSS rule in `globals.css` zeroes all animation durations                                                             |
| WCAG contrast on tinted bg    | ✅            | AC-65.15.5 requires verification of contrast on `bg-green-50`/`bg-red-50`                                                   |

### Issues Found and Fixed During Validation

1. **`formatPercentage()` output error** (Story 65.16): Note incorrectly stated `formatPercentage(14.09)` returns `"14,1 %"`. Actual: function uses `maximumFractionDigits: 2`, so returns `"14,09 %"`. **FIXED** in spec.

2. **Highlighted cards sentiment bg conflict** (Story 65.15): PayoutCard, GrossProfitCard, MarginCard have existing `bg-gradient-to-br` backgrounds. Applying `bg-green-50`/`bg-red-50` would conflict. **FIXED**: Added AC-65.15.8 excluding highlighted cards; updated file edit list.

3. **Screen reader separator handling** (Story 65.16): DualValue separator `/` needs proper semantic handling to avoid being read as a separate element. **FIXED**: Added AC-65.16.6.

4. **Section initial state missing** (Story 65.18): No AC specified whether sections start collapsed or expanded. **FIXED**: Added AC-65.18.7 (default: all expanded).

5. **Mobile section header** (Story 65.18): No explicit AC for mobile layout of section headers. **FIXED**: Added AC-65.18.8.

6. **`aria-busy` + `aria-hidden` anti-pattern** (Story 65.19): Current skeletons use both simultaneously, which is contradictory. **FIXED**: Documented in AC-65.19.8 that BaseMetricCard must use only `aria-busy` without `aria-hidden`.

7. **GrossProfitCard gap deviation** (Design Spec): Uses `gap-2` while all other cards use `gap-1.5` for comparison row. **FIXED**: Documented in design spec table as deviation to unify.

8. **Value margin-top difference** (Design Spec): Standard cards use `mt-2`, highlighted use `mt-3`. Was implicit in anatomy diagram but not in the sizing table. **FIXED**: Added explicit row to sizing table.

### TDD Readiness: CONFIRMED

- **Component tests**: READY -- All ACs are measurable and testable. Component props, variants, CSS classes, and behavior specified with enough precision for unit tests using Vitest + Testing Library.
- **Accessibility tests**: READY -- WCAG requirements explicit (contrast ratios, ARIA attributes, keyboard navigation, reduced motion). Testable with `@axe-core/playwright`.
- **Visual regression tests**: READY -- All Tailwind classes specified; animations have concrete durations; responsive breakpoints are explicit standard Tailwind values (md=768px, xl=1280px).
- **Integration tests**: READY -- Component dependencies mapped; cascading behavior documented (ExpenseMetricCard -> WbCommissions/Logistics); story execution order specified.

### Recommended Execution Order (confirmed)

```
65.19 (BaseMetricCard)  --> FIRST: architectural foundation
65.17 (3-column grid)   --> independent, simple
65.18 (Section headers) --> depends on 65.17 flat grid
65.16 (Dual value)      --> depends on 65.19 BaseMetricCard
65.15 (Color coding)    --> depends on 65.19 BaseMetricCard
```
