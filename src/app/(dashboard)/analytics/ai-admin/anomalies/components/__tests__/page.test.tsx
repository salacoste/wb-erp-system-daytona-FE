/**
 * page.tsx — tests AC-10: page renders <AnomaliesList />, metadata title correct.
 * Story 112.3-FE Task 6. 3rd-pass F-2 fix.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock AnomaliesList so this test focuses on the page wrapper (AC-10).
vi.mock('../AnomaliesList', () => ({
  AnomaliesList: () => <div data-testid="anomalies-list-mock">AnomaliesList</div>,
}))

import AnomaliesPage, { metadata } from '../../page'

describe('AnomaliesPage', () => {
  it('renders <AnomaliesList /> inside a padded container (AC-10)', () => {
    render(<AnomaliesPage />)
    expect(screen.getByTestId('anomalies-list-mock')).toBeInTheDocument()
  })

  it('has metadata title "Разрешение аномалий" (AC-10)', () => {
    expect(metadata.title).toBe('Разрешение аномалий')
  })
})
