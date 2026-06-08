/**
 * MSW Mutation/Error Handlers for Liquidity Analysis API
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 *
 * Error and edge-case handlers for testing error states
 */

import { http, HttpResponse, delay } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ============================================================================
// Error Handlers (for testing error states)
// ============================================================================

export const liquidityErrorHandlers = {
  notFound: http.get(`${API_BASE_URL}/v1/analytics/liquidity`, async () => {
    await delay(100)
    return HttpResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'No inventory data available',
        },
      },
      { status: 404 }
    )
  }),

  serverError: http.get(`${API_BASE_URL}/v1/analytics/liquidity`, async () => {
    await delay(100)
    return HttpResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }),

  unauthorized: http.get(`${API_BASE_URL}/v1/analytics/liquidity`, async () => {
    await delay(100)
    return HttpResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    )
  }),
}
