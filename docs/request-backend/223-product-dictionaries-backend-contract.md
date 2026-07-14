# Backend Contract — S3 Product Dictionaries (brand / subject / tnved)

**Status:** ✅ Backend LIVE (`GET /v1/products/dictionaries`).
**Date:** 2026-07-04
**Implements:** S3 (PC1, gap-03) — SelSup-parity product dictionaries for FE filter dropdowns.
**For:** Frontend — build catalog/analytics filter UIs off this single call.

> Auth/isolation unchanged: `Authorization: Bearer <jwt>` + `X-Cabinet-Id: <uuid>` + ownership verified. Roles Manager/Owner/Analyst.

---

## Endpoint

```
GET /v1/products/dictionaries?includeDiscontinued=false
```

| Param | Type | Default | Notes |
|---|---|---|---|
| `includeDiscontinued` | `boolean` (string `true`/`1`) | `false` | When `true`, discontinued SKUs are counted too. |

Returns distinct values **with product counts** for the cabinet — one round-trip for all filter dropdowns.

---

## Response (200)

```ts
{
  brands:   [{ value: string, count: number }];   // distinct Product.brand
  subjects: [{ value: string, count: number }];   // distinct Product.subject (the real category axis)
  tnveds:   [{ value: string, count: number }];    // distinct Product.tnved (S2 PIM-enrich)
}
```

- Each array is ordered by `count` DESC (most common first) — natural for dropdowns.
- Empty-string `value` never appears (null brands/subjects/tnveds are excluded from the groups).
- Counts are cabinet-scoped and reflect non-discontinued SKUs by default.

### Example

```json
{
  "brands":   [{ "value": "Nike", "count": 42 }, { "value": "Adidas", "count": 17 }],
  "subjects": [{ "value": "Кроссовки", "count": 30 }, { "value": "Кеды", "count": 12 }],
  "tnveds":   [{ "value": "6404", "count": 50 }]
}
```

---

## Why `subject` and not `category`?

`Product.category` is **100% NULL** in our data — the WB Content API does not populate the `object`
field for our nomenclature (OBSERVATION a-i-29). **`subject`** is the real category axis WB gives us.
Do not build a category dropdown — use `subjects`.

---

## FE integration

- **Catalog filters / dropdowns** — render `brands` and `subjects` as `<Select>` options (label =
  `value`, optional badge = `count`).
- **Analytics grouping** — if you need a category/brand picker on analytics pages, use these lists
  (consistent with `/weekly/by-brand` and `/weekly/by-category` groupings).
- **Marking (future)** — `tnveds` is exposed for the eventual Честный-Знак marking flow; no UI needed now.
- Refresh after catalog syncs (the values come from `products`, which the WB product-sync populates).

## v1 boundaries

1. **Read-only, derived** — no separate dictionary table; this is a `groupBy` over `products`. Values
   change as the catalog syncs; there is no manual dictionary management (we are enrichment-only per D7 —
   not a PIM card-management clone).
2. **No `flag_marked`** — the marking-required flag is NOT here; it needs a ТНВЭД→Честный-Знак mapping
   (marking module, gap-06, deferred). `tnveds` is the raw code list only.
3. **Counts, not SKUs** — the response gives counts per value, not the SKU lists. To filter the product
   list by a chosen brand/subject, use `GET /v1/products?brand=...&category=...` (existing query).

## Verification

- Backend: `npm run rebuild` GREEN; `src/products` jest suite GREEN (34 suites / 627 tests). New tests in
  `products.controller.spec.ts` cover delegation + the `includeDiscontinued` flag.
