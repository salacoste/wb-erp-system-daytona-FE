# Request #82: Склейки товаров (Card Linking) - Распределение рекламных затрат

**Дата запроса**: 2025-12-27
**Статус**: 🔍 Требуется исследование
**Приоритет**: High
**Запрошено**: Frontend Team (Epic 33: Advertising Analytics)

---

## 📋 Запрос от Frontend

### Проблема: Аномалия в данных рекламной аналитики

При анализе рекламных данных (период 2025-12-13 to 2025-12-26) обнаружена аномалия у нескольких товаров:

| Артикул | Затраты (spend) | Из рекламы (revenue) | Всего продаж | Органика | Статус |
|---------|----------------|---------------------|--------------|----------|---------|
| **izo30white** (235269056) | **0₽** | 1,113₽ | 4,524₽ | 3,411₽ (75%) | 🔵 Нет данных |
| **ter-09** (173588306) | **0₽** | 1,105₽ | 1,105₽ | 0₽ (0%) | 🔵 Нет данных |
| **ter-10** (173589306) | **0₽** | 1,489₽ | 1,489₽ | 0₽ (0%) | 🔵 Нет данных |
| **ter-11** (173589742) | **0₽** | 1,512₽ | 1,512₽ | 0₽ (0%) | 🔵 Нет данных |
| **ter-20** (270958590) | **0₽** | 5,433₽ | 9,205₽ | 3,772₽ (41%) | 🔵 Нет данных |
| **ll-20-wh** (148188881) | **0₽** | 391₽ | 2,525₽ | 2,134₽ (85%) | 🔵 Нет данных |

**Общие характеристики** (все товары):
- ✅ `views = 0` - нет показов рекламы
- ✅ `clicks = 0` - нет кликов по рекламе
- ✅ `spend = 0₽` - нет прямых рекламных затрат
- ❓ `revenue > 0₽` - **есть продажи "Из рекламы"** (WB атрибутирует к рекламе)

**Backend данные** (excerpt from `/v1/analytics/advertising`):
```json
{
  "key": "sku:235269056",
  "label": "izo30white",
  "nmId": 235269056,
  "views": 0,
  "clicks": 0,
  "spend": 0,
  "revenue": 1113,
  "totalSales": 4524.24,
  "organicSales": 3411.24,
  "organicContribution": 75.4,
  "roas": null,
  "roi": null,
  "efficiency": {
    "status": "unknown",
    "recommendation": "No spend data available"
  }
}
```

---

## 💡 Бизнес-контекст: Склейки карточек (Card Linking)

### Механизм склеек на Wildberries

**Объяснение от Product Owner**:

1. **Основная карточка** - получает весь рекламный трафик (spend > 0, views > 0, clicks > 0)
2. **Склейка (bundling)** - основная карточка объединена с несколькими дочерними товарами
3. **Перетекание трафика** - покупатели переходят с основной карточки на склеенные товары
4. **Атрибуция WB** - рекламный кабинет Wildberries засчитывает продажи склеенных товаров как **рекламные**
5. **Отсутствие прямых затрат** - у склеенных товаров `spend = 0₽`, но `revenue > 0₽`

**Пример**:
```
ter-13-1 (основная карточка)
├─ Затраты: 11,337₽
├─ Клики: 388
├─ Продажи: 31,464₽
└─ Склеена с:
   ├─ ter-09 (spend: 0₽, revenue: 1,105₽) ← трафик от ter-13-1
   ├─ ter-10 (spend: 0₽, revenue: 1,489₽) ← трафик от ter-13-1
   └─ ter-11 (spend: 0₽, revenue: 1,512₽) ← трафик от ter-13-1
```

---

## 🎯 Запрос к Backend Team

### Основные вопросы

**1. Где в WB API хранится информация о склейках?**
   - Есть ли поле/endpoint для получения parent-child связей между карточками?
   - Какие nmId являются основными (parent), а какие склеенными (child)?
   - Как WB API возвращает эту информацию в рекламных данных?

**2. Как WB атрибутирует продажи склеенных товаров?**
   - Почему `revenue > 0` при `spend = 0` для склеенных товаров?
   - Использует ли WB attribution window (окно атрибуции)?
   - Есть ли в API данные о том, от какой кампании пришла продажа?

**3. Как правильно распределять рекламные затраты между склеенными товарами?**
   - Должны ли мы пропорционально распределять `spend` основной карточки на склеенные?
   - Например: ter-13-1 spend=11,337₽ → распределить на ter-09/ter-10/ter-11 по revenue?
   - Или WB уже учитывает это в своих метриках?

**4. Какие endpoints/fields использовать?**
   - Нужен ли новый endpoint для получения card linking данных?
   - Есть ли в текущих WB API методах (Promotion/Advertising) поля для parent/child связей?
   - Требуется ли изменение схемы БД (`adv_campaigns`, `adv_daily_stats`)?

---

## 📊 Текущее состояние Backend

### Database Schema

**Таблица**: `adv_campaigns`
```prisma
model AdvCampaign {
  id          String   @id @default(uuid()) @db.Uuid
  cabinetId   String   @map("cabinet_id") @db.Uuid
  advertId    Int      @unique @map("advert_id")
  name        String   @db.VarChar(500)
  type        Int
  status      Int
  nmIds       Int[]    @map("nm_ids")  // ← Массив артикулов в кампании
  // ❌ NO parent_nm_id field (основная карточка)
  // ❌ NO linked_nm_ids field (склеенные карточки)
}
```

**Таблица**: `adv_daily_stats`
```prisma
model AdvDailyStat {
  id         String   @id @default(uuid()) @db.Uuid
  cabinetId  String   @map("cabinet_id") @db.Uuid
  advertId   Int      @map("advert_id")
  date       DateTime @db.Date
  nmId       Int      @map("nm_id")  // ← Артикул товара
  views      Int      @default(0)
  clicks     Int      @default(0)
  orders     Int      @default(0)
  // ❌ NO parent_nm_id field
  // ❌ NO is_linked_product field (флаг склейки)
}
```

### API Endpoints

**Current**: `GET /v1/analytics/advertising`
- Возвращает метрики по артикулам (nmId)
- НЕ содержит информацию о родительских/дочерних связях

**WB SDK Methods** (daytona-wildberries-typescript-sdk):
- `getFullstats({ id, dates })` - статистика кампании
- `getAuctionAdverts({ ids })` - детали кампаний type 9
- Проверить: есть ли методы для card linking?

---

## ✅ Ожидаемый результат

### Минимальная реализация (MVP)

**Option 1: Metadata в response** (если WB API предоставляет данные)
```typescript
interface AdvertisingItem {
  sku_id: string
  spend: number
  revenue: number
  // NEW: Card linking metadata
  is_linked_product: boolean  // Флаг склеенного товара
  parent_sku_id?: string       // Основная карточка (если is_linked = true)
  linked_sku_ids?: string[]    // Склеенные карточки (если is_linked = false)
  attributed_from_parent?: boolean  // Revenue атрибутирован от parent
}
```

**Option 2: Distributed costs** (если WB не предоставляет, рассчитываем сами)
```typescript
// Пропорциональное распределение затрат основной карточки
// ter-13-1: spend=11,337₽, revenue=31,464₽
// Распределить на склеенные товары:
// - ter-09: spend = 11,337 * (1,105 / total_linked_revenue)
// - ter-10: spend = 11,337 * (1,489 / total_linked_revenue)
// - ter-11: spend = 11,337 * (1,512 / total_linked_revenue)
```

**Option 3: Hybrid approach**
- Сохранять original WB data as-is (spend=0 для склеенных)
- Добавить computed field `adjusted_spend` с распределёнными затратами
- Frontend может переключаться между "Original" и "Adjusted" view

### Расширенная реализация (Future)

**Database Migration**:
```sql
ALTER TABLE adv_campaigns
ADD COLUMN parent_nm_id INTEGER,
ADD COLUMN linked_nm_ids INTEGER[];

ALTER TABLE adv_daily_stats
ADD COLUMN is_linked_product BOOLEAN DEFAULT false,
ADD COLUMN parent_nm_id INTEGER;
```

**New API Endpoint**:
```
GET /v1/analytics/advertising/card-linking
Response:
{
  "cards": [
    {
      "parent_nm_id": 270937054,  // ter-13-1
      "parent_name": "ter-13-1",
      "spend": 11337,
      "linked_products": [
        { "nm_id": 173588306, "name": "ter-09", "attributed_revenue": 1105 },
        { "nm_id": 173589306, "name": "ter-10", "attributed_revenue": 1489 },
        { "nm_id": 173589742, "name": "ter-11", "attributed_revenue": 1512 }
      ]
    }
  ]
}
```

---

## 📝 Impact Analysis

### Frontend Changes Required

**If WB provides card linking data**:
- ✅ Minimal changes - display metadata in UI
- Add tooltip: "🔗 Склейка с {parent_name}"
- Show adjusted metrics with parent spend distribution

**If Backend calculates distribution**:
- ✅ UI toggle: "Original WB data" vs "Adjusted (with distributed costs)"
- Update PerformanceMetricsTable to show both views
- Add explanation tooltip for users

### Current Workaround

**Until Backend implements card linking**:
- ✅ Keep `status: "unknown"` for items with spend=0
- ✅ Add tooltip explaining card linking:
  ```
  🔵 Нет данных
  Нет прямых рекламных затрат в периоде.
  Продажи могут быть атрибутированы из склейки с другими карточками.
  ```

---

## 🔗 Related Issues

- Epic 33: Advertising Analytics (Frontend)
- Request #76: Efficiency filter implementation
- Request #77: ROI calculation validation
- Request #79: Campaign placement field

---

## 📚 Research Questions for Backend

1. **WB API Capabilities**:
   - Проверить Context7 для `daytona-wildberries-typescript-sdk`:
     - Есть ли методы для card linking?
     - Какие поля возвращаются в `getFullstats`/`getAuctionAdverts`?
   - Документация WB: есть ли официальная информация про склейки?

2. **Attribution Logic**:
   - Как WB рассчитывает revenue для склеенных товаров?
   - Используют ли они last-click attribution?
   - Есть ли attribution window (7/14/30 дней)?

3. **Implementation Strategy**:
   - Store raw WB data as-is (no changes to current import)
   - Add computed fields for adjusted metrics
   - OR modify import to distribute costs during sync

---

## 🚀 Next Steps

**Backend Team**:
1. ✅ Исследовать WB API для card linking endpoints/fields
2. ✅ Проверить через Context7: `daytona-wildberries-typescript-sdk` methods
3. ✅ Предложить архитектурное решение (raw vs computed vs hybrid)
4. ✅ Оценить effort для реализации (DB migration, API changes)

**Frontend Team** (waiting):
- ⏳ Ожидаем ответ Backend для дизайна UI
- ⏳ Временно: показываем "Нет данных" с tooltip

---

## 📞 Contact

**Prepared by**: Frontend Team (Claude Code Assistant)
**For questions**: Backend Team Lead
**Priority**: High (блокирует корректный анализ эффективности рекламы)

**Urgency**: Без понимания склеек невозможно правильно рассчитать:
- ROAS (revenue / spend) - spend=0 для склеенных товаров
- ROI ((profit - spend) / spend) - division by zero
- Реальную эффективность рекламных кампаний
