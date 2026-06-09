/**
 * Single COGS Form - Helper types and utilities
 * Extracted from SingleCogsForm.tsx for file size compliance
 */

/**
 * Story 23.10: Role-based access control for task enqueue
 * Manager+ (Owner, Manager, Service) can trigger recalculation
 * Analyst cannot - button is hidden
 */
export function canEnqueueTasks(role: string | undefined): boolean {
  if (!role) return false
  return ['Owner', 'Manager', 'Service'].includes(role)
}

/** Form data shape for react-hook-form */
export interface CogsFormData {
  unit_cost_rub: string
  valid_from: string
  notes: string
}
