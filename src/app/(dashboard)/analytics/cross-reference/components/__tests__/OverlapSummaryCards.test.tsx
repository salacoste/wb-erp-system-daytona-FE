import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OverlapSummaryCards } from '../OverlapSummaryCards'
import type { OverlapSummary } from '../../utils/cross-reference-utils'

describe('OverlapSummaryCards', () => {
  const summary: OverlapSummary = {
    organicOnly: 10,
    adOnly: 5,
    both: 3,
    total: 18,
  }

  it('renders three cards with correct labels', () => {
    render(<OverlapSummaryCards summary={summary} />)
    expect(screen.getByText('Только органика')).toBeInTheDocument()
    expect(screen.getByText('Только реклама')).toBeInTheDocument()
    expect(screen.getByText('Оба канала')).toBeInTheDocument()
  })

  it('displays correct counts', () => {
    render(<OverlapSummaryCards summary={summary} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays percentage of total in Russian locale (comma, not dot)', () => {
    render(<OverlapSummaryCards summary={summary} />)
    // iter-62: Russian locale "55,6 %" (comma + NBSP), not "55.6%". Regex per the
    // locale-assertion convention; \s matches the NBSP separator.
    expect(screen.getByText(/55,6\s%\sот всех/)).toBeInTheDocument() // 10/18
    expect(screen.getByText(/27,8\s%\sот всех/)).toBeInTheDocument() // 5/18
    expect(screen.getByText(/16,7\s%\sот всех/)).toBeInTheDocument() // 3/18
    // guard against the old dot form silently returning
    expect(screen.queryByText(/55\.6%/)).not.toBeInTheDocument()
  })

  it('handles zero total gracefully', () => {
    const empty: OverlapSummary = { organicOnly: 0, adOnly: 0, both: 0, total: 0 }
    render(<OverlapSummaryCards summary={empty} />)
    const zeros = screen.getAllByText('0')
    expect(zeros).toHaveLength(3)
    const pcts = screen.getAllByText(/0,0\s%\sот всех/)
    expect(pcts).toHaveLength(3)
  })
})
