# Epic 68-FE: Мониторинг здоровья системы

**Статус**: 📋 Planned
**Приоритет**: P2 (High)
**Оценка**: 34 SP (7 историй)
**Спринт**: Q1 2026, Sprint 3+
**Маршрут**: `/monitoring`
**Backend**: Epic 49 (8 endpoints) + Epic 67 (3 endpoints) — READY

---

## Обзор

Новая страница мониторинга, показывающая клиентам состояние здоровья их данных: когда и как парсились данные, метрики успешности, полнота данных, статус Telegram-уведомлений. Позволяет клиенту понять, насколько исправно работает система и принять действия при проблемах.

## Целевые персоны

### Владелец бизнеса (Primary)
- Хочет быстро понять: "Всё ли ОК с моими данными?"
- Нужны простые визуальные индикаторы (зелёный/жёлтый/красный)
- Не хочет разбираться в технических деталях, если всё работает

### Финансовый директор (Secondary)
- Нужно понимать полноту данных для отчётов
- Хочет видеть историческую надёжность системы
- Важно знать, все ли финансовые данные загружены

## Доступные Backend API

### Epic 67: Pipeline Health Dashboard (3 НОВЫХ эндпоинта)

| Эндпоинт | Назначение | Cache | p95 |
|----------|-----------|-------|-----|
| `GET /v1/monitoring/dashboard` | Лёгкая сводка (~2KB) | 60s | <200ms |
| `GET /v1/monitoring/pipeline-health-grid` | Heatmap (~5-25KB) | 30-120s | <500ms |
| `GET /v1/monitoring/telegram-health` | Telegram детали | 120s | <300ms |

### Epic 49: Task Monitoring (8 эндпоинтов)

| Эндпоинт | Назначение |
|----------|-----------|
| `GET /v1/monitoring/task-execution` | Gap detection для 8 задач |
| `GET /v1/monitoring/data-completeness` | Полнота 6 таблиц |
| `GET /v1/monitoring/missing-dates` | Пропущенные даты |
| `GET /v1/monitoring/health-report` | Ежедневный отчёт |
| `GET /v1/monitoring/health-reports` | История отчётов |
| `GET /v1/monitoring/recovery-status` | Статус восстановления |
| `POST /v1/monitoring/recover` | Ручной recovery |
| `POST /v1/monitoring/recover-data` | Восстановление дат |

### Важно: авторизация
Все monitoring эндпоинты используют `cabinetId` как **query parameter**, НЕ заголовок `X-Cabinet-Id`.

## Стратегия загрузки данных

```
1. GET /v1/monitoring/dashboard         ← первый запрос (лёгкий, ~2KB)
   ├── Health Score виджет
   ├── Pipeline Status карточки
   ├── Telegram quick status
   └── Data Completeness сводка

2. GET /v1/monitoring/pipeline-health-grid  ← по навигации на вкладку Heatmap
   └── Heatmap сетка (тяжёлый запрос)

3. GET /v1/monitoring/telegram-health      ← по навигации на вкладку Telegram
   └── Детальная Telegram-панель

4. GET /v1/monitoring/recovery-status      ← по навигации на вкладку Recovery
   └── Таблица восстановления
```

## Polling-стратегия

```typescript
const MONITORING_QUERY_CONFIG = {
  dashboard: { refetchInterval: 60_000, staleTime: 50_000 },
  gridCurrent: { refetchInterval: 30_000, staleTime: 25_000 },
  gridPast: { refetchInterval: 120_000, staleTime: 110_000 },
  telegram: { refetchInterval: 120_000, staleTime: 110_000 },
};
```

## 11 Пайплайнов

| pipelineId | Название (ru) | Категория | Частота |
|------------|--------------|-----------|---------|
| `fbo_orders_sync` | FBO Заказы | high_frequency | каждые 15 мин |
| `fbo_sales_sync` | FBO Продажи | high_frequency | каждые 15 мин |
| `orders_fbs_sync` | FBS Заказы | high_frequency | каждые 5 мин |
| `supply_sync` | Поставки | high_frequency | каждые 15 мин |
| `adv_sync` | Реклама | daily | ежедневно |
| `daily_sales_sync` | Ежедневные продажи | daily | ежедневно |
| `stocks_sync` | Остатки на складах | daily | ежедневно |
| `paid_storage_import` | Платное хранение | daily | ежедневно |
| `product_imt_sync` | Товары (IMT) | daily | ежедневно |
| `finances_weekly_ingest` | Финансовый отчёт | weekly | понедельник |
| `daily_stocks_sync` | Покрытие остатков | daily | ежедневно |

## Структура файлов

```
src/app/(dashboard)/monitoring/
├── page.tsx                              # Страница мониторинга
├── components/
│   ├── MonitoringPageContent.tsx          # Основной контейнер с табами
│   ├── HealthScoreWidget.tsx             # Круговой индикатор 0-100
│   ├── PipelineStatusGrid.tsx            # 11 карточек пайплайнов
│   ├── PipelineHeatmap.tsx               # GitHub-style heatmap
│   ├── HeatmapCell.tsx                   # Одна ячейка с tooltip
│   ├── HeatmapTooltip.tsx                # Popup с деталями
│   ├── DataCompletenessTable.tsx          # Таблица полноты данных
│   ├── TelegramStatusCard.tsx            # Quick status
│   ├── TelegramDetailPanel.tsx           # Полная панель Telegram
│   ├── RecoveryPanel.tsx                 # Панель восстановления
│   ├── HealthHistoryChart.tsx            # График истории
│   └── MonitoringEmptyState.tsx          # Empty state нового кабинета
├── hooks/
│   ├── use-monitoring-dashboard.ts       # useQuery для dashboard
│   ├── use-pipeline-grid.ts             # useQuery для grid
│   ├── use-telegram-health.ts           # useQuery для telegram
│   └── use-recovery.ts                  # useQuery + useMutation для recovery
└── types/
    └── monitoring.ts                     # TypeScript интерфейсы
```

---

## Story 68.1-FE: Маршрутизация и каркас страницы

**Приоритет**: P1 (Critical — блокирует все остальные)
**Оценка**: 3 SP

### Описание
Как пользователь, я хочу видеть пункт "Мониторинг" в боковой навигации и перейти на страницу мониторинга, чтобы следить за здоровьем системы.

### Критерии приёмки
- AC1: Маршрут `/monitoring` доступен из sidebar-навигации (иконка Activity)
- AC2: Пункт меню: "Мониторинг" с иконкой `Activity` из lucide-react
- AC3: Страница использует dashboard layout (`(dashboard)` group)
- AC4: Каркас с табами: "Обзор" (default), "Heatmap", "Telegram", "Восстановление", "История"
- AC5: TypeScript типы для всех monitoring API response в `types/monitoring.ts`
- AC6: Query hooks созданы: `use-monitoring-dashboard.ts`, `use-pipeline-grid.ts`, `use-telegram-health.ts`, `use-recovery.ts`
- AC7: Route добавлен в `src/lib/routes.ts`
- AC8: Responsive: табы сворачиваются в dropdown на мобильных

### Технические детали
- API: Пока не вызывается (только каркас)
- Компоненты: `page.tsx`, `MonitoringPageContent.tsx`, `types/monitoring.ts`
- Маршрут: `src/app/(dashboard)/monitoring/page.tsx`

### Файлы
| Файл | Действие |
|------|----------|
| `src/app/(dashboard)/monitoring/page.tsx` | Создать |
| `src/app/(dashboard)/monitoring/components/MonitoringPageContent.tsx` | Создать |
| `src/app/(dashboard)/monitoring/types/monitoring.ts` | Создать |
| `src/app/(dashboard)/monitoring/hooks/use-monitoring-dashboard.ts` | Создать |
| `src/app/(dashboard)/monitoring/hooks/use-pipeline-grid.ts` | Создать |
| `src/app/(dashboard)/monitoring/hooks/use-telegram-health.ts` | Создать |
| `src/app/(dashboard)/monitoring/hooks/use-recovery.ts` | Создать |
| `src/lib/routes.ts` | Изменить — добавить MONITORING route |
| `src/components/custom/layout/Sidebar.tsx` (или аналог) | Изменить — добавить пункт меню |

### Зависимости
- Блокирует: 68.2, 68.3, 68.4, 68.5, 68.6, 68.7

---

## Story 68.2-FE: Health Score виджет и статусы пайплайнов

**Приоритет**: P1 (Critical)
**Оценка**: 5 SP

### Описание
Как владелец бизнеса, я хочу видеть общий показатель здоровья системы (0-100) и статусы всех 11 пайплайнов, чтобы быстро понять, всё ли работает нормально.

### Критерии приёмки
- AC1: Health Score отображается как круговой/полукруговой индикатор (0-100)
- AC2: Цвет индикатора: зелёный (>=80), жёлтый (50-79), красный (<50)
- AC3: overallStatus показан текстом: "Система работает" / "Есть проблемы" / "Критические проблемы"
- AC4: Количество активных алертов показано как badge
- AC5: 11 карточек пайплайнов, сгруппированных по категориям (Высокочастотные / Ежедневные / Еженедельные)
- AC6: Каждая карточка показывает: название, статус-бейдж (5 цветов), lastSuccessAt (относительное время), dataLagMinutes, successRate24h (прогресс-бар)
- AC7: Цвета статусов: healthy=green-500, warning=yellow-500, critical=red-500, stale=gray-500, no_data=gray-300
- AC8: Loading skeleton при загрузке
- AC9: Empty state для нового кабинета (healthScore=0, все no_data): "Данные ещё не загружены. Синхронизация начнётся автоматически."
- AC10: Polling каждые 60 секунд
- AC11: WCAG 2.1 AA — ARIA labels, keyboard navigation

### Технические детали
- API: `GET /v1/monitoring/dashboard?cabinetId={cabinetId}&locale=ru`
- Health Score формула: `pipelineAvg*0.5 + completenessAvg*0.3 + telegramRate*0.1 + noAlerts*0.1`
- Вкладка: "Обзор" (default tab)

### UI/UX заметки
```
┌─────────────────────────────────────────────────────┐
│  Health Score: 95        Система работает    [0 ⚠️]  │
│  [████████████████░░] 95/100                        │
├─────────────────────────────────────────────────────┤
│  Высокочастотные (каждые 5-15 мин)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │🟢 FBO    │ │🟢 FBO    │ │🟢 FBS    │ │🟢 Post │ │
│  │Заказы    │ │Продажи   │ │Заказы    │ │авки    │ │
│  │15 мин    │ │15 мин    │ │5 мин     │ │15 мин  │ │
│  │99.8%     │ │99.5%     │ │100%      │ │98.2%   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  Ежедневные                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │🟢 Рекл.  │ │🟢 Прод.  │ │🟡 Остатки│ │🟢 Хран.│ │
│  ...                                                │
│  Еженедельные                                       │
│  ┌──────────────────────┐                           │
│  │🟢 Финансовый отчёт   │                           │
│  └──────────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

### Файлы
| Файл | Действие |
|------|----------|
| `src/app/(dashboard)/monitoring/components/HealthScoreWidget.tsx` | Создать |
| `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx` | Создать |

### Зависимости
- Заблокировано: 68.1

---

## Story 68.3-FE: Heatmap пайплайнов (GitHub-style)

**Приоритет**: P1 (High)
**Оценка**: 8 SP

### Описание
Как финансовый директор, я хочу видеть визуализацию работы пайплайнов во времени (как GitHub contributions heatmap), чтобы отслеживать паттерны и находить проблемные периоды.

### Критерии приёмки
- AC1: GitHub-style heatmap сетка (строки = пайплайны, колонки = временные периоды)
- AC2: Date range picker: выбор периода (макс. 30 дней), дефолт — 7 дней
- AC3: Переключатель разрешения: "По часам" / "По дням"
- AC4: Фильтр по пайплайнам (мультиселект чипсы)
- AC5: 7 цветов ячеек: success=green-500, partial=amber-500, failed=red-500, missed=gray-500, no_data=gray-100, pending=blue-500, recovered=emerald-500
- AC6: Tooltip при hover на ячейку: статус, executionsExpected/Actual, successCount, failureCount, avgDurationMs, список ошибок (макс. 5)
- AC7: Сводка вверху: healthScore, totalExecutions, totalFailures, successRate
- AC8: Каждая строка пайплайна показывает: displayName, category badge, expectedFrequency
- AC9: Auto-downgrade resolution: >7 дней → day (даже если запрошен hour)
- AC10: Smart polling: 30s для текущего периода, 120s для исторического
- AC11: Lazy loading: данные грузятся только при переходе на вкладку "Heatmap"
- AC12: Responsive: горизонтальный скролл на мобильных

### Технические детали
- API: `GET /v1/monitoring/pipeline-health-grid?cabinetId={cabinetId}&from=...&to=...&resolution=...&pipelines=...&locale=ru`
- Макс. период: 30 дней (400 при превышении)
- Размер: ~5-25KB в зависимости от параметров
- Вкладка: "Heatmap"

### UI/UX заметки
```
┌─────────────────────────────────────────────────────────┐
│  📊 Heatmap    [10.02 — 17.02 ▼]  [По часам|По дням]   │
│  Фильтр: [FBO Заказы ×] [FBS Заказы ×] [+ Добавить]    │
├─────────────────────────────────────────────────────────┤
│  95 Health  │ 1234 выполнений │ 5 ошибок │ 99.6% успех  │
├─────────────────────────────────────────────────────────┤
│                  │ Пн │ Вт │ Ср │ Чт │ Пт │ Сб │ Вс │  │
│  FBO Заказы      │ 🟩 │ 🟩 │ 🟩 │ 🟨 │ 🟩 │ 🟩 │ 🟩 │  │
│  FBO Продажи     │ 🟩 │ 🟩 │ 🟥 │ 🟩 │ 🟩 │ 🟩 │ 🟩 │  │
│  FBS Заказы      │ 🟩 │ 🟩 │ 🟩 │ 🟩 │ 🟩 │ 🟩 │ 🟦 │  │
│  ...             │    │    │    │    │    │    │    │  │
│  Фин. отчёт      │ ⬜ │ 🟩 │ ⬜ │ ⬜ │ ⬜ │ ⬜ │ ⬜ │  │
└─────────────────────────────────────────────────────────┘

Tooltip (hover на 🟨):
┌──────────────────────────┐
│ FBO Заказы — Чт 13 фев   │
│ Статус: Частичный успех   │
│ Ожидалось: 96 выполнений  │
│ Фактически: 94            │
│ Успешных: 90 │ Ошибок: 4  │
│ Ср. время: 1.2s           │
│ ─── Ошибки ───            │
│ 14:15 — Timeout WB API    │
│ 14:30 — Rate limit        │
└──────────────────────────┘
```

### Файлы
| Файл | Действие |
|------|----------|
| `src/app/(dashboard)/monitoring/components/PipelineHeatmap.tsx` | Создать |
| `src/app/(dashboard)/monitoring/components/HeatmapCell.tsx` | Создать |
| `src/app/(dashboard)/monitoring/components/HeatmapTooltip.tsx` | Создать |

### Зависимости
- Заблокировано: 68.1

---

## Story 68.4-FE: Полнота данных

**Приоритет**: P2 (High)
**Оценка**: 5 SP

### Описание
Как финансовый директор, я хочу видеть полноту данных по каждому источнику, чтобы быть уверенным, что отчёты основаны на полных данных.

### Критерии приёмки
- AC1: Таблица из 6 источников данных: daily_sales_raw, adv_daily_stats, paid_storage_daily, inventory_snapshots, wb_finance_raw, weekly_payout_summary
- AC2: Каждая строка: displayName, completenessRatio (прогресс-бар), статус-бейдж (complete/incomplete/critical)
- AC3: Общий индикатор полноты (overallHealth) вверху секции
- AC4: При клике на строку — expand с деталями: список пропущенных дат, recoverable flag, кнопка "Восстановить" для recoverable дат
- AC5: Цвета: complete=green, incomplete=yellow, critical=red
- AC6: Используется из вкладки "Обзор" (секция внизу) и из вкладки "Восстановление"
- AC7: Данные из `dashboard.dataCompleteness` (основной рендер) + `GET /data-completeness` (детали при expand)

### Технические детали
- API primary: `GET /v1/monitoring/dashboard` → `dataCompleteness` block
- API detail: `GET /v1/monitoring/data-completeness?cabinetId={cabinetId}&days=30`
- API missing: `GET /v1/monitoring/missing-dates?cabinetId={cabinetId}&table={table}`

### UI/UX заметки
```
┌────────────────────────────────────────────────┐
│  Полнота данных: 🟢 Все данные загружены        │
├────────────────────────────────────────────────┤
│  Ежедневные продажи    [████████████] 100% 🟢  │
│  Рекламная статистика  [████████████] 100% 🟢  │
│  Платное хранение      [████████░░░░]  83% 🟡  │ ← expand
│    ├── 20.01 — Невосстановимо ❌                │
│    ├── 21.01 — Невосстановимо ❌                │
│    └── [Восстановить доступные (3)]             │
│  Остатки на складах    [████████████] 100% 🟢  │
│  Финансовый отчёт      [████████████] 100% 🟢  │
│  Еженедельная сводка   [████████████] 100% 🟢  │
└────────────────────────────────────────────────┘
```

### Файлы
| Файл | Действие |
|------|----------|
| `src/app/(dashboard)/monitoring/components/DataCompletenessTable.tsx` | Создать |

### Зависимости
- Заблокировано: 68.1

---

## Story 68.5-FE: Telegram мониторинг

**Приоритет**: P2 (Medium)
**Оценка**: 5 SP

### Описание
Как пользователь, я хочу видеть статус Telegram-интеграции и статистику доставки уведомлений, чтобы быть уверенным, что уведомления работают.

### Критерии приёмки
- AC1: Quick status на вкладке "Обзор": статус бота (4 состояния), deliveryRate7d, recentFailures
- AC2: Детальная панель на вкладке "Telegram": bot status, binding info, delivery stats, event breakdown
- AC3: Bot status: active=🟢, degraded=🟡, offline=🔴, not_configured=⚪ + CTA "Настроить"
- AC4: Binding info: привязан/не привязан, username, дата привязки
- AC5: Delivery stats: totalSent, totalFailed, totalRateLimited, totalSkippedQuietHours, deliveryRate, avgDeliveryMs
- AC6: Event breakdown: таблица типов событий с sent/failed/enabled статусом
- AC7: Recent failures: список последних 10 ошибок
- AC8: Preferences summary: quiet hours, language, enabled/disabled events
- AC9: Lazy loading: детали грузятся при переходе на вкладку "Telegram"
- AC10: Polling каждые 120 секунд

### Технические детали
- API quick: `GET /v1/monitoring/dashboard` → `telegram` block
- API detail: `GET /v1/monitoring/telegram-health?cabinetId={cabinetId}&days=7`
- Вкладка: "Telegram"

### UI/UX заметки
```
┌────────────────────────────────────────────────┐
│  🟢 Telegram бот активен                        │
│  @username привязан с 15.01.2026                │
├────────────────────────────────────────────────┤
│  Доставка за 7 дней                             │
│  Отправлено: 245  │  Ошибок: 2  │  Rate: 99.2% │
│  Rate limited: 0  │  Тихие часы: 15             │
│  Ср. время доставки: 150ms                      │
├────────────────────────────────────────────────┤
│  Разбивка по событиям                           │
│  task_failed      │ ✅ │ 5 отпр. │ 0 ошибок    │
│  data_gap         │ ✅ │ 3 отпр. │ 1 ошибка    │
│  recovery_success │ ✅ │ 2 отпр. │ 0 ошибок    │
│  task_success     │ ❌ │ отключено              │
├────────────────────────────────────────────────┤
│  Настройки: Тихие часы 23:00-08:00 │ Язык: RU  │
└────────────────────────────────────────────────┘
```

### Файлы
| Файл | Действие |
|------|----------|
| `src/app/(dashboard)/monitoring/components/TelegramStatusCard.tsx` | Создать |
| `src/app/(dashboard)/monitoring/components/TelegramDetailPanel.tsx` | Создать |

### Зависимости
- Заблокировано: 68.1

---

## Story 68.6-FE: Восстановление данных

**Приоритет**: P2 (Medium)
**Оценка**: 5 SP

### Описание
Как владелец бизнеса, я хочу видеть статус восстановления задач и иметь возможность вручную запустить восстановление, чтобы устранить пропуски в данных.

### Критерии приёмки
- AC1: Таблица recovery status: taskType, lastAttempt, totalAttempts, status (4 состояния), canRetry badge
- AC2: Кнопка "Восстановить" для задач с canRetry=true
- AC3: Кнопка "Принудительно" (forceRetry) для задач с canRetry=false (с подтверждением)
- AC4: Recovery с date range: date picker для выбора конкретного периода
- AC5: Data recovery: кнопка "Восстановить данные" для конкретной таблицы (интеграция с 68.4)
- AC6: Статусы: healthy=🟢, overdue=🟡, overdue_critical=🔴, no_history=⚪
- AC7: Recovery policies: отображение max_window, max_retries, cooldown для каждого типа
- AC8: Loading state при запуске recovery + toast уведомление об успехе/ошибке
- AC9: Вкладка: "Восстановление"

### Технические детали
- API read: `GET /v1/monitoring/recovery-status?cabinetId={cabinetId}`
- API trigger: `POST /v1/monitoring/recover` (body: taskType, cabinetId, forceRetry?, dateRange?)
- API data: `POST /v1/monitoring/recover-data` (body: cabinetId, table, dates?)

### UI/UX заметки
```
┌────────────────────────────────────────────────────┐
│  Восстановление задач                               │
├───────────────┬──────────┬────────┬────────┬───────┤
│ Задача         │ Статус   │ Попыток│ Посл.  │ Дейст.│
├───────────────┼──────────┼────────┼────────┼───────┤
│ adv_sync       │ 🟢 OK   │ 1/3    │ 14:30  │       │
│ daily_sales    │ 🟢 OK   │ 0/3    │ —      │       │
│ product_sync   │ 🟡 Overdue│ 2/2   │ 10:00  │ [⚡]  │
│ stocks_sync    │ ⚪ Нет   │ 0/2    │ —      │ [▶]   │
│ paid_storage   │ 🔴 Крит.│ 3/2    │ 15:00  │ [⚡]  │
└───────────────┴──────────┴────────┴────────┴───────┘
  [▶] = Восстановить   [⚡] = Принудительно (confirm)
```

### Файлы
| Файл | Действие |
|------|----------|
| `src/app/(dashboard)/monitoring/components/RecoveryPanel.tsx` | Создать |

### Зависимости
- Заблокировано: 68.1
- Связано: 68.4 (кнопка "Восстановить данные" в таблице полноты)

---

## Story 68.7-FE: История здоровья

**Приоритет**: P3 (Medium)
**Оценка**: 3 SP

### Описание
Как финансовый директор, я хочу видеть историю здоровья системы за последние 7-30 дней, чтобы отслеживать тренды и выявлять регулярные проблемы.

### Критерии приёмки
- AC1: Визуализация истории: цветная лента / мини-heatmap (7-30 дней)
- AC2: Каждый день: цветная ячейка (healthy=🟢, warning=🟡, critical=🔴)
- AC3: При клике на день — modal/expand с полным отчётом: summary, taskExecution (success/failed/notRun), dataCompleteness, issues[], recommendations[]
- AC4: Переключатель периода: 7 / 14 / 30 дней
- AC5: Issues показываются как список с severity badge и category
- AC6: Recommendations показываются как actionable bullet points
- AC7: Вкладка: "История"

### Технические детали
- API list: `GET /v1/monitoring/health-reports?cabinetId={cabinetId}&days=7`
- API detail: `GET /v1/monitoring/health-report?cabinetId={cabinetId}&date=YYYY-MM-DD`

### UI/UX заметки
```
┌────────────────────────────────────────────────────┐
│  История здоровья    [7 дней|14 дней|30 дней]       │
├────────────────────────────────────────────────────┤
│  Пн │ Вт │ Ср │ Чт │ Пт │ Сб │ Вс                 │
│  🟢  │ 🟢  │ 🟡  │ 🟢  │ 🔴  │ 🟢  │ 🟢             │
│  0   │ 0   │ 2   │ 0   │ 5   │ 0   │ 0   issues   │
├─────────── ▼ Пятница, 14 февраля ──────────────────┤
│  Статус: Критический (5 проблем)                    │
│  Задачи: 5 ✅ │ 1 ❌ (paid_storage) │ 2 ⏳         │
│  Полнота: 92%                                       │
│  ─── Проблемы ───                                   │
│  🔴 paid_storage_import — задача не выполнена        │
│  🟡 daily_sales_raw — пропущены 2 даты              │
│  ─── Рекомендации ───                               │
│  • Проверьте логи и запустите ручное восстановление  │
│  • Запланируйте бэкфилл для пропущенных дат         │
└────────────────────────────────────────────────────┘
```

### Файлы
| Файл | Действие |
|------|----------|
| `src/app/(dashboard)/monitoring/components/HealthHistoryChart.tsx` | Создать |

### Зависимости
- Заблокировано: 68.1

---

## Общие требования для всех историй

### Обработка ошибок
| HTTP Code | Действие |
|-----------|----------|
| 400 | Показать validation error (текст из message) |
| 401 | Redirect на /login |
| 403 | Показать "Доступ запрещён" |

### Empty State (новый кабинет)
```typescript
function isNewCabinet(dashboard: DashboardResponse): boolean {
  return dashboard.system.healthScore === 0
    && dashboard.pipelines.every(p => p.status === 'no_data');
}
// → "Данные ещё не загружены. Синхронизация начнётся автоматически."
```

### Дизайн-система и UI-стандарты

#### Design Kit (ui/)
Все компоненты ДОЛЖНЫ соответствовать Design Kit проекта (`ui/` папка):
- **Primary Button**: Красный фон (#E53935), белый текст, rounded — для основных действий (Recovery, Apply filter)
- **Secondary Button**: Белый фон, красная рамка, красный текст — для второстепенных действий (Cancel, Reset)
- **Text Button**: Красный текст без фона — для навигационных ссылок (View Details, Подробнее)
- **Sidebar**: Белый фон, красный индикатор для активного пункта (красная полоска слева + красный текст)
- **Navbar**: Белый, search bar, иконки уведомлений

#### Цвета
- **Primary**: #E53935 (red) — кнопки, ссылки, активные элементы
- **Primary Dark**: #D32F2F — hover states
- **Primary Light**: #FFCDD2 — hover backgrounds
- **Semantic**: green=#22C55E, red=#EF4444, yellow=#F59E0B, blue=#3B82F6
- **Heatmap специфичные**: emerald=#10B981 (recovered), gray-100=#F3F4F6 (no_data), gray-500=#6B7280 (missed)
- **Typography**: Metric values 32-48px bold, labels 14px, secondary 12px

#### shadcn/ui Component Mapping

**Обязательно**: При создании ЛЮБОГО UI-элемента использовать **shadcn MCP server** (`/llmstxt/ui_shadcn_llms_txt`) для получения актуальных паттернов и примеров. Стиль: `new-york`, иконки: `lucide`.

| Monitoring компонент | shadcn/ui компоненты | Паттерн |
|---------------------|---------------------|---------|
| Health Score gauge | `Card`, `Progress` | Кастомный SVG полукруг внутри Card |
| Pipeline status cards | `Card` + `Badge` + `Tooltip` | Паттерн `BaseMetricCard` (см. `dashboard/BaseMetricCard.tsx`) |
| Pipeline card skeleton | `Card` + `Skeleton` | Паттерн `BaseMetricCardSkeleton` |
| Pipeline card error | `Card` + retry button | Паттерн `BaseMetricCardError` |
| Tabs навигация | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Паттерн `OrderHistoryTabs` (on-demand fetch) |
| Heatmap tooltip | `Tooltip`, `TooltipContent`, `TooltipTrigger` | shadcn tooltip с кастомным контентом |
| Data completeness table | `Table`, `Progress`, `Badge`, `Collapsible` | Expandable rows через Collapsible |
| Recovery confirmation | `AlertDialog` | AlertDialog для destructive actions |
| Recovery toast | `sonner` (toast) | `toast.success()` / `toast.error()` |
| Date range picker | `Popover` + `Calendar` | Двойной Calendar в Popover |
| Filter chips | `Badge` (variant=outline) + `Button` | Removable badge-chips |
| Period selector | `Button` group | Toggle buttons (7/14/30 дней) |
| Empty state | `Card` с SVG-иллюстрацией | Центрированный контент |
| Settings link (Telegram) | `Button` (variant=link) | Навигация через Next.js Link |
| Slide-over panel (история) | `Sheet` (side=right) | Sheet для деталей дня |
| Loading states | `Skeleton` | Повторяет layout загруженного компонента |

#### Existing Project Patterns (обязательно следовать)

**BaseMetricCard pattern** (`src/components/custom/dashboard/BaseMetricCard.tsx`):
- Pipeline status cards ДОЛЖНЫ использовать аналогичную структуру: icon + title + value + trend
- Skeleton state с `aria-busy="true"`
- Error state с `role="alert"` и кнопкой "Повторить"
- Variant: `standard` (text-2xl) / `highlighted` (text-4xl, border-2)

**Tabs on-demand fetch** (`src/components/custom/orders/OrderHistoryTabs.tsx`):
- `enabled: activeTab === 'heatmap'` — данные грузятся ТОЛЬКО для активной вкладки
- `CACHE_CONFIG` объект для переиспользования staleTime/gcTime/retry
- `useState<TabValue>` для типизированного состояния

**Hook pattern** (TanStack Query v5):
```typescript
// Query key factory — создать в src/lib/api/monitoring/query-keys.ts
export const monitoringQueryKeys = {
  all: ['monitoring'] as const,
  dashboard: (cabinetId: string) => [...monitoringQueryKeys.all, 'dashboard', cabinetId] as const,
  grid: (cabinetId: string, params: GridParams) => [...monitoringQueryKeys.all, 'grid', cabinetId, params] as const,
  telegram: (cabinetId: string) => [...monitoringQueryKeys.all, 'telegram', cabinetId] as const,
  recovery: (cabinetId: string) => [...monitoringQueryKeys.all, 'recovery', cabinetId] as const,
  healthReports: (cabinetId: string, days: number) => [...monitoringQueryKeys.all, 'reports', cabinetId, days] as const,
}

// Hook pattern — создать в src/app/(dashboard)/monitoring/hooks/
export function useMonitoringDashboard(cabinetId: string, enabled = true) {
  return useQuery({
    queryKey: monitoringQueryKeys.dashboard(cabinetId),
    queryFn: () => getMonitoringDashboard(cabinetId),
    enabled: enabled && !!cabinetId,
    refetchInterval: 60_000,
    staleTime: 50_000,
  })
}
```

**API client note**: Monitoring endpoints используют `cabinetId` как query parameter, НЕ через `X-Cabinet-Id`. API-функции должны передавать cabinetId явно:
```typescript
export async function getMonitoringDashboard(cabinetId: string) {
  return apiClient.get(`/v1/monitoring/dashboard`, {
    params: { cabinetId, locale: 'ru' },
  })
}
```

### Файл < 200 строк
Все компоненты должны быть < 200 строк. При превышении — выделять подкомпоненты (паттерн: `BaseMetricCard` + `BaseMetricCardParts`).

---

## Дорожная карта спринтов

### Sprint 3, Week 1 (Feb 17-21)
| Story | SP | Описание |
|-------|---:|----------|
| 68.1 | 3 | Каркас, маршрут, типы, хуки |
| 68.2 | 5 | Health Score + Pipeline cards |

### Sprint 3, Week 2 (Feb 24-28)
| Story | SP | Описание |
|-------|---:|----------|
| 68.3 | 8 | Heatmap (самая сложная) |
| 68.4 | 5 | Data Completeness |

### Sprint 4, Week 1 (Mar 3-7)
| Story | SP | Описание |
|-------|---:|----------|
| 68.5 | 5 | Telegram мониторинг |
| 68.6 | 5 | Recovery панель |
| 68.7 | 3 | История здоровья |

---

## Ссылки

| Ресурс | Расположение |
|--------|-------------|
| **Design Kit** | `ui/` — кнопки, sidebar, navbar, компоненты |
| **UX Review** | `docs/epics/epic-68-fe-UX-REVIEW.md` — рекомендации UX-дизайнера |
| **shadcn MCP** | `/llmstxt/ui_shadcn_llms_txt` — всегда использовать при создании компонентов |
| **BaseMetricCard** | `src/components/custom/dashboard/BaseMetricCard.tsx` — эталонный паттерн карточек |
| **Tabs pattern** | `src/components/custom/orders/OrderHistoryTabs.tsx` — on-demand fetch по табам |
| Backend API Guide | `docs/request-backend/149-EPIC-67-PIPELINE-HEALTH-DASHBOARD-API.md` |
| Test API | `test-api/17-monitoring.http` (34 теста) |
| Swagger | `http://localhost:3000/api` |
| Pipeline Registry | Backend: `src/monitoring/pipeline-registry.ts` |
| OpenMemory | `search_memory("[API] Epic-67")` |

---

**Дата создания**: 2026-02-17
**Автор**: Product Team (PO + PM)
