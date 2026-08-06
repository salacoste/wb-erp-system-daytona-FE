/**
 * SortableHeader accessibility tests — Story 163.1.
 *
 * Verifies the sort control is a semantic <button> (so Enter/Space activate it natively),
 * exposes a Russian accessible name carrying the current order, fires onSort exactly once
 * on Enter and on Space, has a visible focus ring, and does NOT carry aria-sort itself
 * (aria-sort belongs on the owning <th>, asserted in PerformanceTableHeader.test.tsx).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { SortableHeader } from './SortableHeader'

describe('SortableHeader — Story 163.1 keyboard a11y', () => {
  it('renders a semantic <button> with a Russian accessible name (action + column)', () => {
    render(
      <SortableHeader
        label="Затраты"
        field="spend"
        currentSort="roas"
        currentOrder="desc"
        onSort={vi.fn()}
      />
    )
    const button = screen.getByRole('button')
    expect(button.tagName).toBe('BUTTON')
    const name = button.getAttribute('aria-label') ?? ''
    expect(name).toContain('Сортировать по')
    expect(name).toContain('Затраты')
  })

  it('accessible name conveys ascending / descending when the column is active', () => {
    const { rerender } = render(
      <SortableHeader
        label="ROAS"
        field="roas"
        currentSort="roas"
        currentOrder="asc"
        onSort={vi.fn()}
      />
    )
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain('по возрастанию')

    rerender(
      <SortableHeader
        label="ROAS"
        field="roas"
        currentSort="roas"
        currentOrder="desc"
        onSort={vi.fn()}
      />
    )
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain('по убыванию')
  })

  it('accessible name conveys "без сортировки" when the column is not the active sort', () => {
    render(
      <SortableHeader
        label="ROI"
        field="roi"
        currentSort="spend"
        currentOrder="asc"
        onSort={vi.fn()}
      />
    )
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain('без сортировки')
  })

  it('fires onSort exactly once with the field on Enter', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    render(
      <SortableHeader
        label="Затраты"
        field="spend"
        currentSort="roas"
        currentOrder="asc"
        onSort={onSort}
      />
    )
    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard('{Enter}')
    expect(onSort).toHaveBeenCalledTimes(1)
    expect(onSort).toHaveBeenCalledWith('spend')
  })

  it('fires onSort exactly once with the field on Space', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    render(
      <SortableHeader
        label="Затраты"
        field="spend"
        currentSort="roas"
        currentOrder="asc"
        onSort={onSort}
      />
    )
    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard(' ')
    expect(onSort).toHaveBeenCalledTimes(1)
    expect(onSort).toHaveBeenCalledWith('spend')
  })

  it('has a visible focus ring class (focus indicator does not rely on color alone)', () => {
    render(
      <SortableHeader
        label="Затраты"
        field="spend"
        currentSort="roas"
        currentOrder="asc"
        onSort={vi.fn()}
      />
    )
    expect(screen.getByRole('button').className).toContain('focus-visible:ring')
  })

  it('does not place aria-sort on the button (it belongs on the owning <th>)', () => {
    render(
      <SortableHeader
        label="Затраты"
        field="spend"
        currentSort="spend"
        currentOrder="asc"
        onSort={vi.fn()}
      />
    )
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-sort')
  })
})
