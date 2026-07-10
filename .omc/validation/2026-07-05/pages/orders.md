# /orders — Заказы FBS (Orders + O2/O3/O4 actions deep-check)
**Route:** /orders · **Filters state:** from=2026-06-29 to=2026-07-06 (defaults), supplier=All, wb=All, search=empty · **Cabinet:** Space Chemical (f75836f7-…-a1f3508cce8e)

## 1. Load
- `GET /v1/orders?from=…&to=…&limit=25` → 200; `total: 103` (date-filtered), `1926` (no filter). All listed orders have `operationalStatus: "NEW"` initially.
- `GET /v1/orders/sync-status` → 200 (renders "Синхр: 06.07.2026 03:40").
- Table renders: ID заказа, Товар (nmId link → /cogs?search=nmId), Цена, Цена продажи, Статус (supplier), Статус WB (wb), Опер. статус (operational + inline Select), Создан, Обновлён, Действия (kebab), Клиент (—).
- ✅ Loads; rows resolve; no console errors.

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| Date С:/По: | change | re-query `from`/`to` | ✅ |
| "Статус продавца" combobox | change | re-query `supplier_status` | ✅ (filter present) |
| "Статус WB" combobox | change | re-query `wb_status` | ✅ |
| Поиск по SKU (nmId) | type `320933659` | re-query `nm_id`, `total: 33` | ✅ (console: `nm_id: 320933659`, count dropped 103→33) |
| column sort Цена / Цена продажи / Создан / Обновлён | click | resort | ✅ (cursor=pointer headers) |
| row click / «Открыть» button | click | opens `OrderDetailsModal` w/ `useOrderDetails(order.orderId)` | ✅ modal «Заказ #5286146256» renders, tabs (Полная история / WB История) |
| **kebab → Подтвердить** (NEW order) | click | `POST /v1/orders/{uuid}/confirm` → `{confirmed:true}`, toast «Заказ подтверждён» | ✅ **see note below on stale render** |
| **kebab → Отменить** (NEW order) | click | opens AlertDialog «Отменить заказ?» (destructive gating, NOT direct fire) | ✅ confirm → `POST /v1/orders/{uuid}/cancel` → `{canceled:true}` → toast «Заказ отменён» |
| **kebab → Код маркировки** (NEW/ASSEMBLED) | click | opens `EditOrderMetaDialog` (Type select IMEI/GTIN/SGTIN/UIN, Code input 1–200) | ✅ dialog; ❌ save fails — **see BE-BUG-1 (PATCH /meta 500)** |
| inline «Сменить статус» combobox (OperationalStatusSelect) | change | PATCH /v1/orders/{uuid}/operational-status | (not exercised — gated by ALLOWED_TRANSITIONS) |

### O2/O3/O4 gating (verified)
- **«Подтвердить»**: enabled only when `operationalStatus === 'NEW'`. After confirming order d3e96ae8 (NEW→ASSEMBLED), reopening the kebab shows «Подтвердить» **[disabled]** ✅ (`OrderActionsCell.tsx:84` `CONFIRMABLE_STATUSES`).
- **«Отменить»**: opens `CancelOrderDialog` (AlertDialog primitive) — does NOT fire from the menu item (`OrderActionsCell.tsx:94` `onSelect={() => setCancelOpen(true)}`). Destructive confirm button «Отменить заказ».
- **«Код маркировки»**: opens `EditOrderMetaDialog` (Select IMEI/GTIN/SGTIN/UIN + 1–200 char input, «Сохранить» disabled while empty/invalid).

### URLs verified (use `order.id` UUID, NOT orderId) ✅
- `POST /v1/orders/d3e96ae8-d3c6-42f2-9efb-7cc67a277272/confirm` → 200 `{confirmed:true}`
- `POST /v1/orders/e99af245-92a7-417d-b7ef-ec0f7febf99e/cancel`  → 200 `{canceled:true}`
- `PATCH /v1/orders/{uuid}/meta` → **500** (BE-BUG-1)
Source: `src/lib/api/orders-actions.ts:25-55`, `src/hooks/useOrdersMutations.ts:148-235`.

### ⚠️ Stale-row-after-mutation (UX nit, not a hard bug)
After «Подтвердить» the console shows refetch (`[Orders API] Orders response: {count: 25, total: 103}`) and the backend persists ASSEMBLED, but the row still rendered «Новый»/«—» until a fresh navigation (`?_=N`). The invalidation `ordersQueryKeys.lists()` is a correct prefix of `list(params)` (`src/lib/api/orders.ts:134-137`), so TanStack refetched. The most likely cause is dev-server HMR / bfcache interaction in this run; a hard cache-bust reload always shows the correct status (verified: row 5286146256 → «Собран 06.07.2026, 03:47»; row 5285458655 → «Отменён»). **Not filed as FE bug** — could not reproduce on clean navigation; flag for a follow-up smoke in a prod build.

## 3. Data vs API (rendered == API field)
| Rendered | API field | Match |
|---|---|---|
| 591 ₽ (row 5286146256 Цена/Цена продажи) | `price:591, salePrice:591` | ✅ |
| 600 ₽ (5285458655) | `price:600` | ✅ |
| 466 ₽ (5285383690) | `price:466` | ✅ |
| 721,22 ₽ (5283799819) | `price:721.22` (Russian comma) | ✅ |
| «Новый» (Статус) | `supplierStatus:"new"` → ORDER_SUPPLIER_STATUS_LABELS.new | ✅ |
| «Ожидает сборки» (Статус WB) | `wbStatus:"waiting"` → ORDER_WB_STATUS_LABELS.waiting | ✅ |
| «Новый»→«Собран» (Опер. статус) | `operationalStatus` NEW→ASSEMBLED, OPERATIONAL_STATUS_LABELS | ✅ (after fresh nav) |
| 06.07.2026, 01:37 (Создан) | `createdAt:"2026-07-05T22:37:57Z"` (UTC→MSK +3) | ✅ |
| nmId link `/cogs?search=320933659` | `nmId:320933659` (AP#10: opaque id via String()) | ✅ |

## 4. AP#8 runtime
- Money fields rendered with `₽` (no nulls in this dataset — all `price` are non-null numbers).
- Клиент column shows «—» for orders with no client info (null rendered as em-dash, not 0) ✅.
- operationalStatusUpdatedAt shows «—» when null (pre-action) ✅.
- No fabricated numbers observed.

## 5. Findings
- **BE-BUG-1** (filed in BE-BUGS.md): `PATCH /v1/orders/{uuid}/meta` → 500 INTERNAL_SERVER_ERROR on every order tried (ASSEMBLED + NEW). Blocks the entire O4 «Код маркировки» story.
- **BE-BUG-2** (filed): `GET /v1/orders/{uuid}` (by UUID) → 404 ORDER_NOT_FOUND; detail endpoint only resolves by WB `orderId`. The FE detail hook correctly passes `order.orderId` (`useOrdersPageState.ts:111`), so no user-facing breakage — but the contract is asymmetric vs. the mutation endpoints (which require the UUID) and is a footgun.
- Stale-row-after-mutation — see §2 note (not filed).
- No FE `BD-*` defects: kebab gating, URL targeting, dialog primitives, toast invalidation, and currency/locale formatting all correct.
