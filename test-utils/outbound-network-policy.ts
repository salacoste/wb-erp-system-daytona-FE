import policy from './network-policy.json'

export const TEST_NETWORK_POLICY = Object.freeze(policy)
export const TEST_NETWORK_ORIGIN = 'http://localhost'

const allowedProtocols = new Set(TEST_NETWORK_POLICY.allowedProtocols)
const allowedHosts = new Set(TEST_NETWORK_POLICY.allowedHosts.map(normalizeHost))

function normalizeHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
}

function denied(): Error & { code: string } {
  return Object.assign(
    new Error(
      `Outbound test request denied by ${TEST_NETWORK_POLICY.schemaVersion}; ` +
        'mock the request or use the local/test-container allowlist.'
    ),
    { code: 'ERR_TEST_NETWORK_DENIED' }
  )
}

function isRelativeTarget(target: string): boolean {
  return /^(?:\.{0,2}\/|[?#])/.test(target)
}

export function assertAllowedTestUrl(
  target: string | URL,
  baseUrl = process.env.TEST_NETWORK_ORIGIN || TEST_NETWORK_ORIGIN
): URL {
  let url: URL
  try {
    if (target instanceof URL) {
      url = target
    } else {
      if (!target.includes('://') && !isRelativeTarget(target)) throw denied()
      url = new URL(target, baseUrl)
    }
  } catch {
    throw denied()
  }

  if (
    !allowedProtocols.has(url.protocol) ||
    !allowedHosts.has(normalizeHost(url.hostname)) ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw denied()
  }
  return url
}

export function assertAllowedSocketHost(host: string | undefined): void {
  if (!allowedHosts.has(normalizeHost(host || 'localhost'))) throw denied()
}

export function networkPolicyDeniedError(): Error & { code: string } {
  return denied()
}
