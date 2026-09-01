import type { Story1743RequiredExecution } from './execution-manifest'

const owner = (
  source: string,
  scenarioId: string
): Omit<Story1743RequiredExecution, 'sourceSha256'> => ({
  source,
  scenarioId,
  runner: 'playwright',
})

export const STORY_174_3_DEDICATED_ROUTE_SCENARIOS = [
  owner(
    'e2e/story-174-3-dedicated-route-evidence.spec.ts',
    '/analytics/brand-share has dedicated settled-route and heading evidence'
  ),
  owner(
    'e2e/story-174-3-dedicated-route-evidence.spec.ts',
    '/analytics/buyout has dedicated settled-route and heading evidence'
  ),
  owner(
    'e2e/story-174-3-dedicated-route-evidence.spec.ts',
    '/orders/fbo has dedicated settled-route and heading evidence'
  ),
  owner(
    'e2e/story-174-3-dedicated-route-evidence.spec.ts',
    '/analytics/models/[id]/evaluations/sku-accuracy has dedicated route-specific evidence'
  ),
] as const
