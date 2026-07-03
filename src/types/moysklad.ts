/**
 * МойСклад integration types (read-only FE, Phase 1 MVP).
 *
 * Contract source of truth:
 *   docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * D43/D44: FE NEVER writes to МойСклад — only reads our cache + triggers sync
 * (POST /sync → OUR DB) and manual-link (POST /mappings/:id/link → OUR DB).
 *
 * Anti-pattern #8: money/nmId/matchedBy are `| null` (pending = null), rendered
 * as «—» / «не привязан», NEVER collapsed to 0.
 */

/** How a МС assortment was linked to a WB nmId. NULL = pending manual link. */
export type MoyskladMatchStrategy = 'VENDOR_CODE' | 'BARCODE' | 'MANUAL'

/** МС assortment kind. Variants have no article (vendorCode stored in moyskladArticle). */
export type MoyskladAssortmentType = 'PRODUCT' | 'VARIANT'

/**
 * Coerced assortment kind. NULL when the backend sends an unknown/unexpected
 * type value (Defensive Frontend — indicate, never silently coerce unknowns to
 * PRODUCT). Rendered as «неизвестный тип» in the row badge.
 */
export type MoyskladAssortmentTypeOrNull = MoyskladAssortmentType | null

/** GET /v1/moysklad/health — config check, no live МС call. */
export interface MoyskladHealth {
  status: string
  readOnly: boolean
  orgId: string | null
  baseUrl: string | null
  tokenConfigured: boolean
}

/** Row inside GET /v1/moysklad/organizations `{ rows }`. */
export interface MoyskladOrganization {
  id: string
  name: string
  legalTitle: string | null
  inn: string | null
}

/**
 * FE-canonical mapping row. `buyPriceRub` is converted from backend
 * `buyPriceKopeck` (string-serialized BigInt, kopecks) → rubles (/100).
 */
export interface MoyskladProductMapping {
  id: string
  moyskladAssortmentId: string
  /** NULL when backend sends an unknown type value (render «неизвестный тип»). */
  moyskladType: MoyskladAssortmentTypeOrNull
  moyskladName: string | null
  /** The vendorCode match key (МС article, or variant code). NULL when absent. */
  moyskladArticle: string | null
  /** WB nmId after matching. NULL = pending manual link. */
  nmId: number | null
  /** Match strategy. NULL = pending. */
  matchedBy: MoyskladMatchStrategy | null
  /** Buy price in rubles (kopeck/100). NULL = unknown (render «—»). */
  buyPriceRub: number | null
  lastSyncedAt: string | null
}

/** GET /v1/moysklad/mappings response (`{ count, total, rows }`). */
export interface MoyskladMappingsResponse {
  count: number
  total: number
  rows: MoyskladProductMapping[]
}

/** Response of POST /v1/moysklad/mappings/:id/link. */
export interface LinkMappingResponse {
  id: string
  nmId: number
  matchedBy: MoyskladMatchStrategy
}

/** Response of POST /v1/moysklad/sync (202 enqueued). */
export interface EnqueueSyncResponse {
  status: string
  taskUuid: string
  queue: string
}

/**
 * FE-canonical МС stock snapshot row (GET /v1/moysklad/stock-db).
 *
 * `stockFree` / `reserve` come from the backend as Prisma Decimal (serialized
 * decimal.js `{s,e,d}`); the normalizer (`toDecimalNumber`) reconstructs them to
 * a JS number. NULL when the backend value is absent (render «—», AP#8 — never 0).
 *
 * `nmId` is NULL when the assortment is unmatched (render «не привязан»).
 * `date` is the snapshot date (YYYY-MM-DD); NULL when the backend omits it.
 * `syncedAt` is the row sync timestamp; NULL when unknown.
 */
export interface MoyskladStockSnapshot {
  id: string
  date: string | null
  moyskladAssortmentId: string
  nmId: number | null
  stockFree: number | null
  reserve: number | null
  syncedAt: string | null
}

/** GET /v1/moysklad/stock-db response (`{ count, total, date, rows }`). */
export interface MoyskladStockDbResponse {
  count: number
  total: number
  /** Snapshot date for these rows (YYYY-MM-DD); NULL when absent. */
  date: string | null
  rows: MoyskladStockSnapshot[]
}

/**
 * МС money object (live `/products` read-through). `value` is in МС minor units
 * (kopecks for RUB) — the normalizer divides by 100 → rubles. NULL value = unknown.
 * `currency` is the МС currency code (e.g. "RUB"); NULL when МС omits it.
 */
export interface MoyskladMoney {
  value: number | null
  currency: string | null
}

/**
 * FE-canonical МС product row (GET /v1/moysklad/products live read-through).
 *
 * `buyPriceRub` / `salePriceRub` are converted from МС minor units (kopecks) →
 * rubles (/100). NULL when МС omits buyPrice / salePrices (render «—», AP#8 — never 0).
 *
 * `salePriceRub` is the FIRST sale-price tier (МС returns up to 3; simplified).
 * `name`/`article`/`code`/`externalCode`/`updated` are NULL when МС omits them.
 */
export interface MoyskladProduct {
  id: string
  name: string | null
  article: string | null
  code: string | null
  externalCode: string | null
  /** Buy price in rubles (kopeck/100). NULL = unknown (render «—»). */
  buyPriceRub: number | null
  /** First sale-price tier in rubles (kopeck/100). NULL = unknown (render «—»). */
  salePriceRub: number | null
  updated: string | null
}

/** GET /v1/moysklad/products response (`{ rows, meta:{ size, ... } }`). */
export interface MoyskladProductsResponse {
  rows: MoyskladProduct[]
  /** Total МС products available (meta.size). */
  total: number
}
