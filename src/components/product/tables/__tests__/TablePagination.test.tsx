import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { TablePagination } from '../TablePagination'

expect.extend(toHaveNoViolations)

describe('TablePagination', () => {
  it('names offset pagination and keeps the result scope visible', () => {
    render(
      <TablePagination
        kind="offset"
        label="Страницы товаров"
        currentPage={2}
        totalPages={7}
        resultScope="Товары 26–50 из 164"
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByRole('navigation', { name: 'Страницы товаров' })).toBeInTheDocument()
    expect(screen.getByText('Страница 2 из 7')).toBeInTheDocument()
    expect(screen.getByText('Товары 26–50 из 164')).toBeInTheDocument()
  })

  it.each([
    [1, 7, true, false],
    [4, 7, false, false],
    [7, 7, false, true],
    [1, 1, true, true],
  ] as const)(
    'guards offset page %s of %s',
    (currentPage, totalPages, previousDisabled, nextDisabled) => {
      render(
        <TablePagination
          kind="offset"
          label="Страницы товаров"
          currentPage={currentPage}
          totalPages={totalPages}
          resultScope="Текущий результат"
          onPageChange={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toHaveProperty(
        'disabled',
        previousDisabled
      )
      expect(screen.getByRole('button', { name: 'Следующая страница' })).toHaveProperty(
        'disabled',
        nextDisabled
      )
    }
  )

  it('calls the caller with adjacent offset pages exactly once', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <TablePagination
        kind="offset"
        label="Страницы товаров"
        currentPage={3}
        totalPages={7}
        resultScope="Товары 51–75 из 164"
        onPageChange={onPageChange}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Предыдущая страница' }))
    await user.click(screen.getByRole('button', { name: 'Следующая страница' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 4)
    expect(onPageChange).toHaveBeenCalledTimes(2)
  })

  it('renders an honest zero-page scope without inventing page one', () => {
    render(
      <TablePagination
        kind="offset"
        label="Страницы товаров"
        currentPage={0}
        totalPages={0}
        resultScope="Товаров нет"
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByText('Страниц нет')).toBeInTheDocument()
    expect(screen.queryByText('Страница 1 из 1')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeDisabled()
  })

  it.each([
    [0, 7],
    [8, 7],
    [1.5, 7],
  ])('guards invalid offset range %s of %s', (currentPage, totalPages) => {
    render(
      <TablePagination
        kind="offset"
        currentPage={currentPage}
        totalPages={totalPages}
        label="Страницы товаров"
        resultScope="Некорректный диапазон"
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByText('Недоступный диапазон страниц')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeDisabled()
  })

  it('uses cursor availability and fires each caller-owned callback exactly once', async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()
    const onNext = vi.fn()

    render(
      <TablePagination
        kind="cursor"
        label="Переходы по товарам"
        resultScope="Показано 25 товаров"
        hasPrevious
        hasNext
        onPrevious={onPrevious}
        onNext={onNext}
      />
    )

    expect(screen.queryByText(/Страница/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Предыдущая страница' }))
    await user.click(screen.getByRole('button', { name: 'Следующая страница' }))
    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('keeps scope visible and disables both actions while updating', () => {
    render(
      <TablePagination
        kind="cursor"
        label="Переходы по товарам"
        resultScope="Показано 25 товаров; результаты обновляются"
        hasPrevious
        hasNext
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        updating
      />
    )

    expect(screen.getByText('Показано 25 товаров; результаты обновляются')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeDisabled()
  })

  it('presents caller-owned page-size meaning without owning page-size state', () => {
    render(
      <TablePagination
        kind="offset"
        label="Страницы товаров"
        currentPage={2}
        totalPages={7}
        resultScope="Товары 26–50 из 164"
        pageSize={<span>По 25 товаров на странице</span>}
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByText('По 25 товаров на странице')).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <TablePagination
        kind="offset"
        label="Страницы товаров"
        currentPage={2}
        totalPages={7}
        resultScope="Товары 26–50 из 164"
        onPageChange={vi.fn()}
      />
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
