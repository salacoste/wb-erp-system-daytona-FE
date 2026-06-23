import { describe, expect, it } from 'vitest'
import { canManageOperationalData } from './role-permissions'

describe('role permissions', () => {
  it.each(['Owner', 'Manager', 'Service'])('allows %s to manage operational data', role => {
    expect(canManageOperationalData(role)).toBe(true)
  })

  it.each(['Analyst', null, undefined, ''])('keeps %s read-only', role => {
    expect(canManageOperationalData(role)).toBe(false)
  })
})
