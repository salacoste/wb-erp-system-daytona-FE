# /settings/tax — Налоговые настройки
**Route:** /settings/tax · **Filters:** none
**Validated:** 2026-07-06 · role=owner · cabinet taxSystem=usn6, vatPayer=false, vatRate=null

## 1. Load
- `GET /v1/cabinets/:id` → **200** (taxRate:6, taxSystem:usn6, vatPayer:false, vatRate:null)
- H1 «Налоговые настройки»; radio group (4 options: Не настроена / **УСН 6% [checked]** / УСН 15% / Пользовательская); VAT checkbox unchecked; Отменить/Сохранить buttons.

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Radio group | render | УСН 6% checked (matches `taxSystem:"usn6"`) | ✅ |
| VAT checkbox | render | unchecked (matches `vatPayer:false`) | ✅ |
| Select УСН 15% + Сохранить | change radio, click Сохранить | `PUT /v1/cabinets/:id` → **400 BAD_REQUEST** `"vatRate must be one of: 0, 5, 20, 22"`; toast «Не удалось сохранить настройки»; BE taxSystem unchanged | ❌ **BD-FE-004** |
| Отменить button | enabled after edit | resets form | ✅ (state mgmt) |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| УСН 6% radio checked | taxSystem:"usn6" | ✅ |
| VAT checkbox unchecked | vatPayer:false | ✅ |

## 4. AP#8 runtime
- N/A — categorical tax system + boolean VAT; no money/ratio.

## 5. Findings
- **BD-FE-004 (BLOCKER, FE round-trip gap)** — Tax form **cannot save** when `vatPayer=false`. `src/components/custom/settings/TaxSettingsForm.tsx:72` sends `vatRate: vatPayer ? vatRate : null`; with `vatPayer=false` → `vatRate:null`. The cabinet's GET returns `vatRate:null`, but the BE PUT DTO **rejects null** — `vatRate must be one of: 0, 5, 20, 22`. So the GET→PUT round-trip is broken for any non-VAT-payer cabinet (the default state). **Fix**: when `vatPayer=false`, send `vatRate:0` (the canonical "no VAT" value) instead of `null`. Verified via curl: `PUT … -d '{"taxSystem":"usn15","taxRate":15,"vatPayer":false,"vatRate":0}'` → **200** (BE then stores `vatRate:null` internally). trace_id `d2799089-ebc5-…`. Repro: open /settings/tax, change any radio, click Сохранить → 400.
- **BE-BUG-F-003 (BE, contract drift)** — `PUT /v1/cabinets/:id` rejects `vatRate:null` but `GET /v1/cabinets/:id` returns `vatRate:null` for non-VAT-payers. Round-trip impossible without FE coercion. Recommend BE either (a) accept `vatRate:null` and coerce to null internally (already does on store), or (b) document the PUT contract as non-null and return `vatRate:0` from GET for consistency. Filed to BE-BUGS-F.md.
- No AP#8 violations; no fabrication.
