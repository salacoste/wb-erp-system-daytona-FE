/**
 * FE-D5: cross-tab cabinet-create mutual exclusion.
 *
 * jsdom has NO navigator.locks → every test here exercises the FALLBACK path
 * by default (claim read-checks + write-verify CAS). The lock path is pinned
 * via an injected fake ExclusiveLockManager (T9/T9b). A racing Storage shim
 * pins the write-verify CAS (T10).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE,
  CABINET_CREATE_SETTLED_BLOCK_MESSAGE,
  CABINET_CREATE_TOMBSTONE_BLOCK_MESSAGE,
  CABINET_CREATE_UNAVAILABLE_BLOCK_MESSAGE,
  CLAIM_REPLAY_WINDOW_MS,
  CLAIM_TTL_MS,
  cabinetCreateClaimKey,
  cabinetCreateLockName,
  isCabinetCreateClaim,
  runCabinetCreateExclusive,
  type CabinetCreateClaim,
  type ExclusiveLockManager,
} from '@/lib/cabinetCreationLock'
import { useAuthStore } from '@/stores/authStore'

const USER_ID = 'user-lock'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const CLAIM_KEY = cabinetCreateClaimKey(USER_ID)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('cabinet creation cross-tab lock (FE-D5)', () => {
  let clock = 1_700_000_000_000
  const now = () => clock

  const seedClaim = (overrides: Partial<CabinetCreateClaim> = {}): CabinetCreateClaim => ({
    v: 1,
    claimId: 'claim-seed',
    acquiredAt: clock,
    idempotencyKey: 'seed-key',
    phase: 'in-flight',
    ...overrides,
  })
  const writeSeed = (claim: CabinetCreateClaim) =>
    window.localStorage.setItem(CLAIM_KEY, JSON.stringify(claim))
  const readStoredClaim = (): unknown => {
    const raw = window.localStorage.getItem(CLAIM_KEY)
    return raw === null ? null : JSON.parse(raw)
  }

  beforeEach(() => {
    window.localStorage.clear()
    clock = 1_700_000_000_000
    useAuthStore.setState({
      user: { id: USER_ID, email: 'lock@test.local', role: 'Owner' },
      token: 'jwt-lock',
      cabinetId: null,
      isAuthenticated: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('T1: mints a fresh claim and idempotency key when the claim is absent, then cleans up on completion', async () => {
    const runner = vi.fn(async (idempotencyKey: string) => ({ created: idempotencyKey }))
    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })

    expect(outcome).toEqual({ kind: 'ran', value: { created: expect.any(String) } })
    expect(runner).toHaveBeenCalledTimes(1)
    const mintedKey = runner.mock.calls[0][0]
    expect(mintedKey).toMatch(UUID_RE)
    // Clean completion removes the claim (retry stays legal)
    expect(window.localStorage.getItem(CLAIM_KEY)).toBeNull()
  })

  it('T2: returns blocked without invoking the runner when an in-flight-fresh claim exists (other tab mid-create)', async () => {
    writeSeed(seedClaim({ acquiredAt: clock - 1000, idempotencyKey: 'tab-a-key' }))
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
    // No mint, no claim mutation — tab A's claim is untouched
    expect(readStoredClaim()).toMatchObject({ idempotencyKey: 'tab-a-key' })
  })

  it('T3: returns blocked fail-closed on a settled-uncertain tombstone (CABINET-BROWSER-04)', async () => {
    writeSeed(
      seedClaim({
        acquiredAt: clock - 1000,
        idempotencyKey: 'tab-a-key',
        phase: 'settled-uncertain',
      })
    )
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_TOMBSTONE_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
    expect(readStoredClaim()).toMatchObject({
      phase: 'settled-uncertain',
      idempotencyKey: 'tab-a-key',
    })
  })

  it('T4: takes over an in-flight-stale claim within the replay window and reuses its idempotency key (crashed-tab BE replay)', async () => {
    const staleKey = 'crashed-tab-key'
    writeSeed(seedClaim({ acquiredAt: clock - CLAIM_TTL_MS - 1000, idempotencyKey: staleKey }))
    const gate = deferred<string>()
    const runner = vi.fn(async (idempotencyKey: string) => gate.promise.then(() => idempotencyKey))

    const outcomePromise = runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })
    await vi.waitFor(() => expect(runner).toHaveBeenCalledTimes(1))
    // Runner REUSES the crashed tab's key (BE replays it into the same operation)
    expect(runner.mock.calls[0][0]).toBe(staleKey)
    // Claim refreshed: fresh claimId + fresh acquiredAt, still in-flight
    expect(readStoredClaim()).toMatchObject({
      idempotencyKey: staleKey,
      acquiredAt: clock,
      phase: 'in-flight',
    })
    // N6: re-assert via the exported type-guard — no downcast.
    const refreshedClaim: unknown = readStoredClaim()
    expect(isCabinetCreateClaim(refreshedClaim)).toBe(true)
    if (isCabinetCreateClaim(refreshedClaim)) {
      expect(refreshedClaim.claimId).not.toBe('claim-seed')
    }

    gate.resolve('done')
    const outcome = await outcomePromise
    // The runner's value echoes the REUSED crashed-tab key
    expect(outcome).toEqual({ kind: 'ran', value: 'crashed-tab-key' })
    expect(window.localStorage.getItem(CLAIM_KEY)).toBeNull()
  })

  it('T5: mints a fresh key when the stale claim exceeds the replay window', async () => {
    writeSeed(
      seedClaim({
        acquiredAt: clock - CLAIM_REPLAY_WINDOW_MS - 1000,
        idempotencyKey: 'ancient-key',
      })
    )
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })

    expect(outcome).toEqual({ kind: 'ran', value: expect.any(String) })
    expect(runner.mock.calls[0][0]).toMatch(UUID_RE)
    expect(runner.mock.calls[0][0]).not.toBe('ancient-key')
  })

  it('T6: clears the claim on a pre-create failure so retry stays legal, and rethrows the runner error', async () => {
    writeSeed(seedClaim({ acquiredAt: clock - CLAIM_TTL_MS - 1000, idempotencyKey: 'stale-key' }))

    const failing = vi.fn(async () => {
      throw new Error('Network unavailable')
    })
    await expect(
      runCabinetCreateExclusive(USER_ID, failing, () => 'clean', { now })
    ).rejects.toThrow('Network unavailable')
    expect(window.localStorage.getItem(CLAIM_KEY)).toBeNull()

    // Deliberate retry after the failure proceeds with a fresh key
    const retry = vi.fn(async (idempotencyKey: string) => idempotencyKey)
    const outcome = await runCabinetCreateExclusive(USER_ID, retry, () => 'clean', { now })
    expect(outcome).toEqual({ kind: 'ran', value: expect.any(String) })
    expect(retry.mock.calls[0][0]).toMatch(UUID_RE)
  })

  it('T7: converts the claim to a settled-uncertain tombstone when the report is uncertain (POST may have landed)', async () => {
    const gate = deferred<string>()
    const runner = vi.fn(async (idempotencyKey: string) => gate.promise.then(() => idempotencyKey))
    const outcomePromise = runCabinetCreateExclusive(USER_ID, runner, () => 'uncertain', { now })
    await vi.waitFor(() => expect(runner).toHaveBeenCalledTimes(1))

    gate.resolve('done')
    await outcomePromise

    expect(readStoredClaim()).toMatchObject({
      idempotencyKey: runner.mock.calls[0][0],
      phase: 'settled-uncertain',
    })
  })

  it('T8: returns blocked when a cabinet appeared in the auth store while this tab waited (in-lock shared re-check)', async () => {
    // Stale claim would be adoptable — but the shared-state re-check must win.
    writeSeed(seedClaim({ acquiredAt: clock - CLAIM_TTL_MS - 1000, idempotencyKey: 'tab-a-key' }))
    useAuthStore.setState({ cabinetId: 'cabinet-appeared' })
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_SETTLED_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
  })

  it('T8b: blocked when only the PERSISTED auth blob has a cabinet (no storage-event dependency)', async () => {
    // Cross-tab races must not depend on storage-EVENT delivery: the persisted
    // auth-storage blob is written synchronously by the settling tab and read
    // here directly. Live store cabinetId stays null on purpose.
    writeSeed(seedClaim({ acquiredAt: clock - CLAIM_TTL_MS - 1000, idempotencyKey: 'tab-a-key' }))
    window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: { id: USER_ID, email: 'lock@test.local', role: 'Owner' },
          token: 'jwt-lock',
          cabinetId: 'cabinet-from-tab-a',
        },
        version: 0,
      })
    )
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_SETTLED_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
  })

  it('T9: uses the injected LockManager, waits for the in-flight tab, and serializes concurrent creates', async () => {
    const requestedNames: string[] = []
    let held = 0
    let maxConcurrent = 0
    // A real LockManager runs ONE callback per name at a time — serialize B
    // behind A with a promise-chain mutex (mirrors navigator.locks semantics).
    let tail: Promise<unknown> = Promise.resolve()
    const noop = () => undefined
    const lockManager: ExclusiveLockManager = {
      request: <R>(name: string, callback: () => Promise<R>): Promise<R> => {
        requestedNames.push(name)
        const turn = tail.then(async () => {
          held += 1
          maxConcurrent = Math.max(maxConcurrent, held)
          try {
            return await callback()
          } finally {
            held -= 1
          }
        })
        tail = turn.then(noop, noop)
        return turn
      },
    }
    const gate = deferred<void>()
    const runner = vi.fn(async (idempotencyKey: string) => {
      await gate.promise
      return idempotencyKey
    })

    const runA = runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { lockManager, now })
    const runB = runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { lockManager, now })

    await vi.waitFor(() => expect(runner).toHaveBeenCalledTimes(1))
    expect(runner).not.toHaveBeenCalledTimes(2) // tab B is serialized behind tab A
    expect(requestedNames).toContain(cabinetCreateLockName(USER_ID))

    gate.resolve()
    const [outcomeA, outcomeB] = await Promise.all([runA, runB])
    expect(outcomeA.kind).toBe('ran')
    expect(outcomeB.kind).toBe('ran')
    expect(maxConcurrent).toBe(1)
    expect(runner).toHaveBeenCalledTimes(2)
    // Tab B minted its own fresh key (tab A cleaned up before release)
    expect(runner.mock.calls[1][0]).toMatch(UUID_RE)
    expect(runner.mock.calls[1][0]).not.toBe(runner.mock.calls[0][0])
  })

  it('T9b: the in-lock shared re-check still blocks when a fresh claim exists under a real LockManager', async () => {
    writeSeed(seedClaim({ acquiredAt: clock - 1000, idempotencyKey: 'tab-a-key' }))
    const lockManager: ExclusiveLockManager = {
      request: (_name, callback) => callback(),
    }
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', {
      lockManager,
      now,
    })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
  })

  it('T10: fallback write-verify CAS detects a racing claim writer and refuses (blocked, runner untouched)', async () => {
    const foreignClaim = seedClaim({ claimId: 'foreign', idempotencyKey: 'foreign-key' })
    const racingStorage = new Proxy(window.localStorage, {
      get(target, property, receiver) {
        if (property === 'setItem') {
          return (key: string, value: string) => {
            target.setItem(key, value)
            // A concurrent writer wins the race between our write and our verify
            target.setItem(key, JSON.stringify(foreignClaim))
          }
        }
        return Reflect.get(target, property, receiver)
      },
    })
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', {
      storage: racingStorage,
      now,
    })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
    // The foreign claim survives untouched — we never clobber another tab's claim
    expect(readStoredClaim()).toMatchObject({ idempotencyKey: 'foreign-key' })
  })

  it('T11: returns blocked fail-closed when no crypto UUID source exists (no mint, no runner)', async () => {
    vi.stubGlobal('crypto', {})
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_UNAVAILABLE_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(CLAIM_KEY)).toBeNull()
  })

  it('T12: anon scope falls back to a shared claim key for token-only legacy sessions', () => {
    expect(cabinetCreateClaimKey(null)).toBe('wb:cabinet-creation:claim:v1:_anon')
    expect(cabinetCreateClaimKey('user-lock')).toBe('wb:cabinet-creation:claim:v1:user-lock')
  })

  it('T13: auto-detects navigator.locks when present and passes the account-scoped lock name (F3)', async () => {
    const requestSpy = vi.fn((name: string, callback: () => Promise<string>) => callback())
    Object.defineProperty(navigator, 'locks', {
      value: { request: requestSpy },
      configurable: true,
    })
    try {
      // No injected lockManager — exercises production detectLockManager wiring.
      const outcome = await runCabinetCreateExclusive(
        USER_ID,
        async key => key,
        () => 'clean'
      )
      expect(outcome).toEqual({ kind: 'ran', value: expect.any(String) })
      expect(requestSpy.mock.calls[0][0]).toBe(cabinetCreateLockName(USER_ID))
    } finally {
      Reflect.deleteProperty(navigator, 'locks')
    }
  })

  it('T14: fallback pre-adoption re-read blocks when a claim appeared since classification (F4)', async () => {
    const racer = seedClaim({ claimId: 'racer', idempotencyKey: 'racer-key' })
    let claimReads = 0
    const racingReadStorage = new Proxy(window.localStorage, {
      get(target, property, receiver) {
        if (property === 'getItem') {
          return (key: string) => {
            const value = Reflect.apply(target.getItem, target, [key])
            if (key === CLAIM_KEY) {
              claimReads += 1
              // Read 1 = classification (absent); read 2 = pre-adoption re-read
              // — the racing tab's claim "appeared" in between.
              if (claimReads === 2) return JSON.stringify(racer)
            }
            return value
          }
        }
        return Reflect.get(target, property, receiver)
      },
    })
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', {
      storage: racingReadStorage,
      now,
    })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
    // Our tab never persisted its own claim — blocked before adoption wrote.
    expect(window.localStorage.getItem(CLAIM_KEY)).toBeNull()
  })

  it('T15: a LockManager request-acquisition failure fails closed as blocked, never raw-thrown (F6)', async () => {
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)
    const broken: ExclusiveLockManager = {
      request: () => Promise.reject(new Error('lock subsystem unavailable')),
    }

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', {
      lockManager: broken,
      now,
    })

    expect(outcome).toEqual({ kind: 'blocked', message: CABINET_CREATE_UNAVAILABLE_BLOCK_MESSAGE })
    expect(runner).not.toHaveBeenCalled()
  })

  it('T16: a failed-ambiguous claim is adopted IMMEDIATELY (no TTL wait) and its key is REUSED — cross-tab safe (wave 4)', async () => {
    // Tab A's wire-ambiguous failure parked this claim; ANY tab (incl. tab B)
    // adopting it must replay the SAME key (BE replay collapses a ghost POST).
    writeSeed(
      seedClaim({
        acquiredAt: clock - 1000,
        idempotencyKey: 'ghost-key',
        phase: 'failed-ambiguous',
      })
    )
    const gate = deferred<string>()
    const runner = vi.fn(async (idempotencyKey: string) => gate.promise.then(() => idempotencyKey))

    const outcomePromise = runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })
    await vi.waitFor(() => expect(runner).toHaveBeenCalledTimes(1))
    expect(runner.mock.calls[0][0]).toBe('ghost-key')
    // Claim rewritten to in-flight with a FRESH acquiredAt/claimId, key preserved
    expect(readStoredClaim()).toMatchObject({
      phase: 'in-flight',
      idempotencyKey: 'ghost-key',
      acquiredAt: clock,
    })

    gate.resolve('replayed')
    // The runner's value echoes the REUSED ghost key
    expect(await outcomePromise).toEqual({ kind: 'ran', value: 'ghost-key' })
    expect(window.localStorage.getItem(CLAIM_KEY)).toBeNull()
  })

  it('T17: a failed-ambiguous claim past the replay window mints a FRESH key (wave 4)', async () => {
    writeSeed(
      seedClaim({
        acquiredAt: clock - CLAIM_REPLAY_WINDOW_MS - 1000,
        idempotencyKey: 'ancient-ghost-key',
        phase: 'failed-ambiguous',
      })
    )
    const runner = vi.fn(async (idempotencyKey: string) => idempotencyKey)

    const outcome = await runCabinetCreateExclusive(USER_ID, runner, () => 'clean', { now })

    expect(outcome).toEqual({ kind: 'ran', value: expect.any(String) })
    expect(runner.mock.calls[0][0]).toMatch(UUID_RE)
    expect(runner.mock.calls[0][0]).not.toBe('ancient-ghost-key')
  })
})
