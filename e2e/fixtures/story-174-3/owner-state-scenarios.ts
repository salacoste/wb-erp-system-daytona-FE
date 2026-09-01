import {
  STORY_174_3_OWNER_VARIANT_SCENARIOS_A,
  STORY_174_3_ROUTE_STATE_SCENARIOS_A,
} from './owner-state-evidence-a'
import {
  STORY_174_3_OWNER_VARIANT_SCENARIOS_B,
  STORY_174_3_ROUTE_STATE_SCENARIOS_B,
} from './owner-state-evidence-b'
import {
  STORY_174_3_OWNER_VARIANT_SCENARIOS_C,
  STORY_174_3_ROUTE_STATE_SCENARIOS_C,
} from './owner-state-evidence-c'
import type {
  Story1743OwnerVariantScenario,
  Story1743RouteStateScenarioMap,
} from './owner-state-scenario-types'

const mergeRouteStateScenarios = (
  ...sources: readonly Story1743RouteStateScenarioMap[]
): Story1743RouteStateScenarioMap => {
  const merged: Record<string, Record<string, unknown>> = {}
  for (const source of sources) {
    for (const [route, declarations] of Object.entries(source)) {
      const target = (merged[route] ??= {})
      for (const [state, declaration] of Object.entries(declarations)) {
        if (Object.hasOwn(target, state)) {
          throw new Error('Duplicate Story 174.3 owner route/state scenario: ' + route + '/' + state)
        }
        target[state] = declaration
      }
    }
  }
  return merged as Story1743RouteStateScenarioMap
}

export const STORY_174_3_OWNER_ROUTE_STATE_SCENARIOS = mergeRouteStateScenarios(
  STORY_174_3_ROUTE_STATE_SCENARIOS_A,
  STORY_174_3_ROUTE_STATE_SCENARIOS_B,
  STORY_174_3_ROUTE_STATE_SCENARIOS_C
)

export const STORY_174_3_OWNER_VARIANT_SCENARIOS: readonly Story1743OwnerVariantScenario[] = [
  ...STORY_174_3_OWNER_VARIANT_SCENARIOS_A,
  ...STORY_174_3_OWNER_VARIANT_SCENARIOS_B,
  ...STORY_174_3_OWNER_VARIANT_SCENARIOS_C,
]

export function findStory1743OwnerVariantScenario(
  route: string,
  rawOwnerState: string,
  normalizedState: Story1743OwnerVariantScenario['normalizedState']
): Story1743OwnerVariantScenario | undefined {
  return STORY_174_3_OWNER_VARIANT_SCENARIOS.find(
    scenario =>
      scenario.route === route &&
      scenario.rawOwnerState === rawOwnerState &&
      scenario.normalizedState === normalizedState
  )
}
