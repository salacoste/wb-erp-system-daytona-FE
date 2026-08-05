import type { Page } from '@playwright/test'

import type { OrderFbsItem } from '../../src/types/orders'
import type { SupplyDetailResponse, SupplyListItem } from '../../src/types/supplies'

export const STORY_162_4_OPEN_SUPPLY_ID = 'story-162-4-open-supply'
export const STORY_162_4_LIFECYCLE_SUPPLY_ID = 'story-162-4-lifecycle-supply'
export const STORY_162_4_STICKER_DOCUMENT_ID = 'story-162-4-sticker-document'
export const STORY_162_4_STICKER_CONTENT = 'story-162-4-sticker'

const OPEN_SUPPLY: SupplyListItem = {
  id: STORY_162_4_OPEN_SUPPLY_ID,
  wbSupplyId: null,
  name: 'Story 162.4 OPEN supply',
  status: 'OPEN',
  ordersCount: 0,
  createdAt: '2026-08-05T10:00:00.000Z',
  closedAt: null,
  syncedAt: '2026-08-05T10:00:00.000Z',
}

const OPEN_SUPPLY_DETAIL: SupplyDetailResponse = {
  ...OPEN_SUPPLY,
  warehouseId: 507,
  warehouseName: 'Коледино',
  orders: [],
  documents: [],
}

export const STORY_162_4_ELIGIBLE_ORDER: OrderFbsItem = {
  id: '11111111-1111-1111-1111-111111111111',
  orderId: '1234567890',
  orderUid: 'story-162-4-order-uid',
  nmId: 12345678,
  vendorCode: 'STORY-162-4-SKU',
  productName: 'Story 162.4 eligible order',
  price: 1500,
  salePrice: 1200,
  supplierStatus: 'confirm',
  wbStatus: 'sorted',
  warehouseId: 507,
  deliveryType: 'fbs',
  isB2B: false,
  cargoType: 'MGT',
  createdAt: '2026-08-05T10:30:00.000Z',
  statusUpdatedAt: '2026-08-05T12:00:00.000Z',
  operationalStatus: 'NEW',
  operationalStatusUpdatedAt: null,
}

const LIFECYCLE_ORDER: SupplyDetailResponse['orders'][number] = {
  orderId: STORY_162_4_ELIGIBLE_ORDER.orderId,
  orderUid: STORY_162_4_ELIGIBLE_ORDER.orderUid,
  nmId: STORY_162_4_ELIGIBLE_ORDER.nmId,
  vendorCode: STORY_162_4_ELIGIBLE_ORDER.vendorCode,
  productName: STORY_162_4_ELIGIBLE_ORDER.productName,
  salePrice: STORY_162_4_ELIGIBLE_ORDER.salePrice,
  supplierStatus: STORY_162_4_ELIGIBLE_ORDER.supplierStatus,
  addedAt: '2026-08-05T12:30:00.000Z',
}

type LifecycleStatus = 'OPEN' | 'CLOSED'

export async function installStory1624LifecycleRoutes(
  page: Page,
  initialStatus: LifecycleStatus
): Promise<void> {
  let status = initialStatus
  let closedAt = initialStatus === 'CLOSED' ? '2026-08-05T13:00:00.000Z' : null
  const documents: SupplyDetailResponse['documents'] = []

  const createSupply = (): SupplyDetailResponse => ({
    id: STORY_162_4_LIFECYCLE_SUPPLY_ID,
    wbSupplyId: null,
    name: 'Story 162.4 lifecycle supply',
    status,
    ordersCount: 1,
    createdAt: '2026-08-05T10:00:00.000Z',
    closedAt,
    syncedAt: '2026-08-05T13:00:00.000Z',
    warehouseId: 507,
    warehouseName: 'Коледино',
    orders: [LIFECYCLE_ORDER],
    documents,
  })

  const fulfillJson = async (
    route: Parameters<Parameters<Page['route']>[1]>[0],
    body: unknown,
    responseStatus = 200
  ) => {
    await route.fulfill({
      status: responseStatus,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }

  await page.route(/\/v1\/supplies(?:\/|\?|$)/, async route => {
    const request = route.request()
    const method = request.method()
    const pathname = new URL(request.url()).pathname
    const detailPath = `/v1/supplies/${STORY_162_4_LIFECYCLE_SUPPLY_ID}`

    if (method === 'GET' && pathname === detailPath) {
      await fulfillJson(route, createSupply())
      return
    }

    if (method === 'GET' && pathname === '/v1/supplies') {
      const supply = createSupply()
      const { orders, documents: supplyDocuments, warehouseId, warehouseName, ...listItem } = supply
      void orders
      void supplyDocuments
      void warehouseId
      void warehouseName
      await fulfillJson(route, {
        items: [listItem],
        pagination: { total: 1, limit: 20, offset: 0 },
        filters: { status, from: null, to: null },
      })
      return
    }

    if (method === 'POST' && pathname === `${detailPath}/close`) {
      status = 'CLOSED'
      closedAt = '2026-08-05T13:00:00.000Z'
      await fulfillJson(route, {
        status,
        closedAt,
        message: 'Supply closed successfully',
      })
      return
    }

    if (method === 'POST' && pathname === `${detailPath}/stickers`) {
      const requestBody = request.postDataJSON() as { format?: string }
      if (!requestBody.format || !['png', 'svg', 'zpl'].includes(requestBody.format)) {
        await fulfillJson(route, { message: 'Unsupported sticker format' }, 400)
        return
      }

      const generatedAt = '2026-08-05T13:05:00.000Z'
      const backendFormat = requestBody.format === 'zpl' ? 'zplv' : requestBody.format
      const document = {
        type: 'sticker' as const,
        format: backendFormat,
        generatedAt,
        downloadUrl: `${detailPath}/documents/STICKER`,
        sizeBytes: STORY_162_4_STICKER_CONTENT.length,
      }
      documents.splice(0, documents.length, document)
      await fulfillJson(
        route,
        {
          id: STORY_162_4_STICKER_DOCUMENT_ID,
          docType: 'STICKER',
          format: backendFormat,
          fileSize: STORY_162_4_STICKER_CONTENT.length,
          generatedAt,
        },
        201
      )
      return
    }

    if (method === 'GET' && pathname === `${detailPath}/documents/STICKER`) {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        headers: {
          'Content-Disposition': 'attachment; filename="STICKER.png"',
        },
        body: STORY_162_4_STICKER_CONTENT,
      })
      return
    }

    await fulfillJson(
      route,
      { message: `Unexpected Story 162.4 lifecycle request: ${method} ${pathname}` },
      501
    )
  })
}

export async function installStory1624OpenSupplyRoutes(page: Page): Promise<void> {
  await page.route(/\/v1\/supplies(?:\?|$)/, async route => {
    const request = route.request()
    if (request.method() !== 'GET') {
      const url = new URL(request.url())
      await route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({
          message: `Unexpected Story 162.4 open supply list request: ${request.method()} ${url.pathname}${url.search}`,
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [OPEN_SUPPLY],
        pagination: { total: 1, limit: 20, offset: 0 },
        filters: { status: 'OPEN', from: null, to: null },
      }),
    })
  })

  await page.route(
    new RegExp(`/v1/supplies/${STORY_162_4_OPEN_SUPPLY_ID}(?:\\?|$)`),
    async route => {
      const request = route.request()
      if (request.method() !== 'GET') {
        const url = new URL(request.url())
        await route.fulfill({
          status: 501,
          contentType: 'application/json',
          body: JSON.stringify({
            message: `Unexpected Story 162.4 open supply detail request: ${request.method()} ${url.pathname}${url.search}`,
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(OPEN_SUPPLY_DETAIL),
      })
    }
  )
}

export async function installStory1624EligibleOrdersRoute(page: Page, delayMs = 0): Promise<void> {
  await page.route(/\/v1\/orders\?/, async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() !== 'GET' || url.searchParams.get('no_supply') !== 'true') {
      await route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({
          message: `Unexpected Story 162.4 eligible orders request: ${request.method()} ${url.pathname}${url.search}`,
        }),
      })
      return
    }

    if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs))

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [STORY_162_4_ELIGIBLE_ORDER],
        pagination: { total: 1, limit: 1000, offset: 0 },
      }),
    })
  })
}
