# /shipments/[id] — Детали отправки
**Route:** /shipments/00000000-0000-0000-0000-000000000000 (probe with non-existent id — cabinet has 0 shipments).

## 1. Load
- `GET /v1/shipments/00000000-…` → 404 `{error:{code:NOT_FOUND, message:"Shipment 00000000-… not found"}}`.
- ✅ Loads; error state rendered gracefully (no crash, no unhandled rejection).

## 2. Interactive elements
| Element | Action | Effect | Result |
|---|---|---|---|
| «Повторить» button | click | refetch | ✅ |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| alert «Shipment 00000000-… not found» | `error.message` | ⚠️ raw BE message surfaced verbatim |

## 4. AP#8 runtime
- N/A (error state).

## 5. Findings
- **BD-1 (minor FE UX nit, not blocking):** the 404 alert renders the raw backend message verbatim (`"Shipment 00000000-… not found"`) rather than a localized Russian string. Consistent with how `ApiError.message` propagates, but jarring next to the otherwise fully-Russian UI. Suggest mapping NOT_FOUND → «Отправка не найдена» at the boundary. Low severity.
- Full happy-path deep-check (header, pallets, box-lines, calculate, confirm) **blocked by empty shipments data** — see `shipments.md` §5. The page wiring itself is sound (correct query key, graceful 404).
- FE `BD-*`: BD-1 (above). BE: none.
