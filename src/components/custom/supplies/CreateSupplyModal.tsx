/**
 * Create Supply Modal Component
 * Story 53.3-FE: Create Supply Flow
 * Epic 53-FE: Supply Management UI
 *
 * Modal dialog for creating new supplies with optional name input.
 * Uses react-hook-form with zod validation.
 */

'use client'

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSupply } from '@/hooks/useCreateSupply'

// Form validation schema
const createSupplySchema = z.object({
  name: z
    .string()
    .max(100, 'Максимум 100 символов')
    .optional()
    .transform(val => val?.trim() || undefined),
})

type CreateSupplyFormValues = z.infer<typeof createSupplySchema>

export interface CreateSupplyModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
}

/**
 * Modal for creating new supplies
 *
 * Features:
 * - Optional name input with max 100 characters
 * - Loading state during creation
 * - Auto-redirects to detail page on success
 * - Error handling with toast notifications
 *
 * @example
 * const [isOpen, setIsOpen] = useState(false)
 * <CreateSupplyModal open={isOpen} onOpenChange={setIsOpen} />
 */
export function CreateSupplyModal({ open, onOpenChange }: CreateSupplyModalProps) {
  const { mutate, isPending } = useCreateSupply()
  const inputRef = useRef<HTMLInputElement>(null)

  const form = useForm<CreateSupplyFormValues>({
    resolver: zodResolver(createSupplySchema),
    defaultValues: { name: '' },
  })

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      // Use setTimeout to wait for modal animation
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  const onSubmit = (values: CreateSupplyFormValues) => {
    mutate(
      { name: values.name },
      {
        onSuccess: () => {
          form.reset()
          onOpenChange(false)
        },
      }
    )
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      form.handleSubmit(onSubmit)()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]" aria-describedby="create-supply-description">
        <DialogHeader>
          <DialogTitle>Новая поставка</DialogTitle>
          <DialogDescription id="create-supply-description">
            Создайте поставку для группировки заказов
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supply-name">Название поставки (опционально)</Label>
            <Input
              id="supply-name"
              placeholder="Например: Поставка на склад Коледино"
              disabled={isPending}
              maxLength={100}
              {...form.register('name')}
              ref={e => {
                form.register('name').ref(e)
                // @ts-expect-error - combining refs for focus
                inputRef.current = e
              }}
              onKeyDown={handleKeyDown}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
