import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  indexStory1743ExecutionManifest,
  type Story1743ExecutionManifest,
  type Story1743RequiredExecution,
} from '../../e2e/fixtures/story-174-3/execution-manifest'
import { STORY_174_3_DEDICATED_ROUTE_SCENARIOS } from '../../e2e/fixtures/story-174-3/dedicated-route-scenarios'
import { STORY_174_3_STATES } from '../../e2e/fixtures/story-174-3/route-contracts'
import {
  normalizeStory1743OwnerClause,
  STORY_174_3_OWNER_STATE_RECONCILIATION,
} from '../../e2e/fixtures/story-174-3/owner-state-reconciliation'
import { findStory1743OwnerVariantScenario } from '../../e2e/fixtures/story-174-3/owner-state-scenarios'
import {
  findStory1743OwnerStateException,
  requireStory1743OwnerStateException,
  STORY_174_3_OWNER_STATE_EXCEPTIONS,
} from '../../e2e/fixtures/story-174-3/owner-state-exceptions'
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
  it('fails closed for an unknown owner label and for a missing or incomplete typed exception', () => {
    expect(() =>
      normalizeStory1743OwnerClause('/synthetic', '174.3', 'invented owner-only transition')
    ).toThrow(
      'Unknown owner State Coverage clause for /synthetic (Story 174.3): invented owner-only transition'
    )

    expect(findStory1743OwnerStateException('/register', 'network', 'error')).toBeUndefined()
    expect(() => requireStory1743OwnerStateException('/register', 'network', 'error')).toThrow(
      '/register/error is required by owner clause [network]'
    )
  })

  it('requires exact evidence or an independently typed exception for every normalized owner state', () => {
    const ownerMappings = STORY_174_3_OWNER_STATE_RECONCILIATION.flatMap(reconciliation =>
      reconciliation.mappings
        .filter(mapping => mapping.source === 'owner-story')
        .map(mapping => ({ reconciliation, mapping }))
    )
    const requirements = ownerMappings.flatMap(({ reconciliation, mapping }) =>
      mapping.normalizedStates.map(state => ({ reconciliation, mapping, state }))
    )
    const rawOwnerLabelsByRouteState = new Map<string, Set<string>>()
    for (const { reconciliation, mapping, state } of requirements) {
      const key = `${reconciliation.route}::${state}`
      const labels = rawOwnerLabelsByRouteState.get(key) ?? new Set<string>()
      labels.add(mapping.rawOwnerState)
      rawOwnerLabelsByRouteState.set(key, labels)
    }
    const exactBindings = requirements.filter(
      ({ reconciliation, mapping, state }) =>
        (state === 'default' && mapping.rawOwnerState === 'default') ||
        findStory1743OwnerVariantScenario(
          reconciliation.route,
          mapping.rawOwnerState,
          state
        ) ||
        (state !== 'default' &&
          rawOwnerLabelsByRouteState.get(`${reconciliation.route}::${state}`)?.size === 1 &&
          STORY_174_3_EXACT_STATE_SCENARIOS[reconciliation.route]?.[state])
    )
    const typedExceptions = requirements.filter(({ reconciliation, mapping, state }) =>
      findStory1743OwnerStateException(reconciliation.route, mapping.rawOwnerState, state)
    )
    const unresolved = requirements
      .filter(requirement => !exactBindings.includes(requirement))
      .filter(requirement => !typedExceptions.includes(requirement))
      .map(
        ({ reconciliation, mapping, state }) =>
          reconciliation.route + ' :: ' + mapping.rawOwnerState + ' -> ' + state
      )

    expect({
      ownerClauses: ownerMappings.length,
      ownerRequirements: requirements.length,
      exactBindings: exactBindings.length,
      typedExceptions: typedExceptions.length,
      unresolved: unresolved.length,
      unresolvedRequirements: unresolved,
    }).toMatchObject({ unresolved: 0, unresolvedRequirements: [] })
  })

  it('keeps typed owner-state exceptions exact, non-overlapping, and independently cited', () => {
    const exceptionKeys = STORY_174_3_OWNER_STATE_EXCEPTIONS.map(
      exception =>
        exception.route + '::' + exception.rawOwnerState + '::' + exception.normalizedState
    )
    expect(new Set(exceptionKeys).size).toBe(exceptionKeys.length)

    for (const exception of STORY_174_3_OWNER_STATE_EXCEPTIONS) {
      const ownerMapping = STORY_174_3_OWNER_STATE_RECONCILIATION.find(
        reconciliation => reconciliation.route === exception.route
      )?.mappings.find(
        mapping =>
          mapping.source === 'owner-story' &&
          mapping.rawOwnerState === exception.rawOwnerState &&
          mapping.normalizedStates.includes(exception.normalizedState)
      )
      expect(
        ownerMapping,
        `${exception.route} :: ${exception.rawOwnerState} -> ${exception.normalizedState}`
      ).toBeDefined()
      expect(exception.reason).toContain(exception.route)
      expect(exception.reason).toContain(`[${exception.rawOwnerState}]`)
      expect(exception.canonicalOwnerDecision).toContain(exception.route)
      expect(exception.canonicalOwnerDecision).toContain(`[${exception.rawOwnerState}]`)
      expect(exception.source).toMatch(/^(src|docs)\//)
      expect(exception.source).not.toContain('..')
      expect(exception.sourceAssertion.trim()).not.toBe('')
      expect(readFileSync(exception.source, 'utf8')).toContain(exception.sourceAssertion)

      const exactRouteState =
        exception.normalizedState !== 'default' &&
        STORY_174_3_EXACT_STATE_SCENARIOS[exception.route]?.[exception.normalizedState]
      const rawOwnerLabelsForState =
        STORY_174_3_OWNER_STATE_RECONCILIATION.find(
          reconciliation => reconciliation.route === exception.route
        )?.mappings.filter(
          mapping =>
            mapping.source === 'owner-story' &&
            mapping.normalizedStates.includes(exception.normalizedState)
        ) ?? []
      const exactOwnerVariant = findStory1743OwnerVariantScenario(
        exception.route,
        exception.rawOwnerState,
        exception.normalizedState
      )
      if (rawOwnerLabelsForState.length === 1) {
        expect(exactRouteState).toBeFalsy()
      }
      expect(exactOwnerVariant).toBeUndefined()
    }

    expect(
      STORY_174_3_OWNER_STATE_EXCEPTIONS.filter(exception => exception.route === '/register')
    ).toEqual([])
    expect(
      STORY_174_3_OWNER_STATE_EXCEPTIONS.filter(
        exception => exception.route === '/automation/canned-rules'
      )
    ).toEqual([])
  })

  it('binds register and canned-rules owner clauses to exact executable titles', () => {
    const ownerStates = (route: string, rawOwnerState: string) =>
      STORY_174_3_OWNER_STATE_RECONCILIATION.find(row => row.route === route)!.mappings.find(
        mapping => mapping.source === 'owner-story' && mapping.rawOwnerState === rawOwnerState
      )!.normalizedStates

    expect(ownerStates('/register', 'network')).toEqual(['error'])
    expect(ownerStates('/register', 'submitting')).toEqual(['pending'])
    expect(ownerStates('/automation/canned-rules', 'loading')).toEqual(['loading'])
    expect(ownerStates('/automation/canned-rules', 'no rules')).toEqual(['empty'])
    expect(ownerStates('/automation/canned-rules', 'restricted')).toEqual(['permission'])
    expect(ownerStates('/automation/canned-rules', 'unavailable rule')).toEqual(['permission'])
    expect(ownerStates('/automation/canned-rules', 'install pending')).toEqual(['pending'])
    expect(ownerStates('/automation/canned-rules', 'success')).toEqual(['partial-success'])
    expect(ownerStates('/automation/canned-rules', 'error')).toEqual(['error'])
    expect(STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES['/register']).not.toEqual(
      expect.arrayContaining(['error', 'pending', 'partial-success'])
    )
    expect(STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES['/automation/canned-rules']).not.toEqual(
      expect.arrayContaining([
        'loading',
        'empty',
        'error',
        'permission',
        'pending',
        'partial-success',
      ])
    )

    expect(STORY_174_3_EXACT_STATE_SCENARIOS['/register']).toMatchObject({
      error: {
        scenarioId:
          '[Review 3 finding M-1] keeps password-like hostile 5xx detail in generic service recovery',
      },
      pending: {
        scenarioId: '[REG-FORM-03] disables every primary control with truthful pending semantics',
      },
      'partial-success': {
        scenarioId:
          '[REG-FORM-06] preserves success toast, exactly one login navigation, and no auth/session write',
      },
    })
    expect(STORY_174_3_EXACT_STATE_SCENARIOS['/automation/canned-rules']).toMatchObject({
      loading: {
        scenarioId: 'AC1: loads the gallery grouped by category with trigger→action summaries',
      },
      empty: { scenarioId: 'AC3: no-rules state renders the empty marker' },
      error: {
        scenarioId: 'AC4: gallery error renders the destructive alert with a Button retry',
      },
      permission: {
        scenarioId: 'AC2: restricted price template carries the destructive arm write-back badge',
      },
      pending: {
        scenarioId:
          'AC5/AC6: install pending → success shows the post-install deep-link; wire contract kept',
      },
      'partial-success': {
        scenarioId:
          'AC5/AC6: install pending → success shows the post-install deep-link; wire contract kept',
      },
    })
  })

  it('normalizes form submission, valid zero values, and optional dynamic parameters truthfully', () => {
    expect(normalizeStory1743OwnerClause('/analytics/storage', '169.12', 'submission')).toEqual([
      'pending',
    ])
    expect(
      normalizeStory1743OwnerClause(
        '/analytics/forecast-accuracy',
        '171.5',
        'valid zero error'
      )
    ).toEqual(['default'])
    expect(
      normalizeStory1743OwnerClause(
        '/analytics/models/[id]/evaluations/sku-accuracy',
        '171.8',
        'missing'
      )
    ).toEqual(['default'])
    expect(
      normalizeStory1743OwnerClause(
        '/analytics/models/[id]/evaluations/sku-accuracy',
        '171.8',
        'invalid evaluation parameter'
      )
    ).toEqual(['error'])
    expect(
      normalizeStory1743OwnerClause(
        '/analytics/advertising/campaigns/[advertId]',
        '170.2',
        'absent'
      )
    ).toEqual(['default'])
    expect(
      normalizeStory1743OwnerClause(
        '/analytics/advertising/campaigns/[advertId]',
        '170.2',
        'invalid nmId'
      )
    ).toEqual(['error'])
    expect(
      normalizeStory1743OwnerClause('/analytics/dashboard', '167.3', 'token')
    ).toEqual(['permission'])
    expect(
      normalizeStory1743OwnerClause('/analytics/acquiring/period', '169.2', 'missing period')
    ).toEqual(['error'])
    expect(
      normalizeStory1743OwnerClause(
        '/analytics/acquiring/reports/[id]',
        '169.3',
        'invalid ID'
      )
    ).toEqual(['not-found'])
  })

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
      executed: 444,
      notApplicable: 468,
      blocked: 0,
      storyRunnerDefaults: 76,
      ownerUnitExecutions: 318,
      ownerBrowserExecutions: 50,
      uniqueOwnerUnitSources: 154,
      uniqueOwnerBrowserSources: 21,
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
