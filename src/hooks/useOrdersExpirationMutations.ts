import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  autoFillOrderExpiration,
  ordersQueryKeys,
  reconcileOrderExpiration,
  updateOrderExpiration,
} from '@/lib/api/orders'
import { isExpirationOutcomeUncertain } from '@/lib/api/order-expiration-error'
import { logger } from '@/lib/logger'
import type {
  AutoFillOrderExpirationResponse,
  ReconcileOrderExpirationResponse,
  UpdateOrderExpirationResponse,
} from '@/types/orders-actions'

export interface UpdateOrderExpirationInput {
  /** Internal OrderFbs UUID used by the mutation route. */
  orderUuid: string
  /** WB order ID used by the detail query cache. */
  wbOrderId: string
  expirationDate: string
}

export function useUpdateOrderExpiration() {
  const queryClient = useQueryClient()

  return useMutation<UpdateOrderExpirationResponse, Error, UpdateOrderExpirationInput>({
    mutationFn: ({ orderUuid, expirationDate }) =>
      updateOrderExpiration(orderUuid, { expirationDate }),
    onSuccess: (_data, variables) => {
      logger.debug('[Orders] Expiration updated:', variables.wbOrderId)
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(variables.wbOrderId) })
      toast.success('Срок годности сохранён')
    },
    onError: async (error, variables) => {
      logger.error('[Orders] Expiration update failed:', error)
      if (isExpirationOutcomeUncertain(error)) {
        try {
          const result = await reconcileOrderExpiration(variables.orderUuid)
          await queryClient.invalidateQueries({
            queryKey: ordersQueryKeys.detail(variables.wbOrderId),
          })
          if (result.verified) {
            toast.success('Срок годности подтверждён повторным чтением WB')
            return
          }
          toast.error('WB вернул другой или неполный срок; повторная запись заблокирована')
          return
        } catch (reconcileError) {
          logger.error('[Orders] Expiration reconciliation failed:', reconcileError)
          await queryClient.invalidateQueries({
            queryKey: ordersQueryKeys.detail(variables.wbOrderId),
          })
        }
      }
      toast.error(error.message || 'Не удалось сохранить срок годности')
    },
  })
}

export interface AutoFillOrderExpirationInput {
  orderUuid: string
  wbOrderId: string
}

export function useAutoFillOrderExpiration() {
  const queryClient = useQueryClient()

  return useMutation<AutoFillOrderExpirationResponse, Error, AutoFillOrderExpirationInput>({
    mutationFn: ({ orderUuid }) => autoFillOrderExpiration(orderUuid),
    onSuccess: (_data, variables) => {
      logger.debug('[Orders] Expiration auto-filled from FEFO:', variables.wbOrderId)
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(variables.wbOrderId) })
      toast.success('Срок годности заполнен по партии FEFO')
    },
    onError: async (error, variables) => {
      logger.error('[Orders] FEFO expiration update failed:', error)
      if (isExpirationOutcomeUncertain(error)) {
        try {
          const result = await reconcileOrderExpiration(variables.orderUuid)
          await queryClient.invalidateQueries({
            queryKey: ordersQueryKeys.detail(variables.wbOrderId),
          })
          if (result.verified) {
            toast.success('Срок партии подтверждён повторным чтением WB')
            return
          }
          toast.error('WB не подтвердил срок партии; резерв оставлен заблокированным')
          return
        } catch (reconcileError) {
          logger.error('[Orders] FEFO expiration reconciliation failed:', reconcileError)
          await queryClient.invalidateQueries({
            queryKey: ordersQueryKeys.detail(variables.wbOrderId),
          })
        }
      }
      toast.error(error.message || 'Не удалось подобрать партию FEFO')
    },
  })
}

export interface ReconcileOrderExpirationInput {
  orderUuid: string
  wbOrderId: string
}

/** Performs a read-only WB reconciliation; it never repeats the expiration PUT. */
export function useReconcileOrderExpiration() {
  const queryClient = useQueryClient()

  return useMutation<ReconcileOrderExpirationResponse, Error, ReconcileOrderExpirationInput>({
    mutationFn: ({ orderUuid }) => reconcileOrderExpiration(orderUuid),
    onSuccess: async (data, variables) => {
      logger.debug('[Orders] Expiration reconciled:', variables.wbOrderId, data.outcome)
      await queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(variables.wbOrderId),
      })
      if (data.verified) {
        toast.success('Срок годности подтверждён повторным чтением WB')
        return
      }
      toast.error(
        data.outcome === 'mismatch'
          ? 'WB вернул другой срок; результат зафиксирован, дату можно записать повторно'
          : 'WB вернул некорректные метаданные; повторная запись остаётся заблокированной'
      )
    },
    onError: async (error, variables) => {
      logger.error('[Orders] Expiration reconciliation failed:', error)
      await queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(variables.wbOrderId),
      })
      toast.error(error.message || 'Не удалось перечитать срок годности из WB')
    },
  })
}
