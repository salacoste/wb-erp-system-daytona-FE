import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import {
  STORY_174_3_ANALYTICS_EVIDENCE,
  STORY_174_3_DYNAMIC_SEGMENTS,
  STORY_174_3_ROUTE_IDENTITIES,
  STORY_174_3_UNAUTHENTICATED_ONBOARDING_ROUTES,
  type Story1743EvidenceAnchor,
  type Story1743RouteEvidence,
} from './route-contracts'
import {
  STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES,
  resolveStory1743StateEvidence,
} from './state-evidence'
import { STORY_174_3_EXACT_STATE_SCENARIOS } from './state-scenarios'

const REPOSITORY_ROOT = '.'
const LEDGER_PATH = '_bmad-output/planning-artifacts/shadcn-route-ledger.md'
const ARTIFACT_ROOT = '_bmad-output/implementation-artifacts'
const SOURCE_LINE_CACHE = new Map<string, readonly string[]>()

function findEvidenceAnchor(
  source: string,
  tokens: readonly string[],
  kind: Story1743EvidenceAnchor['kind']
): Story1743EvidenceAnchor | undefined {
  const lines =
    SOURCE_LINE_CACHE.get(source) ??
    readFileSync(join(REPOSITORY_ROOT, source), 'utf8').split(/\r?\n/)
  SOURCE_LINE_CACHE.set(source, lines)
  for (const token of tokens) {
    const line = lines.findIndex(candidate => candidate.toLocaleLowerCase().includes(token))
    if (line >= 0) return { source, line: line + 1, matchedToken: token, kind }
  }
  return undefined
}

function resolveRouteIdentityEvidence(
  route: string,
  browserEvidence: string,
  ownerArtifact: string
): Story1743EvidenceAnchor {
  const token = route.toLocaleLowerCase()
  const anchor =
    findEvidenceAnchor(browserEvidence, [token], 'owner-browser-executable') ??
    findEvidenceAnchor(ownerArtifact, [token], 'owner-delivery-record')
  if (!anchor) {
    throw new Error(
      'Story 174.3 has no route-identity anchor for ' +
        route +
        ' in ' +
        browserEvidence +
        ' or ' +
        ownerArtifact
    )
  }
  return anchor
}

function materializeRoute(route: string): string {
  return route.replace(/\[([^\]]+)\]/g, (_match, key: string) => {
    const value = STORY_174_3_DYNAMIC_SEGMENTS[key]
    if (!value) {
      throw new Error('Story 174.3 has no deterministic value for [' + key + '] in ' + route)
    }
    return value
  })
}

function resolveOwnerArtifact(story: string): string {
  const prefix = story.replace('.', '-') + '-fe-'
  const matches = readdirSync(ARTIFACT_ROOT).filter(
    file => file.startsWith(prefix) && file.endsWith('.md')
  )
  if (matches.length !== 1) {
    throw new Error(
      'Story ' + story + ' resolves to ' + matches.length + ' implementation artifacts'
    )
  }
  return ARTIFACT_ROOT + '/' + matches[0]
}

function resolveBrowserEvidence(route: string): string {
  if (
    route === '/analytics/brand-share' ||
    route === '/analytics/buyout' ||
    route === '/orders/fbo' ||
    route === '/analytics/models/[id]/evaluations/sku-accuracy'
  ) {
    return 'e2e/story-174-3-dedicated-route-evidence.spec.ts'
  }
  const analytics = STORY_174_3_ANALYTICS_EVIDENCE.find(([prefix]) => route.startsWith(prefix))
  if (analytics) return analytics[1]
  if (route === '/analytics') return 'e2e/analytics/analytics-hub.spec.ts'
  if (route === '/' || route === '/login') return 'e2e/login-dashboard.spec.ts'
  if (['/register', '/cabinet', '/processing', '/wb-token'].includes(route)) {
    return 'e2e/onboarding.spec.ts'
  }
  if (route === '/dashboard') return 'e2e/dashboard-metrics.spec.ts'
  if (route.startsWith('/automation/canned-rules')) return 'e2e/automation/canned-rules.spec.ts'
  if (route.startsWith('/automation/installed-rules/')) {
    return 'e2e/automation/installed-rule-editor.spec.ts'
  }
  if (route.startsWith('/automation/installed-rules')) {
    return 'e2e/automation/installed-rules.spec.ts'
  }
  if (route === '/cogs/price-calculator') return 'e2e/price-calculator-visual.spec.ts'
  if (route.startsWith('/cogs')) return 'e2e/cogs-pages.spec.ts'
  if (route === '/communications') return 'e2e/communications.spec.ts'
  if (route === '/finances') return 'e2e/finances.spec.ts'
  if (route === '/monitor') return 'e2e/monitor.spec.ts'
  if (route === '/monitoring') return 'e2e/monitoring.spec.ts'
  if (route === '/moysklad') return 'e2e/moysklad.spec.ts'
  if (route === '/orders/integrity') return 'e2e/orders-integrity.spec.ts'
  if (route.startsWith('/orders')) return 'e2e/orders.spec.ts'
  if (route === '/products') return 'e2e/products-assortment.spec.ts'
  if (route === '/settings/notifications') return 'e2e/telegram-notifications.spec.ts'
  if (route === '/settings/expenses') return 'e2e/expenses-page.spec.ts'
  if (route === '/settings/backfill') return 'e2e/settings/backfill-a11y.spec.ts'
  if (route.startsWith('/settings')) return 'e2e/settings-pages.spec.ts'
  if (route === '/shipments/box-types') return 'e2e/box-types-page.spec.ts'
  if (route === '/shipments/sku-packaging') return 'e2e/sku-packaging-page.spec.ts'
  if (route.startsWith('/shipments/')) return 'e2e/shipments/shipments-detail.spec.ts'
  if (route === '/shipments') return 'e2e/shipments/shipments-a11y.spec.ts'
  if (route.startsWith('/supplies/')) return 'e2e/supplies/supply-detail.spec.ts'
  if (route === '/supplies') return 'e2e/supplies/supplies-a11y.spec.ts'
  throw new Error('Story 174.3 has no browser evidence source for ' + route)
}

function parseLedger(): Story1743RouteEvidence[] {
  const ledger = readFileSync(LEDGER_PATH, 'utf8')
  const rowPattern =
    /^\| (\d+\.\d+) \| \x60([^\x60]+)\x60 \| \x60([^\x60]+)\x60 \| ([^|]+?) \| (planned|verified) \|$/gm
  const rows = [...ledger.matchAll(rowPattern)].map(match => {
    const story = match[1]
    const route = match[2]
    const ledgerStatus = match[5] as Story1743RouteEvidence['ledgerStatus']
    const routeIdentity = STORY_174_3_ROUTE_IDENTITIES[route]
    if (!routeIdentity) {
      throw new Error('Story 174.3 has no explicit route identity contract for ' + route)
    }
    const browserEvidence = resolveBrowserEvidence(route)
    const ownerArtifact = resolveOwnerArtifact(story)
    for (const evidencePath of [browserEvidence, ownerArtifact]) {
      if (!existsSync(join(REPOSITORY_ROOT, evidencePath))) {
        throw new Error('Story 174.3 evidence path does not exist: ' + evidencePath)
      }
    }
    const stateEvidence = resolveStory1743StateEvidence(route)
    return {
      story,
      route,
      effectiveUrl: materializeRoute(route),
      entry: match[3],
      domain: match[4].trim(),
      ledgerStatus,
      states: stateEvidence
        .filter(evidence => evidence.disposition === 'executed')
        .map(evidence => evidence.state),
      ownerArtifact,
      browserEvidence,
      routeIdentityEvidence: resolveRouteIdentityEvidence(route, browserEvidence, ownerArtifact),
      routeIdentity,
      sessionProfile: STORY_174_3_UNAUTHENTICATED_ONBOARDING_ROUTES.has(route)
        ? ('unauthenticated-onboarding' as const)
        : ('authenticated' as const),
      stateEvidence,
      screenshotDisposition: 'privacy-safe-dom-equivalent' as const,
      manualAtDisposition: 'environment-gap-real-at' as const,
    }
  })

  const ledgerRoutes = new Set(rows.map(row => row.route))
  const contractSets = [
    ['identity', new Set(Object.keys(STORY_174_3_ROUTE_IDENTITIES))],
    ['explicit N/A', new Set(Object.keys(STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES))],
  ] as const
  for (const [label, routes] of contractSets) {
    if (routes.size !== ledgerRoutes.size || [...routes].some(route => !ledgerRoutes.has(route))) {
      throw new Error(
        'Story 174.3 ' +
          label +
          ' contract must match the ledger exactly (ledger=' +
          ledgerRoutes.size +
          ', declarations=' +
          routes.size +
          ')'
      )
    }
  }
  if (Object.keys(STORY_174_3_EXACT_STATE_SCENARIOS).some(route => !ledgerRoutes.has(route))) {
    throw new Error('Story 174.3 executed-state manifest contains a route outside the ledger')
  }
  return rows
}

export const STORY_174_3_ROUTE_EVIDENCE = Object.freeze(parseLedger())
