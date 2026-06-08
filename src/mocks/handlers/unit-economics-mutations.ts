/**
 * MSW Error/Slow Handlers for Unit Economics API
 * Epic 5 - Unit Economics Analytics
 *
 * Error and slow-response handlers for testing edge cases
 */

import { http, HttpResponse, delay } from 'msw'
import { mockUnitEconomicsResponse } from './unit-economics-queries'

/**
 * Base API URL - matches apiClient configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Error handler for testing error scenarios
 */
export const unitEconomicsErrorHandlers = [
  http.get(`${API_BASE_URL}/v1/analytics/unit-economics`, async () => {
    await delay(100)
    return HttpResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Internal server error',
          trace_id: 'test-trace-id',
        },
      },
      { status: 500 }
    )
  }),
]

/**
 * Slow handler for testing loading states
 */
export const unitEconomicsSlowHandlers = [
  http.get(`${API_BASE_URL}/v1/analytics/unit-economics`, async ({ request }) => {
    const url = new URL(request.url)
    const week = url.searchParams.get('week')

    // Simulate slow network
    await delay(2000)

    // F-43: real backend returns the wrapper directly (no outer { data }).
    return HttpResponse.json({
      ...mockUnitEconomicsResponse,
      meta: {
        ...mockUnitEconomicsResponse.meta,
        week: week || '2025-W50',
      },
    })
  }),
]
