# BE-BUGS-D.md — Cluster D (analytics commercial/AI + new)

Append-only handoff log of backend-owned defects surfaced during Cluster-D full-page FE validation against live BE (`:3000`, cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`, JWT in `/tmp/feval-token`). Each entry is self-contained for the BE team.

Per coordinator note: this file is the **Cluster D** BE-bug log, separate from `BE-BUGS.md` (Cluster B), `BE-BUGS-A.md`, `BE-BUGS-C.md`. FE findings (BD-*) live in the per-page docs under `pages/` and in `REPORT.md`.

Validated pages: `/analytics/acquiring` (+/period, /reports/[id]), `/analytics/search`, `/analytics/cross-reference`, `/analytics/forecast`, `/analytics/forecast-accuracy`, `/analytics/pricing`, `/analytics/product/[nmId]`, `/analytics/brand-share` (new, PR4b).

---

## BE-D-1 — `/v1/analytics/brand-share` report is universally empty (`{report:[]}`) for every brand×category×date-window combination

- **Endpoint:** `GET /v1/analytics/brand-share?brand=&parentId=&dateFrom=&dateTo=`
- **Severity:** MEDIUM — the PR4b brand-share feature (shipped this week) is non-operational on live data. The full cascading chain works (`/brands` returns 6 brands, `/parent-subjects` returns the brand's categories), but the time-series `report` is always empty, so the chart permanently renders «Нет данных о доле бренда за выбранный период». A user picking Brand → Category → expecting a competitive-positioning chart gets an empty-state every time.
- **Repro:**
  ```bash
  TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)
  # 1. brands populates
  curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" "http://localhost:3000/v1/analytics/brand-share/brands"
  # → ["DURABOND","Omen taro","Protape","Space Chemical","Trekka","О,ДЕНЬ"]

  # 2. parent-subjects populate (Space Chemical → 8 categories)
  curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    "http://localhost:3000/v1/analytics/brand-share/parent-subjects?brand=Space%20Chemical&dateFrom=2026-04-01&dateTo=2026-06-30"
  # → [{parentId:8891,…},{parentId:760,…},… × 8]

  # 3. report is ALWAYS empty — try all 8 categories × 90-day window
  for PS in 8891 760 8896 739 8614 257 571 8555; do
    echo -n "parentId=$PS: "
    curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
      "http://localhost:3000/v1/analytics/brand-share?brand=Space%20Chemical&parentId=$PS&dateFrom=2026-04-01&dateTo=2026-06-30" \
      | python3 -c "import json,sys;print(len(json.load(sys.stdin).get('report',[])),'rows')"
  done
  # → every category: "0 rows"
  ```
- **Response (excerpt):** `{"report":[]}` HTTP 200, for every brand (DURABOND, Protape, Space Chemical, Trekka, …), every parentId, and date windows from the 7-day default out to a 90-day window (2026-04-01 → 2026-06-30).
- **trace_id:** (varies per call; e.g. the live FE call `brand=Space+Chemical&parentId=8896` returned 200 with `{report:[]}` — no trace_id captured for the empty-200, repro above will yield one.)
- **Expected:** per contract `docs/request-backend/225-brand-share-backend-contract.md` §2, the report should return daily `{applyDate, brandRating, pricePercent, qtyPercent}` points for the brand's position inside the chosen WB parent-subject category. With 6 brands and ≥8 categories each available, at least some brand×category×day combinations should yield non-empty rows (the brand-rating/brand-share data is what the feature exists to show).
- **Actual:** `report:[]` universally. The upstream WB brand-rating/brand-share ingestion appears not to have back-filled any data, OR the query window mapping is broken, OR the upstream WB endpoint is returning empty and the service is silently passing it through.
- **Likely root cause (BE-side hypothesis):** (a) the WB "brand rating by category" / "subject shares" upstream API has not been polled/ingested yet for this cabinet (no `brand_share_daily` rows in DB); (b) the date-window → WB applyDate mapping is off; or (c) the upstream call is failing and being swallowed as empty. The brands + parent-subjects endpoints clearly DO return real WB data (6 real brand names, 8 real category names with correct parentId → parentName), so upstream connectivity works for the catalog/dictionary calls but not for the time-series.
- **Impact:** the entire PR4b feature renders an empty chart. FE cannot fix — the value comes straight from the API. FE side is correct: cascading selects work, the empty-state renders, the AP#8 normalizer (`toNullableShareMetric`) and chart gap-handling are in place and will work as soon as the report has rows. **The FE AP#8 contract-§2 path (`0` share → null → «—» + line gap) could not be runtime-verified because no report rows exist to exercise it** — recommend the BE team confirm the normalizer behavior with a synthetic non-empty payload once ingestion is fixed.

---

## BE-D-2 — `summary.adTrafficShare` returns an implausible value (>100%, e.g. 5764.52%) when organic traffic is zero

- **Endpoint:** `GET /v1/analytics/product/:nmId/unified?from=&to=`
- **Severity:** LOW (cosmetic / data-quality) — the FE renders the value faithfully; no crash. But the >5000% ad-share headline on `/analytics/product/[nmId]` is misleading to a seller reading the «Рекламный трафик» card.
- **Repro:**
  ```bash
  TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)
  curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    "http://localhost:3000/v1/analytics/product/147205694/unified?from=2026-06-07&to=2026-07-06" \
    | python3 -c "import json,sys;d=json.load(sys.stdin);print('summary:',d['summary'])"
  # → {'organicTrafficShare': 0, 'adTrafficShare': 5764.52, 'blendedConversion': 3.23}
  ```
- **Response (excerpt):** `summary = {organicTrafficShare: 0, adTrafficShare: 5764.52, blendedConversion: 3.23}` HTTP 200.
- **trace_id:** (none captured; standard 200 response.)
- **Expected:** a traffic share expressed as a percentage should be bounded (0–100% for an exclusive split, or at most ~100% if "ad share of total" = adViews / (adViews + organicViews)). With organicViews=0 and adViews=1787, "ad share of total traffic" should be 100%.
- **Actual:** `adTrafficShare = 5764.52`. The 5764.52 figure appears to be `ad clicks or orders / organic something` rather than `adViews / (adViews + organicViews)` — i.e. the denominator is the wrong field (possibly organic orders/cart events = 0, inflating the ratio to thousands of percent).
- **Impact:** `/analytics/product/[nmId]` Обзор tab shows «Рекламный трафик 5 764,52 %» next to «Органический трафик 0,0 %», which is nonsensical as a share split. Faithful FE rendering of a BE-computed oddity.
- **Note:** the FE normalizer (`unified-product-normalizer.ts`) passes the numeric value through; no FE-side clamp or fabrication. Fix belongs in the BE share computation.

---

## (data-condition, not bugs) — empty-state pages

The following endpoints returned legitimate empty data for this cabinet (non-RF seller / no Jam / no trained models / no COGS). The FE handles each gracefully (correct empty-states, no fabricated numbers). Listed for completeness; **not BE defects.**

- `/v1/analytics/acquiring/reports` + `/acquiring/detail` → `{data:[]}` (non-RF seller, Request #166 — acknowledged in FE copy).
- `/v1/analytics/search/orders` + `/by-product` + `/by-query` → empty (no search-order attribution ingested).
- `/v1/analytics/search/page-one-opportunities` → `{opportunities:[]}`.
- `/v1/ai/forecast` → `{predictions:[],engine:"none"}` (no trained sales-forecast model).
- `/v1/ai/forecast-accuracy` → `{totalValidated:0,avgMAPE:null,…}` (no validation runs).
- `/v1/products/price-recommendations` → `{items:[],total:0}` (no recommendations computed — likely because cogs=0 for W26/W25).
