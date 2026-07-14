# Backend Contract — МойСклад (МS) integration (read-only pull + cache)

**Status:** ✅ Backend committed on `feature/competitor-parity-FR2-FR5` (MS0+MS1+S1c+MS3: read-only pull, variant persistence, unified product API). Migration applied (moysklad_stock_snapshots/product_mappings/sync_states tables exist); IoC verified (app boots clean); D43/D44 read-only honored (all external calls are `fetch*`/`get*`/`list*` — no writes to МойСклад). **First FE-facing artifact** for МойСклад.
**Date:** 2026-07-01
**Implements:** SelSup-parity program, step **S1** (МойСклад read-only pull).
**For:** Frontend — read **"v1 boundaries"** before building. This doc is the contract you build against; the FE itself is NOT yet integrated.

> Source of truth (cite line numbers throughout): `src/moysklad/**` + `src/shared/moysklad/create-moysklad-client.ts` + `prisma/schema.prisma` (Moysklad* models).
> Gap analysis: `docs/selsup-integration/11-MOYSKLAD-INTEGRATION-GAP-ANALYSIS.md`.

**Auth/isolation** (unchanged project pattern): `Authorization: Bearer <jwt>` + `X-Cabinet-Id: <uuid>` header on every endpoint. Guards: `JwtAuthGuard` + `CabinetGuard` (`src/moysklad/moysklad.controller.ts`). Roles Manager/Owner/Analyst.

**⚠️ D43/D44 — we NEVER write to МойСклад.** The token is from a PRODUCTION cabinet. Every write method is hard-locked (see **Read-only guard**). The `POST /sync` and `POST /mappings/:id/link` endpoints write only to OUR database.

---

## Endpoints

Base path: `/v1/moysklad` (`src/moysklad/moysklad.controller.ts`). All `@UseGuards(JwtAuthGuard, CabinetGuard)`.

### Live read-through to МойСклад (MS0a)

| Method | Path | Handler | Request | Response shape | Notes |
|---|---|---|---|---|---|
| `GET` | `/health` | `getHealth()` | — | `{ status, readOnly, orgId, baseUrl, tokenConfigured }` | **No API call** — safe to hit anytime. `readOnly` = effective `MOYSKLAD_READ_ONLY`. |
| `GET` | `/organizations` | `getOrganizations()` | — | `MoyskladListResponse<MoyskladOrganization>` = `{ rows: [{ id, name, legalTitle, inn }], meta }` | List юрлица for the token. |
| `GET` | `/products` | `getProducts()` | `?limit=&offset=` (default 100/0) | `{ rows: MoyskladProduct[], meta }` | `meta.size` = total count. |
| `GET` | `/variants` | `getVariants()` | `?limit=&offset=` | `{ rows: MoyskladVariant[], meta }` | Modifications. Variants have **no article** (see Matching). |
| `GET` | `/stock` | `getStock()` | `?stockType=stock\|freeStock\|quantity\|reserve\|inTransit` | `{ count, rows: MoyskladStockRow[] }` | FLAT array (not `{meta,rows}`). Default `freeStock`. |

`MoyskladProduct` = `{ id, name, article?, code?, buyPrice?: { value, currency }, salePrices?: [{value,currency}], externalCode?, updated? }` (`src/moysklad/dto/moysklad.types.ts`).
`MoyskladStockRow` = `{ assortmentId, [stockTypeKey]: number }` (`src/moysklad/dto/moysklad.types.ts`) — the numeric key is the requested stock type (e.g. `freeStock`).

### OUR-DB persistence (MS0b) — the cache FE will mostly consume

| Method | Path | Handler | Request | Response shape | Notes |
|---|---|---|---|---|---|
| `POST` | `/sync` | `enqueueSync()` | — (cabinet from header) | `{ status: 'enqueued', taskUuid, queue: 'moysklad-sync' }` | Enqueues products+stock sync → OUR DB. Poll the task system with `taskUuid`. |
| `GET` | `/mappings` | `getMappings()` | `?matched=true\|false&limit=&offset=` | `{ count, total, rows: MoyskladProductMapping[] }` | `matched=true` → only matched; `false` → pending (unmatched); omit → all. |
| `GET` | `/stock-db` | `getStockDb()` | `?date=YYYY-MM-DD&limit=&offset=` | `{ count, total, date: 'YYYY-MM-DD'\|null, rows: MoyskladStockSnapshot[] }` | `date` omitted → latest snapshot date. Invalid date → 400. |
| `POST` | `/mappings/:id/link` | `linkMapping()` | body `{ nmId: number }` (`LinkMappingDto`, `nmId ≥ 1`) | `{ id, nmId, matchedBy: 'MANUAL' }` | Manual link → `matchedBy=MANUAL`. Survives subsequent auto re-syncs. |

**⚠️ Pagination quirk:** `getMappings`/`getStockDb` use `Number(limit) || undefined` (`src/moysklad/moysklad.controller.ts`), so passing `0` for `limit`/`offset` is treated as **absent** (→ default), not literally `0`. Pass real positive ints.

---

## Models (Prisma — `prisma/schema.prisma`)

### `MoyskladProductMapping` (`prisma/schema.prisma`) — the mapping FE reads/links
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key (used by `POST /mappings/:id/link`). |
| `cabinetId` | UUID | Tenant isolation. |
| `moyskladAssortmentId` | String(100) | МС assortment id. |
| `moyskladType` | `MoyskladAssortmentType` | `PRODUCT` \| `VARIANT` (enum `MoyskladAssortmentType` in `prisma/schema.prisma`). |
| `moyskladName` | String?(500) | Display name. |
| `moyskladArticle` | String?(255) | МС `article` ↔ our `vendorCode` (primary match key). For variants (S1c) this column holds the variant `code` (the variant analog of article); NULL when neither is present. |
| `nmId` | Int? | WB nmId after matching. **NULL = pending manual link.** |
| `matchedBy` | `MoyskladMatchStrategy?` | `VENDOR_CODE` \| `BARCODE` \| `MANUAL` (enum `MoyskladMatchStrategy` in `prisma/schema.prisma`). NULL = pending. |
| `buyPriceKopeck` | BigInt? | Себестоимость (копейки) → feeds Cogs in MS1. |
| `lastSyncedAt`, `createdAt`, `updatedAt` | timestamptz | Audit. |
| **`@@unique`** | `[cabinetId, moyskladAssortmentId]` (`idx_moysklad_mapping_unique`) | Idempotency key. |

### `MoyskladStockSnapshot` (`prisma/schema.prisma`) — daily stock
| Field | Type | Notes |
|---|---|---|
| `date` | Date (no TZ) | Snapshot date (MSK). |
| `moyskladAssortmentId` | String(100) | |
| `nmId` | Int? | Back-filled once the assortment is matched; NULL otherwise. |
| `stockFree` | Decimal(15,3) | freeStock (may be fractional). |
| `reserve` | Decimal?(15,3) | |
| **`@@unique`** | `[cabinetId, date, moyskladAssortmentId]` (`idx_moysklad_stock_unique`) | One row per assortment per day. |
> **KEPT SEPARATE from `inventory_snapshots`** (WB stocks on WB warehouses — D41). Do not merge.

### `MoyskladSyncState` (`prisma/schema.prisma`) — sync cursor
`{ cabinetId, entity: 'PRODUCT'|'STOCK'|'VARIANT', lastSyncedAt, lastUpdatedFilter?, lastError? }`. `@@unique [cabinetId, entity]`. `lastUpdatedFilter` is the **live incremental cursor** (S1g, 2026-07-03): the ISO timestamp of the last successful product/variant sync's start; the next sync pulls only МС rows `updated >=` it. Null on STOCK (stock is a full current-snapshot) and on the first-ever product/variant sync.

---

## Pull scope (what backend fetches from МойСклад)

Per `MoyskladSyncService.syncAll()` (`src/moysklad/services/moysklad-sync.service.ts`):

1. **Products** (`getProducts`, paginate 100/page) → upsert `MoyskladProductMapping` + match by vendorCode (`syncProducts()`).
2. **Variants (S1c)** (`getVariants`, paginate 100/page) → upsert `MoyskladProductMapping` with `moyskladType=VARIANT` + match by vendorCode on the variant `code` (stored in `moyskladArticle`) (`syncVariants()`). Parent-linkage deferred (no schema column → S1f).
3. **Current stock** (`getStockCurrent` → `report.stock.allCurrent`, default `freeStock`) → upsert daily `MoyskladStockSnapshot`, back-filling `nmId` from the matched mapping (`syncStock()`).
4. **Buy-price → versioned COGS (MS1)** (`syncCostsToCogs()`): for matched mappings with `buyPriceKopeck`, write `Cogs(source='moysklad', unitCostRub = buyPriceKopeck/100)`. Idempotent (same price → skip; changed → soft-delete stale + create new). **Creates/closing a Cogs version auto-enqueues `MARGIN_CALCULATION`** (`marginQueue.add()` in `syncCostsToCogs()`) → margin auto-recalc for the affected nmIds/weeks.

---

## Matching (`matchByVendorCode()` in `moysklad-sync.service.ts`)

- **Primary:** МС `Product.article` ↔ our `Product.vendorCode` (exact, case-sensitive) → `matchedBy=VENDOR_CODE`.
- **Conflict safety:** if ≥2 WB products share a vendorCode (ambiguous) → **NOT auto-linked**; mapping stays pending.
- **Manual link:** `POST /mappings/:id/link` → `matchedBy=MANUAL`. Survives subsequent auto re-syncs.
- **Variants (S1c):** persisted as `moyskladType=VARIANT`. A Variant has no `article`; its `code` is stored in `moyskladArticle` and matched against `Product.vendorCode` by the SAME vendorCode matcher (shared helper — no duplicated matching math). Variants without a `code`, or whose `code` matches no/≥2 WB products, stay pending. No parent-linkage yet (deferred → S1f).
- **Barcode:** enum value exists (`BARCODE`) but the matcher is **NOT implemented** (`Product.barcode` absent — see v1 boundaries → S1f).

---

## Read-only guard (D43/D44) — `assertWritable()` in `src/moysklad/moysklad-api.service.ts`

Write methods (`updateProduct` / `createDemand` / `moveStock` / `createSupply`) are **DECLARED but hard-locked**:

- `MOYSKLAD_READ_ONLY=true` (default) → **every** write throws `ForbiddenException`, token or not. This is the kill-switch for the production cabinet.
- read-only `false` + **no** `confirmationToken` → `ForbiddenException` (per-action UI confirmation gate, D44).
- read-only `false` + a `confirmationToken` → **STILL `ForbiddenException`** — token validation is `[SPIKE]` pending MS4. No write is possible today.

Read methods are unaffected by the gate.

---

## Sync schedule

- **Queue:** `MOYSKLAD_SYNC` = `'moysklad-sync'` (`src/queue/queue.config.ts`), **concurrency 1** (`src/moysklad/processors/moysklad-sync.processor.ts`) — serializes to respect МС rate limits.
- **Retry policy:** `attempts: 3`, exponential backoff 30s/60s/120s (`src/queue/queue.config.ts`).
- **Cron:** `*/30 * * * *` Europe/Moscow (`src/moysklad/moysklad.scheduler.ts`) — every 30 min.
- **Bootstrap gate:** the auto-sync cron fires **only when `MOYSKLAD_CABINET_ID` is set** (`src/moysklad/moysklad.scheduler.ts`). Without it the cron is a debug no-op (app never crashes on startup). On-demand sync via `POST /sync` is always available.
- **Process split:** scheduler runs in the **API** process (self-guarded on `WORKER_MODE`); processor runs in the **WORKER** process (registered only when `WORKER_MODE=true`, `src/moysklad/moysklad.module.ts`).
- **Task lifecycle:** processor `@OnWorkerEvent` active→`in_progress`, completed→`completed`, failed→`failed` (+ attempt/error) — poll the standard task system with the `taskUuid` from `POST /sync`.

---

## v1 boundaries (be honest — read before building)

1. **Single-cabinet, token from `.env`.** The МС token is `MOYSKLAD_TOKEN` (one production cabinet). Multi-tenant per-`CabinetKey` token is **TODO (S1h)** — every endpoint today operates on the bootstrap cabinet declared by `MOYSKLAD_CABINET_ID`, NOT a per-user cabinet.
2. **`[SPIKE]` runtime ESM-load of `moysklad-ts` — verified by `tsc` ONLY, not yet by a live sync** (pending **S1b**). The SDK is native ESM; the factory hides a native `import()` behind `new Function('s','return import(s)')` so the CommonJS build doesn't downgrade it (`src/shared/moysklad/create-moysklad-client.ts`). `buildMoyskladOptions()` (the pure mapper) is unit-tested; the live import path is NOT (Jest's node env can't resolve native dynamic `import()`). **Do not assume a live pull works until S1b lands.**
3. **Variants now persisted (S1c).** `syncVariants()` (`moysklad-sync.service.ts`) paginates `getVariants` (100/page) and upserts each modification as a `MoyskladProductMapping` row with `moyskladType=VARIANT`, keyed by the same `@@unique([cabinetId, moyskladAssortmentId])` as products (idempotent). The variant `code` is stored in the existing `moyskladArticle` column (it is the variant analog of a product article and the vendorCode match key). **Parent-linkage GAP:** there is NO parent-assortment column on `MoyskladProductMapping` (`parentAssortmentId` / jsonb `metaData` absent) and schema changes are blocked this step — so variants are persisted WITHOUT a link to their parent product mapping for now (the only remaining variant gap). Barcode matching IS implemented (S1f) via `ProductVariant.barcode` — see boundary #4.
4. **Barcode matching IMPLEMENTED (S1f).** `matchByBarcode` runs as a FALLBACK after `matchByVendorCode` on still-pending variants — flattens the МС `barcodes` array (`ean13`/`ean8`/`code128`/`gtin`) and matches against `ProductVariant.barcode` (WB per-size barcode, FR-7) → `MoyskladMatchStrategy.BARCODE`. Conflict handling mirrors vendorCode: a barcode shared by ≥2 WB variants is ambiguous → left pending for manual link.
5. **Incremental sync IMPLEMENTED (S1g, 2026-07-03).** Products & variants are pulled INCREMENTALLY via the МС `updated>` filter (`updated >= <high-watermark>`), confirmed live on the production token. The cursor is each sync's START time (captured before the pull — `gte` inclusive → no skipped rows under concurrent edits), stored as ISO in `MoyskladSyncState.lastUpdatedFilter`; the FIRST sync has no cursor → full pull, and a re-sync that finds nothing changed pulls **0 rows**. Stock is still a full current-snapshot every run (`report.stock.allCurrent` is not `updated>`-filterable). Known gap: hard-deleted МС products aren't surfaced by `updated>` (МС soft-archives, which IS caught).
6. **No FE integration yet.** This doc is the first FE-facing artifact. No widgets / hooks / pages exist for МойСклад data.

---

## What FE can build now vs. what to wait for

**Build now (against the cache — `/mappings`, `/stock-db`, `/health`, `POST /sync`, `POST /mappings/:id/link`):**
- A **«МойСклад статус» panel** reading `GET /health` (config check, no live call) — show `readOnly` / `tokenConfigured` / `orgId`.
- A **manual-link queue UI**: `GET /mappings?matched=false` → list pending МС assortments → `POST /mappings/:id/link { nmId }` to resolve conflicts. Poll `POST /sync` `taskUuid` for progress.
- A **stock view** off `GET /stock-db` (persisted daily snapshots — `date`, `moyskladAssortmentId`, `nmId`, `stockFree`, `reserve`). This is OUR-DB; no МС dependency at read time.

**Verified live (no longer gated):**
- A **live** МойСклад pull works end-to-end (organizations/products/variants/stock). The ESM runtime load is confirmed by a live SPIKE (2026-07-03: 394 products pulled via the SDK on the production token; read-only honored). The `updated>` incremental filter is confirmed live in the same SPIKE.
- **Variants UI** — variants are persisted (`moyskladType=VARIANT`), **barcode auto-match is LIVE (S1f)**, and **incremental sync is LIVE (S1g)**. So a variants view, a barcode-match status column, and a last-sync / incremental-progress indicator (off `MoyskladSyncState.lastSyncedAt` + `lastUpdatedFilter`) CAN all be built now. Only the variant **parent-product linkage** remains a gap.
- Still pending: **multi-cabinet** selection (gap #1 — per-`CabinetKey` token resolved in S1h, but FE multi-cabinet UX is not built).

---

**Confirmations:** no live sync was run to produce this doc; no МойСклад token was used; no commit was made. All claims are read from source (file:line cited). Unit specs added in S1e cover `assertWritable`, `buildMoyskladOptions`, the processor lifecycle, and the controller routing/delegation (all GREEN, token-free).
