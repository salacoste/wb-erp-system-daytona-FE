/**
 * MSW Error/Edge-Case Handlers for Supply Planning API
 * Epic 6 - Supply Planning & Stockout Prevention
 *
 * Slow, unauthorized, forbidden, not-found, and network-error handlers
 */

import { http, HttpResponse, delay } from 'msw'
import { mockSupplyPlanningResponse } from './supply-planning-queries'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ============================================================================
// Additional Test Handlers
// ============================================================================

/**
 * Handler that simulates slow network response
 * Use with server.use() in specific tests
 */
export const slowSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  async () => {
    await delay(2000)
    return HttpResponse.json(mockSupplyPlanningResponse)
  }
)

/**
 * Handler that simulates 401 Unauthorized
 */
export const unauthorizedSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  () => {
    return HttpResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    )
  }
)

/**
 * Handler that simulates 403 Forbidden
 */
export const forbiddenSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  () => {
    return HttpResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this cabinet',
        },
      },
      { status: 403 }
    )
  }
)

/**
 * Handler that simulates 404 Not Found
 */
export const notFoundSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  () => {
    return HttpResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Cabinet not found',
        },
      },
      { status: 404 }
    )
  }
)

/**
 * Handler that simulates network error
 */
export const networkErrorSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  () => {
    return HttpResponse.error()
  }
)
