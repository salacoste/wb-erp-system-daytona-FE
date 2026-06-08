/**
 * authStoreHelpers — Unit Tests
 *
 * Covers: normalizeUser (role case mapping), STORAGE_KEY, STORAGE_EVENT_KEY
 */

import { describe, it, expect } from 'vitest'
import { normalizeUser, STORAGE_KEY, STORAGE_EVENT_KEY } from '../authStoreHelpers'
import type { User } from '@/types/auth'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('authStoreHelpers constants', () => {
  it('STORAGE_KEY is "auth-storage"', () => {
    expect(STORAGE_KEY).toBe('auth-storage')
  })

  it('STORAGE_EVENT_KEY is "auth-storage-event"', () => {
    expect(STORAGE_EVENT_KEY).toBe('auth-storage-event')
  })
})

// ---------------------------------------------------------------------------
// normalizeUser
// ---------------------------------------------------------------------------

describe('normalizeUser', () => {
  const baseUser: User = {
    id: 'user-1',
    email: 'test@test.com',
    role: 'Owner',
    name: 'Test',
  }

  it('returns same user when role is already capitalized', () => {
    const result = normalizeUser(baseUser)
    expect(result).toEqual(baseUser)
    expect(result).toBe(baseUser) // same reference, no copy
  })

  it('normalizes lowercase "owner" to "Owner"', () => {
    const user = { ...baseUser, role: 'owner' as User['role'] }
    const result = normalizeUser(user)
    expect(result.role).toBe('Owner')
  })

  it('normalizes lowercase "manager" to "Manager"', () => {
    const user = { ...baseUser, role: 'manager' as User['role'] }
    const result = normalizeUser(user)
    expect(result.role).toBe('Manager')
  })

  it('normalizes lowercase "analyst" to "Analyst"', () => {
    const user = { ...baseUser, role: 'analyst' as User['role'] }
    const result = normalizeUser(user)
    expect(result.role).toBe('Analyst')
  })

  it('normalizes lowercase "service" to "Service"', () => {
    const user = { ...baseUser, role: 'service' as User['role'] }
    const result = normalizeUser(user)
    expect(result.role).toBe('Service')
  })

  it('preserves unknown roles (pass-through)', () => {
    const user = { ...baseUser, role: 'SuperAdmin' as User['role'] }
    const result = normalizeUser(user)
    expect(result.role).toBe('SuperAdmin')
    expect(result).toBe(user) // same reference
  })

  it('preserves all other user fields', () => {
    const user = { ...baseUser, role: 'manager' as User['role'] }
    const result = normalizeUser(user)
    expect(result.id).toBe('user-1')
    expect(result.email).toBe('test@test.com')
    expect(result.name).toBe('Test')
  })
})
