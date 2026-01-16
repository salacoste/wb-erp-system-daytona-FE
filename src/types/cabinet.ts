/**
 * Cabinet-related TypeScript types
 */

export interface Cabinet {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCabinetRequest {
  name: string
  description?: string
}

export interface ProductSyncTask {
  keyName: string
  taskUuid: string
  status: string
  startedAt?: string | null
  completedAt?: string | null
  error?: string | null
  recommendation?: string | null
}

export interface CreateCabinetResponse {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  newToken: string // ⚠️ КРИТИЧНО: Новый JWT токен - обязательно обновить!
  productsSyncTasks?: ProductSyncTask[]
}

export interface UpdateWbTokenRequest {
  token: string // Новый WB API токен
}

export interface UpdateWbTokenResponse {
  id: string
  keyName: string
  updatedAt: string
}

export interface ApiError {
  code?: string
  message: string
  details?: Array<{
    field: string
    issue: string
    value?: string
    recommendation?: string
  }>
}

