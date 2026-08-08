/**
 * NEW-2 writeback-utils pure-function tests (PR2).
 *
 * Real ApiError (AP#3) for the 403 detection — never a faked error object.
 */

import { describe, it, expect } from 'vitest'
import { ApiError } from '@/types/api'
import {
  isWritebackDisabledError,
  writebackErrorMessage,
  isWritebackCompleted,
  WRITEBACK_DISABLED_MESSAGE,
  WRITEBACK_GENERIC_ERROR_MESSAGE,
} from '../communications-writeback-utils'

describe('NEW-2 writeback-utils', () => {
  it('detects a 403 kill-switch error', () => {
    expect(isWritebackDisabledError(new ApiError('disabled', 403))).toBe(true)
  })

  it('does not flag a non-403 ApiError as disabled', () => {
    expect(isWritebackDisabledError(new ApiError('boom', 500))).toBe(false)
  })

  it('does not flag a plain Error as disabled', () => {
    expect(isWritebackDisabledError(new Error('network'))).toBe(false)
  })

  it('does not flag null/undefined as disabled', () => {
    expect(isWritebackDisabledError(null)).toBe(false)
    expect(isWritebackDisabledError(undefined)).toBe(false)
  })

  it('maps 403 to the RU kill-switch message', () => {
    expect(writebackErrorMessage(new ApiError('disabled', 403))).toBe(WRITEBACK_DISABLED_MESSAGE)
  })

  it('maps a non-403 error to the RU generic message', () => {
    expect(writebackErrorMessage(new Error('network'))).toBe(WRITEBACK_GENERIC_ERROR_MESSAGE)
  })

  it('recognizes the completed terminal state', () => {
    expect(isWritebackCompleted('completed')).toBe(true)
  })

  it('does not treat active/failed/undefined as completed', () => {
    expect(isWritebackCompleted('active')).toBe(false)
    expect(isWritebackCompleted('failed')).toBe(false)
    expect(isWritebackCompleted(undefined)).toBe(false)
  })
})
