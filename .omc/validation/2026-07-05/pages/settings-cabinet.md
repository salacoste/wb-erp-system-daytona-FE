# /settings/cabinet — Кабинет (read-only seller info)
**Route:** /settings/cabinet · **Filters:** none
**Validated:** 2026-07-06 · role=owner · cabinet=Space Chemical

## 1. Load
- `GET /v1/cabinets/:id` → **200** (name, taxRate:6, taxSystem:usn6, etc.)
- `GET /v1/cabinets/:id/seller-info` → **200** (`name:"ИП Дергачев И.М."`, sid, tradeMark:"Space Chemical")
- `GET /v1/cabinets/:id/jam-status` → **200** (`tier:"none"`, `available:false`, `reason:"insufficient_permissions"`, `checkedAt:"2026-07-06T02:39:14.428Z"`)
- `GET /v1/cabinets/:id/seller-rating` → **200** (`available:false`, `reason:"wb_api_error"`, valuation/feedbackCount null)
- `GET /v1/cabinets/:id/token-status` → **200** (`healthy:true`) — invoked elsewhere; **WB token is HEALTHY** (matrix D3 resolved: no WB-API errors here; any errors shown are real WB upstream failures from sub-resources, not a token-health issue)
- H1 «Кабинет» + subtitle «Информация о продавце и статус подписки Джем»

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Settings sub-nav | click | navigates between 6 settings tabs | ✅ |
| Seller info card | render | Name/SID/TM from seller-info API | ✅ |
| Jam subscription card | render | «Статус подписки неизвестен: Недостаточно прав» + «Нет подписки» badge | ✅ (matches jam-status reason) |
| Jam «Проверено» timestamp | render | **«Invalid Date»** | ❌ **BD-FE-002** |
| Seller rating card | render | «Рейтинг недоступен: Ошибка WB API» | ✅ (matches seller-rating reason — WB-owned) |
| H2 «Подписка Джем» (page bottom) | render | «Нет подписки» | ✅ |
| (No editable forms on this page — read-only) | — | — | ➖ |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| «ИП Дергачев И.М.» | seller-info.name | ✅ |
| «87935c94-…» | seller-info.sid | ✅ |
| «Space Chemical» | seller-info.tradeMark | ✅ |
| «Статус подписки неизвестен: Недостаточно прав» | jam-status.reason:"insufficient_permissions" → JAM_STATUS_REASON_LABELS map | ✅ |
| «Нет подписки» badge | jam-status.tier:"none" → JAM_TIER_LABELS | ✅ |
| «Рейтинг недоступен: Ошибка WB API» | seller-rating.reason:"wb_api_error" | ✅ |
| «Проверено Invalid Date» | jam-status.checkedAt — **dropped by normalizer** | ❌ BD-FE-002 |

## 4. AP#8 runtime
- seller-rating `valuation`/`feedbackCount` are `null` — FE renders the `available:false` alert branch (not `—` for null numbers). Correct: when `available:false`, the whole metric is hidden behind the warning. No `?? 0` violation. ✅

## 5. Findings
- **BD-FE-002 (FE, format bug)** — «Проверено Invalid Date». `src/lib/api/cabinet-normalizer.ts:41-48 normalizeJamStatusResponse` returns only `{available, tier, reason}` and **drops `checkedAt`** (also `searchTextsLimit`, `probeCallsMade`). At `src/components/custom/settings/CabinetInfoCard.tsx:166`, `new Date(jam.checkedAt).toLocaleString('ru-RU')` receives `undefined` → `new Date(undefined)` → Invalid Date. **Fix**: extend the normalizer to pass through `checkedAt: toIsoString(r.checkedAt)`, `searchTextsLimit: toCount(r.searchTextsLimit)`, `probeCallsMade: toCount(r.probeCallsMade)`. (Also protects L160 `jam.searchTextsLimit` which would render `undefined текстов` if Jam ever becomes available with tier≠none.)
- **Matrix D3 — RESOLVED**: WB token is healthy (`token-status.healthy:true`). No WB-API errors are shown that originate from a stale token. The two warnings on the page (Jam + seller-rating) are genuine WB upstream/permission issues (insufficient_permissions, wb_api_error) — BE/WB-owned, correctly surfaced by FE per Defensive Frontend Principle.
- No AP#8 violations; no fabrication.
