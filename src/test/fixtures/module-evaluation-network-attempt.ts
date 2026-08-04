import { request } from 'node:http'
import { connect } from 'node:net'
import { lookup } from 'node:dns'

const guarded = Symbol.for('epic128.frontend.test-network-guard.guarded')

const namedRequestGuarded = Boolean((request as unknown as Record<symbol, unknown>)[guarded])
const namedConnectGuarded = Boolean((connect as unknown as Record<symbol, unknown>)[guarded])
const namedLookupGuarded = Boolean((lookup as unknown as Record<symbol, unknown>)[guarded])

if (!namedRequestGuarded || !namedConnectGuarded || !namedLookupGuarded) {
  throw new Error('Vitest network guard bootstrap did not run before module evaluation')
}

let externalRequestDenied = false

try {
  request('https://example.invalid/module-evaluation')
} catch (error) {
  if ((error as { code?: unknown }).code !== 'ERR_TEST_NETWORK_DENIED') throw error
  externalRequestDenied = true
}

export const MODULE_EVALUATION_NETWORK_GUARD_VERIFIED = Object.freeze({
  externalRequestDenied,
  namedConnectGuarded,
  namedLookupGuarded,
  namedRequestGuarded,
})

if (!externalRequestDenied) {
  throw new Error('Guarded module-evaluation request did not fail before I/O')
}
