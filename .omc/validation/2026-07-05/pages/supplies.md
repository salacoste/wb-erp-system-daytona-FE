# /supplies — Поставки FBS (list)
**Route:** /supplies · **Filters state:** status=All, from=2026-06-06 to=2026-07-06 · **Initial data:** `total:0` (cabinet had no supplies; one test supply created during validation then left in place).

## 1. Load
- `GET /v1/supplies?status=&from=…&to=…&limit=20` → 200 `{items:[], pagination:{total:0}}`.
- `GET /v1/supplies/sync-status` → 200 (renders «Синхронизировано: Не синхронизировано»).
- ✅ Loads; empty-state «Нет поставок» renders with CTA; no console errors.

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| «Статус:» combobox (Фильтр по статусу) | change | re-query `status` | ✅ |
| «Период:» Дата начала / окончания | change | re-query `from`/`to` | ✅ |
| «Обновить статусы» button | click | POST sync / refetch | ✅ |
| **«Создать поставку» button** | click | opens dialog «Новая поставка» (name input + Отмена/Создать) | ✅ |
| dialog «Создать» (with name) | click | POST `/v1/supplies` → `{id,…}`, navigates to `/supplies/{id}` | ✅ created `93aeb2f6-59c6-4d50-9982-462008b7ee2a` (name «Тест поставка…»), list refetches total 0→1 |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| «Нет поставок» empty state | `items:[]` / `total:0` | ✅ |
| «Синхронизировано: Не синхронизировано» | sync-status `last_sync:null` | ✅ |
| (post-create) «Тест поставка…» row | created supply `{name, status:"OPEN"}` | ✅ |

## 4. AP#8 runtime
- No money/ratio fields on the list (name/status/dates only). N/A.

## 5. Findings
- **BE-BUG-3** (filed): `DELETE /v1/supplies/:id` → 404 «Cannot DELETE /v1/supplies/:id». There is no API to delete a supply. Stray test supplies cannot be cleaned up via the API; the supply lifecycle expects a close/cancel workflow instead. Minor impact (test-data hygiene) but a contract gap.
- FE `BD-*`: none. Create flow, navigation, and empty state all correct.
