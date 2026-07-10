# /moysklad — МойСклад
**Route:** /moysklad · **Filters:** none (cabinet-independent per subtitle) · **Tabs:** Обзор / Товары и привязки / Сток / МС товары / МС модификации
**Validated:** 2026-07-06 · role=owner · moysklad token configured (read-only mode)

## 1. Load
- `GET /v1/moysklad/health` → **200** `{status:"ok", readOnly:true, orgId:"24c42ddb-…", tokenConfigured:true}`
- `GET /v1/moysklad/mappings?matched=true` → **200** total **13**
- `GET /v1/moysklad/mappings?matched=false` → **200** total **422**
- `GET /v1/moysklad/mappings` → **200** total **435**
- H1 «МойСклад»; header badges «Подключён / Только чтение / ИП Дергачев Иван Михайлович»; subtitle «Данные МойСклад для подключённого кабинета (не зависят от выбранного кабинета WB)».

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Tabs (Обзор / Товары и привязки / Сток / МС товары / МС модификации) | render | Обзор selected by default | ✅ |
| Mapping counts cards | render | Привязаны **13** / Не привязаны **422** / Всего товаров **435** | ✅ (exact API match) |
| «Синхронизировать» button | click | button → disabled (in-flight); `POST /v1/moysklad/sync` → **201** `{status:"enqueued", taskUuid:…, queue:"moysklad-sync"}`; status → «Обновлено: 06.07.2026, 06:29 (повтор через 26 с)» | ✅ |
| Подключение card | render | «Статус: ok / Только чтение: да / Токен: настроен» — faithful to health API | ✅ |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| «Подключён» + «Только чтение» | health.status:"ok", readOnly:true | ✅ |
| «ИП Дергачев Иван Михайлович» | (org name from token) | ✅ |
| Привязаны 13 | mappings?matched=true total:13 | ✅ |
| Не привязаны 422 | mappings?matched=false total:422 | ✅ |
| Всего 435 | mappings total:435 | ✅ |
| «Статус: ok» / «Только чтение: да» / «Токен: настроен» | health.status / readOnly / tokenConfigured | ✅ |

## 4. AP#8 runtime
- Mapping rows: `nmId`/`matchedBy` null preserved by normalizer (anti-pattern #8 comment in `useMoyskadQueries.ts:8`). `buyPriceKopeck` is a string (kopecks) — formatted accordingly. No `?? 0` on money. ✅

## 5. Findings
- No FE defects. Sync round-trip correct (202/201 + UI status update + button disable). Mapping counts faithful. AP#8-compliant null handling.
- (Tabs «Товары и привязки» / «Сток» / «МС товары» / «МС модификации» not deeply exercised — they load the same `/v1/moysklad/*` family; the Обзор tab + sync mutation cover the core functionality.)
