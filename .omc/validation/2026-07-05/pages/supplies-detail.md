# /supplies/[id] — Поставка detail (O5 acceptance-act deep-check)
**Route:** /supplies/93aeb2f6-59c6-4d50-9982-462008b7ee2a (test supply created in-session) · **Supply state:** status=OPEN, orders=0.

## 1. Load
- `GET /v1/supplies/93aeb2f6-…` → 200 (header: name, status «Открыта», «Создана 06.07.2026, 04:01», «Заказов: 0»).
- Status stepper: Открыта → Закрыта → В пути → Доставлена (current = Открыта).
- `GET /v1/supplies/{id}/orders` → 200 `[]` (empty orders section).
- Acceptance-act section renders with empty state «Акт приёмки ещё не загружен» + «Загрузить акт».
- ✅ Loads; all sections render; no console errors.

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| «Назад к списку» link | click | → /supplies | ✅ |
| «Добавить заказы» button | click | opens OrderPickerDrawer | ✅ (not deep-exercised) |
| «Закрыть поставку» button | — | **[disabled]** (orders=0, can't close empty) | ✅ correct gating |
| status stepper items | — | visual only (current state highlighted) | ✅ |
| **«Загрузить акт» (empty state)** | click | opens native file picker | ✅ |
| **file picker → select test-acceptance-act.xlsx** | pick | base64-encodes + POST `/v1/supplies/:id/acceptance-act` `{file, filename, format:'xlsx'}` → `{id:"e41ec25c-…"}` | ✅ console: `Upload acceptance act: {supplyId, format:xlsx, filename:test-acceptance-act.xlsx}` |
| **stored indicator (post-upload)** | — | renders «Загружен 06.07.2026, 04:03» + green checkmark | ✅ |
| **«Загрузить акт» (post-upload)** | — | still present (re-upload allowed) | ✅ |
| **«Скачать» button (post-upload)** | click | GET `/v1/supplies/:id/acceptance-act` (blob, `responseType:'blob'`, `skipDataUnwrap`) → saves `acceptance-act-93aeb2f6-….xlsx` | ✅ console: `Download acceptance act: 93aeb2f6-…` |

## 3. Data vs API (O5 round-trip integrity)
| Step | Detail |
|---|---|
| Upload POST body | `{file:<base64>, filename:"test-acceptance-act.xlsx", format:"xlsx"}` → 201/200 `{id:"e41ec25c-62f3-45b0-878b-e6381d1b4fa1", …}` ✅ |
| Upload URL | `POST /v1/supplies/93aeb2f6-…/acceptance-act` (dedicated route, **NOT** `/documents/:type`) ✅ |
| Download GET | `GET /v1/supplies/93aeb2f6-…/acceptance-act` → 200, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, 1433 bytes ✅ |
| Round-trip | downloaded blob **byte-identical** to uploaded file (`cmp` → IDENTICAL) ✅ |
| stored-act detection | post-upload the section flips from empty-state to stored-indicator. Normalizer lowercases the docType for matching (`src/lib/api/supplies-normalizer.ts:93` comment) ✅ |

`detectAcceptanceActFormat`: `.xlsx`→`xlsx`, `.zip`→`zip`, anything else (pdf/no-ext)→`null` (rejected) — verified via unit-test refs in `src/lib/api/__tests__/supplies-acceptance-act.test.ts:63-68`.

## 4. AP#8 runtime
- No money/ratio fields on this view. N/A.

## 5. Findings
- **None.** O5 acceptance-act upload + stored-indicator + download all fully functional against the dedicated `/v1/supplies/:id/acceptance-act` route, with byte-exact round-trip integrity. The `DocumentType` / lowercase-docType normalizer fix is working.
- FE `BD-*`: none. BE: none.
