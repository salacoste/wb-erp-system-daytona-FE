# /monitor — Монитор
**Route:** /monitor · **Filters:** period
**Validated:** 2026-07-06 · role=owner

## 1. Load
- Renders H1 «Монитор» + subtitle; «Обновлено: 3 минуты назад» freshness stamp.
- Metrics table (Показатель × Сегодня / Нет данных за сегодня / Вчера / 30 дней / Пред. 30 дней).
- COGS-coverage + buyout-rate helper text («Отношение артикулов с известной себестоимостью…», «Процент выкупленных заказов за 30 дней»).

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Period filter | (default) | drives metrics window | ✅ |
| Metrics table render | render | rows: Заказы / Продажи / Выручка / Продажи по себестоимости / Расходы / Маржа / Возвраты; deltas with ↓/↑ arrows + % | ✅ |
| Health badges («Отличный» / «Требуют внимания») | render | summary verdicts | ✅ |

## 3. Data vs API
| Rendered | API | Match |
|---|---|---|
| Заказы: 0 / 0 / 2 889 (↓-32,5%) / 4 280 | task/analytics aggregation | ✅ (locale: NBSP thousands) |
| Выручка: 0 ₽ / 0 ₽ / 1 491 069,9 ₽ (↓-27,5%) / 2 057 574,93 ₽ | (same) | ✅ (comma decimal, NBSP, ₽) |
| Маржа: … / 981 324,92 ₽ (↓-33,9%) / 1 484 801,77 ₽ | (same) | ✅ |
| Возвраты: 0 / 0 / 13 (↑+18,2%) / 11 | (same) | ✅ |

## 4. AP#8 runtime
- Today/yesterday zeros render as «0 ₽» / «0» — semantic zero for "no data today" (correct, not a `?? 0` lie on null money). Deltas computed only when both periods non-zero. ✅
- Russian locale fully correct: «1 491 069,9 ₽», «↓ -32,5 %». ✅

## 5. Findings
- No FE defects. No AP#8 violations. No fabrication. Loads + renders faithfully.
