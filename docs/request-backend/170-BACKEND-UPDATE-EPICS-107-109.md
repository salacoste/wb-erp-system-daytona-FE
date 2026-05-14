# Request #170: Backend Update Report — Epics 107-109

**Date**: 2026-05-06
**Status**: Informational / Ready for Integration
**Epics Covered**: 107 (Frontend Response Fixes), 108 (SDK Returns Integration & Tech Debt Sweep), 109 (SDK Integration Debt & Housekeeping)

---

## TL;DR — Что нового для фронтенда

3 эпика завершены (107-109). **Закрыты 6 открытых запросов**, **1 новый endpoint**, **SDK обновлён до v3.10.0**, пайплайны консолидированы. Все 6529+ тестов проходят, 0 регрессий.

---

## 1. ЗАКРЫТЫЕ ЗАПРОСЫ

Все открытые запросы фронтенда теперь закрыты:

| Запрос | Тема | Статус | Что изменилось |
|--------|------|--------|----------------|
| **#153** | FBO Return Classification Gap | **CLOSED** | Пайплайн `return_classification_sync` работает ежедневно в 06:30 MSK. Все 3 ранее неклассифицированных типа возвратов теперь обрабатываются через `sdk.returns` + `enrichReturnsWithType()`. |
| **#154** | Buyout/Return Data Mismatch | **CLOSED** | `sdk.returns.getReturns()` унифицирует данные FBO + FBS + finance. Выкупов/возвратов сверка (`BuyoutReconciliationService`) работает через единый `ReturnsSyncProcessor` (06:30 MSK). Аномалии: `return_without_buyout`, `orphan_buyout`, `return_quantity_mismatch`. |
| **#148** | Fulfillment Returns Count=0 | **FIXED** | Возвращено корректное количество возвратов в fulfillment summary. Исправлено в Epic 106 + Story 107.8. |
| **#150** | Monitoring False Alarms | **RESOLVED** | StaleTaskReaperService автоматически отменяет зависшие задачи (in_progress > timeout*2 → fail, pending > 2h → cancel). Мониторинг больше не генерирует ложные алармы. |
| **#165** | Orders Price Inversion | **CLOSED** | price/salePrice инверсия исправлена в Story 103.1. |
| **#158** | Stale CLAUDE.md Shards | **CLOSED** | Все shard-документы обновлены, 28 stale markers убраны. |

---

## 2. НОВЫЙ ENDPOINT — Tax Preliminary (#159)

---

## Backend Team Response

**Status**: RESOLVED (informational update)
**Resolution date**: 2026-05-06
**Summary**: Backend update covering Epics 107-109. 6 open frontend requests closed: #153 (return classification), #154 (buyout/return mismatch), #148 (fulfillment returns count), #150 (monitoring false alarms), #165 (price inversion), #158 (stale docs). SDK upgraded to v3.10.0 with `sdk.returns` module. New tax preliminary endpoint. All 6529+ tests passing.
**Remaining frontend action**: Integrate tax preliminary endpoint. Verify closed issues against current frontend behavior.

**Endpoint**: `GET /v1/analytics/tax/preliminary?from=YYYY-MM-DD&to=YYYY-MM-DD`

Предварительный расчёт налогов для **незавершённых** недель. Раньше налоговые данные были доступны только для завершённых недель через `finance-summary`. Теперь можно получить предварительный расчёт для любой даты.

**Response** (обёрнут в объект `tax`):
```json
{
  "tax": {
    "tax_amount": 135000,
    "tax_base": 2250000,
    "effective_tax_rate": 6,
    "tax_system": "usn6",
    "is_minimum_rule": false,
    "net_profit_after_tax": null,
    "vat_payer": true,
    "vat_rate": 20,
    "vat_output": 450000,
    "vat_payable": 420000,
    "revenue_excl_vat": 2250000,
    "net_profit_after_all_tax": null,
    "preliminary": true,
    "data_completeness": {
      "revenueSource": "fulfillment",
      "hasLogistics": false,
      "hasStorage": true,
      "hasAcceptance": false,
      "hasPenalties": false,
      "hasCogs": true,
      "hasAdvertising": true
    }
  }
}
```

**Когда налоговая система не настроена**: `{ "tax": null }`

**Ключевые поля (snake_case!)**:
- `tax_system`: `"usn6"` | `"usn15"` | `"manual"` | `null`
- `tax_amount`: предварительная сумма налога (RUB)
- `tax_base`: база для расчёта налога
- `effective_tax_rate`: эффективная ставка (%)
- `is_minimum_rule`: применяется ли минимальный налог (1% при УСН Доходы-Расходы)
- `preliminary`: `true` — признак предварительного расчёта
- **VAT поля** (только если `vat_payer: true`):
  - `vat_rate`: ставка НДС (%, обычно 20)
  - `vat_output`: начисленный НДС
  - `vat_payable`: НДС к уплате
  - `revenue_excl_vat`: выручка без НДС
- `data_completeness`: вложенный объект (camelCase!) — флаги наличия данных:
  - `revenueSource`: `"orders_fbs"` (только FBS) | `"fulfillment"` (FBO+FBS)
  - `hasLogistics`, `hasStorage`, `hasAcceptance`, `hasPenalties`, `hasCogs`, `hasAdvertising`: boolean

**Auth**: JWT + CabinetGuard
**Cache**: 30 мин

**Источник DTO**: `src/analytics/dto/response/tax-preliminary-response.dto.ts`

---

## 3. SDK v3.10.0 — Новый модуль `sdk.returns`

SDK обновлён с v3.9.3 до v3.10.0. Это **чисто backend** изменение — фронтенд не работает с SDK напрямую, но получает улучшенные данные.

**Что нового в sdk.returns**:
| Метод | Описание |
|-------|----------|
| `getReturns({ dateFrom, dateTo, orderType? })` | Унифицированные данные возвратов FBO + FBS |
| `getReturnByOrderId(orderId, { dateFrom, dateTo })` | Возврат по конкретному заказу |
| `getReturnStats({ dateFrom, dateTo, groupBy })` | Агрегация по nmId / category / orderType |

**Что это значит для фронтенда**:
- Возвраты FBO теперь классифицируются через SDK (ранее — вручную по status history)
- Данные выкупов/возвратов сверяются ежедневно через единый пайплайн
- Endpoint `GET /v1/analytics/buyout/reconciliation` использует новые данные
- Endpoint `GET /v1/analytics/returns/reasons` использует унифицированный источник

**Известное ограничение**: FBS returns (`orderType: 'fbs'`) пока не классифицируются по категориям — WB SDK откладывает это до v3.10.1. FBS возвраты продолжают использовать ручную классификацию по status history.

---

## 4. ПАЙПЛАЙНЫ — Консолидация 18 → 17

Два устаревших пайплайна объединены в один:

| Устаревший (удалён) | Замена |
|---------------------|--------|
| `fbo_return_classification_sync` (06:30 MSK) | `returns_sync` (06:30 MSK) |
| `buyout_reconciliation_sync` (07:00 MSK) | `returns_sync` (06:30 MSK) |

**Итого**: 17 пайплайнов. Monitoring dashboard (`GET /v1/monitoring/pipeline-health-grid`) отражает актуальное состояние.

---

## 5. ИЗМЕНЁННЫЕ ENDPOINTS — Что важно знать

### 5.1 Returns Analytics

| Endpoint | Изменение |
|----------|-----------|
| `GET /v1/analytics/returns/reasons` | Данные теперь из `sdk.returns` (унифицированный источник) |
| `GET /v1/analytics/returns/reasons/by-sku` | То же |
| `GET /v1/analytics/buyout/reconciliation` | Улучшенные данные через `sdk.returns.getReturnStats()` |
| `GET /v1/analytics/buyout/by-sku` | Return counts из унифицированного источника |
| `GET /v1/analytics/buyout/summary` | То же |
| `GET /v1/analytics/fulfillment/summary` | `returnsCount` теперь корректный (fix #148) |

### 5.2 Acquiring Analytics (Epic 101 — ранее)

Endpointы acquiring остаются без изменений. Проверены и стабильны.

### 5.3 FBS Analytics REST API (Epic 105 — ранее)

7 endpointов FBS остаются без изменений. Проверены и стабильны.

---

## 6. СИСТЕМНЫЕ УЛУЧШЕНИЯ (не влияют на API контракт, но улучшают работу)

| Улучшение | Описание |
|-----------|----------|
| **tokenType propagation** | Все 24 WB SDK вызова теперь передают `tokenType: 'personal'`. С 2026-03-30 WB rate-limitит по типу токена. |
| **WbReturnsService caching** | 15-минутный кэш для `sdk.returns` вызовов. Снижает нагрузку на WB API. |
| **StaleTaskReaper** | Автоматическая очистка зависших задач: in_progress > timeout*2 → fail, pending > 2h → cancel. |
| **Queue cleanup** | Устаревшие очереди Redis очищены. Deprecated schedulers удалены. |
| **Monitoring hardening** | Health score корректно считает новые кабинеты. Completeness monitor использует правильные timezone-aware week boundaries. |

---

## 7. ЦЕЛОСТНОСТЬ ДАННЫХ — W16-W17 Re-Aggregation

Исправлены данные за недели W16 (2026-W16) и W17 (2026-W17):
- **W16**: promo expenses были 0 → исправлены на 40,881 (dry-run verified)
- **W17**: promo expenses были 0 → исправлены на 45,144 (dry-run verified)
- **Combined fields**: `weekly_payout_total` пересчитаны с учётом исправленных promo

Если фронтенд отображает данные за эти недели — теперь они корректны.

---

## 8. ЗАПРОСЫ СТАТУСА

### Все закрыты:
- **#130**: Dashboard FBO Orders API — **COMPLETE** (backend реализован в Epic 60, фронтенд ожидает реализации)
- **#153**: FBO Return Classification — **CLOSED**
- **#154**: Buyout/Return Mismatch — **CLOSED**
- **#158**: Stale CLAUDE.md — **CLOSED**
- **#159**: Preliminary Tax — **IMPLEMENTED** (endpoint live, 12 controller tests)
- **#165**: Orders Price Inversion — **CLOSED**

### Открытых запросов нет

Все 130+ запросов от фронтенда закрыты или реализованы. Направляйте новые запросы через `docs/request-backend/` — следующий свободный номер **#170**.

---

## 9. ТЕКУЩИЙ STACK

| Компонент | Версия |
|-----------|--------|
| WB SDK | v3.10.0 |
| NestJS | v11.x |
| Node.js | v25.8.1 |
| PostgreSQL | 15.x |
| Redis | 7.2.4 |
| BullMQ | v5.x |
| Tests | 6529 passing, 0 failures |

---

## 10. БЫСТРЫЙ СТАРТ — Что делать прямо сейчас

1. **Tax Preliminary (#159)**: Если `usePreliminaryTax` hook ещё не подключён к дашборду — теперь можно. Endpoint работает, контракт стабильный.

2. **Returns data (#153, #154)**: Если на дашборде есть компоненты возвратов/выкупов — данные теперь точнее. FBO классификация через SDK, сверка выкупов автоматическая.

3. **Fulfillment #148**: `returnsCount` в fulfillment summary теперь корректный. Если использовали workarounds — можно убрать.

4. **Price inversion #165**: Если использовали `AlertTriangle` для инверсии price/salePrice — backend fix уже на месте. Индикатор можно убрать или оставить для мониторинга.

---

**Backend Team** | 2026-05-06
