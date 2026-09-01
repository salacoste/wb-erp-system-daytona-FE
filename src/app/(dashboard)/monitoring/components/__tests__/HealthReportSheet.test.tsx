import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { HealthReportSheet } from '../HealthReportSheet'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { cabinetId: string }) => unknown) =>
    selector({ cabinetId: 'cabinet-174-3' }),
}))

vi.mock('@tanstack/react-query', async importOriginal => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQuery: () => ({ data: undefined, isLoading: true }),
  }
})

function Harness() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Открыть отчёт 17 августа
      </button>
      <HealthReportSheet
        date="2026-08-17"
        open={open}
        onOpenChange={setOpen}
        returnFocusRef={triggerRef}
      />
    </>
  )
}

describe('HealthReportSheet', () => {
  it('renders the conditional report sheet as a named modal and closes with focus-safe control', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const trigger = screen.getByRole('button', { name: 'Открыть отчёт 17 августа' })
    await user.click(trigger)
    const sheet = screen.getByRole('dialog', { name: 'понедельник, 17 августа 2026 г.' })
    expect(sheet).toBeVisible()
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument()
    expect(screen.getByText('понедельник, 17 августа 2026 г.')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('dialog', { name: 'понедельник, 17 августа 2026 г.' })
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
