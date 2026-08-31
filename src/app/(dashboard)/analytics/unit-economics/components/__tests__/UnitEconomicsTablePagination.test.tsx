import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UnitEconomicsTablePagination } from '../UnitEconomicsTablePagination'

describe('UnitEconomicsTablePagination', () => {
  it('names the page-size and navigation controls', () => {
    render(
      <UnitEconomicsTablePagination
        startIndex={0}
        endIndex={25}
        totalItems={100}
        showPagination
        pageSize={25}
        currentPage={2}
        totalPages={4}
        onPageSizeChange={vi.fn()}
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByRole('combobox', { name: 'Количество строк на странице' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeVisible()
  })
})
