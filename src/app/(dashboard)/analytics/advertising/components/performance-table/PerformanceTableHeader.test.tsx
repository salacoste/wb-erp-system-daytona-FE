/**
 * PerformanceTableHeader aria-sort placement — Story 163.1.
 *
 * aria-sort must live on the column header (<th>), report ascending/descending for the
 * actively sorted column and "none" for other sortable columns; non-sortable columns omit
 * it. Sortable columns are operated by a semantic <button> (keyboard-accessible).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { PerformanceTableHeader } from './PerformanceTableHeader'

const baseProps = {
  identifierLabel: 'Артикул',
  nameColumn: null,
  onSortChange: vi.fn(),
} as const

function thWith(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll('th')).find(th => th.textContent?.includes(text))
}

describe('PerformanceTableHeader — Story 163.1 aria-sort on <th>', () => {
  it('active sortable column reports ascending; other sortable columns report "none"', () => {
    const { container } = render(
      <PerformanceTableHeader {...baseProps} sortBy="spend" sortOrder="asc" />
    )
    expect(thWith(container, 'Затраты')?.getAttribute('aria-sort')).toBe('ascending')
    expect(thWith(container, 'ROAS')?.getAttribute('aria-sort')).toBe('none')
    expect(thWith(container, 'ROI')?.getAttribute('aria-sort')).toBe('none')
  })

  it('flips to descending when sortOrder changes', () => {
    const { container } = render(
      <PerformanceTableHeader {...baseProps} sortBy="roas" sortOrder="desc" />
    )
    expect(thWith(container, 'ROAS')?.getAttribute('aria-sort')).toBe('descending')
    expect(thWith(container, 'Затраты')?.getAttribute('aria-sort')).toBe('none')
  })

  it('non-sortable columns omit aria-sort entirely', () => {
    const { container } = render(
      <PerformanceTableHeader {...baseProps} sortBy="spend" sortOrder="asc" />
    )
    // "Прибыль" is a non-sortable header cell.
    expect(thWith(container, 'Прибыль')?.hasAttribute('aria-sort')).toBe(false)
  })

  it('sortable columns are operated by a semantic <button>', () => {
    render(<PerformanceTableHeader {...baseProps} sortBy="spend" sortOrder="asc" />)
    const spendButton = screen.getByRole('button', { name: /Затраты/ })
    expect(spendButton.tagName).toBe('BUTTON')
  })
})
