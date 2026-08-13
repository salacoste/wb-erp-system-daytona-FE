import { describe, expect, it } from 'vitest'

import type { AsyncOperationPhase, ContextualDetailState, PageStateKind } from '../contracts'

describe('state composition contracts', () => {
  it('keeps the canonical state vocabularies explicit', () => {
    const pageStates = {
      loading: true,
      refreshing: true,
      empty: true,
      'filtered-empty': true,
      error: true,
      offline: true,
      stale: true,
      partial: true,
      restricted: true,
      'not-found': true,
      processing: true,
      success: true,
    } satisfies Record<PageStateKind, true>
    const phases = {
      idle: true,
      validating: true,
      queued: true,
      running: true,
      cancellable: true,
      'non-cancellable': true,
      partial: true,
      complete: true,
      failed: true,
      retrying: true,
      expired: true,
    } satisfies Record<AsyncOperationPhase, true>
    const detailStates = {
      'no-selection': true,
      'loading-detail': true,
      selected: true,
      'detail-error': true,
      'stale-detail': true,
      'restricted-detail': true,
    } satisfies Record<ContextualDetailState, true>

    expect(Object.keys(pageStates)).toHaveLength(12)
    expect(Object.keys(phases)).toHaveLength(11)
    expect(Object.keys(detailStates)).toHaveLength(6)
  })
})
