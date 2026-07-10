# /automation/canned-rules — Шаблоны автоматизации (AT1, NEW)
**Route:** /automation/canned-rules · **Filters state:** none (static gallery)
**Validated:** 2026-07-06 · role=owner · cabinet=Space Chemical (f75836f7)

## 1. Load
- `GET /v1/automation/canned-rules` → **200** (8 templates). Static, no cabinet scoping.
- Renders instantly; no skeleton stuck; no console errors.
- Headings: H1 «Шаблоны автоматизации» + subtitle «Готовые правила в один клик. После установки правило можно настроить.»

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Gallery grouping | render | 3 category sections rendered: «Уведомления» (5), «Аудит (сухой прогон)» (1), «Изменение цены» (2) — matches API `category` counts (notify=5, audit=1, price=2) | ✅ |
| price-category badge | render | Both price cards («Slow-mover → markdown», «Разрыв цены → markdown») show «Требует arm write-back» badge next to title | ✅ |
| trigger→action summary line | render | Each card shows `TRIGGER (op threshold) → ACTION` (e.g. `STOCK_LEVEL (lt 10) → NOTIFY`, `SLOW_MOVER (lt 2) → WRITEBACK_PRICE`, `ML_FORECAST (gt 0.7) → NOTIFY`) — faithful to triggerParams/actionParams | ✅ |
| Install (notify card) | click «Установить» on `low-stock-notify` | `POST /v1/automation/canned-rules/low-stock-notify/install` → 200; toast «Шаблон установлен»; rule created in BE (`enabled:true`, action NOTIFY) | ✅ |
| Install (price card) | click «Установить» on `slow-mover-markdown` | `POST .../slow-mover-markdown/install` → 200; rule created with `action: WRITEBACK_PRICE`, `priority:60`, `cooldownMin:1440`, `actionParams.priceAdjustPct:-5` (INERT until cabinet enables `PRICE_WRITEBACK_ENABLED`) | ✅ |
| 409 dup-name → rename-override | click «Установить» on already-installed `low-stock-notify` | `POST .../install` → 409; dialog «Правило с таким именем уже существует» with `canned-rename-input` textbox (placeholder «Например: Низкий остаток (копия)») + Отмена/Установить buttons | ✅ |
| Rename-override submit | fill «…(копия)» + click Установить | re-POST with custom name → 200; 2nd rule created; toast «Шаблон установлен» | ✅ |

**Cleanup:** DELETE `/v1/automation/rules/:id` soft-disables (`enabled:false`, returns `{disabled:true}`), does NOT hard-delete — disabled rules persist in default list. `?enabled=true` filter excludes them. Left 3 test rules in disabled state (non-destructive).

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| 5 notify / 1 audit / 2 price cards | `category` counts | ✅ |
| «STOCK_LEVEL (lt 10) → NOTIFY» | `trigger:STOCK_LEVEL`, `triggerParams:{operator:lt,threshold:10}`, `action:NOTIFY` | ✅ |
| «ML_FORECAST (gt 0.7) → NOTIFY» | `trigger:ML_FORECAST`, `triggerParams.threshold:0.7` | ✅ |
| «Требует arm write-back» badge | `category==='price'` | ✅ |
| Installed rule `enabled:true` | POST response + GET rules row | ✅ |

## 4. AP#8 runtime
- N/A — no money/ratio fields displayed. Trigger thresholds (10, 0.7, 15) render as-is from API. No fabrication.

## 5. Findings
- **No FE BD-*** — page behaves per spec (`docs/request-backend/224-…md`).
- **FUTURE deep-link** (page.tsx L11-16): after install, no navigation to a rule editor — by design (editor page does not exist yet; documented `FUTURE:` comment, not a bare TODO). Toast is the only success signal. Not a defect.
- **Gallery does not reflect installed state** — `useCannedRules` is a static fetch; no `useAutomationRules` cross-check. Per contract the gallery is intentionally cabinet-agnostic. After installing `low-stock-notify` the card's button stays «Установить» (not «Установлено»). Minor UX gap, not a bug — but re-install hits 409 which the rename dialog handles correctly.
- **BE behavior (informational, not a bug)**: DELETE soft-disables, does not hard-delete. Disabled rules remain in default list response. If a future FE rules-manager page lists rules, it should pass `?enabled=true` or filter client-side to avoid showing tombstones.
