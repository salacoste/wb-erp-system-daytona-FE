'use client'
import { useEffect, useRef, useState } from 'react'
import * as DialogUi from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import * as SelectUi from '@/components/ui/select'
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpensesCRUD'
import { EXPENSE_CATEGORY_CONFIG, type ExpenseCategory, type ExpenseItem } from '@/types/expenses'
interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  editingExpense?: ExpenseItem | null
  onReturnFocus: (useFallback: boolean) => void
}
export function ExpenseFormDialog({
  open,
  onOpenChange,
  month,
  editingExpense,
  onReturnFocus,
}: ExpenseFormDialogProps) {
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [amount, setAmount] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [description, setDescription] = useState('')
  const [invalidField, setInvalidField] = useState<'amount' | 'month' | null>(null)
  const [submitError, setSubmitError] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const useFallbackFocus = useRef(false)
  const [createMutation, updateMutation] = [useCreateExpense(), useUpdateExpense()]
  const isEditing = !!editingExpense
  useEffect(() => {
    if (!open) return
    setCategory(editingExpense?.category ?? 'other')
    setAmount(editingExpense ? String(editingExpense.amount) : '')
    setSelectedMonth(editingExpense?.month ?? month)
    setDescription(editingExpense?.description ?? '')
    setInvalidField(null)
    setSubmitError(false)
    useFallbackFocus.current = false
  }, [open, editingExpense, month])
  const isPending = createMutation.isPending || updateMutation.isPending
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen || !isPending) onOpenChange(nextOpen)
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPending) return
    const amountIsValid = amountRef.current?.validity.valid ?? false
    const monthIsValid = isEditing || /^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)
    const invalid = !amountIsValid ? 'amount' : !monthIsValid ? 'month' : null
    if (invalid) {
      setInvalidField(invalid)
      setSubmitError(false)
      ;(invalid === 'amount' ? amountRef : monthRef).current?.focus()
      return
    }
    setInvalidField(null)
    setSubmitError(false)
    const callbacks = {
      onSuccess: () => {
        useFallbackFocus.current = !isEditing
        onOpenChange(false)
      },
      onError: () => setSubmitError(true),
    }
    const data = { amount: Number(amount), description: description || undefined }
    if (isEditing && editingExpense)
      updateMutation.mutate({ id: editingExpense.id, data }, callbacks)
    else createMutation.mutate({ category, month: selectedMonth, ...data }, callbacks)
  }
  return (
    <DialogUi.Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogUi.DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-md"
        onCloseAutoFocus={event => {
          event.preventDefault()
          onReturnFocus(useFallbackFocus.current)
        }}
      >
        <DialogUi.DialogHeader>
          <DialogUi.DialogTitle>
            {isEditing ? 'Редактировать расход' : 'Добавить расход'}
          </DialogUi.DialogTitle>
          <DialogUi.DialogDescription>
            Заполните категорию, месяц, сумму и описание управленческого расхода.
          </DialogUi.DialogDescription>
        </DialogUi.DialogHeader>
        <form
          onSubmit={handleSubmit}
          noValidate
          onInput={() => setSubmitError(false)}
          className="space-y-4"
          aria-label="Форма расхода"
          aria-busy={isPending || undefined}
        >
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="expense-category">Категория</Label>
              <SelectUi.Select
                value={category}
                onValueChange={v => setCategory(v as ExpenseCategory)}
              >
                <SelectUi.SelectTrigger id="expense-category">
                  <SelectUi.SelectValue placeholder="Выберите категорию" />
                </SelectUi.SelectTrigger>
                <SelectUi.SelectContent>
                  {EXPENSE_CATEGORY_CONFIG.map(cat => (
                    <SelectUi.SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectUi.SelectItem>
                  ))}
                </SelectUi.SelectContent>
              </SelectUi.Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Сумма (₽)</Label>
            <Input
              ref={amountRef}
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => {
                setAmount(e.target.value)
                setInvalidField(null)
              }}
              aria-invalid={invalidField === 'amount' || undefined}
              aria-describedby={invalidField === 'amount' ? 'expense-amount-error' : undefined}
              placeholder="0.00"
              required
            />
            {invalidField === 'amount' && (
              <p id="expense-amount-error" role="alert" className="text-sm text-destructive">
                Введите сумму от 0,01 ₽ с точностью до копеек
              </p>
            )}
          </div>
          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              Не удалось сохранить расход. Проверьте соединение и повторите попытку.
            </p>
          )}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="expense-month">Месяц</Label>
              <Input
                ref={monthRef}
                id="expense-month"
                type="month"
                value={selectedMonth}
                onChange={e => {
                  setSelectedMonth(e.target.value)
                  setInvalidField(null)
                }}
                aria-invalid={invalidField === 'month' || undefined}
                aria-describedby={invalidField === 'month' ? 'expense-month-error' : undefined}
                required
              />
              {invalidField === 'month' && (
                <p id="expense-month-error" role="alert" className="text-sm text-destructive">
                  Выберите корректный месяц
                </p>
              )}
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
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !amount}>
              {isPending ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogUi.DialogContent>
    </DialogUi.Dialog>
  )
}
