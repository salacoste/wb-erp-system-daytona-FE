/**
 * WbTokenForm helpers - validation schema and error message mapping
 * Extracted from WbTokenForm.tsx for file size compliance
 * Story 2.2: WB Token Input & Validation
 */

import { z } from 'zod'

/** Error type for API errors with additional data */
interface ApiErrorWithData extends Error {
  data?: {
    code?: string
    message?: string
    details?: Array<{ field?: string; issue?: string; recommendation?: string }>
  }
}

export const wbTokenFormSchema = z.object({
  token: z
    .string()
    .min(1, 'WB API токен обязателен')
    .min(50, 'Токен кажется слишком коротким. Пожалуйста, проверьте токен.')
    .refine(
      value => {
        const parts = value.split('.')
        return parts.length === 3
      },
      {
        message: 'Формат токена кажется неверным. Пожалуйста, проверьте токен.',
      }
    ),
})

export type WbTokenFormData = z.infer<typeof wbTokenFormSchema>

/**
 * Get user-friendly error message based on API error
 */
export function getErrorMessage(error: Error): {
  title: string
  message: string
  showLink: boolean
} {
  const errorMessage = error.message.toLowerCase()

  const apiError = error as ApiErrorWithData
  const errorCode = apiError.data?.code?.toLowerCase() || ''

  if (
    errorCode.includes('invalid') ||
    errorCode.includes('token_validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('validation failed')
  ) {
    return {
      title: 'Токен недействителен',
      message:
        'WB API токен недействителен или истек. Пожалуйста, проверьте правильность токена или получите новый в личном кабинете Wildberries.',
      showLink: true,
    }
  }

  if (
    errorCode.includes('rate') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('429')
  ) {
    return {
      title: 'Превышен лимит запросов',
      message:
        'Превышен лимит запросов к WB API. Пожалуйста, подождите несколько минут и попробуйте снова.',
      showLink: false,
    }
  }

  if (
    errorCode.includes('network') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection')
  ) {
    return {
      title: 'Ошибка сети',
      message:
        'Не удалось подключиться к WB API. Проверьте интернет-соединение и попробуйте снова.',
      showLink: false,
    }
  }

  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('403')
  ) {
    return {
      title: 'Нет доступа',
      message: 'У вас нет прав для сохранения токена. Требуется роль Owner или Manager.',
      showLink: false,
    }
  }

  if (errorMessage.includes('cabinet') || errorMessage.includes('not found')) {
    return {
      title: 'Кабинет не найден',
      message: 'Кабинет не найден. Пожалуйста, вернитесь к предыдущему шагу и создайте кабинет.',
      showLink: false,
    }
  }

  return {
    title: 'Ошибка сохранения токена',
    message: sanitizeFallbackMessage(error.message),
    showLink: true,
  }
}

const GENERIC_FALLBACK = 'Произошла неизвестная ошибка. Попробуйте снова.'
const FALLBACK_MAX_LENGTH = 200
const SCRUB_INPUT_LIMIT = 4096

/**
 * FE-D3: the fallback branch must never echo raw error text verbatim — a
 * malicious/buggy server can embed tokens, stack frames or internal paths in
 * error.message, which is rendered as-is by WbTokenForm. Scrub known
 * internal/sensitive markers, then bound the remainder for display.
 */
const SCRUB_PATTERNS: RegExp[] = [
  /\bstack:\s*\S.*$/gim, // stack-dump markers — MUST precede the at-rule, else a bare "stack:" literal survives
  /^\s*at\s.*$/gm, // V8 stack frames ("    at fn (file:1:1)")
  /\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, // scheme-agnostic URLs (postgresql://user:pass@host, redis://:pw@host, …)
  /(?:[A-Za-z]:)?(?:\/[\w.@+-]+){2,}/g, // POSIX absolute paths (>=2 segments)
  /(?:\\[\w.@+-]+){2,}/g, // Windows paths
  // SQL fragments in verbal form (one-token object + target verb — avoids
  // two-token benign-prose false hits like "please select a cabinet from the
  // list"; one-token objects ("select one from") still over-scrub — accepted;
  // DDL verbs (drop/truncate/alter table) eat to end-of-line incl. benign tail)
  /\b(?:select\s+\S+\s+from\b|insert\s+into\b|delete\s+from\b|update\s+\S+\s+set\b|drop\s+table\b|truncate\s+table\b|alter\s+table\b)[^;\n]*/gi,
  /\bprisma[\w.:-]*/gi, // ORM internals (single benign-word collateral — accepted trade-off, internal marker class)
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // full JWT header.payload.signature (short signatures <40 chars)
  /\beyJ[A-Za-z0-9_-]+/g, // generic JWT-like sequences ('eyJ' = base64 prefix of '{"<letter>' — virtually all JOSE headers start '{"alg"')
  /\b[0-9a-f]{32,}\b/gi, // hex blobs (hashes; dashed UUIDs NOT covered — low sensitivity, registry-noted)
  /\b[A-Za-z0-9+/_-]{40,}\b/g, // long base64-ish blobs (signatures, keys)
]

/**
 * FE-D3: scrub + bound a raw fallback error message for user display.
 * Exported pure helper (unit-pinnable); always returns a non-empty safe string.
 */
export function sanitizeFallbackMessage(rawMessage: string): string {
  if (typeof rawMessage !== 'string') return GENERIC_FALLBACK
  // FE-D3: pre-bound hostile inputs before the scrub loop (bounds worst-case backtracking).
  let scrubbed = rawMessage.slice(0, SCRUB_INPUT_LIMIT)
  for (const pattern of SCRUB_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, ' ')
  }
  scrubbed = scrubbed.replace(/\s+/g, ' ').trim()
  if (!scrubbed) return GENERIC_FALLBACK

  // Code-point slicing (not UTF-16 index) so surrogate pairs are never split.
  const codePoints = Array.from(scrubbed)
  if (codePoints.length <= FALLBACK_MAX_LENGTH) return scrubbed

  let cut = codePoints.slice(0, FALLBACK_MAX_LENGTH).join('')
  const lastSpace = cut.lastIndexOf(' ')
  if (lastSpace > FALLBACK_MAX_LENGTH / 2) cut = cut.slice(0, lastSpace)
  return `${cut.trimEnd()}…`
}
