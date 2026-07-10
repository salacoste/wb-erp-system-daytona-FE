# /shipments — Отправки (list)
**Route:** /shipments · **Initial data:** `GET /v1/shipments` → `{data:[], total:0}` (cabinet has no shipments; box-types/sku-packaging empty → shipments cannot be created).

## 1. Load
- `GET /v1/shipments` → 200 `{data:[], total:0, page:1, limit:50}`.
- `GET /v1/box-types` → `[]` (used to enable/disable the create button).
- ✅ Loads; empty-state «Нет отправок» renders; no console errors.

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| **«Создать отправку» button** | — | **[disabled]** (no SKU packaging configured) | ✅ correct gating |
| hint link «Сначала настройте упаковку товаров» | click | → /shipments/sku-packaging | ✅ |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| «Нет отправок» | `data:[]` / `total:0` | ✅ |
| «Создать отправку» disabled | box-types/sku-packaging empty | ✅ |

## 4. AP#8 runtime
- No money/ratio fields in empty state. N/A.

## 5. Findings
- None. The disabled-create + helpful-hint UX is correct (shipments depend on box-types + sku-packaging being configured first). Full deep-check of the shipments table + create flow is **blocked by empty data** — would require creating box-types, sku-packaging bindings, then a shipment (out of scope for a non-destructive validation pass; the dependent CRUDs are individually verified in `shipments-box-types.md` and `shipments-sku-packaging.md`).
- FE `BD-*`: none. BE: none.
