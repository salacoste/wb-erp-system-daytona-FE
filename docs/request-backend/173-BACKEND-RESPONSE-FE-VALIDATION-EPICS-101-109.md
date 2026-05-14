# Request #171: Backend Response — Frontend Validation Findings (Epics 101-109)

**Date**: 2026-05-06
**Status**: Response to Frontend Validation Report
**In Response To**: Frontend empirical validation of Request #170

---

## TL;DR

Frontend team провёл эмпирическую валидацию документации #170. **5 из 5 фальсификаций (F1-F5) подтверждены** -- документация #170 содержала неверные данные о форматах ответов. Документ #170 исправлен. Все inconclusive (I1-I4) разрешены ниже.

---

## Backend Team Response

**Status**: RESOLVED (response to validation findings)
**Resolution date**: 2026-05-06
**Summary**: All 5 frontend falsifications (F1-F5) confirmed. Documentation in #170 corrected to match actual API responses. Key corrections: tax preliminary response wrapped in `tax` object with snake_case fields, `cabinet-summary` path fixed, FBS REST API endpoint paths verified. All 4 inconclusive items (I1-I4) resolved.
**Remaining frontend action**: Use corrected documentation. No API changes needed - responses are correct, only docs were wrong.

## Falsifications -- Ответы

### F1: Tax Preliminary -- Response Shape (CRITICAL) ✅ ПОДТВЕРЖДЕНО

**Проблема**: #170 документировал плоский camelCase ответ:
```json
{ "from": "...", "to": "...", "taxSystem": "usn_income", "taxRate": 6, "preliminaryTax": 9000.03 }
```

**Реальный ответ** — обёрнут в объект `tax`, snake_case поля:
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

**Когда налог не настроен**: `{ "tax": null }`

**Источник**: `src/analytics/dto/response/tax-preliminary-response.dto.ts`
**Статус**: #170 Section 2 исправлена.

---

### F2: Tax Preliminary — Enum Values (CRITICAL) ✅ ПОДТВЕРЖДЕНО

**Проблема**: #170 указывал `tax_system: "usn_income" | "usn_income_expense" | "osno" | "patent"`

**Реальные значения**: `"usn6"` | `"usn15"` | `"manual"` | `null`

- `usn6` = УСН Доходы (6%)
- `usn15` = УСН Доходы-Расходы (15%)
- `manual` = Ручная настройка

**Источник**: `src/analytics/dto/response/tax-preliminary-response.dto.ts:71`
**Статус**: #170 Section 2 исправлена.

---

### F3: Unit Economics — Query Parameter Casing ✅ ПОДТВЕРЖДЕНО

**Проблема**: Документация могла подразумевать `viewBy` (camelCase).

**Реальный параметр**: `view_by` (snake_case)

```
GET /v1/analytics/weekly/unit-economics?week=2026-W18&view_by=sku
```

Допустимые значения: `sku` | `category` | `brand` | `total` (default: `sku`)

**Источник**: `src/analytics/dto/query/unit-economics-query.dto.ts:30`

---

### F4: cost_category_order Location ✅ ПОДТВЕРЖДЕНО (с уточнением)

**Утверждение frontend**: Поле не найдено в ответе.

**Реальность**: Поле `cost_category_order` **СУЩЕСТВУЕТ** в объекте `meta`:

```json
{
  "meta": {
    "week": "2025-W47",
    "cabinet_id": "uuid",
    "view_by": "sku",
    "generated_at": "2025-12-09T10:00:00Z",
    "cost_category_order": [
      "cogs",
      "delivery_to_warehouse",
      "commission",
      "logistics_delivery",
      "logistics_return",
      "storage",
      "paid_acceptance",
      "penalties",
      "other_deductions",
      "advertising"
    ]
  },
  "summary": { ... },
  "data": [ ... ]
}
```

**Возможная причина**: Если ответ пустой (нет данных за запрошенную неделю), `meta` может содержать только базовые поля без `cost_category_order`. Проверьте с неделей, где есть данные.

**Источник**: `src/analytics/dto/response/unit-economics-response.dto.ts:331-347`

---

### F5: delivery_to_warehouse Location ✅ ПОДТВЕРЖДЕНО

**Проблема**: Ожидание top-level поля `delivery_to_warehouse`.

**Реальность**: Поле **вложено** в объекты `costs_rub` и `costs_pct`:

```json
{
  "costs_rub": {
    "cogs": 30000,
    "delivery_to_warehouse": 5200,
    "commission": 15000,
    "logistics_delivery": 8000,
    "logistics_return": 2000,
    "storage": 3000,
    "paid_acceptance": 1500,
    "penalties": 500,
    "other_deductions": 1000,
    "advertising": 0
  },
  "costs_pct": {
    "cogs": 30.0,
    "delivery_to_warehouse": 5.2,
    "commission": 15.0,
    "logistics_delivery": 8.0,
    "logistics_return": 2.0,
    "storage": 3.0,
    "paid_acceptance": 1.5,
    "penalties": 0.5,
    "other_deductions": 1.0,
    "advertising": 0
  }
}
```

**Важно**: `delivery_to_warehouse` — nullable. `null` = нет подтверждённых отправок (shipment_cost_snapshots) для SKU за эту неделю.

**Источник**: `src/analytics/dto/response/unit-economics-response.dto.ts:88-94` (CostsRubDto) и `:21-26` (CostsPctDto)

---

## Inconclusive — Разрешения

### I1: commission_other в Finance Summary

**Статус**: Поле `commission_other` **НЕ находится** в `finance-summary`.

**Где оно находится**:
- `GET /v1/analytics/weekly/cabinet-summary` — `commission_other` на верхнем уровне (snake_case)
- `GET /v1/analytics/weekly/sku-financials` — аналогичное поле

**Источник**: `src/analytics/dto/response/cabinet-summary-response.dto.ts:228-234`

```json
{
  "commission": 872.38,
  "commission_other": 51063.0,
  "total_expenses": 45000.0,
  "operating_profit": 555000.0,
  "operating_margin_pct": 37.0
}
```

**Story 107.1** (исправление commission_other) — **завершена и в проде**. Поле теперь корректно показывает `wb_services_cost` из corrections (bonus_type_name).

---

### I2: W16-W17 Data Re-Aggregation

**Статус**: Данные за W16 и W17 исправлены:
- W16: promo expenses 0 → 40,881 RUB
- W17: promo expenses 0 → 45,144 RUB
- `weekly_payout_total` пересчитаны с учётом исправленных promo

Если при запросе `GET /v1/analytics/weekly/finance-summary?week=2026-W16` promo всё ещё 0 — возможно, кэш (TTL 30 мин). Перезапросите или укажите конкретные недели для проверки.

---

### I3: Returns Analytics Test Data

**Статус**: Returns data поставляется через:
- `GET /v1/analytics/returns/reasons` — классификация возвратов по причинам
- `GET /v1/analytics/buyout/reconciliation` — сверка выкупов/возвратов

Данные синхронизируются ежедневно через `returns_sync` pipeline (06:30 MSK). Если данных нет — пайплайн мог ещё не отработать для текущего кабинета. Проверьте через мониторинг:

```
GET /v1/monitoring/pipeline-health-grid?cabinetId=<YOUR_CABINET_ID>
```

Посмотрите статус `returns_sync` пайплайна. Если `no_data` — запустите импорт вручную через `POST /v1/tasks/enqueue` с `task_type: "returns_sync"`.

---

### I4: FBS Orders Test Data

**Статус**: FBS данные синхронизируются каждые 5 минут через `orders_fbs_sync` pipeline.

Endpoints:
- `GET /v1/orders/fbs` — список FBS заказов
- `GET /v1/analytics/fbs/trends` — тренды FBS

Если данных нет — проверьте:
1. WB API token привязан к кабинету (cabinet-settings)
2. Есть ли FBS заказы за запрошенный период
3. Pipeline status через monitoring dashboard

---

## Action Items

### Backend (выполнено)
- [x] Исправлена #170 Section 2 — корректный tax preliminary response shape
- [x] Создан документ #171 — детальный ответ на findings

### Frontend (рекомендации)
- [ ] Обновить типы `usePreliminaryTax` hook: `tax_amount`/`tax_system`/`usn6`/`usn15` вместо `preliminaryTax`/`usn_income`
- [ ] Обновить unit-economics query: `view_by` (snake_case), не `viewBy`
- [ ] Использовать `meta.cost_category_order` для waterfall chart ordering
- [ ] Искать `delivery_to_warehouse` внутри `costs_rub`/`costs_pct`, не на верхнем уровне
- [ ] Искать `commission_other` в `cabinet-summary`, не в `finance-summary`

---

## Endpoint Quick Reference (Corrected)

### Tax Preliminary
```
GET /v1/analytics/tax/preliminary?from=2026-05-05&to=2026-05-11
Response: { tax: { tax_amount, tax_system: "usn6"|"usn15"|"manual"|null, ... } | null }
```

### Unit Economics
```
GET /v1/analytics/unit-economics?week=2026-W18&view_by=sku
Response: { meta: { cost_category_order: [...] }, summary: {...}, data: [...costs_rub: { delivery_to_warehouse }, costs_pct: { delivery_to_warehouse }...] }
Note: path is /v1/analytics/unit-economics (no weekly/ prefix). view_by=sku is REQUIRED for full response with meta+summary.
```

### Cabinet Summary (commission_other)
```
GET /v1/analytics/weekly/cabinet-summary
GET /v1/analytics/weekly/cabinet-summary?weeks=4
GET /v1/analytics/weekly/cabinet-summary?weekStart=2026-W16&weekEnd=2026-W18
Response: { ..., commission: N, commission_other: N, total_expenses: N, ... }
Note: NO singular "week" param. Use "weeks" (number, 1-52, default 4) for relative range, or "weekStart"+"weekEnd" for explicit range.
```

---

**Backend Team** | 2026-05-06
