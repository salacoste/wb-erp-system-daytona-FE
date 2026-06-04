/**
 * Russian-locale guard for ProcessingAlert progress (iter-93).
 *
 * The progress span migrated from dot-locale `{progress}%` ("75%") to formatPercentageInt →
 * "75 %" (NBSP). This is a gate-blind site (raw `{x}%` JSX, not the toFixed form the
 * locale-percent ratchet matches), so the test is the only guard. `\s` matches the NBSP that
 * getByText normalizes. The `!== undefined` guard must still omit the span when progress is absent.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProcessingAlert } from '../DashboardAlerts'

describe('ProcessingAlert', () => {
  it('renders progress as a Russian-locale percent when defined', () => {
    render(<ProcessingAlert processingStatus={{ reportLoading: { progress: 75 } }} />)
    expect(screen.getByText(/Прогресс: 75\s%/)).toBeInTheDocument()
  })

  it('omits the progress span when progress is undefined', () => {
    render(<ProcessingAlert processingStatus={{ reportLoading: {} }} />)
    expect(screen.queryByText(/Прогресс:/)).not.toBeInTheDocument()
  })
})
