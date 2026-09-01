import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  indexStory1743ExecutionManifest,
  type Story1743ExecutionManifest,
  type Story1743RequiredExecution,
} from '../../e2e/fixtures/story-174-3/execution-manifest'
import { STORY_174_3_DEDICATED_ROUTE_SCENARIOS } from '../../e2e/fixtures/story-174-3/dedicated-route-scenarios'
import { STORY_174_3_STATES } from '../../e2e/fixtures/story-174-3/route-contracts'
import { STORY_174_3_OWNER_STATE_RECONCILIATION } from '../../e2e/fixtures/story-174-3/owner-state-reconciliation'
import {
  STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES,
  validateStory1743ExplicitStateContract,
} from '../../e2e/fixtures/story-174-3/state-evidence'
import {
  STORY_174_3_EXACT_STATE_SCENARIOS,
  type Story1743ExactStateScenario,
} from '../../e2e/fixtures/story-174-3/state-scenarios'

const NON_DEFAULT_STATES = STORY_174_3_STATES.filter(state => state !== 'default')
const scenario: Story1743ExactStateScenario = {
  source: 'src/components/custom/LoginForm.test.tsx',
  scenarioId: 'has no automated accessibility violations in the request-error state',
}
const REQUIRED_EXECUTION: Story1743RequiredExecution = {
  source: 'src/components/custom/LoginForm.test.tsx',
  sourceSha256: 'source-sha',
  scenarioId: 'exact scenario',
  runner: 'vitest',
}
const manifest = (
  overrides: Partial<Story1743ExecutionManifest['entries'][number]> = {},
  extraEntries: Story1743ExecutionManifest['entries'] = []
): Story1743ExecutionManifest => ({
  schemaVersion: 1,
  generatedAt: '2026-08-31T00:00:00.000Z',
  runtime: { node: 'v24.18.0', npm: '11.11.0' },
  entries: [
    {
      ...REQUIRED_EXECUTION,
      command: 'npm test -- --run source.test.ts',
      result: 'passed',
      exitCode: 0,
      startedAt: '2026-08-31T00:00:00.000Z',
      durationMs: 1,
      ...overrides,
    },
    ...extraEntries,
  ],
})
const routeEvidence = async () =>
  (await import('../../e2e/fixtures/story-174-3/route-evidence')).STORY_174_3_ROUTE_EVIDENCE

describe('Story 174.3 explicit route/state contract', () => {
  it('reconciles all 76 owner Story State Coverage clauses with the audit taxonomy', async () => {
    const rows = await routeEvidence()

    expect(STORY_174_3_OWNER_STATE_RECONCILIATION).toHaveLength(76)
    expect(
      new Set(STORY_174_3_OWNER_STATE_RECONCILIATION.map(reconciliation => reconciliation.route))
        .size
    ).toBe(76)

    for (const reconciliation of STORY_174_3_OWNER_STATE_RECONCILIATION) {
      expect(reconciliation.canonicalCoverage).not.toBe('')
      expect(reconciliation.mappings.length).toBeGreaterThan(0)
      const route = rows.find(candidate => candidate.route === reconciliation.route)!

      for (const mapping of reconciliation.mappings) {
        expect(mapping.rawOwnerState).not.toBe('')
        expect(mapping.normalizedStates.length).toBeGreaterThan(0)
        expect(mapping.rationale).not.toBe('')
        for (const state of mapping.normalizedStates) {
          const evidence = route.stateEvidence.find(candidate => candidate.state === state)
          expect(evidence, `${route.route} :: ${mapping.rawOwnerState} -> ${state}`).toBeDefined()
          if (evidence?.disposition === 'not-applicable' && mapping.source === 'owner-story') {
            expect(evidence.rationale).toContain(mapping.rawOwnerState)
            expect(evidence.declarationSource).toMatch(/not-applicable-[ab]\.ts$/)
            expect(evidence.declarationLine).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('binds canonical dashboard and tax owner states to exact executable scenarios', async () => {
    const rows = await routeEvidence()
    const executed = (route: string) =>
      Object.fromEntries(
        rows
          .find(row => row.route === route)!
          .stateEvidence.filter(evidence => evidence.disposition === 'executed')
          .map(evidence => [evidence.state, evidence.scenarioId])
      )

    expect(executed('/dashboard')).toMatchObject({
      refresh: 'does not blank the metrics grid for advertising-only refreshes',
      empty: 'renders the empty dashboard identity without a false processing state',
      stale: 'does not let stale available-weeks data blank other selected-period metrics',
      partial: 'keeps available current-period metrics visible while finance is transitioning',
    })
    expect(executed('/settings/tax')).toMatchObject({
      permission: 'presents a truthful read-only view for Analyst without mutation actions',
      pending: 'blocks every editable control and both actions while a save is pending',
    })
  })

  it('registers every dedicated route and SKU scenario in the immutable execution manifest', () => {
    const committed = JSON.parse(
      readFileSync('e2e/fixtures/story-174-3/execution-manifest.json', 'utf8')
    ) as Story1743ExecutionManifest

    for (const required of STORY_174_3_DEDICATED_ROUTE_SCENARIOS) {
      expect(
        committed.entries.find(
          entry => entry.source === required.source && entry.scenarioId === required.scenarioId
        ),
        `${required.source} :: ${required.scenarioId}`
      ).toMatchObject({ result: 'passed', runner: 'playwright', exitCode: 0 })
    }
  })

  it('locks authoritative route/state and executable-source counters to committed exports', async () => {
    const evidence = (await routeEvidence()).flatMap(row => row.stateEvidence)
    const executions = evidence.filter(row => row.disposition === 'executed')
    const executionSources = (kind: 'owner-unit-executable' | 'owner-browser-executable') =>
      new Set(
        executions.flatMap(row => [
          ...(row.kind === kind && row.source ? [row.source] : []),
          ...(row.supportingExecutions ?? [])
            .filter(supporting => supporting.kind === kind)
            .map(supporting => supporting.source),
        ])
      ).size

    expect({
      rows: evidence.length,
      executed: executions.length,
      notApplicable: evidence.filter(row => row.disposition === 'not-applicable').length,
      blocked: evidence.filter(row => row.disposition === 'blocked').length,
      storyRunnerDefaults: executions.filter(row => row.kind === 'story-runner').length,
      ownerUnitExecutions: executions.filter(row => row.kind === 'owner-unit-executable').length,
      ownerBrowserExecutions: executions.filter(row => row.kind === 'owner-browser-executable')
        .length,
      uniqueOwnerUnitSources: executionSources('owner-unit-executable'),
      uniqueOwnerBrowserSources: executionSources('owner-browser-executable'),
    }).toEqual({
      rows: 912,
      executed: 280,
      notApplicable: 632,
      blocked: 0,
      storyRunnerDefaults: 76,
      ownerUnitExecutions: 169,
      ownerBrowserExecutions: 35,
      uniqueOwnerUnitSources: 69,
      uniqueOwnerBrowserSources: 15,
    })
  })

  it('materializes exactly one disposition for every route and non-default state', async () => {
    const rows = await routeEvidence()
    const declarationLines = new Map<string, string[]>()
    const notApplicableStates = new Set<string>()

    expect(rows).toHaveLength(76)
    expect(Object.keys(STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES)).toHaveLength(76)

    for (const row of rows) {
      expect(row.stateEvidence).toHaveLength(STORY_174_3_STATES.length)
      expect(new Set(row.stateEvidence.map(evidence => evidence.state)).size).toBe(
        STORY_174_3_STATES.length
      )
      expect(row.stateEvidence.filter(evidence => evidence.disposition === 'blocked')).toEqual([])
      for (const evidence of row.stateEvidence.filter(
        candidate => candidate.disposition === 'not-applicable'
      )) {
        expect(evidence.rationale).toContain(row.route)
        const source = evidence.declarationSource!
        const lines = declarationLines.get(source) ?? readFileSync(source, 'utf8').split(/\r?\n/)
        declarationLines.set(source, lines)
        expect(lines[evidence.declarationLine! - 1]).toContain(`'${evidence.state}'`)
        expect(evidence.rationale.startsWith(row.route + ': ')).toBe(true)
        notApplicableStates.add(evidence.state)
      }
    }
    expect(notApplicableStates.size).toBe(NON_DEFAULT_STATES.length)
  })

  it('binds /login error evidence to the exact executable LoginForm scenario', async () => {
    const login = (await routeEvidence()).find(row => row.route === '/login')
    const error = login?.stateEvidence.find(evidence => evidence.state === 'error')

    expect(error).toMatchObject({
      disposition: 'executed',
      source: 'src/components/custom/LoginForm.test.tsx',
      scenarioId: 'has no automated accessibility violations in the request-error state',
      kind: 'owner-unit-executable',
      result: 'passed',
      runner: 'vitest',
      exitCode: 0,
    })
  })

  it('binds shipment states to semantically exact independent owner scenarios', async () => {
    const shipment = (await routeEvidence()).find(row => row.route === '/shipments')!
    const scenarios = Object.fromEntries(
      shipment.stateEvidence
        .filter(evidence => evidence.disposition === 'executed')
        .map(evidence => [evidence.state, evidence.scenarioId])
    )

    expect(scenarios).toMatchObject({
      loading: 'keeps route identity visible while the queue loads',
      refresh: 'passes background-refresh state to the populated queue',
      empty: 'renders the unfiltered empty state with packaging and permission context',
      'filtered-empty': 'routes filtered-empty data through the table state owner',
      error: 'renders a recoverable terminal route error',
      stale: 'preserves previously loaded rows when a background refresh fails',
      permission: 'does not expose create controls to a read-only analyst',
      pending: 'disables submit button during pending mutation',
    })
    expect(new Set(Object.values(scenarios)).size).toBe(Object.values(scenarios).length)
  })

  it('executes the known Monitor, Orders, Moysklad, and FBO route-owned states', async () => {
    const rows = await routeEvidence()
    const executedStates = (route: string) =>
      rows
        .find(row => row.route === route)!
        .stateEvidence.filter(evidence => evidence.disposition === 'executed')
        .map(evidence => evidence.state)

    expect(executedStates('/monitor')).toEqual(
      expect.arrayContaining(['default', 'loading', 'empty', 'error', 'stale', 'partial'])
    )
    expect(executedStates('/orders')).toEqual(
      expect.arrayContaining(['default', 'loading', 'empty', 'filtered-empty', 'error'])
    )
    expect(executedStates('/moysklad')).toEqual(
      expect.arrayContaining(['default', 'loading', 'empty', 'error'])
    )
    expect(executedStates('/orders/fbo')).toEqual(
      expect.arrayContaining(['default', 'loading', 'empty', 'filtered-empty', 'error', 'stale'])
    )
  })

  it('declares both independent Monitor submachines for loading and partial evidence', () => {
    const monitor = STORY_174_3_EXACT_STATE_SCENARIOS['/monitor']
    const loading = monitor.loading!
    const partial = monitor.partial!

    expect(loading.supportingScenarios?.map(evidence => evidence.scenarioId)).toEqual([
      'keeps summary content visible while the independent weekly chart is loading',
      'keeps summary content visible while independent pipeline health is loading',
    ])
    expect(partial.supportingScenarios?.map(evidence => evidence.scenarioId)).toEqual([
      'keeps summary content visible when independent pipeline health fails and retries it',
    ])
  })

  it('renders guarded onboarding routes under an explicit empty-session profile', async () => {
    const rows = await routeEvidence()
    const profiles = Object.fromEntries(rows.map(row => [row.route, row.sessionProfile]))

    expect(
      Object.entries(profiles)
        .filter(([, profile]) => profile === 'unauthenticated-onboarding')
        .map(([route]) => route)
        .sort()
    ).toEqual(['/cabinet', '/processing', '/wb-token'])
    expect(profiles['/dashboard']).toBe('authenticated')
  })

  it('fails closed when a state is missing, overlapping, duplicated, or unsupported', () => {
    expect(() =>
      validateStory1743ExplicitStateContract('/synthetic', {}, NON_DEFAULT_STATES.slice(1))
    ).toThrow('/synthetic/loading must have exactly one explicit disposition')

    expect(() =>
      validateStory1743ExplicitStateContract(
        '/synthetic',
        { loading: scenario },
        NON_DEFAULT_STATES
      )
    ).toThrow('/synthetic/loading must have exactly one explicit disposition')

    expect(() =>
      validateStory1743ExplicitStateContract('/synthetic', {}, [...NON_DEFAULT_STATES, 'loading'])
    ).toThrow('/synthetic has duplicate explicit not-applicable state declarations')

    expect(() =>
      validateStory1743ExplicitStateContract('/synthetic', {}, [
        ...NON_DEFAULT_STATES,
        'unsupported' as (typeof NON_DEFAULT_STATES)[number],
      ])
    ).toThrow('/synthetic declares unsupported Story 174.3 state: unsupported')
  })

  it('fails closed for missing, stale, failed, skipped, or duplicate runner evidence', () => {
    expect(() =>
      indexStory1743ExecutionManifest({ ...manifest(), entries: [] }, [REQUIRED_EXECUTION])
    ).toThrow('missing execution result')

    expect(() =>
      indexStory1743ExecutionManifest(manifest({ sourceSha256: 'stale-sha' }), [REQUIRED_EXECUTION])
    ).toThrow('stale source hash')

    expect(() =>
      indexStory1743ExecutionManifest(manifest({ result: 'failed', exitCode: 1 }), [
        REQUIRED_EXECUTION,
      ])
    ).toThrow('did not pass')

    expect(() =>
      indexStory1743ExecutionManifest(manifest({ result: 'skipped' }), [REQUIRED_EXECUTION])
    ).toThrow('did not pass')

    const duplicate = manifest().entries[0]
    expect(() =>
      indexStory1743ExecutionManifest(manifest({}, [duplicate]), [REQUIRED_EXECUTION])
    ).toThrow('duplicate execution result')
  })

  it('rejects runner and scenario substitutions even when the source passed', () => {
    expect(() =>
      indexStory1743ExecutionManifest(manifest({ runner: 'playwright' }), [REQUIRED_EXECUTION])
    ).toThrow('runner mismatch')

    expect(() =>
      indexStory1743ExecutionManifest(manifest({ scenarioId: 'different scenario' }), [
        REQUIRED_EXECUTION,
      ])
    ).toThrow('missing execution result')
  })
})
