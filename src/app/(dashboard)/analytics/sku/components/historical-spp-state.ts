type SearchParamsReader = Pick<URLSearchParams, 'get' | 'toString'>

/** Historical finance is enabled by default; only an explicit false disables it. */
export function readHistoricalSppEnabled(searchParams: SearchParamsReader): boolean {
  return searchParams.get('include_cogs') !== 'false'
}

/** Return a copy so callers never mutate Next.js read-only search params in place. */
export function setHistoricalSppSearchParam(
  searchParams: SearchParamsReader,
  enabled: boolean
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString())
  next.set('include_cogs', String(enabled))
  return next
}
