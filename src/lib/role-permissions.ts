import type { User } from '@/types/auth'

type UserRole = User['role']

const OPERATIONAL_MUTATION_ROLES = new Set<UserRole>(['Owner', 'Manager', 'Service'])

/**
 * Manager+ operational actions are available to Owner, Manager, and Service roles.
 * Analyst is intentionally read-only for UI controls that would create/update/delete data.
 */
export function canManageOperationalData(role: UserRole | string | null | undefined): boolean {
  return OPERATIONAL_MUTATION_ROLES.has(role as UserRole)
}
