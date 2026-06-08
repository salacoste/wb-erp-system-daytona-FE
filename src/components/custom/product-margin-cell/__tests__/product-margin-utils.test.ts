import { describe, it, expect } from 'vitest'
import { canEnqueueTasks } from '../product-margin-utils'

describe('canEnqueueTasks', () => {
  it('returns true for Owner role', () => {
    expect(canEnqueueTasks('Owner')).toBe(true)
  })

  it('returns true for Manager role', () => {
    expect(canEnqueueTasks('Manager')).toBe(true)
  })

  it('returns true for Service role', () => {
    expect(canEnqueueTasks('Service')).toBe(true)
  })

  it('returns false for Analyst role', () => {
    expect(canEnqueueTasks('Analyst')).toBe(false)
  })

  it('returns false for undefined role', () => {
    expect(canEnqueueTasks(undefined)).toBe(false)
  })

  it('returns false for unknown role', () => {
    expect(canEnqueueTasks('Guest')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(canEnqueueTasks('')).toBe(false)
  })
})
