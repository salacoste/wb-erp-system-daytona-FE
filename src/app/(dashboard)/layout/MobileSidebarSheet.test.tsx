import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileSidebarSheet } from './MobileSidebarSheet'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('MobileSidebarSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a native mobile menu button and requests the sheet to open', () => {
    const onOpenChange = vi.fn()

    render(<MobileSidebarSheet open={false} onOpenChange={onOpenChange} />)

    const trigger = screen.getByRole('button', { name: 'Open menu' })
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger).toHaveAttribute('type', 'button')
    expect(trigger).toHaveClass('inline-flex', 'lg:hidden')

    fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})
