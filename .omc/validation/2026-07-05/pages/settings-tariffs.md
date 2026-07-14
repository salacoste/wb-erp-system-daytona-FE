# /settings/tariffs — Управление тарифами (admin)
**Route:** /settings/tariffs · **Filters:** none · **Tabs:** Текущие настройки / История версий / Журнал изменений
**Validated:** 2026-07-06 · role=owner (BE rejects saves — see BD-FE-005)

## 1. Load
- `GET /v1/tariffs/settings` → **200** (owner can READ)
- `GET /v1/tariffs/settings/history` → **200** (empty: count 0)
- `GET /v1/tariffs/settings/audit` → **200** (`{data:[], total:0}`)
- Form populated correctly: Приёмка (1.7 ₽/л, pallet 500), Логистика (Крупногабар 46/14, 5 volume tiers), Комиссии (FBO 25% / FBS 28%), Возвраты (FBO 50 / FBS 50), Хранение (60 free days), FBS настройки. All values match API exactly.
- Collapsible sections (Приёмка/Логистика expanded by default; Возвраты/Комиссии/Хранение/FBS collapsed).
- Save flow: edit → «Сохранить» enabled → alertdialog «Сохранить изменения тарифов?» (warning: immediate effect + journal) → «Подтвердить».

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Collapsible sections | click | expand/collapse | ✅ |
| Spinbuttons (rates) | edit | «Сохранить» enables, «Отмена» enables | ✅ |
| Volume-tiers table | render/edit/«Добавить уровень»/«Удалить» | works | ✅ |
| «Сохранить» + confirm dialog | change value → save → confirm | `PUT /v1/tariffs/settings` → **403 INSUFFICIENT_PERMISSIONS** `"Required roles: admin. User role: owner"`; **BE does not persist** (audit empty, value unchanged); expected `toast.error('Требуется роль Admin')` + redirect per `useUpdateTariffSettings.ts:78-80` | ❌ **BD-FE-005 / BE-BUG-F-004** |
| Tabs (Текущие/История/Журнал) | render | История + Журнал both empty (count 0) | ✅ (renders empty state) |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| 1.7 / 500 / 46 / 14 / 25 / 28 / 50 / 50 / 60 | all `*_rate`/`*_pct`/`storage_free_days` | ✅ |
| 5 tiers (0.001–1, rates 23–32) | `logistics_volume_tiers` (5 entries) | ✅ |

## 4. AP#8 runtime
- N/A — tariff rates are small numbers/decimals; raw `<input type=number>` values (1.7, 0.001) are acceptable (not locale-formatted display). No `?? 0` on null money. ✅

## 5. Findings
- **BD-FE-005 + BE-BUG-F-004 (BLOCKER, role-gate mismatch)** — The tariffs page is **unusable by Owner** (the highest standard role). FE role-gate `src/app/(dashboard)/settings/tariffs/page.tsx:70` allows `user?.role === 'Owner'` (FE normalizes lowercase `'owner'`→`'Owner'`), so the Owner sees the full form. But `PUT /v1/tariffs/settings` requires role **`admin`** — a separate role the Owner JWT does not have → 403 INSUFFICIENT_PERMISSIONS (trace_id `463ccb66-feb9-…`). The Feb note "admin-only redirected non-admins" is **still broken**: Owner is neither redirected nor warned upfront; the failure surfaces only on save attempt. **Fix options**: (a) BE — accept `owner` (in addition to `admin`) for tariffs write, OR (b) FE — role-gate the page on the actual write-capable role and either redirect Owner or hide the form. Recommend (a) since Owner is the cabinet admin in practice. Repro: `curl -X PUT -H "Authorization: Bearer $TOKEN" -d '{...}' http://localhost:3000/v1/tariffs/settings` → 403. Filed to BE-BUGS-F.md.
- Read-only rendering is otherwise correct; data fidelity is high.
- No AP#8 violations; no fabrication.
