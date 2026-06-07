'use client'

/**
 * Operational Expenses Page
 * Manual expense tracking with CRUD operations
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { useExpensesList, useDeleteExpense } from '@/hooks/useExpensesCRUD'
import { getExpenseCategoryLabel, type ExpenseItem } from '@/types/expenses'
import { Plus } from 'lucide-react'
import { ExpenseSummaryCards } from './components/ExpenseSummaryCards'
import { ExpenseFormDialog } from './components/ExpenseFormDialog'

function getCurrentMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function ExpensesPage() {
  const [month, setMonth] = useState(getCurrentMonth)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)

  const { data: expenses, isLoading } = useExpensesList(month)
  const deleteMutation = useDeleteExpense()

  function handleEdit(expense: ExpenseItem) {
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditingExpense(null)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id)
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Операционные расходы</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Учёт и управление операционными расходами по месяцам
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить расход
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="month-selector" className="text-sm font-medium">
          Месяц:
        </label>
        <Input
          id="month-selector"
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="w-44"
        />
      </div>

      <ExpenseSummaryCards month={month} />

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !expenses || expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Нет расходов за этот месяц</p>
            <Button variant="outline" className="mt-4" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить первый расход
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map(expense => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        month={month}
        editingExpense={editingExpense}
      />
    </div>
  )
}

interface ExpenseRowProps {
  expense: ExpenseItem
  onEdit: (expense: ExpenseItem) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

function ExpenseRow({ expense, onEdit, onDelete, isDeleting }: ExpenseRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{getExpenseCategoryLabel(expense.category)}</TableCell>
      <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
      <TableCell className="text-muted-foreground">{expense.description ?? '—'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}>
            Изменить
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(expense.id)}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            Удалить
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
