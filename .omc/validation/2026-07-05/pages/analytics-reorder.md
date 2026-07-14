# /analytics/reorder — Дашборд пополнения (Reorder Recommendations)

**Route:** `/analytics/reorder` · **Filters state:** status=Все (default), no recommendations present in cabinet
**Validated:** 2026-07-06 · FE `:3100` · BE `:3000` · cabinet `f75836f7-…`

## 1. Load — ✅ (empty-data state)
- `/v1/analytics/reorder-recommendations?limit=…` → **200** `{meta:{lead_time_days:7,coverage_days:14,safety_factor:1.2}, summary:{total_skus:0, pending_count:0, ordered_count:0, total_reorder_value:0, urgent_count:0}, data:[]}`
- `/v1/analytics/reorder-recommendations/metrics` → **200** `{totalPending:0,totalOrdered:0,totalReceived:0,totalExpired:0,avgHoursToOrder:0,avgHoursToReceive:0,reorderCoveragePct:0}`
- Page renders: 4 summary cards (Ожидают / Заказано / Получено / Покрытие), status filter, table with header + **"Нет рекомендаций по пополнению"** empty row. No console errors.
- **Data-condition:** this cabinet has 0 generated reorder recommendations. Not a code bug — graceful empty-state.

## 2. Interactive elements — ✅ (limited by empty data)
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Обновить button | click | refetch | ✅ |
| Status filter combobox (Все/…) | open | dropdown | ✅ (no rows to filter) |
| Sort headers | — | — | ⬜ no rows |
| Mark ordered / Mark received buttons | — | — | ⬜ no rows |

## 3. Data vs API — ✅ (empty → empty)
| Rendered | API field | ✅/⚠️/❌ |
|---|---|---|
| «Ожидают 0 / Ср. 0 ч до заказа» | `totalPending=0`, `avgHoursToOrder=0` | ✅ (literal 0 from BE) |
| «Заказано 0 / Ср. 0 ч до получения» | `totalOrdered=0`, `avgHoursToReceive=0` | ✅ |
| «Получено 0» | `totalReceived=0` | ✅ |
| «Покрытие 0 % / SKUs с рекомендацией» | `reorderCoveragePct=0` | ✅ |
| «Рекомендации (0)» + empty row | `data:[]` | ✅ |

## 4. AP#8 runtime — ⚠️ minor (data-condition)
- Normalizer `reorder-recommendations-normalizer.ts:60` clamps `reorderCoveragePct: toNullableNumber(...) ?? 0` — when backend returns literal `0` (not null) for an empty cabinet, the card shows **"0 %"** rather than **"—"**. The adjacent table row "Нет рекомендаций по пополнению" contextualizes the zero, so this is **borderline-OK** (not a hard AP#8 violation: a genuine "no SKU has a recommendation" reading is 0 %). `avgHoursToOrder` / `avgHoursToReceive` use `toNullableNumber` (no clamp) but backend returns literal 0 → "Ср. 0 ч" (could read as "instant ordering" rather than "no data"). Minor ambiguity, low severity — same family as BD-35/BD-37. No fabrication of money.

## 5. Findings
- **None active (data-empty cabinet).** Page structure, normalizer, and empty-state are all correct.
- **Advisory (low):** when `summary.total_skus === 0`, the four metric cards could render «—» instead of «0 / 0 ч / 0 %» to distinguish "no recommendations exist" from "recommendations exist but coverage genuinely 0 %". Not a defect on current data. Same class as BD-35/BD-37; not re-filed.
- **No BE-owned reorder bugs.** Both endpoints 200, response shape matches the normalizer contract.
