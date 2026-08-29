'use client'

import { useRef, useState, type MouseEvent } from 'react'
import { Plus } from 'lucide-react'
import { ContextBar, PageHeader } from '@/components/product'
import { PageState } from '@/components/product/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExpensesList } from '@/hooks/useExpensesCRUD'
import type { ExpenseItem } from '@/types/expenses'
import { ExpenseFormDialog } from './components/ExpenseFormDialog'
import { ExpenseSummaryCards } from './components/ExpenseSummaryCards'
import { ExpenseTable } from './components/ExpenseTable'

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function ExpensesPage() {
  const [month, setMonth] = useState(getCurrentMonth)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const dialogTriggerRef = useRef<HTMLButtonElement | null>(null)
  const monthIsValid = /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
  const queryMonth = monthIsValid ? month : ''
  const { data: expenses, isLoading, isError, isFetching, refetch } = useExpensesList(queryMonth)

  function openCreate(event: MouseEvent<HTMLButtonElement>) {
    dialogTriggerRef.current = event.currentTarget
    setEditingExpense(null)
    setDialogOpen(true)
  }

  function openEdit(expense: ExpenseItem, trigger: HTMLButtonElement) {
    dialogTriggerRef.current = trigger
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  function returnDialogFocus(useFallback: boolean) {
    const opener = dialogTriggerRef.current
    const target = !useFallback && opener?.isConnected ? opener : addButtonRef.current
    target?.focus()
  }

  const count = expenses?.length ?? 0

  return (
    <section aria-label="Настройки операционных расходов" className="space-y-6 py-2">
      <PageHeader
        title="Операционные расходы"
        description="Учёт и управление операционными расходами по месяцам"
        breadcrumbs={[
          { label: 'Главная', href: '/dashboard' },
          { label: 'Настройки', href: '/settings' },
          { label: 'Расходы' },
        ]}
        busy={monthIsValid && isLoading}
        actions={
          <Button ref={addButtonRef} onClick={openCreate} className="min-h-11">
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Добавить расход
          </Button>
        }
      />

      <ContextBar
        period={month}
        periodLabel="Учётный месяц"
        items={
          monthIsValid && expenses && !isError
            ? [{ id: 'expense-count', label: 'Сохранено расходов', value: count }]
            : []
        }
        state={
          !monthIsValid || isError
            ? 'unavailable'
            : isFetching || !expenses
              ? 'refreshing'
              : 'fresh'
        }
        stateLabel={
          !monthIsValid ? 'Выберите корректный месяц' : isError ? 'Список недоступен' : undefined
        }
      >
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <label htmlFor="month-selector" className="text-sm font-medium">
            Выбрать месяц
          </label>
          <Input
            id="month-selector"
            type="month"
            value={month}
            onChange={event => setMonth(event.target.value)}
            aria-invalid={!monthIsValid || undefined}
            aria-describedby={!monthIsValid ? 'month-selector-error' : undefined}
            className="min-h-11 w-44 max-w-full"
          />
          {!monthIsValid && (
            <p id="month-selector-error" role="alert" className="text-sm text-destructive">
              Выберите корректный месяц
            </p>
          )}
        </div>
      </ContextBar>

      {monthIsValid && <ExpenseSummaryCards month={month} />}

      {!monthIsValid ? (
        <PageState
          state="error"
          title="Выберите корректный месяц"
          explanation="Список и сводка недоступны без корректного учётного месяца."
          trust="Нулевые суммы и пустой список не показываются без ответа сервера."
          recovery={
            <Button onClick={() => document.getElementById('month-selector')?.focus()}>
              Выбрать месяц
            </Button>
          }
        />
      ) : isLoading ? (
        <PageState
          state="loading"
          title="Загружаем расходы"
          explanation="Получаем сохранённые расходы за выбранный месяц."
          trust="Список появится только после успешного ответа сервера."
        />
      ) : isError ? (
        <PageState
          state="error"
          title="Не удалось загрузить расходы"
          explanation="Сервер не вернул список расходов за выбранный месяц."
          trust="Пустой список не показывается, чтобы ошибка не выглядела как отсутствие расходов."
          recovery={<Button onClick={() => void refetch()}>Повторить загрузку</Button>}
        />
      ) : !expenses ? (
        <PageState
          state="error"
          title="Список расходов пока недоступен"
          explanation="Сервер ещё не подтвердил данные за выбранный месяц."
          trust="Неизвестный результат не показывается как пустой список."
          recovery={<Button onClick={() => void refetch()}>Повторить загрузку</Button>}
        />
      ) : count === 0 ? (
        <PageState
          state="empty"
          title="Нет расходов за этот месяц"
          explanation="Для выбранного месяца пока нет сохранённых операционных расходов."
          trust="Добавьте первый расход или выберите другой месяц."
          action={
            <Button variant="outline" onClick={openCreate}>
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Добавить первый расход
            </Button>
          }
        />
      ) : (
        <ExpenseTable
          expenses={expenses!}
          onEdit={openEdit}
          onDeleteSuccessFocus={() => addButtonRef.current?.focus()}
        />
      )}

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        month={month}
        editingExpense={editingExpense}
        onReturnFocus={returnDialogFocus}
      />
    </section>
  )
}
