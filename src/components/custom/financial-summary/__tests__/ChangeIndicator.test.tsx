/**
 * Unit tests for ChangeIndicator.
 *
 * iter-78 (dot-locale percent consolidation): the change span rendered dot-locale
 * `${change.percentage.toFixed(1)}%` → migrated to formatPercentage(change.percentage, 1)
 * ("10,0 %", comma + NBSP). The component had no dedicated test; these lock the comma+NBSP
 * locale, the +/−/0 sign (+ only for positive; Intl emits the minus; none for 0), and the
 * null em-dash guard. `\s` matches the NBSP separator.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChangeIndicator } from '../ChangeIndicator'

describe('ChangeIndicator', () => {
  it('renders a positive change with a leading + and comma+NBSP percent', () => {
    render(<ChangeIndicator current={110} previous={100} />) // +10%
    expect(screen.getByText(/^\+10,0\s%$/)).toBeInTheDocument()
  })

  it('renders a negative change with a minus and no +', () => {
    render(<ChangeIndicator current={90} previous={100} />) // -10%
    // [-−] tolerates ASCII hyphen-minus (current ICU) or the Unicode minus on other ICU
    expect(screen.getByText(/^[-−]10,0\s%$/)).toBeInTheDocument()
  })

  it('renders a zero change as "0,0 %" with no sign', () => {
    render(<ChangeIndicator current={100} previous={100} />)
    expect(screen.getByText(/^0,0\s%$/)).toBeInTheDocument()
  })

  it('renders an em dash when current or previous is null/undefined', () => {
    render(<ChangeIndicator current={null} previous={100} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders an em dash when previous is 0 (division guard)', () => {
    render(<ChangeIndicator current={50} previous={0} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('never renders the dot-locale form', () => {
    render(<ChangeIndicator current={110} previous={100} />)
    expect(screen.queryByText(/10\.0%/)).not.toBeInTheDocument()
  })
})
