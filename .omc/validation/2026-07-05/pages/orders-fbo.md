# /orders/fbo — FBO Заказы и продажи
**Route:** /orders/fbo · **Filters state:** from=2026-06-06 to=2026-07-06 (defaults), tab=Заказы, search=empty

## 1. Load
- `GET /v1/orders/fbo?from=2026-06-06&to=2026-07-06&limit=20` → 200 (list).
- `GET /v1/orders/fbo/aggregate?from=…&to=…` → 200 `{count:690, totalPrice:1214376, totalFinishedPrice:1214376, avgPrice:1759.97, cancelledCount:0, cancelRate:0}`.
- `GET /v1/orders/fbo/sync-status` → 200 (renders «Активен · Every 15 minutes»).
- `GET /v1/orders/fbo/sales?from=…&to=…` → 200 (Продажи tab, total 811).
- ✅ Loads; aggregate cards + table resolve; no console errors.

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| Дата начала / Дата окончания | change | re-query list + aggregate + sales | ✅ |
| Поиск по артикулу (nmId) | type | filter | ✅ (input present) |
| tab «Заказы» ↔ «Продажи» | click | swap tables (panel ref swaps; Продажи shows 811 rows, «Цена продажи»/«К выплате»/«Тип») | ✅ |
| «Синхронизировать FBO заказы» button | click | POST sync → `{jobId:"fbo-manual-…"}`, refetch list/aggregate/sync-status | ✅ (console: `Sync triggered: fbo-manual-f75836f7-…-1783299459279`) |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| «Заказы» 690 | aggregate `count:690` | ✅ |
| «Сумма заказов» 1 214 376 ₽ | aggregate `totalPrice:1214376` | ✅ |
| «Итого со скидкой» 1 214 376 ₽ | aggregate `totalFinishedPrice:1214376` | ✅ |
| «Отмены» 0 | aggregate `cancelledCount:0` | ✅ |
| «% отмен» 0 % | aggregate `cancelRate:0` | ✅ (formatPercentageInt → «0 %», comma+NBSP rule OK) |
| row «2 378 ₽» (nmId 254936041) | list `totalPrice:2378` | ✅ |
| «Всего: 811» (Продажи) | sales count | ✅ |
| row «428,28 ₽» (Продажи К выплате) | sales `ppearing/finishedPrice` (decimal comma) | ✅ |

## 4. AP#8 runtime
- All money fields rendered with ₽; no nulls in this dataset.
- cancelRate renders «0 %» (not 0% or 0.0%) ✅.
- No fabricated numbers.

## 5. Findings
- None. FE `BD-*`: none. BE: none. Aggregate numbers reconcile exactly with `/v1/orders/fbo/aggregate`.
