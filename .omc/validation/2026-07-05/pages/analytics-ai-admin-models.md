# /analytics/ai-admin/models — Управление AI моделями (Owner-gated)
**Route:** `/analytics/ai-admin/models` · **Filters state:** default sort

## 1. Load
- HTTP statusMap (all 200): `GET /v1/ai/admin/models`, `GET /v1/analytics/supply-planning`, cabinet meta. Accessible as **Owner** role (test user).
- Renders: H1 "Управление AI моделями", sortable admin table — columns Артикул модели/Тип/Версия/Статус/MAPE/Создана/Действие. "Откатить модель v1" buttons per row.
- No console errors.

## 2. Interactive elements
- **"Откатить модель v1" button** → opens `alertdialog "Откатить модель v1?"` with reason textbox, "Отменить" + "Подтвердить откат" (disabled until reason filled). **PASS.**
- **Sortable column headers** (Версия, MAPE, etc.) — "Сортировать по" buttons present. **PASS.**
- **Role-gate**: Owner-only enforced client-side (`useAdminModels`, `useModelRollback` — defense-in-depth guard throws `ApiError 403` if non-Owner). Sidebar `adminOnly` filter hides link from non-Owners. As Owner, full access. ✅

## 3. Data vs API
| Rendered | API field (`GET /v1/ai/admin/models`) | Match |
|---|---|---|
| UUID "549cc7ab-…" (Артикул модели) | `id: 549cc7ab-…` | ✅ |
| "Детекция аномалий" | `modelType: anomaly_detection` (localized) | ✅ |
| "v1" | `version: 1` | ✅ |
| "Активна" | `status: active` | ✅ |
| MAPE "—" | `currentMape: null`, `metrics.mape: null` | ✅ (AP#8) |
| "05.07.2026" | `trainedAt: 2026-07-05T…` | ✅ |

## 4. AP#8 runtime
- MAPE "—" for null. ✅

## 5. Findings
- **BD-note (low):** "Артикул модели" column shows raw model UUID. Acceptable (admin page) but could show a friendlier label. Not a defect.
- None blocking.
