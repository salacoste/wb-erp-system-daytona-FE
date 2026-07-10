# /cogs/history — История изменений COGS

**Route:** `/cogs/history?nmId={nmId}` · **Filters state:** `nmId=148190095`, limit=25, cursor pagination, `include_deleted` toggle.
**Validated:** 2026-07-06 · live BE :3000 + FE :3100 (Playwright).

## 1. Load
- `/v1/cogs/history?nm_id=148190095&limit=25` → **200**. Page renders meta card + history table + pagination ✅.
  - **Note:** the page reads `nmId` (camelCase) from the URL query but the hook (`useCogsHistoryFull`) correctly converts to **`nm_id`** (snake_case integer) when building the request (`src/hooks/useCogsHistoryFull.ts:62`). The backend rejects `nmId` and non-integer `nm_id` with 400 — FE handles both correctly. ✅
- No-nmId state (`/cogs/history` with no query): renders «История COGS / Не указан ID товара. Перейдите на страницу товара и нажмите "История COGS". / Вернуться к товарам» ✅.
- Console: no /cogs/history errors.

## 2. Interactive elements
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Breadcrumbs / «К товарам» button | click | navigates to `/cogs` | ✅ (rendered) |
| «Показать удалённые записи» checkbox | — | **NOT RENDERED for any user** — see BD-14 | ❌ |
| Row actions menu («Открыть меню» / ✏️ edit) | render | Edit action gated by `canEdit = userRole !== 'analyst'`; renders for owner | ✅ (rendered) |
| Pagination Вперёд/Назад | — | disabled (only 1 version) | ✅ |

## 3. Data vs API
Source: `GET /v1/cogs/history?nm_id=148190095&limit=25`.

| Rendered | API field | Verdict |
|---|---|---|
| «Жидкость для дым машины…» (product name, header) | `meta.product_name` | ✅ |
| «Текущий COGS: 846,00 ₽» | `meta.current_cogs.unit_cost_rub="846"` | ✅ |
| «Всего версий: 1» | `meta.total_versions=1` | ✅ |
| «1 версия» (table count) | `pagination.total=1` | ✅ |
| Row: `05.07.2026 / Текущий / 846,00 ₽ / ✏️ / 1 неделя / —` | `valid_from=2026-07-05`, `valid_to=null`, `unit_cost_rub="846"`, `affected_weeks=["2026-W27"]`, `is_active=true` | ✅ dates + cost exact |
| Source icon «✏️» + tooltip «Ручной ввод» | `source="moysklad"` | ❌ **BD-13 — mislabeled** |

## 4. AP#8 runtime
- ✅ `valid_to: null` renders as «Текущий» (not blank/0).
- ✅ Cost formatter guards NaN → «—» (`src/components/custom/CogsHistoryTableCells.tsx:31`).
- ✅ Notes `null` → «—».

## 5. Findings
- **BD-13 (FE, 🟡) — source-icon mislabel.** `sourceConfig` (`src/components/custom/CogsHistoryTableCells.tsx:21`) has keys `manual | import | system` only. The backend now emits `source: "moysklad"` (set by the МойСклад sync, per commits `36d600aa`/`2c99e217`). `sourceConfig["moysklad"]` is `undefined` → falls back to `sourceConfig.manual` → renders ✏️ + tooltip «Ручной ввод». A МойСклад-synced COGS row is therefore **misleadingly labeled as manual entry**. Fix: add `moysklad: { icon: '🗄️', label: 'МойСклад' }` (and widen the `SourceCell` prop type union beyond `'manual' | 'import' | 'system'`).
- **BD-14 (FE, 🟠) — "Показать удалённые записи" toggle is dead UI.** Two compounding defects:
  1. The history page passes **no `userRole` prop** to `CogsHistoryTable` (`src/app/(dashboard)/cogs/history/page.tsx:98-102`), so it falls to the prop default `'manager'` (`src/components/custom/CogsHistoryTable.tsx:36`).
  2. Even if passed, the gate `canViewDeleted = userRole === 'owner' || 'admin'` (lowercase, line 41) would never match the FE-canonical role **`"Owner"` (capitalized)** — the boundary normalizer (`src/stores/authStoreHelpers.ts:22-27`) deliberately capitalizes roles from backend lowercase. Verified live: `localStorage.auth-storage.state.user.role === "Owner"`, checkbox not in DOM.
  - **Effect:** an Owner cannot view soft-deleted COGS versions; the `include_deleted=true` query param is unreachable from the UI. Fix: page must read `useAuthStore(s => s.user?.role)` and pass it; and the comparison must be case-insensitive (or use the canonical capitalized form).
