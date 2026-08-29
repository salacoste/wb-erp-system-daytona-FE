'use client'

import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDeleteExpense } from '@/hooks/useExpensesCRUD'
import { formatCurrency } from '@/lib/utils'
import { getExpenseCategoryLabel, type ExpenseItem } from '@/types/expenses'

interface ExpenseTableProps {
  expenses: ExpenseItem[]
  onEdit: (expense: ExpenseItem, trigger: HTMLButtonElement) => void
  onDeleteSuccessFocus: () => void
}

function formatMonth(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return 'Период недоступен'
  const text = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(new Date(`${month}-01T00:00:00Z`))
    .replace(' г.', '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatAmount(amount: number) {
  return Number.isFinite(amount) ? formatCurrency(amount) : 'Сумма недоступна'
}

function expenseName(expense: ExpenseItem) {
  return `${getExpenseCategoryLabel(expense.category)}, ${formatAmount(expense.amount)}`
}

export function ExpenseTable({ expenses, onEdit, onDeleteSuccessFocus }: ExpenseTableProps) {
  const [selected, setSelected] = useState<ExpenseItem | null>(null)
  const [deleteError, setDeleteError] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const returnFocus = useRef<() => void>(() => undefined)
  const deleteMutation = useDeleteExpense()

  function closeDialog() {
    if (!deleteMutation.isPending) {
      setSelected(null)
      setDeleteError(false)
    }
  }

  function confirmDelete() {
    if (!selected || deleteMutation.isPending) return
    deleteMutation.mutate(selected.id, {
      onSuccess: () => {
        returnFocus.current = onDeleteSuccessFocus
        setSelected(null)
        setDeleteError(false)
      },
      onError: () => setDeleteError(true),
    })
  }

  const period = formatMonth(expenses[0]?.month ?? '')

  return (
    <>
      <Card className="min-w-0 overflow-hidden">
        <Table
          scrollContainerTabIndex={0}
          scrollContainerAriaLabel={`Таблица расходов за ${period}`}
        >
          <caption className="sr-only">Расходы за {period}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Категория</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>Состояние записи</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map(expense => {
              const name = expenseName(expense)
              return (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {getExpenseCategoryLabel(expense.category)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(expense.amount)}
                  </TableCell>
                  <TableCell>{formatMonth(expense.month)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-status-success/40 bg-status-success/10 text-foreground"
                    >
                      Сохранён
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-64 break-words text-muted-foreground">
                    {expense.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-11"
                        aria-label={`Изменить расход ${name}`}
                        onClick={event => onEdit(expense, event.currentTarget)}
                      >
                        Изменить
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-11 text-destructive hover:text-destructive"
                        aria-label={`Удалить расход ${name}`}
                        onClick={event => {
                          triggerRef.current = event.currentTarget
                          returnFocus.current = () => triggerRef.current?.focus()
                          setDeleteError(false)
                          setSelected(expense)
                        }}
                      >
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={selected !== null} onOpenChange={open => !open && closeDialog()}>
        <AlertDialogContent
          aria-busy={deleteMutation.isPending || undefined}
          className="min-w-0 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto"
          onCloseAutoFocus={event => {
            event.preventDefault()
            returnFocus.current()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить расход?</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              {selected
                ? `${expenseName(selected)} будет удалён без возможности восстановления.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              Не удалось удалить расход. Проверьте соединение и повторите попытку.
            </p>
          )}
          <AlertDialogFooter className="min-w-0">
            <AlertDialogCancel disabled={deleteMutation.isPending}>Отмена</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              aria-label={
                deleteMutation.isPending
                  ? `Удаление расхода ${selected ? expenseName(selected) : ''}`
                  : `Подтвердить удаление расхода ${selected ? expenseName(selected) : ''}`
              }
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? 'Удаление…' : 'Удалить расход'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
