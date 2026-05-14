# Request #39: Storage Data Sources Discrepancy Analysis

**Date:** 2025-12-05
**Status:** 📊 ANALYZED
**Type:** Data Investigation

---

## Problem

Two WB API sources for storage costs show significantly different values:
- `weekly_payout_summary.storage_cost` (from Finances/Reports API)
- `paid_storage_daily.warehouse_price` (from Reports/PaidStorage API - Epic 24)

**Example discrepancy (W48 2025-11-24 to 2025-11-30):**
- Finance report storage: **+1,604.02₽**
- Paid storage daily sum: **-167.73₽**

---

## Verified Comparison Results (W46 2025)

> **Обновлено 2025-12-15**: Реальное сравнение данных Weekly Report и Paid Storage API за W46.

| Источник | Сумма | Примечание |
|----------|-------|------------|
| Weekly Report (`wb_finance_raw.storage`) | **1,837.55₽** | 7 дней полных данных |
| Paid Storage API (`paid_storage_daily`) | **1,849.85₽** | 7 дней, агрегированные |
| **Разница** | **+0.67%** | ✅ В пределах нормы (<1%) |

---

## Backend Team Response

**Status**: RESOLVED (analysis complete)
**Resolution date**: 2025-12-15
**Summary**: Storage data sources compared - weekly report vs paid storage daily. After real data comparison for W46, difference is only 0.67% (within normal range). Both sources are valid; `paid_storage_daily` provides more granular per-SKU per-day data. System uses both as appropriate for different analytics views.
**Remaining frontend action**: None - documented as analysis, not a bug.
**Детализация по дням:**

| Дата | Weekly Report | Paid Storage | Разница |
|------|--------------|--------------|---------|
| 2025-11-10 | 267.62₽ | 269.18₽ | +1.56₽ |
| 2025-11-11 | 266.44₽ | 267.64₽ | +1.20₽ |
| 2025-11-12 | 264.43₽ | 266.45₽ | +2.02₽ |
| 2025-11-13 | 262.84₽ | 264.43₽ | +1.59₽ |
| 2025-11-14 | 259.77₽ | 262.86₽ | +3.09₽ |
| 2025-11-15 | 259.44₽ | 259.81₽ | +0.37₽ |
| 2025-11-16 | 257.01₽ | 259.48₽ | +2.47₽ |

**Вывод**: При полном покрытии данных расхождение составляет **<1%**, что является допустимой погрешностью из-за различий в округлении и методологии расчёта WB.

📖 **Подробный гайд**: [`docs/STORAGE-API-GUIDE.md`](../../../docs/STORAGE-API-GUIDE.md)

---

## Root Cause Analysis

### 1. Data Coverage Gap

`paid_storage_daily` has incomplete data coverage:

| Week | wb_finance_raw days | paid_storage_daily days |
|------|---------------------|------------------------|
| W48 | 6 days (24-29.11) | **1 day** (24.11) |
| W47 | 7 days (17-23.11) | 6 days (18-23.11) |

**Impact:** Missing days cause significant underreporting.

### 2. Different Calculation Methodology

Even for the same day (2025-11-24):
- `wb_finance_raw.storage`: **+243.95₽** (single aggregated row)
- `paid_storage_daily` sum: **-167.73₽** (81 detailed rows)

### 3. Different API Purposes

| Source | WB API | Purpose |
|--------|--------|---------|
| `wb_finance_raw.storage` | Finances/Reports (weekly) | **Final billed amount** deducted from seller payout |
| `paid_storage_daily` | Reports/PaidStorage (daily) | **Detailed breakdown** by article with discounts |

### 4. paid_storage_daily calc_type breakdown

| calc_type | Description | Sign | Example |
|-----------|-------------|------|---------|
| `короба: товары ниже базы` | Base storage rate | + (charge) | +58.61₽ |
| `короба: товары свыше базы` | Higher storage rate | + (charge) | +6.40₽ |
| `скидка на период поставки` | Delivery period discount | - (discount) | -65.47₽ |
| `скидка на остаток склада` | Stock remainder discount | - (discount) | -5.30₽ |

**W47 breakdown:**
- Charges (+): 912.27₽
- Discounts (-): -1,592.67₽
- Net: **-680.40₽**

But `wb_finance_raw.storage` for W47: **+3,258.61₽**

---

## Conclusion

**These are fundamentally different data sets that cannot be directly compared.**

| Metric | Finance Report | Paid Storage Report |
|--------|----------------|---------------------|
| Granularity | Daily aggregate | Per-article, per-warehouse |
| Includes discounts | No (final amount) | Yes (detailed breakdown) |
| Purpose | Payout calculation | Cost analysis by SKU |
| Data source | `wb_finance_raw.storage` | `paid_storage_daily.warehouse_price` |

---

## Recommendations

### For UI/UX:

1. **Do NOT show paid_storage_daily totals as "Storage Cost"**
   - These are not comparable to finance report values

2. **Add clarification text** on Storage Analytics page:
   > "Данные показывают детальный расчёт хранения по артикулам из API платного хранения.
   > Итоговая сумма может отличаться от фактического списания в еженедельном отчёте
   > из-за различий в методологии расчёта WB."

3. **Consider showing both values** when available:
   - "Расчётная стоимость (по артикулам): X₽"
   - "Фактическое списание (финансовый отчёт): Y₽"

### For Backend:

1. **Ensure full date coverage** for paid_storage import
   - Current gap: W48 has only 1 day of data
   - Check import scheduler and WB API availability

2. **Add data quality indicator** to API response:
   - `data_coverage_pct`: percentage of days with data
   - `missing_dates`: list of missing dates in range

---

## References

- Epic 24: `docs/epics/epic-24-paid-storage-by-article.md`
- Storage Analytics API: `docs/API-PATHS-REFERENCE.md#storage-analytics-epic-24`
- WB API Docs: Reports/PaidStorage endpoint

---

## Validation Criteria

Критерии валидности при сравнении источников данных:

| Расхождение | Статус | Действие |
|-------------|--------|----------|
| < 1% | ✅ Норма | Данные валидны |
| 1-5% | ⚠️ Предупреждение | Проверить пропущенные дни |
| > 5% | ❌ Ошибка | Расследовать причину |

---

**Last Updated:** 2025-12-15
