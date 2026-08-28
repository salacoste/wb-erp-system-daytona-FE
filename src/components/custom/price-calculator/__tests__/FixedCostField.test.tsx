import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from '@/components/ui/input'
import { FixedCostField } from '../FixedCostField'

describe('FixedCostField accessibility', () => {
  it('associates an invalid input with its rendered error', () => {
    render(
      <FixedCostField
        id="cogs_rub"
        label="Себестоимость"
        tooltipContent="Стоимость товара"
        error="Себестоимость не может быть отрицательной"
      >
        <Input id="cogs_rub" />
      </FixedCostField>
    )

    const input = screen.getByLabelText('Себестоимость')
    const error = screen.getByRole('alert')

    expect(error).toHaveAttribute('id', 'cogs_rub-error')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'cogs_rub-error')
  })

  it('does not expose invalid state when no error is present', () => {
    render(
      <FixedCostField id="packaging_rub" label="Упаковка" tooltipContent="Стоимость упаковки">
        <Input id="packaging_rub" />
      </FixedCostField>
    )

    const input = screen.getByLabelText('Упаковка')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })
})
