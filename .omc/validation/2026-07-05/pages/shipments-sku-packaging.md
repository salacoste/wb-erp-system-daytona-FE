# /shipments/sku-packaging — Упаковка товаров (CRUD)
**Route:** /shipments/sku-packaging · **Initial data:** `GET /v1/sku-packaging` → `[]`.

## 1. Load
- `GET /v1/sku-packaging` → 200 `[]` (same strict-query rejection as box-types: `?limit` → 400; FE calls with no params).
- `GET /v1/box-types` → used to gate the «Добавить упаковку» button (disabled when no box-types).
- ✅ Loads; empty-state «Нет привязок упаковки» renders; no console errors.

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| **«Добавить упаковку» button** | — | **[disabled]** when no box-types exist | ✅ (initial state, empty cabinet) |
| (after creating a box-type) **«Добавить упаковку» button** | click | opens dialog «Добавить упаковку» (Товар nmId combobox, Тип коробки combobox, optional parent combobox, «Штук в коробке» spinbutton, Отмена/Создать) | ✅ |
| dialog fields | — | «Тип коробки» defaults to «Выберите тип коробки» placeholder; «Создать» disabled until valid | ✅ |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| «Нет привязок упаковки» | `[]` | ✅ |
| «Добавить упаковку» enabled-state | depends on box-types existing | ✅ (cascade gating correct) |

## 4. AP#8 runtime
- N/A (no money/ratio in empty state or form).

## 5. Findings
- **BE-BUG-4 (same as box-types):** `GET /v1/sku-packaging` rejects unknown query params with 400. FE calls it correctly. Low severity.
- The create flow was opened and the form is well-formed (nmId + boxType + quantity). Full submit not exercised because it would create persistent binding data on real SKUs (kept the pass non-destructive). The cascade gating (disabled until box-types exist) is correct.
- FE `BD-*`: none. BE: BE-BUG-4 (shared).
