/**
 * FE-D3 fallback-message sanitizer (canonical home).
 *
 * Extracted byte-identically from
 * src/components/custom/wb-token-form-helpers.ts (fe-d3-family debt item):
 * hooks importing a components/ module was a direction smell. The original
 * file re-exports this symbol so existing imports stay resolving.
 */

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
