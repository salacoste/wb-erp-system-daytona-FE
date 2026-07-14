/**
 * МойСклад test fixtures (Phase 1 MVP).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Raw backend shapes (pre-normalizer): `buyPriceKopeck` is a string-serialized
 * BigInt (kopecks); nmId/matchedBy/moyskladArticle are null when pending.
 */

/** Raw GET /health shape (no live МС call). */
export const moyskladHealthFixture = {
  status: 'ok',
  readOnly: true,
  orgId: 'org-123',
  baseUrl: 'https://online.moysklad.ru/api/remap/1.2',
  tokenConfigured: true,
}

/** Raw GET /organizations `{ rows }` shape. */
export const moyskladOrganizationsFixture = {
  rows: [
    {
      id: 'org-123',
      name: 'ООО Ромашка',
      legalTitle: 'Общество с ограниченной ответственностью Ромашка',
      inn: '7700000000',
    },
  ],
  meta: { size: 1 },
}

/**
 * Raw GET /mappings `{ count, total, rows }` shape.
 * Covers: matched-by-vendor, matched-by-manual, pending (null nmId/matchedBy),
 * variant (code in moyskladArticle), null article, null buy price, unknown type.
 *
 * buyPriceKopeck "7080000" = 70800.00 ₽ (kopecks → rubles / 100).
 */
export const moyskladMappingsRawFixture = {
  count: 4,
  total: 435,
  rows: [
    {
      id: 'map-1',
      cabinetId: 'cab-1',
      moyskladAssortmentId: 'assort-1',
      moyskadType: 'PRODUCT',
      moyskladType: 'PRODUCT',
      moyskladName: 'Футболка белая',
      moyskladArticle: 'WB-001',
      nmId: 12345678,
      matchedBy: 'VENDOR_CODE',
      buyPriceKopeck: '7080000',
      lastSyncedAt: '2026-07-01T10:00:00.000Z',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-07-01T10:00:00.000Z',
    },
    {
      id: 'map-2',
      cabinetId: 'cab-1',
      moyskladAssortmentId: 'assort-2',
      moyskadType: 'VARIANT',
      moyskladType: 'VARIANT',
      moyskladName: 'Футболка белая / M',
      moyskladArticle: 'WB-001-M',
      nmId: 87654321,
      matchedBy: 'MANUAL',
      buyPriceKopeck: null,
      lastSyncedAt: '2026-07-01T10:00:00.000Z',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-07-01T10:00:00.000Z',
    },
    {
      id: 'map-3',
      cabinetId: 'cab-1',
      moyskladAssortmentId: 'assort-3',
      moyskadType: 'PRODUCT',
      moyskladType: 'PRODUCT',
      moyskladName: 'Носки чёрные (без артикула)',
      moyskladArticle: null,
      nmId: null,
      matchedBy: null,
      buyPriceKopeck: '500000',
      lastSyncedAt: null,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    },
    {
      id: 'map-4',
      cabinetId: 'cab-1',
      moyskladAssortmentId: 'assort-4',
      // Unknown assortment kind — Defensive Frontend: must coerce to NULL,
      // never silently to PRODUCT. Rendered as «неизвестный тип».
      moyskladType: 'SERVICE',
      moyskladName: 'Услуга (неизвестный тип)',
      moyskladArticle: 'SVC-9',
      nmId: null,
      matchedBy: null,
      buyPriceKopeck: null,
      lastSyncedAt: null,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    },
  ],
}

/** Empty mappings response (cabinet with no synced data). */
export const moyskladMappingsEmptyFixture = {
  count: 0,
  total: 0,
  rows: [],
}

/**
 * Raw GET /stock-db row sample. stockFree/reserve arrive as Prisma Decimal
 * (decimal.js `{s,e,d}`). `{s:1,e:4,d:[28765,3100000]}` = +28765.31 (decimal.js-
 * verified). nmId null = unmatched assortment. reserve null = unknown.
 */
export const stockSnapshotSample = {
  id: 'stk-1',
  cabinetId: 'cab-1',
  date: '2026-07-03',
  moyskladAssortmentId: 'assort-1',
  nmId: 12345678,
  stockFree: { s: 1, e: 4, d: [28765, 3100000] }, // 28765.31
  reserve: { s: 1, e: 1, d: [50] }, // 50
  syncedAt: '2026-07-03T08:00:00.000Z',
}

/** Unmatched stock row (nmId null -> «не привязан», reserve null -> «—»). */
export const stockSnapshotUnmatchedSample = {
  id: 'stk-2',
  cabinetId: 'cab-1',
  date: '2026-07-03',
  moyskladAssortmentId: 'assort-2',
  nmId: null,
  stockFree: { s: 1, e: 2, d: [100] }, // 100
  reserve: null,
  syncedAt: null,
}

/** Raw GET /stock-db `{ count, total, date, rows }` shape. */
export const stockDbRawFixture = {
  count: 2,
  total: 365,
  date: '2026-07-03',
  rows: [stockSnapshotSample, stockSnapshotUnmatchedSample],
}

/** Empty stock-db response (no snapshot for the date). */
export const stockDbEmptyFixture = {
  count: 0,
  total: 0,
  date: null,
  rows: [],
}

/**
 * Raw GET /products row sample (live МС `/products` read-through, M2).
 * buyPrice.value/salePrices[].value are МС minor units (kopecks for RUB).
 * 7080000 kopecks = 70800.00 ₽; 1200000 kopecks = 12000.00 ₽.
 */
export const moyskladProductSample = {
  id: 'prod-1',
  name: 'Футболка белая',
  article: 'WB-001',
  code: '00001',
  externalCode: 'ext-1',
  buyPrice: { value: 7080000, currency: { meta: { href: '.../currency/rub', type: 'currency' } } },
  salePrices: [
    { value: 1200000, currency: { meta: { href: '.../currency/rub', type: 'currency' } } },
    { value: 1100000, currency: { meta: { href: '.../currency/rub', type: 'currency' } } },
  ],
  updated: '2026-07-01T10:00:00.000Z',
}

/** Product missing buyPrice + salePrices (render «—», AP#8 — never 0). */
export const moyskladProductMissingPricesSample = {
  id: 'prod-2',
  name: 'Носки (без цены)',
  article: null,
  code: null,
  externalCode: null,
  // buyPrice + salePrices omitted entirely.
  updated: null,
}

/** Raw GET /products `{ rows, meta:{ size } }` shape. */
export const moyskladProductsRawFixture = {
  rows: [moyskladProductSample, moyskladProductMissingPricesSample],
  meta: {
    size: 394,
    limit: 20,
    offset: 0,
    nextHref: 'https://online.moysklad.ru/api/remap/1.2/entity/product?offset=20',
  },
}

/** Empty products response (no products in МС account). */
export const moyskladProductsEmptyResponse = {
  rows: [],
  meta: { size: 0, limit: 20, offset: 0 },
}

/**
 * Raw GET /variants row sample (live МС `/variants` read-through, M3).
 * Variants LACK `article` (the contract's key point). `product` is a parent-
 * product entity-link object (`{ meta:{ href }, id, name }`). `barcodes` is an
 * array; here 3 entries.
 */
export const moyskladVariantSample = {
  id: 'var-1',
  name: 'Футболка белая / M',
  code: '00001-M',
  product: {
    meta: {
      href: 'https://online.moysklad.ru/api/remap/1.2/entity/product/prod-1',
      type: 'product',
    },
    id: 'prod-1',
    name: 'Футболка белая',
  },
  barcodes: [{ ean13: '2000000000017' }, { ean13: '2000000000024' }, { ean13: '2000000000031' }],
  updated: '2026-07-01T10:00:00.000Z',
}

/**
 * Variant missing product ref + barcodes (parentProductHref → null → «—»,
 * barcodesCount → 0, code/updated null → «—»). A bare `product.id` (no
 * meta.href) exercises the href-then-id fallback.
 */
export const moyskladVariantMissingRefsSample = {
  id: 'var-2',
  name: 'Носки чёрные / 42',
  code: null,
  // Bare id, no meta.href — fallback to product.id string.
  product: { id: 'prod-2' },
  // barcodes omitted entirely.
  updated: null,
}

/** Raw GET /variants `{ rows, meta:{ size } }` shape. */
export const moyskladVariantsRawFixture = {
  rows: [moyskladVariantSample, moyskladVariantMissingRefsSample],
  meta: {
    size: 41,
    limit: 20,
    offset: 0,
    nextHref: 'https://online.moysklad.ru/api/remap/1.2/entity/variant?offset=20',
  },
}

/** Empty variants response (no variants in МС account). */
export const moyskladVariantsEmptyResponse = {
  rows: [],
  meta: { size: 0, limit: 20, offset: 0 },
}
