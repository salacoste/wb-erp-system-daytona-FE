import type { Story1743State } from './route-contracts'
import { STORY_174_3_OWNER_STATE_EXCEPTIONS_A } from './owner-state-exceptions-a'
import { STORY_174_3_OWNER_STATE_EXCEPTIONS_B } from './owner-state-exceptions-b'
import { STORY_174_3_OWNER_STATE_EXCEPTIONS_C } from './owner-state-exceptions-c'

export type Story1743OwnerStateException = {
  route: string
  rawOwnerState: string
  normalizedState: Story1743State
  reason: string
  canonicalOwnerDecision: string
  source: string
  sourceAssertion: string
}

/**
 * A canonical owner requirement may resolve to N/A only through an exact,
 * manually authored route/raw/state decision. Generated N/A prose is never
 * authority and cannot populate this registry.
 */
export const STORY_174_3_OWNER_STATE_EXCEPTIONS: readonly Story1743OwnerStateException[] = [
  ...STORY_174_3_OWNER_STATE_EXCEPTIONS_A,
  ...STORY_174_3_OWNER_STATE_EXCEPTIONS_B,
  ...STORY_174_3_OWNER_STATE_EXCEPTIONS_C,
]

export function findStory1743OwnerStateException(
  route: string,
  rawOwnerState: string,
  normalizedState: Story1743State
): Story1743OwnerStateException | undefined {
  return STORY_174_3_OWNER_STATE_EXCEPTIONS.find(
    exception =>
      exception.route === route &&
      exception.rawOwnerState === rawOwnerState &&
      exception.normalizedState === normalizedState
  )
}

export function requireStory1743OwnerStateException(
  route: string,
  rawOwnerState: string,
  normalizedState: Story1743State
): Story1743OwnerStateException {
  const exception = findStory1743OwnerStateException(route, rawOwnerState, normalizedState)
  if (!exception) {
    throw new Error(
      route +
        '/' +
        normalizedState +
        ' is required by owner clause [' +
        rawOwnerState +
        '] and must have exact executable evidence or a typed owner-state exception'
    )
  }
  if (
    !exception.reason.trim() ||
    !exception.canonicalOwnerDecision.trim() ||
    !exception.sourceAssertion.trim()
  ) {
    throw new Error(
      route + '/' + normalizedState + ' has an incomplete typed owner-state exception'
    )
  }
  if (!exception.source.startsWith('src/') && !exception.source.startsWith('docs/')) {
    throw new Error(
      route +
        '/' +
        normalizedState +
        ' owner-state exception must cite an independent src/** or docs/** source'
    )
  }
  return exception
}
