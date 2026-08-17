import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CREATE_PENDING_PHASE,
  TOKEN_RECOVERY_PHASE,
  UPDATE_PENDING_PHASE,
  admitRecoveryOperation,
  clearRecoveryMarker,
  finishRecoveryOperation,
  isRecoveryOperationActive,
  readRecoveryMarker,
  recoveryMarkerKey,
  transitionRecoveryMarker,
} from './cabinetCreationRecovery'

describe('cabinet creation recovery storage and CAS', () => {
  beforeEach(() => sessionStorage.clear())

  it('uses account-scoped keys and persists only privacy-safe marker fields', () => {
    const userId = 'manager/privacy@example.test'
    const marker = admitRecoveryOperation(userId, CREATE_PENDING_PHASE)

    expect(marker).not.toBeNull()
    expect(recoveryMarkerKey(userId)).toBe(
      'cabinet-creation:recovery:v2:manager%2Fprivacy%40example.test'
    )
    const serialized = sessionStorage.getItem(recoveryMarkerKey(userId))
    expect(JSON.parse(serialized!)).toEqual({
      version: 2,
      userId,
      operationId: marker!.operationId,
      phase: CREATE_PENDING_PHASE,
    })
    expect(Object.keys(JSON.parse(serialized!)).sort()).toEqual([
      'operationId',
      'phase',
      'userId',
      'version',
    ])
    expect(serialized).not.toMatch(/token|email|cabinetId|name|margin|payload|error/i)
  })

  it('indexes active same-realm operations by exact opaque operationId', () => {
    const markerA = admitRecoveryOperation('active-a', CREATE_PENDING_PHASE)!
    const markerB = admitRecoveryOperation('active-b', CREATE_PENDING_PHASE)!

    expect(markerA.operationId).not.toBe(markerB.operationId)
    expect(isRecoveryOperationActive(markerA)).toBe(true)
    expect(isRecoveryOperationActive({ ...markerA, operationId: markerB.operationId })).toBe(true)
    finishRecoveryOperation(markerA)
    expect(isRecoveryOperationActive(markerA)).toBe(false)
    expect(isRecoveryOperationActive(markerB)).toBe(true)
    finishRecoveryOperation(markerB)
  })

  it('transitions and clears only the exact expected operation and phase', () => {
    const old = admitRecoveryOperation('cas-user', CREATE_PENDING_PHASE)!
    expect(transitionRecoveryMarker(old, TOKEN_RECOVERY_PHASE)).toBe('applied')
    const transitioned = { ...old, phase: TOKEN_RECOVERY_PHASE }
    expect(clearRecoveryMarker(old)).toBe('mismatch')
    expect(readRecoveryMarker('cas-user')).toEqual({ kind: 'present', marker: transitioned })
    expect(clearRecoveryMarker(transitioned)).toBe('applied')

    const newer = admitRecoveryOperation('cas-user', UPDATE_PENDING_PHASE)!
    expect(clearRecoveryMarker(transitioned)).toBe('mismatch')
    expect(readRecoveryMarker('cas-user')).toEqual({ kind: 'present', marker: newer })
    finishRecoveryOperation(old)
    finishRecoveryOperation(newer)
  })

  it('keeps account B byte-identical while account A transitions and clears', () => {
    const markerA = admitRecoveryOperation('independent-a', CREATE_PENDING_PHASE)!
    const markerB = admitRecoveryOperation('independent-b', UPDATE_PENDING_PHASE)!
    const bKey = recoveryMarkerKey('independent-b')
    const before = sessionStorage.getItem(bKey)

    expect(transitionRecoveryMarker(markerA, TOKEN_RECOVERY_PHASE)).toBe('applied')
    expect(clearRecoveryMarker({ ...markerA, phase: TOKEN_RECOVERY_PHASE })).toBe('applied')
    expect(sessionStorage.getItem(bKey)).toBe(before)
    finishRecoveryOperation(markerA)
    finishRecoveryOperation(markerB)
  })

  it('fails closed for malformed account A storage without affecting account B', () => {
    sessionStorage.setItem(recoveryMarkerKey('malformed-a'), '{"phase":')

    expect(readRecoveryMarker('malformed-a')).toEqual({ kind: 'indeterminate' })
    const markerB = admitRecoveryOperation('valid-b', CREATE_PENDING_PHASE)
    expect(markerB).not.toBeNull()
    expect(sessionStorage.getItem(recoveryMarkerKey('malformed-a'))).toBe('{"phase":')
    finishRecoveryOperation(markerB!)
  })

  it('fails closed when a secure UUID source is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID')
    Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: undefined })
    try {
      expect(admitRecoveryOperation('no-secure-uuid', CREATE_PENDING_PHASE)).toBeNull()
      expect(sessionStorage.getItem(recoveryMarkerKey('no-secure-uuid'))).toBeNull()
    } finally {
      if (descriptor) Object.defineProperty(globalThis.crypto, 'randomUUID', descriptor)
      else delete (globalThis.crypto as Partial<Crypto>).randomUUID
    }
  })

  it('fails closed when the secure UUID source throws', () => {
    const randomUUID = vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => {
      throw new DOMException('Secure random unavailable', 'OperationError')
    })
    try {
      expect(admitRecoveryOperation('uuid-throws', CREATE_PENDING_PHASE)).toBeNull()
      expect(sessionStorage.getItem(recoveryMarkerKey('uuid-throws'))).toBeNull()
    } finally {
      randomUUID.mockRestore()
    }
  })

  it('requires read-after-write equality before admission succeeds', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    const storage = window.sessionStorage
    const getItem = vi.fn(() => null)
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: { ...storage, getItem, setItem: storage.setItem.bind(storage) },
    })
    try {
      expect(admitRecoveryOperation('readback-failure', CREATE_PENDING_PHASE)).toBeNull()
    } finally {
      Object.defineProperty(window, 'sessionStorage', descriptor!)
    }
  })
})
