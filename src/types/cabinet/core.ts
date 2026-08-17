/**
 * Cabinet Core Types — cabinet interface, tax/VAT, CRUD, API error
 * Split from cabinet.ts for file size compliance
 */

// ============================================================================
// Tax & VAT Types
// ============================================================================

/** Income tax system options — matches backend taxSystem column */
export type TaxSystem = 'usn6' | 'usn15' | 'manual'

/** VAT rate options — legally mandated НДС rates in Russia */
export const VAT_RATES = [0, 5, 20, 22] as const
export type VatRate = (typeof VAT_RATES)[number]

/** Russian labels for tax system options */
export const TAX_SYSTEM_LABELS: Record<TaxSystem, string> = {
  usn6: 'УСН 6% — по доходам',
  usn15: 'УСН 15% — по прибыли',
  manual: 'Пользовательская ставка',
}

/** Tax system options for form selectors (including "not configured") */
export const TAX_SYSTEM_OPTIONS = [
  { value: null as TaxSystem | null, label: 'Не настроена' },
  { value: 'usn6' as TaxSystem, label: TAX_SYSTEM_LABELS.usn6 },
  { value: 'usn15' as TaxSystem, label: TAX_SYSTEM_LABELS.usn15 },
  { value: 'manual' as TaxSystem, label: TAX_SYSTEM_LABELS.manual },
]

/** Russian labels for VAT rate options */
export const VAT_RATE_LABELS: Record<VatRate, string> = {
  0: '0% — экспорт',
  5: '5% — УСН при превышении порога',
  20: '20% — стандартная ставка',
  22: '22% — отдельные категории (с 2025)',
}

// ============================================================================
// Cabinet Interface
// ============================================================================

export interface Cabinet {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Epic 66-FE: Tax settings (Backend Epic 72)
  taxSystem: TaxSystem | null
  taxRate: number | null
  // Epic 66-FE: VAT settings (Backend Task-50)
  vatPayer: boolean
  vatRate: number | null
  // Epic 121 GAP-3: explicit pricing target; null means use the proposed 20% fallback in UI/runtime
  targetMarginPct: number | null
}

/**
 * Request body for updating cabinet tax + VAT settings.
 * Backend auto-clears taxRate when taxSystem is usn6/usn15.
 * Backend auto-clears vatRate when vatPayer is false.
 */
export interface UpdateCabinetTaxRequest {
  taxSystem?: TaxSystem | null
  taxRate?: number | null
  vatPayer?: boolean
  vatRate?: number | null
  targetMarginPct?: number | null
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

/**
 * Story 167.8 contract: POST /v1/cabinets response (CreateCabinetResponseDto).
 * Durable operation fields (operationId/status/replayed) are authoritative;
 * status is always "succeeded" on a 201/202 create response.
 */
export interface CreateCabinetResponse {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  newToken: string // ⚠️ КРИТИЧНО: Новый JWT токен - обязательно обновить!
  operationId?: string // Account-scoped creation operation id (UUID)
  status?: 'succeeded' // Authoritative durable operation status
  replayed?: boolean // True when this response replays a committed create
  // Story 167.8 swagger fields present on CreateCabinetResponseDto
  taxSystem?: TaxSystem | null
  taxRate?: number | null
  vatPayer?: boolean
  vatRate?: VatRate | null
  targetMarginPct?: number | null
  keys?: CabinetKeyMetadata[]
  productsSyncTasks?: ProductSyncTask[]
}

/** Story 167.8 swagger: CabinetKeyMetadataDto */
export interface CabinetKeyMetadata {
  keyName: string
  updatedAt: string
}

/**
 * Story 167.8 contract: GET /v1/cabinets/creation-operations/{operationId}
 * (CabinetCreationInProgressDto / CabinetCreationFailedDto shapes).
 * 404-neutral cross-account; 410 when the cabinet was hard-deleted after success.
 */
export type CabinetCreationOperationState =
  | { operationId: string; status: 'in_progress'; retryable: boolean; retryAfterSeconds?: number }
  | {
      operationId: string
      status: 'failed'
      failure: {
        /** CabinetCreationFailureDto: enum code + retryable flag only (swagger) */
        code: 'CABINET_CREATION_FAILED' | 'CABINET_CREATION_ACCOUNT_INELIGIBLE'
        retryable: boolean
      }
      completedAt?: string
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
