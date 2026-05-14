# Guide #29: COGS Temporal Versioning & Margin Calculation Logic

**Date**: 2025-11-28
**Type**: 📊 **TECHNICAL GUIDE**
**Component**: Backend API - COGS Module + Analytics Module
**Related**: Guide #24 (Margin Integration), Request #16 (COGS History), Epic 10/20

---

## Executive Summary

Данный документ описывает **как система выбирает себестоимость (COGS) для расчёта маржинальности** с учётом временного версионирования. Ключевой момент: система использует **середину недели (midpoint ≈ четверг)** для определения актуальной версии COGS.

---

## 1. Модель данных COGS

### 1.1 Структура таблицы `cogs`

```sql
CREATE TABLE cogs (
  id            UUID PRIMARY KEY,
  nm_id         VARCHAR(50) NOT NULL,      -- Артикул товара
  sa_name       VARCHAR(255) NOT NULL,     -- Название товара
  unit_cost_rub DECIMAL(15,2) NOT NULL,    -- Себестоимость за единицу
  currency      VARCHAR(3) DEFAULT 'RUB',

  -- Временное версионирование
  valid_from    TIMESTAMPTZ NOT NULL,      -- Начало действия версии
  valid_to      TIMESTAMPTZ NULL,          -- Конец действия (NULL = текущая)

  -- Аудит
  source        VARCHAR(50) NOT NULL,      -- 'manual', 'import', 'system'
  created_by    VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete (Story 5.3)
  is_active     BOOLEAN DEFAULT TRUE,
  deleted_at    TIMESTAMPTZ NULL,
  deleted_by    VARCHAR(100) NULL,

  -- Уникальный индекс: одна версия на (nm_id, valid_from)
  UNIQUE(nm_id, valid_from)
);
```

### 1.2 Принцип версионирования

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Версионирование COGS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  valid_to = NULL означает ТЕКУЩУЮ (активную) версию                         │
│                                                                              │
│  При создании новой версии:                                                  │
│  1. Старая версия закрывается: valid_to = новая.valid_from                  │
│  2. Новая версия создаётся: valid_to = NULL                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Пример версий в базе данных

| nm_id | unit_cost_rub | valid_from | valid_to | is_active | Комментарий |
|-------|---------------|------------|----------|-----------|-------------|
| 12345 | 100.00 | 2025-01-01 | 2025-03-01 | true | v1 (закрыта) |
| 12345 | 150.00 | 2025-03-01 | 2025-06-15 | true | v2 (закрыта) |
| 12345 | 180.00 | 2025-06-15 | NULL | true | v3 (текущая) |

**Важно**: Все версии сохраняются для истории. `is_active = false` означает удалённую версию (soft delete).

---

## 2. Алгоритм выбора COGS для расчёта маржи

### 2.1 Ключевой принцип: Week Midpoint Strategy

```typescript
// margin-calculation.service.ts:244-249
private async lookupCogs(revenues: RevenueData[], start: Date, end: Date) {
  // Используем СЕРЕДИНУ недели для поиска COGS
  const midpoint = new Date((start.getTime() + end.getTime()) / 2);

  for (const revenue of revenues) {
    const cogs = await this.cogsService.findCogsAtDate(revenue.nmId, midpoint);
    // ...
  }
}
```

**Midpoint для ISO-недели (Пн-Вс)**:
- Неделя: `понедельник 00:00:00` → `воскресенье 23:59:59`
- Midpoint: `≈ четверг 12:00:00` (середина)

### 2.2 SQL-запрос поиска COGS

```typescript
// cogs.service.ts:231-248
async findCogsAtDate(nmId: string, validAt: Date): Promise<Cogs | null> {
  return this.prisma.cogs.findFirst({
    where: {
      nmId,
      isActive: true,                    // Только активные записи
      validFrom: { lte: validAt },       // valid_from ≤ midpoint
      OR: [
        { validTo: null },               // Текущая версия
        { validTo: { gt: validAt } },    // Или версия ещё действует
      ],
    },
    orderBy: {
      validFrom: 'desc',                 // Самая свежая версия
    },
  });
}
```

### 2.3 Визуальная схема алгоритма

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    АЛГОРИТМ ВЫБОРА COGS ДЛЯ НЕДЕЛИ                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ШАГ 1: Вычислить midpoint недели                                           │
│         midpoint = (monday_00:00 + sunday_23:59) / 2 ≈ четверг 12:00       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ШАГ 2: Найти COGS в базе данных                                            │
│         WHERE nm_id = ?                                                      │
│           AND is_active = true                                               │
│           AND valid_from <= midpoint                                         │
│           AND (valid_to > midpoint OR valid_to IS NULL)                     │
│         ORDER BY valid_from DESC                                             │
│         LIMIT 1                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ШАГ 3: Рассчитать маржу                                                    │
│         cogs_total = quantity_sold × unit_cost_rub                          │
│         gross_profit = revenue_net - cogs_total                             │
│         margin_percent = (gross_profit / revenue_net) × 100%                │
│         markup_percent = (gross_profit / cogs_total) × 100%                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Сценарии применения COGS

### 3.1 Сценарий A: COGS не менялась много недель

```
Временная шкала:
════════════════════════════════════════════════════════════════════════════════
COGS: 100₽ ────────────────────────────────────────────────────────────────────→
valid_from: 01.01.2025                                              valid_to: NULL

Недели:     W40    W41    W42    W43    W44    W45    W46    W47
            ↓      ↓      ↓      ↓      ↓      ↓      ↓      ↓
COGS:      100₽   100₽   100₽   100₽   100₽   100₽   100₽   100₽
════════════════════════════════════════════════════════════════════════════════
```

**Результат**: Все недели используют одну и ту же себестоимость 100₽.

---

### 3.2 Сценарий B: COGS изменилась между неделями

```
Временная шкала:
════════════════════════════════════════════════════════════════════════════════
COGS v1: 100₽ ─────────────────────────┐
valid_from: 01.11, valid_to: 17.11     │
                                        ↓
COGS v2: 150₽                          └────────────────────────────────────────→
valid_from: 17.11.2025 (понедельник W47)                            valid_to: NULL

Недели:  |←────── W46 ──────→|←────── W47 ──────→|←────── W48 ──────→|
         Пн 10    Чт 13   Вс 16   Пн 17  Чт 20  Вс 23   Пн 24    Вс 30
                   ↑                      ↑
              midpoint W46           midpoint W47
════════════════════════════════════════════════════════════════════════════════
```

**Расчёт**:
- **W46** midpoint = 13.11 → `valid_from(17.11) > midpoint` → **COGS v1 (100₽)**
- **W47** midpoint = 20.11 → `valid_from(17.11) ≤ midpoint` → **COGS v2 (150₽)**
- **W48+** → **COGS v2 (150₽)**

---

### 3.3 Сценарий C: COGS изменилась в середине недели (ДО четверга)

```
COGS изменена в среду 19.11.2025 (внутри недели W47)

Неделя W47:  Пн 17   Вт 18   Ср 19   Чт 20   Пт 21   Сб 22   Вс 23
                             ↑       ↑
                     valid_from   midpoint
                       (новая)    (проверка)
════════════════════════════════════════════════════════════════════════════════
```

**Проверка**: `valid_from(19.11) ≤ midpoint(20.11)` → **TRUE**

**Результат**: **НОВАЯ COGS применяется к неделе W47**

---

### 3.4 Сценарий D: COGS изменилась в середине недели (ПОСЛЕ четверга)

```
COGS изменена в пятницу 21.11.2025 (внутри недели W47)

Неделя W47:  Пн 17   Вт 18   Ср 19   Чт 20   Пт 21   Сб 22   Вс 23
                                     ↑       ↑
                                 midpoint  valid_from
                                (проверка)  (новая)
════════════════════════════════════════════════════════════════════════════════
```

**Проверка**: `valid_from(21.11) ≤ midpoint(20.11)` → **FALSE**

**Результат**:
- **W47** использует **СТАРУЮ COGS**
- **W48+** использует **НОВУЮ COGS**

---

### 3.5 Сводная таблица сценариев

| Когда изменена COGS | valid_from | Применяется с недели |
|---------------------|------------|----------------------|
| В понедельник W47 | 17.11 (Пн) | **W47** ✓ |
| Во вторник W47 | 18.11 (Вт) | **W47** ✓ |
| В среду W47 | 19.11 (Ср) | **W47** ✓ |
| В четверг W47 до 12:00 | 20.11 (Чт) | **W47** ✓ |
| В четверг W47 после 12:00 | 20.11 (Чт) | **W48** (зависит от времени) |
| В пятницу W47 | 21.11 (Пт) | **W48** |
| В субботу W47 | 22.11 (Сб) | **W48** |
| В воскресенье W47 | 23.11 (Вс) | **W48** |

---

## 4. Пример с реальными данными

### 4.1 Исходные данные

**Товар**: nm_id = `147205694`

**История COGS**:
```
v1: 500₽ (valid_from: 01.10.2025, valid_to: 15.11.2025)
v2: 650₽ (valid_from: 15.11.2025, valid_to: NULL) ← текущая
```

**Продажи**:
| Неделя | Период | Кол-во | Выручка |
|--------|--------|--------|---------|
| W45 | 03-09.11 | 10 шт | 8,000₽ |
| W46 | 10-16.11 | 15 шт | 12,000₽ |
| W47 | 17-23.11 | 8 шт | 6,400₽ |

### 4.2 Расчёт маржи по неделям

**Неделя W45** (03-09.11.2025):
```
midpoint = 06.11.2025 (четверг)
valid_from(01.10) ≤ 06.11 → COGS v1 = 500₽

cogs_total = 10 × 500 = 5,000₽
gross_profit = 8,000 - 5,000 = 3,000₽
margin_percent = 3,000 / 8,000 × 100% = 37.50%
```

**Неделя W46** (10-16.11.2025):
```
midpoint = 13.11.2025 (четверг)
valid_from(01.10) ≤ 13.11, valid_to(15.11) > 13.11 → COGS v1 = 500₽

cogs_total = 15 × 500 = 7,500₽
gross_profit = 12,000 - 7,500 = 4,500₽
margin_percent = 4,500 / 12,000 × 100% = 37.50%
```

**Неделя W47** (17-23.11.2025):
```
midpoint = 20.11.2025 (четверг)
valid_from(15.11) ≤ 20.11, valid_to = NULL → COGS v2 = 650₽ ← НОВАЯ!

cogs_total = 8 × 650 = 5,200₽
gross_profit = 6,400 - 5,200 = 1,200₽
margin_percent = 1,200 / 6,400 × 100% = 18.75%
```

### 4.3 Итоговая таблица

| Неделя | Midpoint | COGS версия | Себестоимость | Маржа |
|--------|----------|-------------|---------------|-------|
| W45 | 06.11 | v1 | 500₽ | **37.50%** |
| W46 | 13.11 | v1 | 500₽ | **37.50%** |
| W47 | 20.11 | v2 | 650₽ | **18.75%** |

---

## 5. Автоматический пересчёт маржи

### 5.1 Когда запускается пересчёт

Система автоматически пересчитывает маржу при:

| Событие | Триггер | Затронутые недели |
|---------|---------|-------------------|
| **Назначение COGS** | `POST /v1/products/:nmId/cogs` | От `valid_from` до последней завершённой недели |
| **Редактирование COGS** | `PATCH /v1/cogs/:cogsId` | От `valid_from` до `valid_to` (или до сейчас) |
| **Удаление COGS** | `DELETE /v1/cogs/:cogsId` | От `valid_from` до `valid_to` (или до сейчас) |
| **Bulk загрузка** | `POST /v1/products/cogs/bulk` | Агрегированный пересчёт для всех затронутых недель |

### 5.2 Алгоритм определения затронутых недель

```typescript
// affected-weeks.helper.ts
function calculateAffectedWeeks(validFrom: Date): string[] {
  // 1. Определить последнюю ЗАВЕРШЁННУЮ неделю (Epic 19)
  const lastCompletedWeek = isoWeekService.getLastCompletedWeek(true);

  // 2. Если valid_from > lastCompletedWeek → пустой массив
  if (validFrom > lastCompletedWeek.end) {
    return [];
  }

  // 3. Генерировать недели от valid_from до lastCompletedWeek
  const weeks: string[] = [];
  let current = validFrom;

  while (current <= lastCompletedWeek.end) {
    weeks.push(dateToIsoWeek(current));
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}
```

### 5.3 Время пересчёта

| Количество товаров | Примерное время |
|-------------------|-----------------|
| 1 товар | 5-30 секунд |
| 10 товаров | 15-45 секунд |
| 100 товаров | 45-90 секунд |
| 500 товаров (bulk) | 45-60 секунд (batch) |

---

## 6. Frontend: Рекомендации по UX

### 6.1 Отображение версий COGS

```tsx
// Пример компонента истории COGS
function CogsHistoryTimeline({ history }: { history: CogsHistoryItem[] }) {
  return (
    <div className="timeline">
      {history.map((version, index) => (
        <div key={version.cogs_id} className="timeline-item">
          <div className="version-badge">
            {version.valid_to === null ? '✓ Текущая' : `v${history.length - index}`}
          </div>
          <div className="cost">{version.unit_cost_rub}₽</div>
          <div className="period">
            {formatDate(version.valid_from)} —
            {version.valid_to ? formatDate(version.valid_to) : 'сейчас'}
          </div>
          {version.affected_weeks.length > 0 && (
            <div className="affected">
              Затронуто недель: {version.affected_weeks.length}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 6.2 Подсказка при назначении COGS

```tsx
function CogsAssignmentForm() {
  const [validFrom, setValidFrom] = useState(new Date());

  // Определить, с какой недели применится COGS
  const effectiveWeek = useMemo(() => {
    const midpoint = getWeekMidpoint(validFrom);
    if (validFrom <= midpoint) {
      return getCurrentWeek(validFrom);
    } else {
      return getNextWeek(validFrom);
    }
  }, [validFrom]);

  return (
    <form>
      <DatePicker value={validFrom} onChange={setValidFrom} />

      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <span>
          Себестоимость применится <strong>с недели {effectiveWeek}</strong>
          {validFrom.getDay() >= 5 && (
            <span className="text-muted">
              {' '}(дата после четверга — применится со следующей недели)
            </span>
          )}
        </span>
      </Alert>

      <Button type="submit">Назначить</Button>
    </form>
  );
}
```

### 6.3 Предупреждение о задержке пересчёта

```tsx
// После назначения COGS
function MarginRecalculationNotice({ taskUuid, affectedWeeks }: Props) {
  return (
    <Alert>
      <Loader2 className="h-4 w-4 animate-spin" />
      <div>
        <p>Маржа пересчитывается для {affectedWeeks.length} недель...</p>
        <p className="text-muted text-sm">
          Обычно занимает 5-30 секунд. Обновите страницу через минуту.
        </p>
      </div>
    </Alert>
  );
}
```

---

## 7. Edge Cases и FAQ

### 7.1 Что если COGS не назначена?

- `missing_data_reason: "COGS_NOT_ASSIGNED"`
- `margin_pct: null`
- `cogs: null`

### 7.2 Что если изменить COGS задним числом?

Система автоматически пересчитает маржу для всех затронутых недель от `valid_from` до последней завершённой недели.

### 7.3 Что если удалить текущую версию COGS?

- Предыдущая версия становится текущей (`valid_to = NULL`)
- Маржа пересчитывается с учётом восстановленной версии
- Если предыдущей версии нет → товар остаётся без COGS

### 7.4 Можно ли назначить COGS на будущее?

Да, но маржа будет рассчитана только когда:
1. Наступит эта дата
2. Неделя станет "завершённой" (Epic 19)
3. Будут продажи в эту неделю

### 7.5 Почему маржа одинаковая для W45 и W46, но разная для W47?

Потому что COGS изменилась 15.11 (суббота W46). Midpoint W46 = 13.11, а `valid_from(15.11) > 13.11`, поэтому W46 использует старую COGS. Midpoint W47 = 20.11, а `valid_from(15.11) ≤ 20.11`, поэтому W47 использует новую COGS.

---

## 8. API Reference

### 8.1 Назначить COGS

```http
POST /v1/products/:nmId/cogs
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
Content-Type: application/json

{
  "unit_cost_rub": 650.00,
  "valid_from": "2025-11-15T00:00:00Z",  // С какой даты действует
  "source": "manual",
  "notes": "Новая партия от поставщика"
}
```

### 8.2 Получить историю COGS

```http
GET /v1/cogs/history?nm_id=147205694&limit=50
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Response**:
```json
{
  "data": [
    {
      "cogs_id": "uuid-v2",
      "unit_cost_rub": "650.00",
      "valid_from": "2025-11-15T00:00:00.000Z",
      "valid_to": null,
      "is_active": true,
      "affected_weeks": ["2025-W47"]
    },
    {
      "cogs_id": "uuid-v1",
      "unit_cost_rub": "500.00",
      "valid_from": "2025-10-01T00:00:00.000Z",
      "valid_to": "2025-11-15T00:00:00.000Z",
      "is_active": true,
      "affected_weeks": ["2025-W40", "W41", "W42", "W43", "W44", "W45", "W46"]
    }
  ],
  "meta": {
    "nm_id": "147205694",
    "current_cogs": {
      "unit_cost_rub": "650.00",
      "valid_from": "2025-11-15T00:00:00.000Z"
    },
    "total_versions": 2
  }
}
```

### 8.3 Редактировать COGS (Story 5.2)

```http
PATCH /v1/cogs/:cogsId
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
Content-Type: application/json

{
  "unit_cost_rub": 680.00,  // Исправленная сумма
  "notes": "Корректировка после сверки с накладной"
}
```

---

## 9. Связанная документация

- **Guide #24**: [Margin & COGS Integration Guide](./24-margin-cogs-integration-guide.md) — полное руководство по интеграции
- **Request #16**: [COGS History Data Structure](./16-cogs-history-and-margin-data-structure.md) — структура данных
- **Story 5.1**: [View COGS History](../../../docs/stories/epic-5/story-5.1-view-cogs-history.md)
- **Story 5.2**: [Edit COGS](../../../docs/stories/epic-5/story-5.2-edit-cogs.md)
- **Story 5.3**: [Delete COGS](../../../docs/stories/epic-5/story-5.3-delete-cogs.md)
- **Epic 10**: [Story 10.4 - Margin & Profit Calculation](../../../docs/stories/epic-10/story-10.4-margin-profit-calculation.md)
- **Epic 19**: [Completed Weeks Only](../../../docs/stories/epic-19/EPIC-19-OVERVIEW.md)
- **Epic 20**: [Automatic Margin Recalculation](../../../docs/stories/epic-20/EPIC-20-OVERVIEW.md)

---

## 10. Summary: Ключевые выводы

| Аспект | Описание |
|--------|----------|
| **Стратегия выбора COGS** | Week Midpoint (≈ четверг 12:00) |
| **Версионирование** | `valid_from` / `valid_to` с сохранением истории |
| **Текущая версия** | `valid_to = NULL` |
| **Автопересчёт маржи** | При любом изменении COGS |
| **Граничный случай** | Пт-Вс → COGS применится со следующей недели |

---

**Created**: 2025-11-28
**Author**: Claude Code
**Status**: ✅ Active Guide

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-11-28
- **Summary**: Comprehensive guide documenting COGS temporal versioning strategy and margin calculation logic. Uses the Week Midpoint strategy (Thursday ~12:00) for COGS lookup. Documents the `valid_from`/`valid_to` versioning model, automatic margin recalculation triggers, and edge cases (e.g., Friday-Sunday COGS applying to the next week).
- **Remaining frontend action**: Use this guide as the reference for implementing COGS temporal logic in the frontend.
