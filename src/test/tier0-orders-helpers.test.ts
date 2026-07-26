import { describe, expect, it, vi } from 'vitest'
import {
  countsValue,
  fixtures,
  matchesOrdersResponse,
  textValue,
} from '../../e2e/fixtures/tier0-orders'
import {
  mutationCleanupBinding,
  selectMutationCleanupId,
  shouldIncludeTier0MutationProject,
} from '../../e2e/fixtures/tier0-mutation'
import { enforceTier0WebSocket } from '../../e2e/fixtures/tier0-runtime'

describe('Tier-0 orders fixtures', () => {
  it('accepts only non-empty text and numeric count maps', () => {
    expect(textValue('cabinet-a')).toBe('cabinet-a')
    expect(textValue('')).toBeUndefined()
    expect(countsValue({ duplicates: 2, orphans: 0 })).toEqual({ duplicates: 2, orphans: 0 })
    expect(countsValue({ duplicates: '2' })).toBeUndefined()
    expect(fixtures(null)).toEqual({})
  })

  it('matches an exact endpoint and cabinet query parameter', () => {
    const response = {
      url: () => 'https://sandbox.example/v1/orders/reconciliation?cabinet_id=cabinet-a',
    }

    expect(
      matchesOrdersResponse(
        response,
        ['/health/orders-integrity', '/v1/orders/reconciliation'],
        ['https://sandbox.example'],
        'cabinet-a'
      )
    ).toBe(true)
    expect(
      matchesOrdersResponse(
        response,
        '/v1/orders/reconciliation',
        ['https://sandbox.example'],
        'cabinet-b'
      )
    ).toBe(false)
    expect(
      matchesOrdersResponse(
        response,
        '/health/orders-integrity',
        ['https://sandbox.example'],
        'cabinet-a'
      )
    ).toBe(false)
  })
})

describe('Tier-0 mutation cleanup selection', () => {
  it('arms a fallback only when the create payload binds the signed test-owned ID', () => {
    expect(
      mutationCleanupBinding('signed-id', 'id', { id: 'signed-id', owner_marker: 'owner' })
    ).toBe('signed-id')
    expect(() => mutationCleanupBinding('signed-id', 'id', { id: 'other-id' })).toThrow(
      'signed mutation record ID'
    )
  })

  it('never changes the signed cleanup target and fails on response mismatch', () => {
    expect(selectMutationCleanupId('signed-id', 'signed-id', 'owner', 'owner')).toBe('signed-id')
    expect(() => selectMutationCleanupId('signed-id', 'returned-id', 'owner', 'owner')).toThrow(
      'signed cleanup target'
    )
    expect(() => selectMutationCleanupId('signed-id', 'signed-id', 'other', 'owner')).toThrow(
      'signed owner marker'
    )
  })

  it('does not include RT-E14 for permissive legacy truthy flags or absent capabilities', () => {
    const exact = {
      E2E_ENABLE_MUTATIONS: 'true',
      E2E_MUTATION_TARGET: 'sandbox',
      E2E_MUTATION_ACK: 'I_UNDERSTAND_THIS_MUTATES_TEST_DATA',
      E2E_TEST_EMAIL: 'user@example.test',
      E2E_TEST_PASSWORD: 'user-secret',
    }
    const receipt = { capabilities: { P_MUTATION: true, P_CLEANUP: true } }
    const descriptor = {
      fixtures: {
        mutation_record_id: 'signed-id',
        cleanup_control_id: 'cleanup-v1',
        mutation: {
          create_url: 'https://sandbox.example/records',
          create_method: 'POST',
          create_id_field: 'id',
          create_body: { id: 'signed-id', owner_marker: 'owner' },
          response_id_field: 'id',
          response_id_header: 'x-tier0-created-id',
          response_owner_header: 'x-tier0-owner-marker',
          owner_marker: 'owner',
          observe_path: '/records/signed-id',
          observe_text: 'signed-id owner',
          cleanup_url_template: 'https://sandbox.example/records/{id}',
          cleanup_method: 'DELETE',
        },
      },
      backendAllowlist: ['https://sandbox.example'],
      frontendOrigin: 'http://127.0.0.1:3100',
      frontendAllowlist: ['http://127.0.0.1:3100'],
    }
    expect(shouldIncludeTier0MutationProject(exact, receipt, descriptor)).toBe(true)
    expect(() =>
      shouldIncludeTier0MutationProject(
        { ...exact, E2E_ENABLE_MUTATIONS: '1' },
        receipt,
        descriptor
      )
    ).toThrow('receipt mutation capabilities differ')
    expect(
      shouldIncludeTier0MutationProject(
        { ...exact, E2E_ENABLE_MUTATIONS: '1' },
        { capabilities: { P_MUTATION: false, P_CLEANUP: true } },
        descriptor
      )
    ).toBe(false)
  })
})

describe('Tier-0 WebSocket egress enforcement', () => {
  it('blocks a non-allowlisted socket before connecting and forwards an allowlisted socket', async () => {
    const failures: string[] = []
    const blocked = {
      url: () => 'wss://evil.invalid/live',
      close: vi.fn().mockResolvedValue(undefined),
      connectToServer: vi.fn(),
    }
    await enforceTier0WebSocket(blocked, ['https://sandbox.example'], failures)
    expect(blocked.close).toHaveBeenCalledWith({ code: 1008, reason: 'Tier-0 origin denied' })
    expect(blocked.connectToServer).not.toHaveBeenCalled()
    expect(failures).toEqual(['non-allowlisted-websocket:https://evil.invalid'])

    const allowed = {
      url: () => 'wss://sandbox.example/live',
      close: vi.fn().mockResolvedValue(undefined),
      connectToServer: vi.fn(),
    }
    await enforceTier0WebSocket(allowed, ['https://sandbox.example'], failures)
    expect(allowed.connectToServer).toHaveBeenCalledOnce()
    expect(allowed.close).not.toHaveBeenCalled()
  })
})
