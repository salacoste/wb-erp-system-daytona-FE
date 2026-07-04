/**
 * S3: BrandSubjectFilter component tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BrandSubjectFilter } from '../BrandSubjectFilter'
import type { DictionaryEntry } from '@/types/product-dictionaries'

const brands: DictionaryEntry[] = [
  { value: 'Nike', count: 42 },
  { value: 'Adidas', count: 17 },
]
const subjects: DictionaryEntry[] = [{ value: 'Кроссовки', count: 30 }]

describe('BrandSubjectFilter (S3)', () => {
  const onBrandChange = vi.fn()
  const onSubjectChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders brand options with counts', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BrandSubjectFilter
        brands={brands}
        subjects={subjects}
        brand={null}
        subject={null}
        onBrandChange={onBrandChange}
        onSubjectChange={onSubjectChange}
      />
    )

    await user.click(screen.getByLabelText('Фильтр по бренду'))
    expect(screen.getByText('Nike (42)')).toBeInTheDocument()
    expect(screen.getByText('Adidas (17)')).toBeInTheDocument()
  })

  it('fires onBrandChange with the chosen value', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BrandSubjectFilter
        brands={brands}
        subjects={subjects}
        brand={null}
        subject={null}
        onBrandChange={onBrandChange}
        onSubjectChange={onSubjectChange}
      />
    )

    await user.click(screen.getByLabelText('Фильтр по бренду'))
    await user.click(screen.getByText('Nike (42)'))

    expect(onBrandChange).toHaveBeenCalledWith('Nike')
  })

  it('clears the brand filter (null) when «Все» selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BrandSubjectFilter
        brands={brands}
        subjects={subjects}
        brand="Nike"
        subject={null}
        onBrandChange={onBrandChange}
        onSubjectChange={onSubjectChange}
      />
    )

    await user.click(screen.getByLabelText('Фильтр по бренду'))
    // Scope «Все» to the open brand listbox (both selects have a «Все» option).
    const listbox = await screen.findByRole('listbox')
    await user.click(within(listbox).getByText('Все'))

    expect(onBrandChange).toHaveBeenCalledWith(null)
  })

  it('renders subject (category) options from the subjects axis', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BrandSubjectFilter
        brands={brands}
        subjects={subjects}
        brand={null}
        subject={null}
        onBrandChange={onBrandChange}
        onSubjectChange={onSubjectChange}
      />
    )

    await user.click(screen.getByLabelText('Фильтр по категории'))
    expect(screen.getByText('Кроссовки (30)')).toBeInTheDocument()
  })
})
