import { expect, test } from '@playwright/test'
import {
  installFbsEnhancedReadOnlyApiFixture,
  installReadOnlyNetworkGuard,
  type BlockedRequestRecord,
} from './fixtures/read-only-network-guard'

test.describe('read-only route audit built-in API fixtures', () => {
  test('FBS enhanced fixture fulfills read methods with the empty response', async ({ page }) => {
    const routePath = '/analytics/fbs-enhanced'
    await installFbsEnhancedReadOnlyApiFixture(page, routePath)

    await page.goto('about:blank')
    const result = await page.evaluate(async () => {
      const getResponse = await fetch('http://localhost:3000/v1/analytics/fbs/enhanced')
      const headResponse = await fetch('http://localhost:3000/v1/analytics/fbs/enhanced', {
        method: 'HEAD',
      })
      return {
        getStatus: getResponse.status,
        getBody: await getResponse.json(),
        headStatus: headResponse.status,
      }
    })

    expect(result.getStatus).toBe(200)
    expect(result.getBody).toMatchObject({
      orderStats: { ordersCount: 0 },
      stockAnalytics: { totalStock: 0 },
      regionalData: [],
      period: { from: '', to: '' },
      generatedAt: '',
    })
    expect(result.headStatus).toBe(200)
  })

  test('FBS enhanced fixture can be disabled', async ({ page }) => {
    const fixtures = await installFbsEnhancedReadOnlyApiFixture(
      page,
      '/analytics/fbs-enhanced',
      false
    )

    expect(fixtures).toEqual([])
  })

  test('FBS enhanced fixture falls back to the mutation guard for non-read methods', async ({
    page,
  }) => {
    const blockedRequests: BlockedRequestRecord[] = []
    const routePath = '/analytics/fbs-enhanced'
    const baseURL = 'http://localhost:3100'

    await installReadOnlyNetworkGuard(page, blockedRequests, {
      baseURL,
      routePath,
      sessionContext: 'authenticated',
    })
    await installFbsEnhancedReadOnlyApiFixture(page, routePath)

    await page.goto('about:blank')
    const result = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3000/v1/analytics/fbs/enhanced', {
          method: 'POST',
          body: '{}',
        })
        return { ok: response.ok, status: response.status, failed: false }
      } catch (error) {
        return {
          ok: false,
          status: null,
          failed: true,
          message: error instanceof Error ? error.message : String(error),
        }
      }
    })

    expect(result.failed).toBe(true)
    expect(blockedRequests).toHaveLength(1)
    expect(blockedRequests[0]).toMatchObject({
      method: 'POST',
      reason: 'read-only-audit-blocked-non-get-head-target-request',
      route_path: routePath,
      session_context: 'authenticated',
    })
    expect(blockedRequests[0]?.url).toContain('/v1/analytics/fbs/enhanced')
  })
})
