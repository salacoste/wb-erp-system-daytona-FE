#!/usr/bin/env node

/**
 * Start Next dev from a clean cache only when the target port is free.
 *
 * Running `next build` rewrites .next for production. If an older `next dev`
 * process is still listening afterwards, local E2E/manual runs can hit stale
 * chunks or route manifests. This wrapper makes the safe restart path explicit:
 * stop the old server first, remove generated caches, then launch next dev.
 */

import fs from 'node:fs'
import net from 'node:net'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)

function parseArgs(argv) {
  const parsed = { port: process.env.PORT || '3100', hostname: undefined, nextArgs: [] }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      parsed.help = true
      continue
    }

    if ((arg === '--port' || arg === '-p') && argv[index + 1]) {
      parsed.port = argv[index + 1]
      index += 1
      continue
    }

    if (arg.startsWith('--port=')) {
      parsed.port = arg.slice('--port='.length)
      continue
    }

    if ((arg === '--hostname' || arg === '-H') && argv[index + 1]) {
      parsed.hostname = argv[index + 1]
      index += 1
      continue
    }

    if (arg.startsWith('--hostname=')) {
      parsed.hostname = arg.slice('--hostname='.length)
      continue
    }

    parsed.nextArgs.push(arg)
  }

  return parsed
}

function printHelp() {
  console.log(`Usage: node scripts/start-fresh-next-dev.mjs [--port 3100] [--hostname 127.0.0.1] [next dev args...]

Fails fast if the requested port is already in use, then removes .next and
node_modules/.cache before spawning: npx next dev -p <port> [...args].`)
}

function validatePort(port) {
  const numeric = Number(port)
  if (!Number.isInteger(numeric) || numeric <= 0 || numeric > 65535) {
    throw new Error(`Invalid port: ${port}`)
  }
  return numeric
}

function canConnect(host, port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
    socket.setTimeout(750, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

async function assertPortFree(port) {
  const hosts = ['127.0.0.1', '::1']
  for (const host of hosts) {
    if (await canConnect(host, port)) {
      throw new Error(
        `Port ${port} is already in use. Stop the existing Next dev server before running the safe restart path. This prevents stale .next assets after \`next build\`.`
      )
    }
  }
}

function removeGeneratedCaches() {
  for (const relativePath of ['.next', path.join('node_modules', '.cache')]) {
    fs.rmSync(path.join(rootDir, relativePath), { recursive: true, force: true })
  }
}

const parsed = parseArgs(args)
if (parsed.help) {
  printHelp()
  process.exit(0)
}

try {
  const port = validatePort(parsed.port)
  await assertPortFree(port)
  removeGeneratedCaches()

  const childArgs = ['next', 'dev', '-p', String(port)]
  if (parsed.hostname) childArgs.push('--hostname', parsed.hostname)
  childArgs.push(...parsed.nextArgs)

  const child = spawn('npx', childArgs, { cwd: rootDir, stdio: 'inherit' })

  const forwardSignal = signal => {
    if (!child.killed) child.kill(signal)
  }
  process.on('SIGINT', () => forwardSignal('SIGINT'))
  process.on('SIGTERM', () => forwardSignal('SIGTERM'))

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    process.exit(code ?? 0)
  })
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
