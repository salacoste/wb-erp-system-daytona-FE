#!/usr/bin/env node

import { readFileSync } from 'node:fs'

const path = process.argv[2]
if (!path) {
  process.stderr.write('coverage active-policy path is required\n')
  process.exit(64)
}

try {
  const policy = JSON.parse(readFileSync(path, 'utf8'))
  if (!['threshold', 'waiver'].includes(policy.mode))
    throw new Error('invalid coverage policy mode')
  process.stdout.write(`${policy.mode}\n`)
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exit(1)
}
