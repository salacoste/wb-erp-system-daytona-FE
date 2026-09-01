import { readFileSync } from 'node:fs'

import type { Story1743State } from './route-contracts'

const EPICS_PATH = '_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md'
const LEDGER_PATH = '_bmad-output/planning-artifacts/shadcn-route-ledger.md'

const SC_CLAUSES = [
  'default success',
  'initial structural loading',
  'background refresh with usable content retained',
  'global empty',
  'filtered-empty with visible reset',
  'recoverable error and retry',
  'stale',
  'partial',
  'permission-restricted',
  'route-appropriate processing/success',
] as const

export type Story1743OwnerStateMapping = {
  rawOwnerState: string
  normalizedStates: readonly Story1743State[]
  source: 'owner-story' | 'standard-contract'
  requirement: 'disposition'
  rationale: string
}

export type Story1743OwnerStateReconciliation = {
  story: string
  route: string
  canonicalCoverage: string
  mappings: readonly Story1743OwnerStateMapping[]
}

function storySections(source: string): ReadonlyMap<string, string> {
  const headings = [...source.matchAll(/^### Story (\d+\.\d+):/gm)]
  return new Map(
    headings.map((heading, index) => [
      heading[1],
      source.slice(heading.index, headings[index + 1]?.index ?? source.length),
    ])
  )
}

function canonicalCoverage(section: string, story: string): string {
  const line = section.match(/\*\*State Coverage:\*\*\s*([^\n]+)/)?.[1]
  const value = line?.split(/\s+\*\*/)[0]?.trim()
  if (!value) throw new Error('Story ' + story + ' has no canonical State Coverage clause')
  return value
}

function splitOwnerClauses(coverage: string): string[] {
  const withoutSc = coverage.replace(/^SC plus\s*/i, '')
  return withoutSc
    .replace(/\.\s+Paid-storage[\s\S]*$/i, '')
    .replace(/[.;]/g, ',')
    .replace(/\s+and\s+/gi, ',')
    .split(/\s*[,/]\s*/)
    .map(clause => clause.replace(/^and\s+/i, '').trim())
    .filter(Boolean)
}

export function normalizeStory1743OwnerClause(
  route: string,
  story: string,
  rawOwnerState: string
): Story1743State[] {
  const state = rawOwnerState.toLocaleLowerCase()
  if (
    route === '/automation/canned-rules' &&
    (state === 'restricted' || state === 'unavailable rule')
  ) {
    return ['permission']
  }
  if (state === 'default' || state === 'default success') return ['default']
  if (route === '/register' && state === 'success') return ['partial-success']
  if (route === '/automation/canned-rules' && state === 'success') return ['partial-success']
  if (route === '/analytics/forecast-accuracy' && state === 'valid zero error') {
    return ['default']
  }
  if (route === '/analytics/advertising/campaigns/[advertId]' && state === 'absent') {
    return ['default']
  }
  if (route === '/analytics/dashboard' && state === 'token') return ['permission']
  if (route === '/analytics/acquiring/period' && state === 'missing period') return ['error']
  if (route === '/analytics/acquiring/reports/[id]' && state === 'invalid id') {
    return ['not-found']
  }
  if (/partial success|partial-success/.test(state)) return ['partial-success']
  if (/not[ -]?found|\bnotfound\b|\babsent\b/.test(state)) return ['not-found']
  if (/filtered(?:-empty| empty)?/.test(state)) return ['filtered-empty']
  if (/\b(?:load(?:ing)?|suspense|hydrating|hydration|checking|collecting)\b/.test(state)) {
    return ['loading']
  }
  if (/\brefresh\b|results-updating|background update/.test(state)) return ['refresh']
  if (
    /\bempty\b|\bno (?:rules|weeks|documents|campaigns|data|evaluations|observations|history|selection|recommendation|regional data|gaps|risk)\b|\bno-selection\b/.test(
      state
    )
  ) {
    return ['empty']
  }
  if (
    /\b(?:error|failure|failed|network|server|rejected|rate-limit(?:ed)?|503|route-boundary|invalid|malformed|duplicate|credential|conflict|conflicting|mismatched)\b|not-calculated/.test(
      state
    )
  ) {
    return ['error']
  }
  if (/\bstale\b/.test(state)) return ['stale']
  if (
    /\b(?:partial|degraded|unavailable|incomplete|one-source|mixed)\b|missing availability/.test(
      state
    )
  ) {
    return ['partial']
  }
  if (/\b(?:permission|restricted|unauthorized|guard|token-required)\b|no cabinet/.test(state)) {
    return ['permission']
  }
  if (
    /\b(?:pending|submission|submitting|processing|queued|running|sending|calculating|validating|connecting|verification)\b|action lifecycle|writeback|install |training |rollback |download |export /.test(
      state
    )
  ) {
    return ['pending']
  }
  if (
    /^authenticated redirect$|^unauthenticated redirect$|^success$|session-expired|^complete$|completed lifecycle|^progress$|safe-(?:to-)?leave|^retry$|period modes|dialog validation|^unknown$|^token$|^large$|large-negative|^negative$|^zero$|^missing$|^update$|sheet states|date update|long product|status variants|large amount|^weeks$|^data$|missing[- ]cogs|^group$|^export$|^periods$|positive-negative-zero|pagination|^sort$|^filter$|waterfall|vat-anomaly|unknown report-status|missing period|missing comparison|anomalous negative delta|zero-buyout|not-started|^matched$|^mismatched$|stock-risk|valid zero-stock|expanded group|^ready$|sync-gap|anomaly states|valid no-gaps|unknown classification|^analyzed$|^preview$|validating|partial trend|valid zero-returns|unknown reason|week-filter mismatch|^alert$|import idle|^validation$|no-risk|^selected$|^cost$|over-attribution|multi-campaign warning|^discrepancy$|daily-series|unknown category|negative[- ]margin|null-share|no-overlap|indeterminate correlation|selected chart point|deep-linked tab|unknown seller|unknown anomaly type|already-resolved|unknown model status|^pristine$|^dirty(?: form)?$|save success|unsaved-change|preference-required|forecast ready|missing confidence band|insufficient sample|undefined metric|unknown status|unknown run status|undefined versus zero metric|^chart$|^populated$|warning acknowledgement|^warning$|validation warning|valid zero|^edit$|^create$|margin ready|validation errors|^preview$|all success|conflicting row|valid input|unusual warning|^result$|negative result|^unread$|^draft$|^session$|^healthy$|^offline$|telegram disconnected|^disconnected$|^active$|^inactive$|status states|lifecycle statuses|lifecycle states|destructive confirmation|active navigation|^compact$|mobile navigation|valid form|^save$|^bound$|^unbound$|quiet-hours validation|^valid$|deactivate confirmation|picker states/.test(
      state
    )
  ) {
    return ['default']
  }

  {
    throw new Error(
      'Unknown owner State Coverage clause for ' +
        route +
        ' (Story ' +
        story +
        '): ' +
        rawOwnerState
    )
  }
}

function mapping(
  route: string,
  story: string,
  rawOwnerState: string,
  source: Story1743OwnerStateMapping['source']
): Story1743OwnerStateMapping {
  const normalizedStates = normalizeStory1743OwnerClause(route, story, rawOwnerState)
  return {
    rawOwnerState,
    normalizedStates,
    source,
    requirement: 'disposition',
    rationale:
      source === 'standard-contract'
        ? 'The universal SC clause permits executed evidence or an explicit route-specific disposition.'
        : 'The owner Story explicitly names this normalized Story 174.3 state, so exact executable evidence is required unless a separately authored typed exception applies.',
  }
}

export function buildStory1743OwnerStateReconciliation(): readonly Story1743OwnerStateReconciliation[] {
  const epics = readFileSync(EPICS_PATH, 'utf8')
  const sections = storySections(epics)
  const ledger = readFileSync(LEDGER_PATH, 'utf8')
  const rows = [...ledger.matchAll(/^\| (\d+\.\d+) \| `([^`]+)` \|/gm)]

  return rows.map(row => {
    const story = row[1]
    const route = row[2]
    const section = sections.get(story)
    if (!section) throw new Error('Ledger route ' + route + ' has no owner Story ' + story)
    const coverage = canonicalCoverage(section, story)
    const mappings = [
      ...(coverage.startsWith('SC plus')
        ? SC_CLAUSES.map(clause => mapping(route, story, clause, 'standard-contract'))
        : []),
      ...splitOwnerClauses(coverage).map(clause => mapping(route, story, clause, 'owner-story')),
    ]
    if (mappings.length === 0) {
      throw new Error('Story ' + story + ' has an empty owner-state reconciliation')
    }
    return { story, route, canonicalCoverage: coverage, mappings }
  })
}

export const STORY_174_3_OWNER_STATE_RECONCILIATION = buildStory1743OwnerStateReconciliation()

export function story1743CanonicalOwnerStateLabels(
  route: string,
  state: Story1743State
): readonly string[] {
  return (
    STORY_174_3_OWNER_STATE_RECONCILIATION.find(row => row.route === route)
      ?.mappings.filter(
        mapping => mapping.source === 'owner-story' && mapping.normalizedStates.includes(state)
      )
      .map(mapping => mapping.rawOwnerState) ?? []
  )
}
