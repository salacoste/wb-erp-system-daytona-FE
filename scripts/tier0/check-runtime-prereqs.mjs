#!/usr/bin/env node
import { runPreflight } from './preflight.mjs'
import { exitCodeForVerdict, preflightFailureOutcome } from './run-certification.mjs'

function argument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const descriptorPath = argument('--descriptor') || process.env.TIER0_ENV_DESCRIPTOR
const receiptPath = argument('--receipt') || process.env.TIER0_PREFLIGHT_RECEIPT

try {
  const receipt = await runPreflight({ descriptorPath, receiptPath })
  process.stdout.write(
    `${JSON.stringify({ status: receipt.status, run_id: receipt.run_id, capabilities: receipt.capabilities })}\n`
  )
} catch (error) {
  const failure = preflightFailureOutcome(error)
  process.stderr.write(`${JSON.stringify({ ...failure, message: error.message })}\n`)
  process.exitCode = exitCodeForVerdict(failure.status === 'BLOCKED' ? 'UNDETERMINED' : 'FAIL')
}
