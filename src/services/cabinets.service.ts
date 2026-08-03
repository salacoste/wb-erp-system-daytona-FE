/**
 * Cabinet service functions
 * Handles cabinet creation with automatic JWT token refresh
 */

import { createCabinet } from '@/lib/api'
import { updateCabinetTaxSettings } from '@/lib/api/cabinet'
import { useAuthStore } from '@/stores/authStore'
import type { CreateCabinetResponse } from '@/types/cabinet'
import { logger } from '@/lib/logger'

/**
 * Creates a cabinet and automatically updates JWT token in auth store.
 * ⚠️ КРИТИЧНО: После создания кабинета backend возвращает новый JWT токен.
 * Этот токен ОБЯЗАТЕЛЬНО обновляется в auth store, иначе пользователь не сможет получить доступ к созданному кабинету.
 *
 * @param cabinetName - Название кабинета
 * @returns Созданный кабинет и опциональные задачи синхронизации
 * @throws Error если создание кабинета или обновление токена не удалось
 */
export async function handleCreateCabinet(
  cabinetName: string,
  targetMarginPct: number
): Promise<{
  cabinet: {
    id: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    targetMarginPct: number | null
  }
  productsSyncTasks?: CreateCabinetResponse['productsSyncTasks']
}> {
  const { token, refreshToken: refreshTokenInStore, user } = useAuthStore.getState()

  if (!token) {
    throw new Error('User not authenticated')
  }

  try {
    // 1. Создаем кабинет
    const response = await createCabinet({ name: cabinetName }, token)

    // 2. ⚠️ КРИТИЧНО: Обновляем JWT токен в store синхронно
    // Используем refreshToken() метод из store
    try {
      refreshTokenInStore(response.newToken, user || undefined)
    } catch (tokenError) {
      // Критическая ошибка - токен не обновлен
      logger.error('Failed to update token after cabinet creation:', tokenError)
      throw new Error(
        'Cabinet created, but token update failed. Please refresh the page or log in again.'
      )
    }

    // 3. Устанавливаем созданный кабинет как активный
    useAuthStore.getState().setCabinetId(response.id)

    // 4. Persist the explicit onboarding target through the existing cabinet PUT endpoint.
    // The refreshed token and active cabinet must be installed before this authenticated request.
    let updatedCabinet
    try {
      updatedCabinet = await updateCabinetTaxSettings(response.id, { targetMarginPct })
    } catch (marginError) {
      logger.error('Cabinet created, but target margin update failed:', marginError)
      throw new Error('Cabinet created, but target margin could not be saved')
    }

    // 5. Возвращаем созданный кабинет
    return {
      cabinet: {
        id: response.id,
        name: response.name,
        isActive: response.isActive,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        targetMarginPct: updatedCabinet.targetMarginPct,
      },
      productsSyncTasks: response.productsSyncTasks,
    }
  } catch (error) {
    logger.error('Failed to create cabinet:', error)
    throw error
  }
}
