'use client'

/**
 * Expense Form Dialog
 * Create/edit expense items with category, amount, month, and description
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpensesCRUD'
import { EXPENSE_CATEGORY_CONFIG, type ExpenseCategory, type ExpenseItem } from '@/types/expenses'

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  editingExpense?: ExpenseItem | null
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  month,
  editingExpense,
}: ExpenseFormDialogProps) {
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [amount, setAmount] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [description, setDescription] = useState('')

  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()
  const isEditing = !!editingExpense

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        setCategory(editingExpense.category)
        setAmount(String(editingExpense.amount))
        setSelectedMonth(editingExpense.month)
        setDescription(editingExpense.description ?? '')
      } else {
        setCategory('other')
        setAmount('')
        setSelectedMonth(month)
        setDescription('')
      }
    }
  }, [open, editingExpense, month])

  const isPending = createMutation.isPending || updateMutation.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) return

    if (isEditing && editingExpense) {
      updateMutation.mutate(
        {
          id: editingExpense.id,
          data: {
            amount: parsedAmount,
            description: description || undefined,
          },
        },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(
        {
          category,
          amount: parsedAmount,
          month: selectedMonth,
          description: description || undefined,
        },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Редактировать расход' : 'Добавить расход'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="expense-category">Категория</Label>
              <Select value={category} onValueChange={v => setCategory(v as ExpenseCategory)}>
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORY_CONFIG.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Сумма (₽)</Label>
            <Input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="expense-month">Месяц</Label>
              <Input
                id="expense-month"
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expense-description">Описание (необязательно)</Label>
            <Textarea
              id="expense-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Комментарий к расходу"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !amount}>
              {isPending ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
