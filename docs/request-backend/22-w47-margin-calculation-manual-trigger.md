# Request #22: W47 Margin Calculation - Manual Trigger Required

**Дата:** 2025-11-25
**Статус:** ✅ RESOLVED
**Тип:** Backend Response / Explanation
**Связано с:** Request #17 (COGS assigned after completed week)

---

## 📋 Проблема

Frontend сообщил что для товаров с назначенной COGS не отображается маржа:
- Товар 412096139 (COGS с 02.11) → показывает "(расчёт маржи...)"
- Товар 321678606 (COGS с 24.11) → показывает "(COGS с будущей даты)"

---

## 🔍 Root Cause Analysis

### Хронология событий:

| Время | Событие | Last Completed Week |
|-------|---------|---------------------|
| Пн 24.11 или раньше | COGS назначен | W46 (10-16 ноября) |
| Вт 25.11 до 12:00 | Система ждёт данные WB | W46 |
| **Вт 25.11 после 12:00** | **W47 стала "завершённой"** | **W47 (17-23 ноября)** |

### Почему маржа не рассчиталась автоматически:

1. **COGS был назначен в понедельник 24.11** (или раньше)
2. В тот момент `getLastCompletedWeek()` возвращал **W46** (Epic 19 логика):
   - Понедельник → week-2 (2 недели назад)
   - Вторник до 12:00 → week-2
3. Даты COGS (23.11 и 24.11) были **после конца W46** (16.11)
4. `calculateAffectedWeeks()` вернул **пустой массив** → пересчёт НЕ запущен
5. Во вторник после 12:00 W47 стала "завершённой"
6. **НО система не знает что нужно пересчитать маржу для W47**

### Это документированное ограничение Epic 20

Система автоматически пересчитывает маржу только для недель, которые **уже были завершёнными** в момент назначения COGS. Когда новая неделя становится "завершённой", автоматического trigger нет.

---

## ✅ Решение

### Ручной запуск расчёта маржи для W47:

```bash
POST /v1/tasks/enqueue
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
Content-Type: application/json

{
  "task_type": "weekly_margin_calculation",
  "payload": {
    "weeks": ["2025-W47"]
  },
  "priority": 1
}
```

**Результат:** Задача выполнена за 236ms, маржа рассчитана для 17 товаров.

---

## 📊 Результаты расчёта W47

### Общая статистика:
- **Всего товаров с продажами:** 17
- **Товаров с COGS:** 6
- **Товаров без COGS:** 11 (margin = 100%, т.к. COGS = 0)

### Товары с COGS и маржой:

| nmId | Маржа | Выручка | COGS | Название |
|------|-------|---------|------|----------|
| 147205694 | 91.9% | 20,137₽ | 1,628₽ | ll-20-bl |
| 235269056 | 68.3% | 4,990₽ | 1,584₽ | izo30white |
| **412096139** | **66.4%** | 11,429₽ | 3,842₽ | **izoblack_30** |
| 254936041 | 63.6% | 14,632₽ | 5,328₽ | m62-1 |
| 148191269 | 51.9% | 1,855₽ | 893₽ | m62-2 |
| **321678606** | **-52.3%** | 36,622₽ | 55,770₽ | ❌ Убыток |

---

## 🔬 Детальный анализ товара 321678606

### История версий COGS:

| validFrom | unitCostRub | Комментарий |
|-----------|-------------|-------------|
| 01.10.2025 | 444₽ | - |
| 10.10.2025 | 224₽ | - |
| 01.11.2025 | 988₽ | - |
| 11.11.2025 | 991₽ | - |
| 14.11.2025 | 990₽ | - |
| **20.11.2025** | **995.89₽** | **← Использован для W47** |
| 23.11.2025 | 994₽ | - |
| 24.11.2025 | 990₽ | - |

### Почему использован COGS от 20.11 (995.89₽)?

**Week Midpoint Strategy** (документировано в CLAUDE.md):

```
W47: Mon 17.11 - Sun 23.11
Midpoint = (17.11 + 23.11) / 2 ≈ Thursday 20.11.2025
```

`findCogsAtDate('321678606', '2025-11-20')` нашёл COGS с `validFrom=2025-11-20`:
- `20.11 ≤ 20.11` ✓ → COGS валиден на дату midpoint
- Это **точное совпадение** с midpoint!

### Расчёт маржи:

```
Revenue:     36,621.85₽
COGS:        55,769.84₽ (56 шт × 995.89₽)
Gross Profit: -19,147.99₽ (УБЫТОК)
Margin:      -52.3%
```

**⚠️ Товар продаётся в убыток!** Себестоимость (995.89₽) выше цены продажи.

---

## 📝 Важные выводы

### 1. Midpoint Strategy работает корректно

Система использовала COGS от 20.11 (995.89₽), а **не** от 24.11 (990₽), потому что:
- W47 midpoint = 20.11 (четверг)
- COGS с validFrom=24.11 > midpoint → не применяется к W47
- COGS с validFrom=20.11 ≤ midpoint → применяется к W47

### 2. Товар 321678606 показывает разные статусы

| COGS дата | vs W47 end (23.11) | Отображение |
|-----------|-------------------|-------------|
| validFrom=24.11 | 24 > 23 | "(COGS с будущей даты)" |
| validFrom=20.11 | 20 ≤ 23 | Используется для расчёта |

Frontend показывает "(COGS с будущей даты)" потому что **последняя** версия COGS (validFrom=24.11) действительно после W47. Но для расчёта маржи система корректно использует **актуальную на midpoint** версию.

### 3. Ограничение Epic 20

Когда COGS назначается в момент когда целевая неделя ещё не "завершена" по Epic 19 логике, автоматический пересчёт не происходит. Это **by design** - см. Request #17.

---

## 🔧 Рекомендации

### Для Frontend:

1. **Обновить страницу** — данные маржи W47 теперь доступны через API
2. При отображении "(расчёт маржи...)" для товаров с COGS:
   - Проверить `calculatedAt` в `weekly_margin_fact`
   - Если данных нет → возможно нужен ручной trigger

### Для будущего (Epic 23?):

Рассмотреть автоматический cron job который:
1. Проверяет когда новая неделя становится "завершённой"
2. Пересчитывает маржу для товаров с COGS, затрагивающих эту неделю

---

## 📚 Связанная документация

- **CLAUDE.md**: Раздел "COGS Temporal Lookup - Week Midpoint Strategy"
- **docs/HOW-COGS-MARGIN-SHOULD-WORK.md**: Раздел "📅 COGS Temporal Lookup"
- **docs/PRODUCTS-API-GUIDE.md**: Раздел "Temporal Lookup - Week Midpoint Strategy"
- **Request #17**: `17-cogs-assigned-after-completed-week-recalculation.md`
- **Epic 19**: Completed weeks logic
- **Epic 20**: Automatic margin recalculation

---

## 🔗 API Reference

### Ручной запуск расчёта маржи:

```http
POST /v1/tasks/enqueue
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json

{
  "task_type": "weekly_margin_calculation",
  "payload": {
    "weeks": ["2025-W47"]  // можно несколько: ["2025-W46", "2025-W47"]
  },
  "priority": 1
}
```

**Response (201 Created):**
```json
{
  "task_uuid": "c7cc485d...",
  "status": "pending",
  "task_type": "weekly_margin_calculation"
}
```

**Время выполнения:** ~200-500ms для одной недели.

---

**Дата создания:** 2025-11-25
**Автор:** Backend Team
**Статус:** ✅ RESOLVED

## Backend Team Response
**Status**: RESOLVED
**Resolution**: Manual margin calculation trigger for W47 was executed successfully via `POST /v1/tasks/enqueue`, calculating margin for 17 products in 236ms. Documented that this is a known Epic 20 limitation where auto-recalculation does not trigger when a new week becomes "completed" after COGS assignment.
**Frontend Action**: No further action needed unless noted above.
