# 205 — Supplies: null sale price coerced to 0 → renders "0 ₽" (anti-pattern #8)

**Status**: RESOLVED (2026-06-06) — Backend supply.service.ts:343 now preserves null for unknown salePrice. Frontend renders "—" instead of fabricated "0".
**Severity**: MEDIUM (a null price renders as a fabricated "0 ₽" in the supply order tables)
**Found**: iter-143 audit of the supplies domain
**Endpoint**: supply detail orders + order-picker (the order list feeding `SupplyOrder.salePrice`)

## Problem

An order with no sale price renders **"0 ₽"** in the "Цена" column (SupplyOrdersTable / OrderPickerTable) instead of "—" — fabricating a real price of zero rubles (anti-pattern #8: a null money field must render "—", never "0 ₽").

## Root cause (verified against backend source)

- Prisma `orderFbs.salePrice` is `Decimal? @map("sale_price")` (`prisma/schema.prisma:228`) — **genuinely nullable**.
- The backend coerces it before the FE sees it: `salePrice: Number(so.orderFbs.salePrice)` (`src/supplies/services/supply.service.ts:325`), and **`Number(null) === 0`**. So a null price is sent to the FE as `0`.
- The FE normalizer then does `salePrice: Number(o.salePrice ?? 0)` (`supplies-normalizer.ts`) and displays `formatCurrency(order.salePrice)` → "0 ₽".

Because the backend destroys the null (`Number(null)→0`), **the frontend cannot recover "—" on its own** — it receives `0`, indistinguishable from a genuine 0-rouble price.

## Request

At `supply.service.ts:325`, preserve null instead of coercing: `salePrice: so.orderFbs.salePrice == null ? null : Number(so.orderFbs.salePrice)` (and type the DTO field `number | null`). Then the FE will render "—" for null and "0 ₽" only for a genuine zero.

## Paired FE follow-up (queued, do WHEN this ships)

Make `SupplyOrder.salePrice` nullable, null-preserve in `supplies-normalizer.ts`, and render `order.salePrice == null ? '—' : formatCurrency(order.salePrice)`. (Preventive until the backend stops coercing — currently the FE only ever receives `0`.)

## Related low-severity observations (queued, FE-only)

- **D**: `SupplyStatusBadge` defaults an unknown/out-of-enum status to the blue "Открыта" (OPEN) badge (`STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN`) — an unknown lifecycle state shouldn't masquerade as OPEN; render a neutral "Неизвестно"/gray badge.
- **E**: Supply timestamps (`SupplyHeader`, `SupplyOrdersTable`, `SupplyDocumentsList`) use `new Date(iso).getHours()` (browser-local tz), not Europe/Moscow — a non-MSK user sees a shifted HH:MM. Format with `timeZone: 'Europe/Moscow'`.
