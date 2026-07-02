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
