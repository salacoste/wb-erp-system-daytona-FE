# Backend Request #189 — Advertising ROI & efficiency_status formula mixes total-product-profit with ad-spend

**Status:** RESOLVED — backend already uses `ROI = (ad_revenue - spend) / spend` (ad-attributed basis). Updated validator tests + DTO description to match.
**Filed:** 2026-06-02 (frontend validation campaign, iter-51)
**Endpoint:** `GET /v1/analytics/advertising`
**Related:** #71 (advertising-analytics Epic 33), #139 (organic/ad split), #160 (marketing-analytics audit backlog), #75 (revenue source isolation)
**Severity:** MEDIUM (data is faithfully rendered by FE, but the values mislead users)

## Problem

On the advertising analytics page, SKUs with **excellent ad return** display an **"Убыток" (Loss)** efficiency badge and a wildly negative ROI, because `roi` and `efficiency.status` are computed from the SKU's **total product profit ÷ ad-spend** rather than ad-attributed economics.

## Root Cause (live-confirmed, 2026-06-02, cabinet f75836f7…, `from=2026-05-01&to=2026-06-02`)

Backend `roi == (total_product_profit − ad_spend) / ad_spend` — it divides the SKU's **entire product profit** (which includes COGS, WB commissions, logistics, storage on ALL sales) by **ad-spend only**. Verified across all 25 returned items, e.g. nmId 906010371: `(−303937.05 − 2119.86) / 2119.86 = −144.38` = backend `roi`. The `efficiency.status` badge keys off this ROI sign, not ad ROAS.

## Impact

**16 of 36 SKUs** have `roas > 5` yet `efficiency.status = 'loss'`. Examples:

| nmId | ROAS (rev/spend) | backend ROI | efficiency.status | total profit | ad-spend |
|---|---|---|---|---|---|
| 887604577 | **39.1×** | −642.22 | `loss` → "Убыток" | −1,200,679 | 1,872 |
| 412096139 | 10.48× | −82.66 | `loss` | −108,464 | 1,328 |
| 906010371 | 6.87× | −144.38 | `loss` | −303,937 | 2,120 |

A seller seeing a **39× ROAS campaign flagged "Убыток"** will distrust the page or make the wrong call (pausing a highly-profitable ad). ROI also renders as e.g. `−14438%` / `+9501%` (FE faithfully applies ×100 to the backend ratio), which reads as nonsense.

## Frontend status (no FE bug)

The FE is **data-correct at the boundary**: it renders the backend `roi`/`efficiency.status`/`roas` faithfully (verified normalizer field-mapping, anti-pattern #8 null handling, organic/ad isolation per #75, and the F-47/F-50 efficiency-enum guards — the latter untriggered since live `efficiency.status ∈ {excellent, loss}`). Per the Defensive Frontend Principle the FE does NOT override backend semantics — hence this ticket rather than a FE patch.

## Proposed Resolution (backend decision required)

Clarify the intended semantics of `roi` and `efficiency.status` for the advertising endpoint:
- **Option A (recommended):** make them **ad-attributed** — `ad_roi = (ad_attributed_revenue − ad_spend) / ad_spend`, and base `efficiency.status` on ad ROAS / ad ROI, so the badge reflects advertising effectiveness.
- **Option B:** keep total-profit ROI but **rename** it (e.g. `product_roi`) and add a separate ad-attributed `ad_roi`, so the FE can label them distinctly and not present a total-profit metric under an "advertising efficiency" badge.

Either way, please document which revenue/profit basis each field uses (cross-link #146 BACKEND-DATA-TRANSFORMATIONS).

## Reproduction

```
GET /v1/analytics/advertising?from=2026-05-01&to=2026-06-02&view_by=sku&sort_by=spend&sort_order=desc&limit=36
Authorization: Bearer <token>   X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
→ items[*].roas, .roi, .efficiency.status, .profit, .spend  (see table above)
```
