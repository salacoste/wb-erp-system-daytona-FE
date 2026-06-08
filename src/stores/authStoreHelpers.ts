/**
 * Auth Store Helpers — extracted from authStore.ts for line-count compliance.
 * Role normalization and cross-tab sync utilities.
 */

import type { User } from '@/types/auth'

/**
 * Backend ↔ frontend role-case bridge.
 *
 * Backend `UserRole` enum emits lowercase values: 'owner' | 'manager' | 'analyst' | 'service'.
 * The frontend `User` type expects capitalized variants. Normalizing here keeps the rest of
 * the codebase ignorant of this mismatch.
 */
const ROLE_CASE_MAP: Record<string, User['role']> = {
  owner: 'Owner',
  manager: 'Manager',
  analyst: 'Analyst',
  service: 'Service',
}

/** Normalize user role case from backend lowercase to frontend capitalized */
export function normalizeUser(user: User): User {
  const incoming = user.role as string
  const canonical = ROLE_CASE_MAP[incoming.toLowerCase()] ?? user.role
  if (canonical === user.role) return user
  return { ...user, role: canonical }
}

/** Storage keys used by authStore for cross-tab communication */
export const STORAGE_KEY = 'auth-storage'
export const STORAGE_EVENT_KEY = 'auth-storage-event'
