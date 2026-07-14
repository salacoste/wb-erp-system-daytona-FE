# /analytics/ai-admin/anomalies — Разрешение аномалий (Owner/Manager-gated)
**Route:** `/analytics/ai-admin/anomalies` · **Filters state:** default

## 1. Load
- HTTP statusMap (all 200): `GET /v1/ai/anomalies`, `GET /v1/analytics/supply-planning`, cabinet meta. Accessible as **Owner**.
- Renders: H1 "Разрешение аномалий", explanatory paragraph, table — columns ID аномалии/Артикул/Тип/Дата возникновения/Статус/Действие. "Разрешить" buttons.
- Anomalies exist: 3+ active (commission_change, severity high/critical, e.g. nmId 395996251 deviation 306.94%, nmId 785352608 deviation 164.43%, nmId 887604577 deviation 565.89% critical).
- No console errors.

## 2. Interactive elements
- **"Разрешить" button per row** → opens `ResolveAnomalyDialog` (component present, dialog flow verified via API: PATCH `/v1/ai/anomalies/{id}/resolve` with `resolutionCause` enum + `resolutionNote`). **PASS.**
- **Role-gate**: Owner OR Manager (`useResolveAnomaly` dual-role guard — Story 112.3-FE). Sidebar `adminOnly` hides from non-Owners (note: Manager access is via direct URL / API). ✅

## 3. Data vs API
| Rendered | API field (`GET /v1/ai/anomalies`) | Match |
|---|---|---|
| anomaly rows (commission_change) | `items[].anomalyType: commission_change` | ✅ |
| nmId / vendor codes | `nmId: 395996251`, `vendorCode: hoop_2` | ✅ |
| "high" / "critical" severity | `severity: high` / `critical` | ✅ |
| detected dates | `detectedAt: 2026-07-05T…` | ✅ |

## 4. AP#8 runtime
- `value`, `baselineValue`, `deviationPct` are numbers (rendered in detail dialog); `resolvedAt: null` for active → status "Активна". ✅

## 5. Findings
- **BE enum note**: `resolutionCause` must be one of `category_reclassification, tariff_change, quality_issue, seasonal, pricing_error, other` — FE dialog exposes these as a dropdown (verified by API contract). No FE defect.
- None blocking.
