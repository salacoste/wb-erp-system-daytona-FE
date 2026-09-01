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

function unique(states: Story1743State[]): Story1743State[] {
  return [...new Set(states)]
}

function normalizeOwnerClause(rawOwnerState: string): Story1743State[] {
  const state = rawOwnerState.toLocaleLowerCase()
  const normalized: Story1743State[] = []
  const add = (candidate: Story1743State, pattern: RegExp) => {
    if (pattern.test(state)) normalized.push(candidate)
  }

  add('loading', /\b(?:load(?:ing)?|suspense|hydrating|hydration|checking|collecting)\b/)
  add('refresh', /\brefresh\b|results-updating|background update/)
  add(
    'empty',
    /\bempty\b|\bno (?:rules|weeks|documents|campaigns|data|evaluations|observations|history|selection|recommendation|regional data|gaps|risk)\b/
  )
  add('filtered-empty', /filtered(?:-empty| empty)?/)
  add(
    'error',
    /\b(?:error|failure|failed|network|server|rejected|rate-limit(?:ed)?|503|route-boundary)\b|invalid (?:url|id|model id|period)|not-calculated/
  )
  add('stale', /\bstale\b/)
  add(
    'partial',
    /\b(?:partial|degraded|unavailable|incomplete|one-source|mixed)\b|missing availability/
  )
  add('permission', /\b(?:permission|restricted|unauthorized|guard|token-required)\b|no cabinet/)
  add(
    'pending',
    /\b(?:pending|submitting|processing|queued|running|sending|calculating|validating|connecting|verification)\b|action lifecycle|writeback|install |training |rollback |download |export /
  )
  add('partial-success', /partial success|partial-success/)
  add('not-found', /not[ -]?found|\bnotfound\b/)

  return unique(normalized.length > 0 ? normalized : ['default'])
}

function mapping(
  rawOwnerState: string,
  source: Story1743OwnerStateMapping['source']
): Story1743OwnerStateMapping {
  const normalizedStates = normalizeOwnerClause(rawOwnerState)
  return {
    rawOwnerState,
    normalizedStates,
    source,
    requirement: 'disposition',
    rationale:
      source === 'standard-contract'
        ? 'The universal SC clause permits executed evidence or an explicit route-specific disposition.'
        : normalizedStates.every(state => state === 'default')
          ? 'This owner-specific variant is outside the twelve-state audit taxonomy and is covered by the canonical default plus exact owner tests.'
          : 'The owner Story explicitly names this normalized Story 174.3 state, so executable evidence is required.',
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
        ? SC_CLAUSES.map(clause => mapping(clause, 'standard-contract'))
        : []),
      ...splitOwnerClauses(coverage).map(clause => mapping(clause, 'owner-story')),
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
    STORY_174_3_OWNER_STATE_RECONCILIATION.find(row => row.route === route)?.mappings
      .filter(mapping => mapping.source === 'owner-story' && mapping.normalizedStates.includes(state))
      .map(mapping => mapping.rawOwnerState) ?? []
  )
}
