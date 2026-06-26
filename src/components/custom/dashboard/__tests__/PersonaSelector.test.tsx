/**
 * Tests for PersonaSelector (TZ-4): the role→persona default is applied on mount when no
 * persona is persisted, and a persisted persona is not overridden. (applyPersona itself
 * is covered by dashboardWidgetsStore.persona.test.ts.)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PersonaSelector } from '../PersonaSelector'
import { useDashboardWidgetsStore } from '@/stores/dashboardWidgetsStore'

vi.mock('@/stores/authStore', () => ({ useAuthStore: vi.fn() }))
import { useAuthStore } from '@/stores/authStore'

const STORAGE_KEY = 'wb-repricer-dashboard-widgets'

function setRole(role: string | undefined): void {
  vi.mocked(useAuthStore).mockReturnValue(role as never)
}

describe('PersonaSelector (TZ-4)', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    // resetAll() intentionally sets the Owner persona; for these first-load tests we need
    // the no-persona-yet state, so setState directly.
    useDashboardWidgetsStore.setState({ persona: null })
    vi.clearAllMocks()
  })

  it('applies the role default on first load (Analyst → CFO)', () => {
    setRole('Analyst')
    render(<PersonaSelector />)
    expect(useDashboardWidgetsStore.getState().persona).toBe('CFO')
  })

  it('applies Owner default for Owner/Manager roles', () => {
    setRole('Manager')
    render(<PersonaSelector />)
    expect(useDashboardWidgetsStore.getState().persona).toBe('Owner')
  })

  it('does not override a persisted persona', () => {
    useDashboardWidgetsStore.getState().applyPersona('Ops')
    setRole('Analyst') // would default to CFO, but Ops is already chosen
    render(<PersonaSelector />)
    expect(useDashboardWidgetsStore.getState().persona).toBe('Ops')
  })

  it('waits for a role to be available before applying the default', () => {
    setRole(undefined)
    render(<PersonaSelector />)
    // No role yet → no default applied
    expect(useDashboardWidgetsStore.getState().persona).toBeNull()
  })
})
