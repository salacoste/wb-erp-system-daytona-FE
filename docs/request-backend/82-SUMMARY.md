# Request #82: Склейки товаров - КРАТКАЯ СВОДКА (ИСПРАВЛЕНО)

**Дата**: 2025-12-27 | **Статус**: ✅ Решение найдено - требуется реализация | **Приоритет**: HIGH
**Backend Response**: См. `82-BACKEND-RESPONSE.md` (ИСПРАВЛЕНО)

---

## 🎯 Суть проблемы (TL;DR)

**Найдено 6 товаров** с аномальными метриками:
- ❌ Затраты на рекламу: **0₽**
- ✅ Продажи "Из рекламы": **> 0₽** (1,105₽ - 5,433₽)
- ❓ Откуда продажи, если нет затрат?

**✅ Решение найдено**: Это товары в **склейке** (WB API предоставляет данные через `imtID`).

---

## 📊 Примеры товаров

| Артикул | Spend | Revenue | Total Sales | imtID | Status |
|---------|-------|---------|-------------|-------|--------|
| ter-09 | 0₽ | 1,105₽ | 1,105₽ | 328632 | 🔗 Склейка |
| ter-10 | 0₽ | 1,489₽ | 1,489₽ | 328632 | 🔗 Склейка |
| ter-11 | 0₽ | 1,512₽ | 1,512₽ | 328632 | 🔗 Склейка |
| ter-13-1 | 11,337₽ | 31,464₽ | 31,464₽ | 328632 | 🔗 Склейка |

**Вывод**: Все 4 товара объединены (imtID: 328632). Рекламные затраты на ter-13-1, продажи на всех товарах склейки.

**Суммарные метрики склейки**:
- Total Spend: 11,337₽
- Total Revenue: 35,570₽
- ROAS: **3.14** (отличная эффективность!)
- ROI: **213%**

---

## ✅ WB API предоставляет данные о склейках

### Ключевое поле: imtID

**Endpoint**: `POST /content/v2/get/cards/list`

**Response**:
```json
{
  "cards": [
    {
      "nmID": 173588306,
      "imtID": 328632,      // ← ID объединённой карточки
      "vendorCode": "ter-09"
    },
    {
      "nmID": 270937054,
      "imtID": 328632,      // ← Тот же imtID = склейка!
      "vendorCode": "ter-13-1"
    }
  ]
}
```

**Логика**: Товары с **одинаковым `imtID`** = склейка.

---

## ❓ Ответы Backend (кратко)

**1. Где в WB API данные о склейках?**
✅ **Content API**: поле `imtID` в `/content/v2/get/cards/list`

**2. Как WB атрибутирует продажи?**
✅ Advertising API возвращает метрики по `nmId`, Content API предоставляет `imtID` для группировки.

**3. Как распределять затраты?**
✅ **Группировка по `imtID`** (не распределение):
```
Склейка imtID: 328632
├─ totalSpend: 11,337₽ (сумма всех товаров)
├─ totalRevenue: 35,570₽
└─ ROAS: 3.14
```

**4. Нужны ли изменения в БД?**
✅ **ДА**:
- Добавить поле `imtId` в таблицу `products`
- Синхронизировать Content API (daily cron)
- Группировать аналитику по `imtID`

---

## 🛠️ Решение (краткий план)

### Backend (10-15 hours)

**Phase 1: Database**
```sql
ALTER TABLE products ADD COLUMN imt_id INTEGER;
CREATE INDEX idx_products_imt_id ON products(imt_id, cabinet_id);
```

**Phase 2: Content API Sync**
```typescript
// Daily cron job at 06:00 MSK
async syncImtIds(cabinetId: string) {
  const cards = await sdk.products.getCardsList({...});

  await prisma.product.updateMany({
    data: cards.map(c => ({ nmId: c.nmID, imtId: c.imtID }))
  });
}
```

**Phase 3: Analytics Grouping**
```typescript
// GET /v1/analytics/advertising?groupBy=imtId
async getAdvertising(query) {
  // Группировка по imtID
  const grouped = stats.reduce((acc, stat) => {
    const key = product.imtId || stat.nmId;
    acc[key].totalSpend += stat.spend;
    acc[key].totalRevenue += stat.revenue;
    return acc;
  }, {});

  return grouped.map(g => ({
    imtId: g.imtId,
    roas: g.totalRevenue / g.totalSpend
  }));
}
```

### Frontend (4-6 hours)

**1. Grouped View (expandable rows)**
```tsx
<Collapsible>
  <Badge>🔗 Склейка ({row.mergedProducts.length} товаров)</Badge>
  <CollapsibleContent>
    {row.mergedProducts.map(p => (
      <li>{p.vendorCode} - {formatCurrency(p.revenue)}</li>
    ))}
  </CollapsibleContent>
</Collapsible>
```

**2. Tooltip**
```tsx
<Tooltip>
  <Badge>🔗 Склейка</Badge>
  <TooltipContent>
    Объединённая карточка (imtID: {row.imtId})
    Товары: {row.mergedProducts.map(p => p.vendorCode).join(', ')}
  </TooltipContent>
</Tooltip>
```

**3. Filter Toggle**
```tsx
<Tabs value={viewMode}>
  <Tab value="grouped">По склейкам (рекомендовано)</Tab>
  <Tab value="individual">По отдельным товарам</Tab>
</Tabs>
```

---

## 📊 API Response Format

**Endpoint**: `GET /v1/analytics/advertising?groupBy=imtId`

```json
{
  "data": [
    {
      "type": "merged_group",
      "imtId": 328632,
      "label": "ter (склейка)",
      "mergedProducts": [
        { "nmId": 270937054, "vendorCode": "ter-13-1", "spend": 11337, "revenue": 31464 },
        { "nmId": 173588306, "vendorCode": "ter-09", "spend": 0, "revenue": 1105 },
        { "nmId": 173589306, "vendorCode": "ter-10", "spend": 0, "revenue": 1489 },
        { "nmId": 173589742, "vendorCode": "ter-11", "spend": 0, "revenue": 1512 }
      ],
      "totalSpend": 11337,
      "totalRevenue": 35570,
      "roas": 3.14,
      "roi": 213.5,
      "efficiency": {
        "status": "excellent",
        "recommendation": "Увеличить бюджет"
      }
    }
  ]
}
```

---

## 🎯 Итоговый статус

**✅ Проблема решена**:
- WB API предоставляет данные о склейках через `imtID`
- Группировка по `imtID` решает проблему spend=0
- ROAS/ROI корректно рассчитывается для склеек

**📝 Требуется реализация**:
- Backend: Database migration + Content API sync + Analytics grouping
- Frontend: Grouped view + Tooltips + Filter toggle

**⏰ Оценка времени**: 14-21 час (10-15 backend + 4-6 frontend)

**🚀 Приоритет**: HIGH (блокирует корректный анализ эффективности для 33% товаров)

---

## 🔗 Полная документация

См. **82-BACKEND-RESPONSE.md** для детального технического плана реализации.

---

**Impact**: С реализацией склеек получаем корректный ROAS/ROI для ВСЕХ товаров, включая те, у которых spend=0.

**Example**: ter-09 (spend=0) → часть склейки с ROAS=3.14 вместо "Нет данных" ✅
