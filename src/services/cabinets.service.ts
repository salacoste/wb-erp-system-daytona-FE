/**
 * Cabinet service functions
 * Handles cabinet creation with automatic JWT token refresh
 */

import { createCabinet } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { CreateCabinetRequest, CreateCabinetResponse } from '@/types/cabinet'

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
): Promise<{
  cabinet: {
    id: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  productsSyncTasks?: CreateCabinetResponse['productsSyncTasks']
}> {
  const { token, refreshToken: refreshTokenInStore, user } =
    useAuthStore.getState()

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
      console.error('Failed to update token after cabinet creation:', tokenError)
      throw new Error(
        'Cabinet created, but token update failed. Please refresh the page or log in again.',
      )
    }

    // 3. Устанавливаем созданный кабинет как активный
    useAuthStore.getState().setCabinetId(response.id)

    // 4. Возвращаем созданный кабинет
    return {
      cabinet: {
        id: response.id,
        name: response.name,
        isActive: response.isActive,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      },
      productsSyncTasks: response.productsSyncTasks,
    }
  } catch (error) {
    console.error('Failed to create cabinet:', error)
    throw error
  }
}

