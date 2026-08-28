import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { DimensionInputSection } from '../DimensionInputSection'

interface DimensionFields {
  length_cm: number
  width_cm: number
  height_cm: number
}

const register = ((name: keyof DimensionFields) => ({
  name,
  onBlur: vi.fn(),
  onChange: vi.fn(),
  ref: vi.fn(),
})) as UseFormRegister<DimensionFields>

describe('DimensionInputSection accessibility and reflow', () => {
  it('associates each invalid dimension with its field error', () => {
    const errors: FieldErrors<DimensionFields> = {
      length_cm: { type: 'max', message: 'Макс. 300 см' },
      width_cm: { type: 'min', message: 'Мин. 0 см' },
    }

    render(
      <DimensionInputSection<DimensionFields>
        register={register}
        errors={errors}
        dimensions={{ length_cm: 0, width_cm: 0, height_cm: 0 }}
      />
    )

    const length = screen.getByLabelText('Длина, см')
    const width = screen.getByLabelText('Ширина, см')
    const height = screen.getByLabelText('Высота, см')

    expect(length).toHaveAttribute('aria-invalid', 'true')
    expect(length).toHaveAttribute('aria-describedby', 'length_cm-error')
    expect(screen.getByText('Макс. 300 см')).toHaveAttribute('id', 'length_cm-error')
    expect(width).toHaveAttribute('aria-invalid', 'true')
    expect(width).toHaveAttribute('aria-describedby', 'width_cm-error')
    expect(screen.getByText('Мин. 0 см')).toHaveAttribute('id', 'width_cm-error')
    expect(height).not.toHaveAttribute('aria-invalid')
    expect(height).not.toHaveAttribute('aria-describedby')
  })

  it('stacks fields at narrow widths and restores three columns from sm', () => {
    const { container } = render(
      <DimensionInputSection<DimensionFields>
        register={register}
        errors={{}}
        dimensions={{ length_cm: 0, width_cm: 0, height_cm: 0 }}
      />
    )

    expect(container.querySelector('.grid-cols-1.sm\\:grid-cols-3')).toBeInTheDocument()
  })
})
