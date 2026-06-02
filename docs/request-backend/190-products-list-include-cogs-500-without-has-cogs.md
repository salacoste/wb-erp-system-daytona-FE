# Backend Request #190 — `/v1/products?include_cogs=true` returns 500 unless `has_cogs` is set — breaks the main COGS page

**Status:** Open
**Filed:** 2026-06-02 (frontend validation campaign, iter-53)
**Severity:** **CRITICAL** (the default view of the COGS-management page renders an empty, errored product list)
**Endpoint:** `GET /v1/products`
**Related:** #15 (add include_cogs to product list — marked complete; this is a regression of it), #20 (FE polling issues), #18/#19 (margin/missing-data scenarios)

## Problem

The main COGS-management page (`/cogs`, "Управление себестоимостью") loads with the default **"Все товары"** tab, which fetches the product list **with margin** (`include_cogs=true`). That request **500s**, so the table shows **0 products** and error alerts. The page is effectively broken on first load.

## Root cause (LIVE-CONFIRMED 2026-06-02, cabinet f75836f7…)

`include_cogs=true` crashes **only when `has_cogs` is absent**:

| Request | Result |
|---|---|
| `GET /v1/products?limit=25&include_cogs=true` | **500** INTERNAL_SERVER_ERROR |
| `GET /v1/products?limit=25&include_cogs=true&include_storage=true` | **500** (this is the exact request the COGS page sends) |
| `GET /v1/products?has_cogs=true&limit=25&include_cogs=true` | **200** — 25 products, `current_margin_pct` populated ✓ |
| `GET /v1/products?limit=64&include_dimensions=true` (no include_cogs) | 200 — 64 products, but `current_margin_pct=null` for all (margin omitted) |

So margin **works** when `has_cogs=true` is sent, but the "all products" view (no `has_cogs` filter) **500s**. Since #15 added `include_cogs` to this endpoint and was marked complete, this is a **regression** for the unfiltered case.

## Live evidence (Playwright, default `/cogs` load)

```
GET /v1/products?limit=25&include_cogs=true&include_storage=true → 500  (fired twice, retry)
rendered product rows = 0 ; 3 error alerts ; page body shows header but no product table
```
The single-product detail endpoint `GET /v1/products/906010371` DOES return the margin (`current_margin_pct:-33.27, period:"2026-W22"`), confirming the data exists — only the **list + include_cogs (no has_cogs)** path is broken.

## Frontend status (FE is behaving per the #15 contract)

The COGS page sets `enableMarginDisplay=true` → `include_margin` → `include_cogs=true` (`ProductList.tsx:68`, `useProducts-utils.ts:55-56`). It does NOT (and should not) force `has_cogs=true` on the "Все товары" tab. The FE is correctly requesting margin per #15; the backend 500 is the defect.

**Secondary FE impact (also rooted in this bug):** when the list omits margin (`current_margin_pct=null` while COGS is assigned), the FE treats it as "margin calculation pending" → perpetual "(расчёт маржи…)" + 5-min polling churn, never displaying the real margin. Resolving the 500 (so the list returns margin) fixes this too.

## Proposed Resolution (backend)

`GET /v1/products?include_cogs=true` must return 200 with `current_margin_pct` populated **regardless of whether `has_cogs` is provided** (i.e. for the "all products" view). Restore the #15 behavior for the unfiltered case. Also confirm `has_cogs=false&include_cogs=true` does not 500.

## Reproduction

```
GET /v1/products?limit=25&include_cogs=true&include_storage=true
Authorization: Bearer <token>   X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
→ 500 ; compare with ?has_cogs=true&limit=25&include_cogs=true → 200 + margins
```
