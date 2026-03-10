/**
 * COGS Edit - Types & Validation Helpers
 * Extracted from useCogsEdit.ts for file size compliance (Epic 74)
 */

// ============================================================================
// Types
// ============================================================================

/** Request DTO for updating COGS record */
export interface UpdateCogsRecordDto {
  unit_cost_rub?: number
  notes?: string
}

/** Response from PATCH /v1/cogs/:cogsId */
export interface EditCogsResponse {
  cogs_id: string
  nm_id: string
  unit_cost_rub: number
  currency: string
  valid_from: string
  valid_to: string | null
  source: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  margin_recalculation: {
    triggered: boolean
    task_uuid: string
    affected_weeks: string[]
    estimated_time_sec: number
  }
}

/** API Error with status code */
export interface ApiError extends Error {
  status?: number
  response?: {
    status: number
    data?: {
      message?: string
      errors?: Array<{ field: string; message: string }>
    }
  }
}

export interface UseCogsEditOptions {
  onSuccess?: (response: EditCogsResponse) => void
  onError?: (error: ApiError) => void
}

// ============================================================================
// Validation Helpers
// ============================================================================

/** Validates if at least one field has changed (AC: 12) */
export function hasCogsChanges(
  original: { unit_cost_rub: number; notes: string | null },
  edited: { unit_cost_rub: number; notes: string }
): boolean {
  const costChanged = edited.unit_cost_rub !== original.unit_cost_rub
  const notesChanged = edited.notes !== (original.notes || '')
  return costChanged || notesChanged
}

/** Builds the update payload, only including changed fields */
export function buildUpdatePayload(
  original: { unit_cost_rub: number; notes: string | null },
  edited: { unit_cost_rub: number; notes: string }
): UpdateCogsRecordDto {
  const payload: UpdateCogsRecordDto = {}
  if (edited.unit_cost_rub !== original.unit_cost_rub) {
    payload.unit_cost_rub = edited.unit_cost_rub
  }
  if (edited.notes !== (original.notes || '')) {
    payload.notes = edited.notes
  }
  return payload
}

/** Validation helper for unit_cost_rub (AC: 10) */
export function validateUnitCost(value: string): string | null {
  if (!value.trim()) {
    return 'Себестоимость обязательна для заполнения'
  }
  const trimmed = value.trim()
  const numValue = Number(trimmed)
  if (isNaN(numValue) || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return 'Введите числовое значение'
  }
  if (numValue <= 0) {
    return 'Себестоимость должна быть положительным числом'
  }
  return null
}

/** Validation helper for notes (AC: 11) */
export function validateNotes(value: string): string | null {
  if (value.length > 1000) {
    return 'Максимум 1000 символов'
  }
  return null
}
