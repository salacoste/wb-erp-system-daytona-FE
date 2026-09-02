/**
 * Console-log redaction for API error bodies (debt FE-D9, security HIGH).
 *
 * logApiError() used to print raw non-2xx bodies; bodies can echo secrets
 * (JWT / WB token, password, cabinet validation details[].value). This module
 * returns a redacted COPY — the input object is never mutated.
 *
 * String patterns are derived from scripts/check-privacy-console.mjs
 * SECRET_RULES (authorization-value / cookie-value / token-value), broadened:
 * 8+ chars instead of the scanner's 12+, optional quote instead of the
 * token-value rule's mandatory one, plus an extra key set (password/secret/
 * jwt/session/credential, private[_-]?key) — wider in the safe (over-redact) direction.
 * Debt FE-D9, handoff 2026-09-02 §8-P0.
 */

/** Keys whose value is a secret whenever the key appears (substring, case-insensitive).
 *  refreshToken / accessToken / wb_token / apiToken are covered by the "token" substring;
 *  api[_-]?key and private[_-]?key cover the camel/snake/kebab spellings (separator
 *  optional), case-insensitive. */
const SENSITIVE_KEY_RE =
  /token|password|secret|authorization|cookie|api[_-]?key|jwt|session|credential|private[_-]?key/i

/** Replacement marker for every redacted value. */
const REDACTED = '[REDACTED]'

/** Depth cap: response.json() cannot produce cycles, but this guards any caller
 *  against cyclic/oversized structures without a visited-set. */
const MAX_DEPTH = 10

/** "(Bearer|Basic) <credential>" echo — separator is colon and/or whitespace
 *  (`Bearer eyJ…`, `Bearer:eyJ…`, `Basic:dXNl…`); scheme marker kept, credential
 *  dropped (≥8 chars). */
const BEARER_RE = /(\b(?:bearer|basic)[:\s]+)[A-Za-z0-9._~+/=-]{8,}/gi

/** <key>[":=]"'<credential> — covers `token=…`, `"token":"…"`, `password: …`, `wb_token=…`.
 *  Separator chars are captured so the key stays visible after replacement. */
const KEY_VALUE_RE =
  /((?:(?:access|refresh|api|wb|session)?[_-]?token|password|secret|authorization|cookie)\s*["']?\s*[:=]\s*["']?)[A-Za-z0-9._~+/=-]{8,}/gi

/** Fallback for credentials outside the ASCII class (e.g. Cyrillic `password=ПарольСекрет123`):
 *  a secret key word followed by a ≥8-char non-space run. Re-running on already-redacted
 *  text yields the identical string (idempotent). On backtracking the separator may be
 *  swallowed into the credential run (e.g. `password=Пароль1` → `password[REDACTED]`,
 *  the `=` consumed) — over-redact direction, deliberate. */
const KEY_VALUE_FALLBACK_RE =
  /((?:password|secret|token|authorization|cookie|api[_-]?key|private[_-]?key|jwt|session|credential)[\s"'=:]*)([^\s"'<>]{8,})/gi

function redactString(text: string): string {
  return text
    .replace(BEARER_RE, `$1${REDACTED}`)
    .replace(KEY_VALUE_RE, `$1${REDACTED}`)
    .replace(KEY_VALUE_FALLBACK_RE, `$1${REDACTED}`)
}

/** Cabinet validation echo shape { field: '<secret-name>', value: '<secret>' }
 *  (src/types/cabinet/core.ts ApiError.details[]): only the echoed value of such
 *  an item is redacted — the `value` key is NOT sensitive globally. Receives the
 *  caller's entries so the object is enumerated exactly once (F6). */
function hasSecretFieldEcho(entries: Array<[string, unknown]>): boolean {
  return entries.some(
    ([key, val]) => key === 'field' && typeof val === 'string' && SENSITIVE_KEY_RE.test(val)
  )
}

function redactObject(source: object, depth: number): Record<string, unknown> {
  const entries: Array<[string, unknown]> = Object.entries(source)
  const fieldEcho = hasSecretFieldEcho(entries)
  const result: Record<string, unknown> = {}
  for (const [key, val] of entries) {
    if (SENSITIVE_KEY_RE.test(key)) result[key] = REDACTED
    else if (fieldEcho && key === 'value') result[key] = REDACTED
    else result[key] = redactValue(val, depth + 1)
  }
  return result
}

/** Contract: values originate from response.json() — plain JSON types only.
 *  Non-plain objects (Date/Map/Set) expose no enumerable own props and collapse
 *  to {} — deliberate, JSON-only contract (F7). */
function redactValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return redactString(value)
  if (typeof value !== 'object' || value === null) return value
  if (depth > MAX_DEPTH) return REDACTED
  if (Array.isArray(value)) return value.map(item => redactValue(item, depth + 1))
  return redactObject(value, depth)
}

/** Return a redacted copy of an API error body: secret-keyed values, cabinet
 *  details[].value echoes, and plain-text credential patterns become '[REDACTED]'. */
export function redactSensitive(value: unknown): unknown {
  return redactValue(value, 0)
}
