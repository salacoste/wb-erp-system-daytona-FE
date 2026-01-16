# Request #77: Frontend Impact Summary - Profit Bug Fix

**Date**: 2025-12-26
**Status**: ⏳ **AWAITING BACKEND FIX**
**Frontend Team**: Maxim
**Related**: Request #77 (ROI Calculation Validation)

---

## TL;DR для Frontend

🐛 **Backend обнаружил критичный баг**: Profit умножается на количество кампаний для SKU.

📊 **Что изменится после fix**:
- Profit values станут **меньше** (правильнее) для SKU с несколькими кампаниями
- ROI станет **менее отрицательным** (лучше)
- Некоторые SKU могут переместиться из `efficiency: "loss"` → `"poor"` или `"moderate"`

✅ **Никаких breaking changes в API** - структура response остаётся той же.

---

## Пример изменения данных

### SKU 193775258 (ter-13) - Рекламируется в 2 кампаниях

**До fix** (WRONG):
```json
{
  "nmId": 193775258,
  "revenue": 3190,
  "spend": 2188.23,
  "profit": -9566.34,       ← ×2 (DOUBLED)
  "profitAfterAds": -11754.57,
  "roi": -5.37,             ← -537%
  "efficiency": {
    "status": "loss",
    "recommendation": "Consider pausing..."
  }
}
```

**После fix** (CORRECT):
```json
{
  "nmId": 193775258,
  "revenue": 3190,
  "spend": 2188.23,
  "profit": -4783.17,       ← Правильное значение
  "profitAfterAds": -6971.4,
  "roi": -3.19,             ← -319% (лучше чем -537%)
  "efficiency": {
    "status": "loss",       ← Остаётся "loss", но менее критично
    "recommendation": "Consider pausing..."
  }
}
```

**Изменения**:
- `profit`: **-9566.34 → -4783.17** (уменьшилось в 2 раза) ✅
- `profitAfterAds`: **-11754.57 → -6971.4** (улучшилось на 40%) ✅
- `roi`: **-5.37 → -3.19** (улучшилось на 40%) ✅
- `efficiency.status`: Остаётся `"loss"` (но на границе с `"poor"`)

---

## Масштаб изменений

### Какие SKU затронуты?

**Только SKU, рекламируемые в нескольких кампаниях одновременно**:
- 1 кампания: **БЕЗ ИЗМЕНЕНИЙ** ✅
- 2 кампании: profit станет **×0.5** (уменьшится в 2 раза)
- 3 кампании: profit станет **×0.33** (уменьшится в 3 раза)
- N кампаний: profit станет **×(1/N)**

### Примеры изменения efficiency status

**До fix**:
- SKU A: roi = -5.37 → `status: "loss"`

**После fix**:
- SKU A: roi = -3.19 → `status: "loss"` (всё ещё убыток, но меньше)

**Возможно**:
- Некоторые SKU с roi близким к -20% порогу могут переместиться из `"loss"` → `"poor"`
- SKU с roi близким к 0% порогу могут переместиться из `"poor"` → `"moderate"`

---

## Frontend Action Items

### Немедленно (после backend deploy)

- [ ] **Обновить кэш**: Clear React Query cache для `/v1/analytics/advertising`
- [ ] **Проверить UI**: Verify profit values отображаются корректно
- [ ] **Проверить summary**: Total profit должен уменьшиться пропорционально
- [ ] **Проверить фильтры**: Efficiency filter всё ещё работает корректно

### Тестирование

**Test #11 (efficiency_filter=loss)** - ожидаемые изменения:
```bash
# До fix:
totalProfit: -12363.09
avgRoi: -2.36

# После fix (примерно):
totalProfit: ~-6181.55  (уменьшится ~2×)
avgRoi: ~-1.18          (улучшится ~2×)
```

**Test #12 (efficiency_filter=excellent)** - НЕ ЗАТРОНУТ:
- Если excellent товары только в 1 кампании → без изменений
- Если excellent товары в нескольких кампаниях → profit уменьшится, но всё равно останутся excellent

---

## Что НЕ изменится?

✅ **API structure**: Response format остаётся идентичным
✅ **revenue**: Без изменений (было корректным)
✅ **spend**: Без изменений (было корректным)
✅ **views, clicks, orders**: Без изменений
✅ **ctr, cpc, conversionRate**: Без изменений
✅ **roas**: Без изменений (зависит от revenue/spend)
✅ **totalSales**: Без изменений (Epic 35)
✅ **organicSales**: Без изменений (Epic 35)

❌ **profit**: ИЗМЕНИТСЯ (станет корректным)
❌ **profitAfterAds**: ИЗМЕНИТСЯ (зависит от profit)
❌ **roi**: ИЗМЕНИТСЯ (зависит от profitAfterAds)
❌ **efficiency.status**: МОЖЕТ ИЗМЕНИТЬСЯ (зависит от roi)

---

## Как проверить корректность после fix?

### Validation Formula

Для SKU с несколькими кампаниями:
```typescript
// До fix:
profit_displayed = actual_profit × number_of_campaigns ❌

// После fix:
profit_displayed = actual_profit ✅
```

### SQL Query для проверки

Backend может проверить:
```sql
-- Сколько SKU затронуто?
SELECT
  nm_id,
  COUNT(DISTINCT advert_id) as campaign_count,
  SUM(order_sum) as total_revenue,
  SUM(spend) as total_spend
FROM adv_daily_stats
WHERE date BETWEEN '2025-12-01' AND '2025-12-21'
GROUP BY nm_id
HAVING COUNT(DISTINCT advert_id) > 1
ORDER BY campaign_count DESC;
```

### Frontend Validation

После backend deploy:
```typescript
// Проверить что profit уменьшился для multi-campaign SKUs
const before = -9566.34  // Old value
const after = -4783.17   // New value
const ratio = after / before  // Should be ≈ 0.5 for 2-campaign SKU
```

---

## Timeline

**Bug Discovery**: 2025-12-26
**Backend Fix**: ⏳ **PENDING** (~1.5h estimated)
**Frontend Testing**: After backend deploys fix
**Expected Impact**: ✅ **POSITIVE** (more accurate profit/ROI values)

---

## Summary

✅ **Good News**: Fix улучшит точность profit/ROI метрик
✅ **No Breaking Changes**: API structure остаётся неизменным
✅ **Frontend Work**: Minimal (just verify after backend deploys)
⚠️ **User Impact**: Profit values станут более точными (могут удивить пользователей)

**Recommendation**: После backend fix добавить в UI notification:
> "Мы исправили ошибку расчёта прибыли для товаров в нескольких кампаниях. Показатели стали точнее."

---

**Last Updated**: 2025-12-26
**Frontend Status**: ✅ Ready for backend fix
**Backend Status**: ⏳ Fix pending implementation
