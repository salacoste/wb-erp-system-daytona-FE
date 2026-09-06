/**
 * Story 167.9: account-scoped conditional cabinet settlement — behavioral tests.
 * Uses the REAL authStore (with sessionNonce) so session switches (login/logout)
 * are exercised honestly; only the network layer (createCabinet) and the
 * follow-up tax-settings call are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleCreateCabinet, evaluateCabinetSettlement } from './cabinets.service'
import { createCabinet } from '@/lib/api'
import { updateCabinetTaxSettings } from '@/lib/api/cabinet'
import { useAuthStore } from '@/stores/authStore'
import { STORAGE_KEY } from '@/stores/authStoreHelpers'
import { logger } from '@/lib/logger'

vi.mock('@/lib/api', () => ({
  createCabinet: vi.fn(),
}))

vi.mock('@/lib/api/cabinet', () => ({
  updateCabinetTaxSettings: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const userA = {
  id: 'user-a',
  email: 'a@example.com',
  role: 'Owner' as const,
  cabinet_ids: [],
}
const userB = {
  id: 'user-b',
  email: 'b@example.com',
  role: 'Owner' as const,
  cabinet_ids: [],
}

const createSuccess = {
  id: 'cabinet-a',
  name: 'A Cabinet',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  newToken: 'new-jwt-for-a',
  operationId: '11111111-1111-4111-8111-111111111111',
  status: 'succeeded' as const,
}

/** Full Cabinet shape returned by the follow-up tax-settings PUT. */
const updatedTaxSettings = {
  ...createSuccess,
  taxSystem: null,
  taxRate: null,
  vatPayer: false,
  vatRate: null,
  targetMarginPct: 20,
}

/** Deferred that lets the test switch sessions while the create is in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.clearAllMocks()
  // FE-D5: the cross-tab create claim lives in localStorage — clear it between
  // tests so a tombstone from a prior uncertain test cannot fail-close the next.
  window.localStorage.clear()
  useAuthStore.setState({
    user: null,
    token: null,
    cabinetId: null,
    isAuthenticated: false,
    sessionNonce: null,
  })
  useAuthStore.getState().login(userA, 'jwt-a')
})

afterEach(() => {
  useAuthStore.getState().logout()
})

describe('handleCreateCabinet conditional settlement (Story 167.9)', () => {
  it('A→B switch during await: stale success must NOT commit A token/cabinet into B', async () => {
    const pending = deferred<typeof createSuccess>()
    vi.mocked(createCabinet).mockReturnValue(pending.promise)

    const resultPromise = handleCreateCabinet('A Cabinet', 20)
    // Account switch A→B while the create is in flight
    useAuthStore.getState().login(userB, 'jwt-b')
    pending.resolve(createSuccess)

    const result = await resultPromise

    expect(result.status).toBe('stale')
    // B's live state is untouched: no A token, no A cabinet id
    const live = useAuthStore.getState()
    expect(live.token).toBe('jwt-b')
    expect(live.user?.id).toBe('user-b')
    expect(live.cabinetId).not.toBe('cabinet-a')
    expect(updateCabinetTaxSettings).not.toHaveBeenCalled()
  })

  it('A→B→A re-login: the NEW A session is a different session — settlement is stale', async () => {
    const pending = deferred<typeof createSuccess>()
    vi.mocked(createCabinet).mockReturnValue(pending.promise)

    const resultPromise = handleCreateCabinet('A Cabinet', 20)
    useAuthStore.getState().logout()
    useAuthStore.getState().login(userB, 'jwt-b')
    useAuthStore.getState().logout()
    useAuthStore.getState().login(userA, 'jwt-a-new-login')
    pending.resolve(createSuccess)

    const result = await resultPromise

    // Same account id, but a different login session (fresh sessionNonce)
    expect(result.status).toBe('stale')
    expect(useAuthStore.getState().token).toBe('jwt-a-new-login')
    expect(useAuthStore.getState().cabinetId).not.toBe('cabinet-a')
  })

  it('logout during await: stale, no commit, no throw', async () => {
    const pending = deferred<typeof createSuccess>()
    vi.mocked(createCabinet).mockReturnValue(pending.promise)

    const resultPromise = handleCreateCabinet('A Cabinet', 20)
    useAuthStore.getState().logout()
    pending.resolve(createSuccess)

    await expect(resultPromise).resolves.toMatchObject({ status: 'stale' })
    expect(useAuthStore.getState().token).toBeNull()
    expect(updateCabinetTaxSettings).not.toHaveBeenCalled()
  })

  it('stale FAILURE produces no error (resolves stale instead of throwing)', async () => {
    const pending = deferred<typeof createSuccess>()
    vi.mocked(createCabinet).mockReturnValue(pending.promise)

    const resultPromise = handleCreateCabinet('A Cabinet', 20)
    useAuthStore.getState().login(userB, 'jwt-b')
    pending.reject(new Error('Network failure'))

    await expect(resultPromise).resolves.toMatchObject({ status: 'stale' })
  })

  it('legacy nonce-less session mints a nonce at initiation and settles applied (D-1/PB-1)', async () => {
    // Simulate a legacy persisted session: authenticated but nonce missing.
    // D-1 (PB-1): the initiation mint gives the create a session identity, so
    // the server-side-created cabinet is COMMITTED instead of silently dropped.
    useAuthStore.setState({ sessionNonce: null })
    vi.mocked(createCabinet).mockResolvedValue(createSuccess)
    vi.mocked(updateCabinetTaxSettings).mockResolvedValue(updatedTaxSettings)

    const result = await handleCreateCabinet('A Cabinet', 20)

    expect(result.status).toBe('applied')
    expect(useAuthStore.getState().token).toBe('new-jwt-for-a') // committed
    expect(useAuthStore.getState().cabinetId).toBe('cabinet-a')
    expect(updateCabinetTaxSettings).toHaveBeenCalledTimes(1)
  })

  it('live failure in the same session still throws for error UI', async () => {
    vi.mocked(createCabinet).mockRejectedValueOnce(new Error('Cabinet creation failed'))

    await expect(handleCreateCabinet('A Cabinet', 20)).rejects.toThrow('Cabinet creation failed')
  })

  it('stale settlement logs quietly without secrets (privacy)', async () => {
    const pending = deferred<typeof createSuccess>()
    vi.mocked(createCabinet).mockReturnValue(pending.promise)

    const resultPromise = handleCreateCabinet('A Cabinet', 20)
    useAuthStore.getState().login(userB, 'jwt-b')
    pending.resolve(createSuccess)
    await resultPromise

    expect(logger.warn).toHaveBeenCalled()
    for (const call of vi.mocked(logger.warn).mock.calls) {
      const serialized = JSON.stringify(call)
      expect(serialized).not.toContain('new-jwt-for-a')
      expect(serialized).not.toContain('jwt-a')
      expect(serialized).not.toContain('jwt-b')
      expect(serialized).not.toContain('a@example.com')
      expect(serialized).not.toContain('b@example.com')
      expect(serialized).not.toContain('A Cabinet')
    }
  })

  describe('follow-up margin PUT settlement guard (review fix HIGH-1)', () => {
    it('A→B switch between commit and margin call: no throw, pinned transport, quiet swallow', async () => {
      vi.mocked(createCabinet).mockResolvedValue(createSuccess)
      // The margin await is the switch point: B logs in mid-flight, then the PUT fails.
      vi.mocked(updateCabinetTaxSettings).mockImplementationOnce(async () => {
        useAuthStore.getState().login(userB, 'jwt-b')
        throw new Error('403 Forbidden')
      })

      // B must see neither a rejection nor an error toast for A's work
      const result = await handleCreateCabinet('A Cabinet', 20)

      expect(result.status).toBe('stale')
      // Transport was pinned to the JUST-COMMITTED context, not live B state
      // (D-2 pass-2: the pin also opts out of reactive 401 replay).
      expect(updateCabinetTaxSettings).toHaveBeenCalledWith(
        'cabinet-a',
        { targetMarginPct: 20 },
        {
          authToken: 'new-jwt-for-a',
          cabinetIdOverride: 'cabinet-a',
          allowReactiveRefresh: false,
        }
      )
      // B's live state is untouched by the swallowed failure
      expect(useAuthStore.getState().token).toBe('jwt-b')
      expect(useAuthStore.getState().user?.id).toBe('user-b')
      expect(logger.warn).toHaveBeenCalled()
    })

    it('same-session margin failure still throws (legacy error UI behavior)', async () => {
      vi.mocked(createCabinet).mockResolvedValue(createSuccess)
      vi.mocked(updateCabinetTaxSettings).mockRejectedValueOnce(new Error('API unavailable'))

      await expect(handleCreateCabinet('A Cabinet', 20)).rejects.toThrow(
        'target margin could not be saved'
      )
    })
  })

  describe('evaluateCabinetSettlement truth table (review fix MEDIUM-3)', () => {
    it('nonce match alone (null initiating accountId) settles applied', () => {
      const nonce = useAuthStore.getState().sessionNonce
      expect(evaluateCabinetSettlement({ accountId: null, sessionNonce: nonce })).toBe('applied')
    })

    it('nonce match + account mismatch (both non-null) is stale (defense-in-depth)', () => {
      const nonce = useAuthStore.getState().sessionNonce
      expect(evaluateCabinetSettlement({ accountId: 'user-b', sessionNonce: nonce })).toBe('stale')
    })

    it('null nonce on either side stays indeterminate (immutable initiating capture)', () => {
      const nonce = useAuthStore.getState().sessionNonce
      expect(evaluateCabinetSettlement({ accountId: 'user-a', sessionNonce: null })).toBe(
        'indeterminate'
      )
      expect(evaluateCabinetSettlement({ accountId: 'user-a', sessionNonce: nonce })).toBe(
        'applied'
      )
    })
  })
})

describe('authStore sessionNonce (Story 167.9)', () => {
  it('login mints a fresh nonce per session; logout clears it', () => {
    const first = useAuthStore.getState().sessionNonce
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    useAuthStore.getState().login(userA, 'jwt-a')
    expect(useAuthStore.getState().sessionNonce).not.toBe(first)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().sessionNonce).toBeNull()
  })

  it('rehydrate of a legacy persisted session (no nonce) mints one (review fix HIGH-2)', async () => {
    // Simulate a pre-deploy persisted auth state: token+user, sessionNonce absent/null.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { user: userA, token: 'legacy-jwt', cabinetId: null, sessionNonce: null },
        version: 0,
      })
    )

    await useAuthStore.persist.rehydrate()

    // Nonce minted post-rehydrate: every SUBSEQUENT cabinet-create initiation carries one.
    expect(useAuthStore.getState().sessionNonce).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
    expect(useAuthStore.getState().token).toBe('legacy-jwt')
  })

  it('ensureSessionNonce is idempotent — a session that already has a nonce keeps it (D-1/PB-1)', async () => {
    // beforeEach logged in: nonce present. Capture before/after a full create
    // initiation — no remint means the settle predicate stays stable.
    const nonceBefore = useAuthStore.getState().sessionNonce
    expect(nonceBefore).not.toBeNull()
    vi.mocked(createCabinet).mockResolvedValue(createSuccess)
    vi.mocked(updateCabinetTaxSettings).mockResolvedValue(updatedTaxSettings)

    const result = await handleCreateCabinet('A Cabinet', 20)

    expect(useAuthStore.getState().sessionNonce).toBe(nonceBefore)
    expect(result.status).toBe('applied')
    expect(result.cabinet?.id).toBe('cabinet-a')
  })

  it('ensureSessionNonce does not mint for an unauthenticated store (D-1 guard)', () => {
    // The mint must not fabricate session identity for a logged-out state —
    // settlement then classifies via the token guard (stale), never applied.
    const nonceBefore = useAuthStore.getState().sessionNonce
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })

    expect(useAuthStore.getState().ensureSessionNonce()).toBeNull()
    // Store unchanged: the pre-existing nonce is neither replaced nor cleared.
    expect(useAuthStore.getState().sessionNonce).toBe(nonceBefore)
  })
})
