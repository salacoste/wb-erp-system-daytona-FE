# /analytics/fbs-stock — Складские остатки FBS

**Route:** `/analytics/fbs-stock` · **Filters state:** period 07.06.2026—06.07.2026 (last 30 days, default), tab=По группам
**Validated:** 2026-07-06 · FE `:3100` · BE `:3000` · cabinet `f75836f7-…`

## 1. Load — ✅
- `/v1/analytics/fbs/stock/groups?from=2026-06-07&to=2026-07-06` → **200** (51 groups)
- `/v1/analytics/fbs/stock/sizes?from=2026-06-07&to=2026-07-06` → **200**
- `/v1/analytics/fbs/stock/regions` → **200** (7 regions, latest-snapshot)
- Page renders: period picker + "Скачать CSV", tabs (По размерам / По регионам / По группам default), table. No console errors.

## 2. Interactive elements — ✅
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Period picker (07.06—06.07) | change | `from/to` query, refetch | ✅ |
| "По размерам" tab | click | renders sizes table | ✅ |
| "По регионам" tab (e1413) | click | renders regions table | ✅ |
| "По группам" tab | click | renders groups table (default) | ✅ |
| Скачать CSV button | click | triggers `/v1/analytics/fbs/stock/export` (POST 202) | ✅ (not deep-tested) |

## 3. Data vs API — ✅ exact
Raw payloads: `fbs-groups.raw.json`, `fbs-sizes.raw.json`, `fbs-regions.raw.json`.

**Groups table** (response has both `items` (raw) and pre-shaped `data.groups` — normalizer reads `data.groups`):
| Rendered | API field (`data.groups[*]`) | ✅/⚠️/❌ |
|---|---|---|
| "Product 148188881 / SKU 1 / Остатки 603 / Стоимость — / Расход/день 0 / Дней покрытия —" | `groupName`, `skuCount=1`, `stockUnits=603`, `stockValue=null`, `averageDailyOutgoing=0`, `daysOfCover=null` | ✅ |
| All 51 rows: stockValue «—», daysOfCover «—» | COGS-absent → null guarded | ✅ AP#8 |

**Regions table** (По регионам):
| Rendered | API field | ✅ |
|---|---|---|
| "Южный ФО / 2 склада / 2140 ед / — / 58,86 %" | `regionName`, `warehouseCount=2`, `stockUnits=2140`, `stockValue=null→—`, `shareOfTotalPct=58.86` | ✅ |
| "Другой / 39 / 1064 / — / 29,26 %" | same | ✅ |

## 4. AP#8 runtime — ✅ clean
- `stockValue: toNullableNumber(...)` → null preserved → `{item.stockValue == null ? '—' : formatCurrency(...)}` (`FbsStockGroupsSection.tsx:126`). ✅
- `daysOfCover: toNullableNumber(...)` → null → «—». ✅
- `shareOfTotalPct: toNullableNumber(...)` → null preserved. ✅
- No fabricated money/ratio. Count fields (`stockUnits`, `skuCount`, `averageDailyOutgoing`) use `toCount` (null→0) which is correct for counts (AP#8 exception AGGREGATION-REDUCE / SEMANTIC-ZERO). ✅
- Confirms the BD audit line 163: "All cluster normalizers AP#8-clean: `fbs-stock-normalizer.ts:60,62,92-93`".

## 5. Findings
- **None.** Page is correct, AP#8-clean, data matches API exactly.
- **Advisory (data-quality, not FE):** every group has `stockValue=null` and `averageDailyOutgoing=0` and `daysOfCover=null` — because (a) COGS is unassigned for W26 (data-condition), and (b) FBS orders are 0 in the period. The FE correctly renders «—» for the null money/ratio fields rather than fabricating. The "Расход/день 0" is a literal backend 0 (count), acceptable.
- **BD-39 (advisory, from prior audit)** — "Аналитика остатков" shows totalStock beside available/reserved/inTransit with no FE sum-reconciliation. Still advisory only (no FE arithmetic → no computed defect). Not re-filed.
- **No BE-owned fbs-stock bugs.** All 3 endpoints 200.
