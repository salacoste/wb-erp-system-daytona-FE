# Backend Contract — AT1 Canned Automation Rules (one-click templates)

**Status:** ✅ Backend LIVE (`GET /v1/automation/canned-rules` + `POST /v1/automation/canned-rules/:key/install`).
**Date:** 2026-07-04
**Implements:** AT1 (gap-09) — SelSup-parity one-click canned automation templates on the AT0 engine.
**For:** Frontend — build a "rule templates" gallery + one-click install into the cabinet.

> Auth/isolation unchanged: `Authorization: Bearer <jwt>` + `X-Cabinet-Id: <uuid>` + ownership verified. Roles Manager/Owner/Analyst.

---

## Endpoints

### 1. List templates

```
GET /v1/automation/canned-rules
```

Returns the static template gallery (no cabinet state — same for everyone). `200`:

```ts
[
  {
    key: string;            // stable install slug, e.g. "low-stock-notify"
    name: string;           // default rule name (ru), e.g. "Низкий остаток → уведомление"
    description: string;    // what the rule does
    category: 'notify' | 'price' | 'task' | 'audit';
    trigger: AutomationTrigger;   // STOCK_LEVEL | MARGIN_BELOW | PRICE_GAP | ML_FORECAST | …
    action: AutomationAction;     // NOTIFY | LOG_ONLY | WRITEBACK_PRICE | CREATE_TASK
    triggerParams?: object;       // { threshold, operator }
    actionParams?: object;        // { message?, priceAdjustPct? }
    priority?: number;
    cooldownMin?: number;
    enabledByDefault?: boolean;   // undefined = enabled (true) unless template opts out
  },
  …
]
```

### 2. Install a template

```
POST /v1/automation/canned-rules/:key/install
Content-Type: application/json

{ "name"?: string, "enabled"?: boolean }   // optional overrides
```

- `201` → the created `AutomationRule` (full row, same shape as `POST /v1/automation/rules`).
- `404` → template `key` unknown.
- `409` → a rule with the resolved name already exists in the cabinet (use a `name` override or delete the existing rule first).

The install creates a **real** `AutomationRule` via the same path as `POST /v1/automation/rules`. The cabinet can then edit/tune it (thresholds, scope, cooldown) like any rule.

---

## Template gallery (v1)

| key | category | trigger → action | note |
|---|---|---|---|
| `low-stock-notify` | notify | STOCK_LEVEL (`<10`) → NOTIFY | SelSup «робот онлайн-остатков» parity |
| `margin-below-notify` | notify | MARGIN_BELOW (`<10%`) → NOTIFY | margin-dumping early warning |
| `price-gap-notify` | notify | PRICE_GAP (`>10%`) → NOTIFY | recommendation drift |
| `ml-stockout-notify` | notify | ML_FORECAST (`stockout_risk>0.7`) → NOTIFY | ML-predicted OOS |
| `low-stock-dry-run` | audit | STOCK_LEVEL (`<10`) → LOG_ONLY | tests the trigger w/o acting |
| `slow-mover-notify` | notify | SLOW_MOVER (`recentBuyouts<3`) → NOTIFY | PR3 slow-mover early warning (неликвид) |
| `slow-mover-markdown` | price | SLOW_MOVER (`recentBuyouts<2`) → WRITEBACK_PRICE (`-5%`) | PR3 auto-уценка, **enabledByDefault=false**, floor-protected (PR2), inert until `PRICE_WRITEBACK_ENABLED` |
| `price-gap-markdown` | price | PRICE_GAP (`>15%`) → WRITEBACK_PRICE (`-5%`) | **enabledByDefault=false**, inert until `PRICE_WRITEBACK_ENABLED` |

> **PR3 — `SLOW_MOVER` trigger:** fires when a SKU's trailing-14-day buyouts (`recentBuyoutCount`,
> Σ `product_funnel_daily.buyout_count`) fall below the threshold — a slow seller / неликвид → markdown
> candidate. Undefined when the SKU has no funnel rows in the window (trigger then can't fire for it).
> Caveat: newly-listed SKUs (live <14d) also have low buyouts — tune the threshold / scope per catalog.

### Safety

- `notify` / `audit` templates act immediately on install (notify-only / log-only — reversible).
- `price` (WRITEBACK_PRICE) templates default to **disabled** and are **inert until the cabinet arms**
  `PRICE_WRITEBACK_ENABLED` (kill-switch). Safe to install any template; arming is a separate gate.
- Re-installing the same template 409s unless a custom `name` override is provided (`@@unique([cabinetId, name])`).

## FE integration

- **Gallery UI** — render `GET /canned-rules` as cards grouped by `category` (notify / audit / price / task).
- **Install button** per card → `POST /canned-rules/:key/install` (optionally prompt for a custom name).
- After install, deep-link to the existing rule editor (`GET/PATCH /v1/automation/rules/:id`) so the operator tunes thresholds/scope.
- Surface the **safety** distinction: `category === 'price'` → badge "требует arm write-back".

## v1 boundaries

1. **Static library** — templates are code (`canned-rules.registry.ts`), not DB rows. Adding a template = a deploy.
2. **No `task` / `CREATE_TASK` templates yet** — the registry ships notify/audit/price examples; a `task` (CREATE_TASK) template is added when a concrete canned flow (e.g. auto-create WB supply) is specced (gated on D19 + the supplies module).
3. **Thresholds are sensible defaults** — the operator is expected to tune them after install (e.g. set the real low-stock threshold per their catalog).
