import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES,
  STORY_174_3_ROUTE_EVIDENCE,
  STORY_174_3_STATES,
  validateStory1743ExplicitStateContract,
  type Story1743ExactStateScenario,
} from '../../e2e/fixtures/story-174-3-visual-accessibility'

const NON_DEFAULT_STATES = STORY_174_3_STATES.filter(state => state !== 'default')
const scenario: Story1743ExactStateScenario = {
  source: 'src/components/custom/LoginForm.test.tsx',
  scenarioId: 'has no automated accessibility violations in the request-error state',
}

describe('Story 174.3 explicit route/state contract', () => {
  it('materializes exactly one disposition for every route and non-default state', () => {
    const fixtureLines = readFileSync(
      'e2e/fixtures/story-174-3-visual-accessibility.ts',
      'utf8'
    ).split(/\r?\n/)
    const rationaleByState = new Map<string, string>()

    expect(STORY_174_3_ROUTE_EVIDENCE).toHaveLength(76)
    expect(Object.keys(STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES)).toHaveLength(76)

    for (const row of STORY_174_3_ROUTE_EVIDENCE) {
      expect(row.stateEvidence).toHaveLength(STORY_174_3_STATES.length)
      expect(new Set(row.stateEvidence.map(evidence => evidence.state)).size).toBe(
        STORY_174_3_STATES.length
      )
      expect(row.stateEvidence.filter(evidence => evidence.disposition === 'blocked')).toEqual([])
      for (const evidence of row.stateEvidence.filter(
        candidate => candidate.disposition === 'not-applicable'
      )) {
        expect(evidence.rationale).toContain(row.route)
        expect(fixtureLines[evidence.declarationLine! - 1]).toContain(`'${evidence.state}'`)
        const stateRationale = evidence.rationale.slice(row.route.length)
        expect(rationaleByState.get(evidence.state) ?? stateRationale).toBe(stateRationale)
        rationaleByState.set(evidence.state, stateRationale)
      }
    }
    expect(new Set(rationaleByState.values()).size).toBe(NON_DEFAULT_STATES.length)
  })

  it('binds /login error evidence to the exact executable LoginForm scenario', () => {
    const login = STORY_174_3_ROUTE_EVIDENCE.find(row => row.route === '/login')
    const error = login?.stateEvidence.find(evidence => evidence.state === 'error')

    expect(error).toMatchObject({
      disposition: 'executed',
      source: 'src/components/custom/LoginForm.test.tsx',
      scenarioId: 'has no automated accessibility violations in the request-error state',
      kind: 'owner-unit-executable',
      result: 'passed',
    })
  })

  it('renders guarded onboarding routes under an explicit empty-session profile', () => {
    const profiles = Object.fromEntries(
      STORY_174_3_ROUTE_EVIDENCE.map(row => [row.route, row.sessionProfile])
    )

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
})
