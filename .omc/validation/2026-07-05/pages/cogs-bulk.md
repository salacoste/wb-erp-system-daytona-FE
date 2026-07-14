# /cogs/bulk — Массовое назначение себестоимости

**Route:** `/cogs/bulk` · **Filters state:** search box, cursor pagination (BULK_COGS_PAGE_LIMIT per page), checkboxes.
**Validated:** 2026-07-06 · live BE :3000 + FE :3100 (Playwright).

## 1. Load
- `/v1/products?limit=…&has_cogs=false&include_cogs=true&include_storage=true` → **200**, total **55** no-cogs products (note: dropped from 56 after the /cogs single-assign gave `785352608` a COGS). Table renders with checkboxes + «Выбрать все» header ✅.
- Header, info banner («Максимум 1000 товаров за один раз»), 3-step help card all render ✅.
- «Выбрано: N товаров» counter updates live ✅.

## 2. Interactive elements
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Per-row checkbox | tick 2 rows | «Выбрано: 2 товаров» | ✅ |
| Cost input (`Себестоимость (₽) *`) | enter `150` | «Предпросмотр: 150,00 ₽» shows | ✅ |
| Date input (`Дата начала действия *`) | set `2026-06-15` | accepted | ✅ |
| «Просмотреть (N товаров)» submit | click | Preview dialog opens: «Вы собираетесь назначить себестоимость для 2 товаров / Себестоимость 150,00 ₽ / Выбранные товары (2): 202867769, 202870875» | ✅ |
| Preview «Подтвердить» | click | `POST /v1/products/cogs/bulk?format=v2` fired (twice — React StrictMode double-invoke in dev) — **but BE returned 400 both times; products NOT persisted; NO redirect to /cogs; NO success toast** | ❌ **BLOCKING — see BE-3** |

## 3. Data vs API
Preview dialog numbers honest (count + cost + names match selection). The mutation itself fails against the live backend contract — see §5.

## 4. AP#8 runtime
- N/A (no money/ratio display beyond the user-entered cost); the list correctly excludes products that already have COGS.

## 5. Findings
- **BE-3 (BE, 🔴 BLOCKING) — bulk COGS assignment is completely broken end-to-end.** The FE sends `nm_id` as a **string** (per `BulkCogsItem.nm_id: string`, `src/types/cogs/cogs-bulk.ts:16`; `createBulkCogsItems` consumes `string[]`), but the backend validator demands an **integer**: `{"error":{"code":"BAD_REQUEST","details":[{"issue":"items.0.nm_id must be an integer number"}]}}`. Repro + full contract detail in `BE-BUGS.md` §BE-3.
  - **Owner ambiguity:** either (a) BE widens the validator to accept string-or-integer `nm_id`, or (b) FE changes `BulkCogsItem.nm_id` to `number` and `createBulkCogsItems` parses. Recommend (b) for type-honesty + alignment with the rest of the codebase (single-assign uses URL path, so it's unaffected).
  - **Secondary contract drift (informational, resolved in favor of BE):** BE also rejects `currency` ("property currency should not exist") and requires `source` (non-empty string). FE's `createBulkCogsItems` already sends `source: 'manual'` and omits `currency` when not passed (currency is `undefined` in JSON), so once the `nm_id` type is fixed the payload will be accepted. (Verified by direct curl: `{nm_id:202867769(unit_cost_rub:150,valid_from,source:"manual")}` → 202 ✅, persisted.)
- No other FE-owned defect; the selection/preview/validation UX is correct. The break is purely the `nm_id` type contract.
