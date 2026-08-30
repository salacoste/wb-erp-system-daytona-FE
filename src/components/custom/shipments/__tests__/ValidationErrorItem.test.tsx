import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ValidationErrorItem } from '../ValidationErrorItem'
import { ValidationErrorCode } from '@/types/shipment-cost'

describe('ValidationErrorItem', () => {
  it('renders config message text for known error code (MISSING_COGS)', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.MISSING_COGS}
        message="COGS not found for 2 SKU(s)"
      />
    )
    expect(screen.getByText('Не указана себестоимость товара')).toBeInTheDocument()
  })

  it('uses semantic warning tokens for warning severity (DUPLICATE_SKU_IN_PALLET)', () => {
    const { container } = render(
      <ValidationErrorItem
        code={ValidationErrorCode.DUPLICATE_SKU_IN_PALLET}
        message="Дублирование артикула в паллете"
      />
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('border-status-warning/30')
    expect(wrapper.className).toContain('bg-status-warning/10')
    expect(wrapper.innerHTML).toContain('text-status-warning')
    expect(wrapper.innerHTML).not.toMatch(/yellow-/)
  })

  it('uses destructive border class for error severity (MISSING_COGS)', () => {
    const { container } = render(
      <ValidationErrorItem code={ValidationErrorCode.MISSING_COGS} message="COGS not found" />
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('border-destructive/50')
    expect(wrapper.className).toContain('bg-destructive/5')
  })

  it('renders navigation links with correct href for codes with linkPattern', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.MISSING_COGS}
        message="COGS not found"
        affectedIds={['123']}
      />
    )
    const link = screen.getByText('Указать себестоимость')
    expect(link.closest('a')).toHaveAttribute('href', '/products?filter=123')
  })

  it('renders multiple links for multiple affectedIds (MISSING_COGS)', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.MISSING_COGS}
        message="COGS not found"
        affectedIds={['100', '200']}
      />
    )
    const links = screen.getAllByText('Указать себестоимость')
    expect(links).toHaveLength(2)
    expect(links[0].closest('a')).toHaveAttribute('href', '/products?filter=100')
    expect(links[1].closest('a')).toHaveAttribute('href', '/products?filter=200')
  })

  it('renders MISSING_PACKAGING link pointing to sku-packaging route', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.MISSING_PACKAGING}
        message="Packaging not configured"
        affectedIds={['456']}
      />
    )
    const link = screen.getByText('Настроить упаковку')
    expect(link.closest('a')).toHaveAttribute('href', '/shipments/sku-packaging')
  })

  it('shows "Затронуто:" for codes without linkPattern but with affectedIds', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.EMPTY_PALLET}
        message="1 pallet(s) have no box lines"
        affectedIds={['p-1', 'p-2']}
      />
    )
    expect(screen.getByText('Затронуто: p-1, p-2')).toBeInTheDocument()
  })

  it('returns null for unknown code not in VALIDATION_ERROR_MAP', () => {
    const { container } = render(
      <ValidationErrorItem
        code={'UNKNOWN_CODE' as ValidationErrorCode}
        message="Something unexpected"
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows backend message when it differs from config message', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.MISSING_COGS}
        message="COGS not found for 3 SKU(s)"
      />
    )
    // Config message is always shown
    expect(screen.getByText('Не указана себестоимость товара')).toBeInTheDocument()
    // Backend message shown separately since it differs
    expect(screen.getByText('COGS not found for 3 SKU(s)')).toBeInTheDocument()
  })

  it('does not duplicate message when backend message matches config', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.DUPLICATE_SKU_IN_PALLET}
        message="Дублирование артикула в паллете"
      />
    )
    // Only one instance of the message, not duplicated
    const matches = screen.getAllByText('Дублирование артикула в паллете')
    expect(matches).toHaveLength(1)
  })

  it('does not show "Затронуто" when affectedIds is empty array', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.EMPTY_SHIPMENT}
        message="В отправке нет паллетов"
        affectedIds={[]}
      />
    )
    expect(screen.queryByText(/Затронуто/)).not.toBeInTheDocument()
  })

  it('renders link aria-label with affected ID', () => {
    render(
      <ValidationErrorItem
        code={ValidationErrorCode.MISSING_COGS}
        message="test"
        affectedIds={['789']}
      />
    )
    expect(screen.getByLabelText('Указать себестоимость для 789')).toBeInTheDocument()
  })
})
