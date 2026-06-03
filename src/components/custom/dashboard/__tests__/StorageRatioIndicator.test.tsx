/**
 * Tests for StorageRatioIndicator — Russian-locale ratio rendering.
 *
 * Regression: the ratio rendered dot-locale `${ratio.toFixed(1)}%` ("25.5%"); now via
 * formatPercentage (comma + NBSP). null → no percent shown (no-data).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StorageRatioIndicator } from '../StorageRatioIndicator'

describe('StorageRatioIndicator — Russian locale', () => {
  it('renders the ratio in comma+NBSP locale, not dot-locale', () => {
    render(<StorageRatioIndicator ratio={25.5} />)
    expect(screen.getByText(/25,5\s+%/)).toBeInTheDocument()
    expect(screen.queryByText('25.5%')).not.toBeInTheDocument()
  })

  it('shows no percent when ratio is null (no revenue data)', () => {
    render(<StorageRatioIndicator ratio={null} />)
    // match only a formatted numeric percentage ("25,5 %") — robust to the severity-label
    // text which can contain a literal "%" (e.g. ">20%")
    expect(screen.queryByText(/\d+,\d+\s+%/)).not.toBeInTheDocument()
  })
})
