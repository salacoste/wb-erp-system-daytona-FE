/**
 * Story 23.10: Role-based access control for task enqueue
 * Manager+ (Owner, Manager, Service) can trigger recalculation
 * Analyst cannot - button is hidden
 */
export function canEnqueueTasks(role: string | undefined): boolean {
  if (!role) return false
  return ['Owner', 'Manager', 'Service'].includes(role)
}
