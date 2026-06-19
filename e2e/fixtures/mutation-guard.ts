/**
 * Safety gate for E2E specs that mutate backend/WB-cabinet data.
 *
 * Default policy: mutating E2E is disabled. This prevents accidental creation,
 * closure, sync, or deletion of supplies/shipments when credentials point at a
 * real WB cabinet or real products.
 *
 * To run these specs intentionally, require all three explicit opt-ins:
 *   E2E_ENABLE_MUTATIONS=true
 *   E2E_MUTATION_TARGET=sandbox
 *   E2E_MUTATION_ACK=I_UNDERSTAND_THIS_MUTATES_TEST_DATA
 */

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])

export const E2E_MUTATION_ACK_VALUE = 'I_UNDERSTAND_THIS_MUTATES_TEST_DATA'

function isTruthyEnv(value: string | undefined): boolean {
  return TRUE_VALUES.has((value ?? '').trim().toLowerCase())
}

export function isMutatingE2EEnabled(): boolean {
  return (
    isTruthyEnv(process.env.E2E_ENABLE_MUTATIONS) &&
    process.env.E2E_MUTATION_TARGET === 'sandbox' &&
    process.env.E2E_MUTATION_ACK === E2E_MUTATION_ACK_VALUE
  )
}

export function shouldSkipMutatingE2E(): boolean {
  return !isMutatingE2EEnabled()
}

export const MUTATING_E2E_SKIP_REASON =
  'Mutating E2E disabled: set E2E_ENABLE_MUTATIONS=true, ' +
  'E2E_MUTATION_TARGET=sandbox, and ' +
  `E2E_MUTATION_ACK=${E2E_MUTATION_ACK_VALUE} only for isolated test data.`
