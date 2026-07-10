# /settings/expenses — Операционные расходы
**Route:** /settings/expenses · **Filters:** month picker (default 2026-07)
**Validated:** 2026-07-06 · role=owner

## 1. Load
- `GET /v1/expenses?month=2026-07` → **200** `[]` (empty)
- `GET /v1/expenses/summary?from=…&to=…` → **200** (totals as Decimal objects)
- H1 «Операционные расходы»; summary cards (Total + 5 categories: Аренда/Зарплата/Упаковка/Транспорт/Прочее) all «0 ₽» when empty; «Добавить расход» button + «Добавить первый расход» (empty state).
- Month `<input type="month">` defaults to current month (2026-07).

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Month picker | (default 2026-07) | drives `?month=` query | ✅ |
| «Добавить расход» button | click | opens dialog «Добавить расход» with Категория (combobox: 5 options), Сумма (₽) spinbutton, Месяц, Описание | ✅ |
| Category combobox (Аренда) | select | option list = EXPENSE_CATEGORIES (rent/salary/packaging/transport/other) | ✅ |
| Amount + description fill + «Добавить» | fill 15000 + «Тест расход — валидация», submit (button enabled when valid) | `POST /v1/expenses` → **201/200**; BE persists `{category:"rent", amount:15000, month:"2026-07", description:…}`; toast «Расход добавлен»; row appears in table | ✅ (persist) / ❌ (display) |
| Row render after create | render | **«Аренда не число ₽ …»** — amount shows `не число` (NaN) | ❌ **BD-FE-003** |
| Summary cards after create | render | **All still «0 ₽»** — summary does not reflect the new 15000 rent | ❌ **BD-FE-003** |
| «Удалить» button | click (then confirmed via API) | `DELETE /v1/expenses/:id` → **200**; item removed | ✅ (verified via curl) |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| category cell «Аренда» | `category:"rent"` → label map | ✅ |
| description «Тест расход — валидация» | `description` | ✅ |
| amount cell «не число ₽» | `amount:{s:1,e:4,d:[15000]}` (Prisma Decimal JSON) | ❌ BD-FE-003 |
| summary «0 ₽» after create | `summary.byCategory.rent = {s:1,e:4,d:[15000]}` | ❌ BD-FE-003 |

## 4. AP#8 runtime
- Empty month → «0 ₽» is correct semantic-zero (no expenses), not a `?? 0` violation on null money. ✅
- BUT after creating an expense, the genuine 15000 renders as `не число` — worse than «—». The honest-sentinel `NaN` (per `toExpenseAmount`) is meant to surface parse failure, and `formatCurrency(NaN)` renders «не число ₽». While NaN-as-sentinel is defensible per anti-pattern #8, the **root issue is the normalizer fails to parse a valid BE Decimal object**, so a real value is silently lost — the cardinal sin AP#8 guards against.

## 5. Findings
- **BD-FE-003 (BLOCKER, FE normalizer gap)** — Expense `amount` renders as «не число» (NaN); summary totals stay «0 ₽». `src/lib/api/expenses/expense-normalizer.ts:23 toExpenseAmount` does `Number(raw)` on `raw = {s:1, e:4, d:[15000]}` (Prisma `Decimal.toJSON()` shape — sign/exponent/digits), which yields `NaN`. The header comment L5 incorrectly claims "Backend returns amount as Decimal (string or number)". **Fix**: handle the Decimal-object form: if `raw && typeof raw === 'object' && 'd' in raw`, reconstruct via `Number((raw.s===-1?'-':'') + raw.d.join('') + 'e' + raw.e)` or use a Decimal parser; alternatively request BE to serialize as string. Affects both `normalizeExpenseItem` (table rows) and `normalizeExpenseSummaryResponse` (summary cards). Repro: create any expense → observe «не число ₽» in its row + summary cards unchanged.
- **BE-BUG-F-002 (BE, contract drift — root cause)** — `/v1/expenses` & `/v1/expenses/summary` serialize `amount`/totals as raw Prisma `Decimal` JSON objects (`{s,e,d}`) instead of strings/numbers. This is non-portable (Prisma-specific) and breaks any client that expects a JSON number/string. Recommend BE serialize Decimal as string (Prisma: `extendFieldType('Decimal', { stringify: true })` or output interceptor). Filed to BE-BUGS-F.md.
- DELETE works correctly (hard-delete, 200). Create round-trips category/description/month correctly; only `amount` decoding is broken.
- No AP#8 fabrication; values are honestly lost rather than invented.
