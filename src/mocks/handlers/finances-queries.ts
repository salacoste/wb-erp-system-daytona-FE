/**
 * MSW handlers for NEW-7 Finances API.
 *
 * Covers balance (populated/empty/error), documents categories, documents list,
 * and document download (base64). State edges driven by `?mode=` query for
 * unit/component tests; E2E drives its own `page.route` interception.
 *
 * BE contract: controller returns BARE arrays/objects (service unwraps the WB
 * envelope server-side). Balance → AccountBalanceDto (camelCase), documents →
 * DocumentItem[] (bare array), categories → DocumentCategory[] (bare array),
 * download → DocumentDownloadDto (camelCase).
 */

import { http, HttpResponse, delay } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Populated balance fixture (camelCase — BE maps snake → camel server-side). */
export const MOCK_BALANCE = {
  currency: 'RUB',
  current: 1523400.5,
  forWithdraw: 980000,
}

/** Empty balance fixture (all-null — WB omits balance data). */
export const MOCK_BALANCE_EMPTY = { currency: null, current: null, forWithdraw: null }

/** Populated document categories fixture. */
export const MOCK_CATEGORIES = [
  { name: 'ПА', title: 'Платёжное поручение' },
  { name: 'ЭДО', title: 'Электронный документооборот' },
  { name: 'ВОЗВРАТ', title: 'Возвраты' },
]

/** Populated documents fixture (camelCase — BE-facing DTO). */
export const MOCK_DOCUMENTS = [
  {
    serviceName: 'wildberries-ru/documents/ПА-2026-01',
    name: 'Платёжное поручение за январь 2026',
    category: 'ПА',
    extensions: ['pdf', 'xlsx'],
    creationTime: '2026-02-01T10:00:00Z',
    viewed: false,
  },
  {
    serviceName: 'wildberries-ru/documents/ЭДО-2025-12',
    name: 'Акт сверки за декабрь 2025',
    category: 'ЭДО',
    extensions: ['pdf'],
    creationTime: '2026-01-05T09:30:00Z',
    viewed: true,
  },
]

/** Small valid base64 PDF ("Test PDF content" — decodes cleanly). */
export const MOCK_DOWNLOAD_BASE64 = 'VGVzdCBQREYgY29udGVudA=='
export const MOCK_DOWNLOAD = {
  fileName: 'ПА-2026-01.pdf',
  extension: 'pdf',
  document: MOCK_DOWNLOAD_BASE64,
}

/** Empty download fixture (no base64 content). */
export const MOCK_DOWNLOAD_EMPTY = { fileName: null, extension: null, document: null }

export const financesQueryHandlers = [
  // GET /v1/finances/balance — populated | empty | error (via ?mode=)
  http.get(`${API_BASE_URL}/v1/finances/balance`, async ({ request }) => {
    await delay(50)
    const mode = new URL(request.url).searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'WB API rate limit exceeded' }, { status: 503 })
    }
    if (mode === 'empty') {
      // Bare object — no { data } envelope.
      return HttpResponse.json(MOCK_BALANCE_EMPTY)
    }
    return HttpResponse.json(MOCK_BALANCE)
  }),

  // GET /v1/finances/documents/categories — bare array
  http.get(`${API_BASE_URL}/v1/finances/documents/categories`, async () => {
    await delay(50)
    return HttpResponse.json(MOCK_CATEGORIES)
  }),

  // GET /v1/finances/documents — bare array (filterable for tests)
  http.get(`${API_BASE_URL}/v1/finances/documents`, async ({ request }) => {
    await delay(50)
    const url = new URL(request.url)
    const mode = url.searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'WB API unavailable' }, { status: 503 })
    }
    let docs = [...MOCK_DOCUMENTS]
    const category = url.searchParams.get('category')
    if (category && category !== 'all') {
      docs = docs.filter(d => d.category === category)
    }
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const offset = Number(url.searchParams.get('offset') ?? '0')
    docs = docs.slice(offset, offset + limit)
    return HttpResponse.json(docs)
  }),

  // GET /v1/finances/documents/:serviceName/download — base64
  http.get(`${API_BASE_URL}/v1/finances/documents/:serviceName/download`, async ({ request }) => {
    await delay(50)
    const url = new URL(request.url)
    const mode = url.searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'WB download rate limit' }, { status: 503 })
    }
    if (mode === 'empty') {
      return HttpResponse.json(MOCK_DOWNLOAD_EMPTY)
    }
    return HttpResponse.json(MOCK_DOWNLOAD)
  }),
]
