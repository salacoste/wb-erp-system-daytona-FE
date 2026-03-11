import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ValidationErrorPanel, getAffectedBoxLineIds } from '../ValidationErrorPanel'
import { ValidationErrorCode, type ValidationError } from '@/types/shipment-cost'

const mockErrors: ValidationError[] = [
  {
    code: ValidationErrorCode.MISSING_COGS,
    message: 'COGS not found for 2 SKU(s)',
    affectedIds: ['111', '222'],
  },
  {
    code: ValidationErrorCode.MISSING_PACKAGING,
    message: 'Packaging not configured for 1 SKU(s)',
    affectedIds: ['333'],
  },
  {
    code: ValidationErrorCode.EMPTY_PALLET,
    message: '1 pallet(s) have no box lines',
    affectedIds: ['pallet-1'],
  },
]

describe('ValidationErrorPanel', () => {
  it('renders nothing when errors are empty', () => {
    const { container } = render(<ValidationErrorPanel errors={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders error count in header', () => {
    render(<ValidationErrorPanel errors={mockErrors} />)
    expect(screen.getByText('Ошибки валидации (3)')).toBeInTheDocument()
  })

  it('renders all error items', () => {
    render(<ValidationErrorPanel errors={mockErrors} />)
    expect(screen.getByText('Не указана себестоимость товара')).toBeInTheDocument()
    expect(screen.getByText('Не настроена упаковка товара')).toBeInTheDocument()
    expect(screen.getByText('Паллет не содержит товаров')).toBeInTheDocument()
  })

  it('renders navigation links for MISSING_COGS', () => {
    render(<ValidationErrorPanel errors={[mockErrors[0]]} />)
    const links = screen.getAllByText('Указать себестоимость')
    expect(links).toHaveLength(2)
    expect(links[0].closest('a')).toHaveAttribute('href', '/products?filter=111')
    expect(links[1].closest('a')).toHaveAttribute('href', '/products?filter=222')
  })

  it('renders navigation link for MISSING_PACKAGING', () => {
    render(<ValidationErrorPanel errors={[mockErrors[1]]} />)
    const link = screen.getByText('Настроить упаковку')
    expect(link.closest('a')).toHaveAttribute('href', '/shipments/sku-packaging')
  })

  it('renders affected IDs for errors without links', () => {
    render(<ValidationErrorPanel errors={[mockErrors[2]]} />)
    expect(screen.getByText('Затронуто: pallet-1')).toBeInTheDocument()
  })

  it('has role=alert for accessibility', () => {
    render(<ValidationErrorPanel errors={mockErrors} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('normalizes backend-specific code NO_PALLETS to EMPTY_SHIPMENT display', () => {
    const backendErrors: ValidationError[] = [
      { code: 'NO_PALLETS', message: 'No pallets in shipment' },
    ]
    render(<ValidationErrorPanel errors={backendErrors} />)
    expect(screen.getByText('В отправке нет паллетов')).toBeInTheDocument()
  })

  it('normalizes backend INVALID_BOX_VOLUME to ZERO_VOLUME display', () => {
    const backendErrors: ValidationError[] = [
      { code: 'INVALID_BOX_VOLUME', message: 'Box volume is zero', affectedIds: ['bl-1'] },
    ]
    render(<ValidationErrorPanel errors={backendErrors} />)
    expect(screen.getByText('Объём коробки равен нулю')).toBeInTheDocument()
    expect(screen.getByText('Затронуто: bl-1')).toBeInTheDocument()
  })

  it('renders fallback for unknown error codes', () => {
    const unknownErrors: ValidationError[] = [
      { code: 'BRAND_NEW_ERROR', message: 'Something unexpected', affectedIds: ['x-1'] },
    ]
    render(<ValidationErrorPanel errors={unknownErrors} />)
    expect(screen.getByText('Something unexpected')).toBeInTheDocument()
    expect(screen.getByText('Затронуто: x-1')).toBeInTheDocument()
  })

  it('renders fallback with code when unknown error has no message', () => {
    const unknownErrors: ValidationError[] = [{ code: 'MYSTERY_CODE', message: '' }]
    render(<ValidationErrorPanel errors={unknownErrors} />)
    expect(screen.getByText('MYSTERY_CODE')).toBeInTheDocument()
  })
})

describe('getAffectedBoxLineIds', () => {
  it('returns empty array for no errors', () => {
    expect(getAffectedBoxLineIds([])).toEqual([])
  })

  it('collects all affected IDs across errors', () => {
    const ids = getAffectedBoxLineIds(mockErrors)
    expect(ids).toContain('111')
    expect(ids).toContain('222')
    expect(ids).toContain('333')
    expect(ids).toContain('pallet-1')
  })

  it('deduplicates affected IDs', () => {
    const duplicated: ValidationError[] = [
      { code: ValidationErrorCode.ZERO_UNITS, message: 'test', affectedIds: ['a', 'b'] },
      { code: ValidationErrorCode.ZERO_VOLUME, message: 'test', affectedIds: ['b', 'c'] },
    ]
    const ids = getAffectedBoxLineIds(duplicated)
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('handles errors without affectedIds', () => {
    const noIds: ValidationError[] = [{ code: ValidationErrorCode.EMPTY_SHIPMENT, message: 'test' }]
    expect(getAffectedBoxLineIds(noIds)).toEqual([])
  })
})
