# 193 — Shipment-cost DECIMAL fields serialized as Decimal.js objects (not strings) + contract drift

**Status**: OPEN
**Severity**: CRITICAL (every numeric value on the shipment-cost feature renders 0 / "—" / crashes)
**Filed**: 2026-06-02 (frontend validation iter-65)
**Endpoints**: `/v1/box-types`, `/v1/sku-packaging`, `/v1/shipments`, `/v1/shipments/:id`, `POST /v1/shipments/:id/calculate`
**Frontend**: /shipments/box-types, /shipments/sku-packaging, /shipments/[id] (Epic 75-FE / 76-FE)
**Prior contract**: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md#11 says DECIMAL fields are strings ("96000.0000").

---

## 1. CRITICAL — DECIMAL columns serialized as Decimal.js INTERNAL objects, not strings

The backend returns every Prisma `DECIMAL` column as the **Decimal.js internal object** rather than a
decimal string. Live evidence (created a 70×40×40 box type, a 5000₽ shipment, a box line):
```json
"lengthCm":          {"s":1,"e":1,"d":[70]}          // expected "70" (value 70)
"totalDeliveryCost": {"s":1,"e":3,"d":[5000]}        // expected "5000" (value 5000)
"finalCostPerUnit":  {"s":1,"e":2,"d":[708,3333000]} // expected "708.3333" (value 708.33)
```
Swagger + `test-api/99-box-types.http` document these as strings (`"60.00"`). The frontend's
`parseDecimal()` does `parseFloat(value)`; `parseFloat({…})` → `NaN` → returns 0.

**Impact (render-confirmed):**
- /shipments/box-types: every row shows dimensions **"0 × 0 × 0"**, volume **"0"**.
- /shipments/[id]: header delivery cost **"0,00 ₽"**; all post-calc box-line costs **"0,00 ₽"**.
  (The `value ? … : '—'` guards never fire because a Decimal.js object is truthy → fabricated 0 is
  shown instead of "—" — arguably worse than missing.)

**Requested fix:** serialize Prisma DECIMAL columns as strings (or numbers) in the JSON response,
per the #161 contract — e.g. a global `@Transform(({value}) => value?.toString())` / interceptor, or
`Decimal.prototype.toJSON = function(){ return this.toString() }`. This is almost certainly a
backend-wide serialization gap, not shipment-specific — please audit all DECIMAL responses.

**Frontend interim (iter-65):** `parseDecimal` hardened to reconstruct the value from the Decimal.js
`{s,e,d}` object so the feature renders correct numbers even with the current serialization. This is a
defensive shim coupled to the decimal.js internal format — please STILL fix the serialization so the
shim can be removed.

## 2. CRITICAL — `POST /v1/shipments/:id/calculate` response envelope mismatch

Backend returns `{ palletDeliveryCost, totalDeliveryCost, pallets: [{ lines: […] }], roundingDelta }`.
Frontend `CalculateShipmentResponse` expects `{ results: [...] }` (types/shipment-cost.ts:189-201);
`result.results` is `undefined` → `CalculationResults` does `results.length` → **runtime crash**.
Requested: align the envelope (either backend returns `results`, or document the `pallets[].lines`
shape so the FE can remap). This is the FBS-divergence class (#181/#182).

## 3. HIGH — `/v1/sku-packaging` omits the `product` object

FE `SkuPackaging.product` (name/subject) is required, but the response has no `product` key →
the "Товар" column degrades to a bare nmId. Requested: enrich with product name/subject, OR confirm
the FE should treat `product` as optional.

## 4. HIGH — shipment box-line field name `productionCostPerUnit` vs FE `unitCostRub`

Backend sends `productionCostPerUnit` (+ `unitCostRub: null`); FE reads `unitCostRub` → the
"Себест. (PCU)" column shows "—" despite a real value. Requested: align the field name (or confirm FE
should read `productionCostPerUnit`).

---

## Summary
Items 1 (Decimal serialization — backend-wide) and 2 (calculate envelope) are CRITICAL and make the
shipment-cost feature non-functional on the live backend. 3 + 4 are field-contract drift. The FE has
applied a defensive Decimal-object shim (item 1) so box-types/shipment costs render correctly in the
interim, but the canonical fix is server-side serialization + envelope/field alignment.
