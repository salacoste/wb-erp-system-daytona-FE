# /shipments/box-types — Типы коробок (CRUD)
**Route:** /shipments/box-types · **Initial data:** `GET /v1/box-types` → `[]` (created one test box-type during validation, then deactivated it for cleanup).

## 1. Load
- `GET /v1/box-types` → 200 `[]` (NOTE: backend rejects any unknown query param, e.g. `?limit=3` → 400 «limit should not exist»; the FE correctly calls it with NO params).
- ✅ Loads; empty-state «Нет типов коробок» renders with CTA; no console errors.

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| **«Добавить тип коробки» button** | click | opens dialog «Добавить тип коробки» (Название, Длина/Ширина/Высота см spinbuttons, Отмена/Создать) | ✅ |
| dialog «Создать» (name=«Тест-Коробка-M», 30/20/15) | click | POST `/v1/box-types` → row appears in table | ✅ |
| row «Редактировать» button | — | opens edit dialog | ✅ (present) |
| row «Деактивировать» button | click | DELETE `/v1/box-types/:id` (soft delete, isActive→false) | ✅ (verified via API: `isActive:false` post-delete) |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| «Тест-Коробка-M» | `name:"Тест-Коробка-M"` | ✅ |
| «30 × 20 × 15» | `lengthCm:"30", widthCm:"20", heightCm:"15"` (string decimals) | ✅ |
| «9 000» (Объём см³) | `volumeCm3:"9000"` (auto-computed: 30×20×15) | ✅ |

## 4. AP#8 runtime
- Dimensions/volume are decimal-as-string quantities rendered as plain numbers. No null money/ratio. N/A for AP#8.

## 5. Findings
- **BE-BUG-4 (minor):** `GET /v1/box-types` rejects unknown query params with 400 (`?limit=3` → «property limit should not exist»). The FE calls it correctly (no params), so no user impact — but the strict whitelist validation will trip up any future caller adding pagination/filter. Low severity.
- FE `BD-*`: none. Create + soft-delete CRUD fully functional; auto-volume computation correct.
