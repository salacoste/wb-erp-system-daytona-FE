import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBoundServerChildEnv, createSanitizedLineWriter } from './start-bound-server.mjs'

test('bound Next child receives only the minimal allowlisted environment', () => {
  const childEnv = buildBoundServerChildEnv({
    PATH: '/exact/bin',
    HOME: '/private/home',
    TMPDIR: '/private/tmp',
    E2E_TEST_EMAIL: 'operator@example.test',
    E2E_TEST_PASSWORD: 'secret-password',
    E2E_ENABLE_MUTATIONS: 'true',
    E2E_MUTATION_ACK: 'unsafe',
    NEXT_PUBLIC_API_URL: 'https://unbound.invalid',
    NODE_OPTIONS: '--require=/tmp/untrusted-hook.cjs',
    ARBITRARY_UNBOUND_VALUE: 'must-not-cross-boundary',
    NODE_ENV: 'development',
  })

  assert.deepEqual(childEnv, {
    PATH: '/exact/bin',
    HOME: '/private/home',
    TMPDIR: '/private/tmp',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
  })
})

test('server log sanitization detects secrets split across stream chunks', () => {
  const output = []
  const writer = createSanitizedLineWriter(chunk => output.push(chunk), '[stdout] ', [
    'declared-secret-value',
  ])
  writer.write('Bear')
  writer.write('er abc.def.ghi declared-')
  writer.write('secret-value /callback?api_')
  writer.write('key=unsafe eyJaaaaaaaaaaaa.')
  writer.write('bbbbbbbbbbbb.cccccccccccc Cookie: sess')
  writer.write('ion=unsafe Set-Cookie: sid=unsafe /next?%74ok')
  writer.write('en=encoded-secret\n')
  writer.flush()

  const text = output.join('')
  assert.doesNotMatch(
    text,
    /abc\.def\.ghi|declared-secret-value|unsafe|encoded-secret|eyJaaaaaaaaaaaa/
  )
  assert.match(text, /Bearer \[REDACTED\]/)
  assert.match(text, /api_key=\[REDACTED\]/)
  assert.match(text, /Cookie: \[REDACTED\]/)
  assert.match(text, /Set-Cookie: \[REDACTED\]/)
})
