# /products — Ассортимент (lifecycle management)

**Route:** `/products` · **Filters state:** none (two fixed sections: «Снятые с продажи» + «Подсказки системы»).
**Validated:** 2026-07-06 · live BE :3000 + FE :3100 (Playwright).

## 1. Load
- `GET /v1/products/discontinued` → **200 `[]`** (count 0) ✅.
- `GET /v1/products/discontinued-suggestions` → **200 `[{nmId:99866376, vendorCode:"неопознанный товар", brand:"Неопознанный Товар", subject:"Коробки картонные", discontinuedSuggestedAt:"2026-07-06T01:00:01.857Z"}]` ✅.
- Page renders two cards: «Снятые с продажи» («Нет снятых товаров.») and «Подсказки системы» (1 row). H1 «Ассортимент», explanatory copy («…исключаются из текущей аналитики, прогнозов и рекомендаций») ✅.
- Console: no /products errors.

## 2. Interactive elements — BOTH lifecycle mutations verified end-to-end
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Suggestion «Снять с продажи» button (product `99866376`) | click | AlertDialog opens: «Снять товар с продажи? «неопознанный товар» будет исключён из текущей аналитики, прогнозов и рекомендаций. Действие можно отменить позже…» (correct product name) | ✅ |
| AlertDialog «Снять с продажи» confirm | click | `PATCH /v1/products/99866376/lifecycle {"status":"discontinued"}` fired; **BE persisted** (discontinued count → 1, contains 99866376); product moved to «Снятые с продажи» card with «Вернуть в ассортимент» button + «с DD.MM.YYYY» badge | ✅ |
| Discontinued «Вернуть в ассортимент» button | click | `PATCH /v1/products/99866376/lifecycle {"status":"active"}` fired; **BE persisted** (discontinued count → 0); card re-renders «Нет снятых товаров.» | ✅ |
| AlertDialog «Отмена» | render | present (not triggered) | ✅ |

**Both mutation directions verified** (discontinue → reactivate). The destructive action is correctly guarded by an AlertDialog; reactivate is one-click (undo) per the page comment.

## 3. Data vs API
| Rendered | API field | Verdict |
|---|---|---|
| «Нет снятых товаров.» | `GET /discontinued` → `[]` | ✅ |
| Row: «неопознанный товар · артикул 99866376» + «Неопознанный Товар · Коробки картонные» | `vendorCode="неопознанный товар"`, `nmId=99866376`, `brand="Неопознанный Товар"`, `subject="Коробки картонные"` | ✅ |
| Subtitle «Товары без продаж ≥90 дней…» | (static copy; backed by BE suggestion logic) | ✅ |
| «с DD.MM.YYYY» badge after discontinue | `discontinuedAt` (set by PATCH) | ✅ |

## 4. AP#8 runtime
- N/A (no money/ratio fields on this page; all values are names/IDs/dates).
- ✅ `vendorCode ?? '—'`, `brand ?? '—'`, `subject ?? '—'` — null-safe per `ProductRow`.

## 5. Findings
- **No FE-owned defect.** Load, both mutations (discontinue + reactivate), data binding, empty states, and the confirm-dialog guard all behave correctly against the live backend.
- AP#8 applied via null-coalescing on optional product fields (`src/app/(dashboard)/products/page.tsx:24-32`).
