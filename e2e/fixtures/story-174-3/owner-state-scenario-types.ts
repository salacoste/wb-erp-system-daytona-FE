import type { Story1743State } from './route-contracts'

export type Story1743OwnerScenarioReference = {
  source: string
  scenarioId: string
  runner?: 'vitest' | 'playwright'
  supportingScenarios?: readonly Story1743OwnerScenarioReference[]
}

export type Story1743OwnerVariantScenario = {
  route: string
  rawOwnerState: string
  normalizedState: Story1743State
  evidence: Story1743OwnerScenarioReference
}

export type Story1743RouteStateScenarioMap = Readonly<
  Record<
    string,
    Partial<Record<Exclude<Story1743State, 'default'>, Story1743OwnerScenarioReference>>
  >
>

export const exact = (
  source: string,
  scenarioId: string,
  supportingScenarios: readonly Story1743OwnerScenarioReference[] = []
): Story1743OwnerScenarioReference => ({
  source,
  scenarioId,
  ...(supportingScenarios.length > 0 ? { supportingScenarios } : {}),
})

export const owner = (
  source: string,
  scenarioId: string,
  runner?: 'vitest' | 'playwright',
  supportingScenarios: readonly Story1743OwnerScenarioReference[] = []
): Story1743OwnerScenarioReference => ({
  source,
  scenarioId,
  ...(runner ? { runner } : {}),
  ...(supportingScenarios.length > 0 ? { supportingScenarios } : {}),
})

export const variant = (
  route: string,
  rawOwnerState: string,
  normalizedState: Story1743State,
  evidence: Story1743OwnerScenarioReference
): Story1743OwnerVariantScenario => ({ route, rawOwnerState, normalizedState, evidence })
