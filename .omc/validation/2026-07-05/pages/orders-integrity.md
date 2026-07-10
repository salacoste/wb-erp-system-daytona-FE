# /orders/integrity — Целостность заказов
**Route:** /orders/integrity · **Cabinet:** Space Chemical

## 1. Load
- `GET /health/orders-integrity?cabinet_id=…` (NOTE: **no `/v1/` prefix** — `src/lib/api/orders-integrity-api.ts:55-57`, `skipDataUnwrap:true`) → 200:
  ```json
  {"status":"unhealthy","checks":{
    "duplicates":{"status":"pass","count":0},
    "orphans":{"status":"pass","count":0},
    "missing_history":{"status":"pass","count":0},
    "duplicate_status_history":{"status":"pass","count":0},
    "invalid_transitions":{"status":"fail","count":2},
    "sync_overlaps":{"status":"pass","count":0}},
   "last_check":"2026-07-06T01:00:19.488Z","duration_ms":12}
  ```
- `GET /v1/orders/reconciliation?cabinet_id=…&from=…&to=…` → 200 (Сверка заказов section).
- ✅ Loads; integrity cards + reconciliation render; no console errors.
- ⚠️ Initial false alarm during probing: a raw `curl /v1/health/orders-integrity` returns 404 (wrong prefix). The FE correctly omits `/v1/` and the call succeeds — NOT a bug, just a contract surprise (endpoint is mounted outside `/v1`).

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| «Обновить проверку» button | click | refetch `/health/orders-integrity` | ✅ (last-check timestamp refreshes, duration "(0.0 сек.)") |
| «Последняя проверка» timestamp | — | renders `last_check` formatted MSK | ✅ «06.07.2026, 03:58» |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| Status «Обнаружены проблемы» (red) | `status:"unhealthy"` | ✅ |
| Дубликаты OK / 0 | `checks.duplicates.{status:pass,count:0}` | ✅ |
| Сироты OK / 0 | `checks.orphans.{status:pass,count:0}` | ✅ |
| Пропущенная история OK / 0 | `checks.missing_history.{status:pass,count:0}` | ✅ |
| Дубли истории OK / 0 | `checks.duplicate_status_history.{status:pass,count:0}` | ✅ |
| **Неверные переходы Ошибка / 2** | `checks.invalid_transitions.{status:fail,count:2}` | ✅ |
| Пересечения синхронизации OK / 0 | `checks.sync_overlaps.{status:pass,count:0}` | ✅ |
| «(0.0 сек.)» | `duration_ms:12` | ✅ |

## 4. AP#8 runtime
- Counts are integer health counters (not money/ratio) — `0` is the correct semantic zero (AP#8 exception SEMANTIC-ZERO), rendered as «0» not «—». ✅.

## 5. Findings
- None. The "2 invalid transitions" is real backend-observed data (legit integrity finding, not a FE/BE bug for this report).
- Minor doc/contract nit: the integrity endpoint lives outside `/v1/` — could confuse API consumers but is correctly handled by the FE client. Not filing.
