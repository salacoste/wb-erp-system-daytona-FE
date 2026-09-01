import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const EXPECTED_NODE = 'v24.18.0'
const EXPECTED_NPM = '11.11.0'
const npmCli = process.env.STORY_174_3_NPM_CLI

if (process.platform !== 'darwin') {
  throw new Error('Story 174.3 real browser zoom evidence requires the macOS headed-browser host')
}
if (process.version !== EXPECTED_NODE) {
  throw new Error(`Story 174.3 requires Node ${EXPECTED_NODE}; received ${process.version}`)
}
if (!npmCli) {
  throw new Error('STORY_174_3_NPM_CLI must name the pinned npm 11.11.0 CLI')
}

const npmVersion = spawnSync(process.execPath, [npmCli, '--version'], {
  encoding: 'utf8',
})
if (npmVersion.status !== 0 || npmVersion.stdout.trim() !== EXPECTED_NPM) {
  throw new Error(
    `Story 174.3 requires npm ${EXPECTED_NPM}; received ${npmVersion.stdout.trim() || 'unknown'}`
  )
}

const temporaryRoot = mkdtempSync(resolve(tmpdir(), 'story-174-3-real-browser-zoom-'))
const readyFile = resolve(temporaryRoot, 'browser-ready')
const child = spawn(
  process.execPath,
  [
    npmCli,
    'run',
    'test:e2e:full',
    '--',
    'e2e/story-174-3-real-browser-zoom.spec.ts',
    '--project=chromium',
    '--workers=1',
    '--headed',
    '--grep',
    'real browser 200 percent zoom',
  ],
  {
    env: {
      ...process.env,
      STORY_174_3_REAL_BROWSER_ZOOM: '1',
      STORY_174_3_ZOOM_READY_FILE: readyFile,
    },
    stdio: 'inherit',
  }
)

function waitForBrowserReady() {
  return new Promise((resolveReady, reject) => {
    const deadline = Date.now() + 120_000
    const interval = setInterval(() => {
      if (existsSync(readyFile)) {
        clearInterval(interval)
        resolveReady()
      } else if (Date.now() >= deadline) {
        clearInterval(interval)
        reject(new Error('Timed out waiting for headed Chromium to reach the zoom checkpoint'))
      }
    }, 100)
    child.once('exit', code => {
      if (!existsSync(readyFile)) {
        clearInterval(interval)
        reject(
          new Error(`Playwright exited before the zoom checkpoint (exit ${code ?? 'unknown'})`)
        )
      }
    })
  })
}

function findPlaywrightBrowserPid() {
  const processTable = spawnSync('ps', ['-axo', 'pid=,ppid=,command='], { encoding: 'utf8' })
  if (processTable.status !== 0) {
    throw new Error(`Unable to inspect Playwright browser processes: ${processTable.stderr.trim()}`)
  }

  const processes = processTable.stdout
    .split('\n')
    .map(line => line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/))
    .filter(Boolean)
    .map(match => ({
      pid: Number(match[1]),
      parentPid: Number(match[2]),
      command: match[3],
    }))
  const descendantPids = new Set([child.pid])
  let addedDescendant = true
  while (addedDescendant) {
    addedDescendant = false
    for (const process of processes) {
      if (descendantPids.has(process.parentPid) && !descendantPids.has(process.pid)) {
        descendantPids.add(process.pid)
        addedDescendant = true
      }
    }
  }

  const browserProcesses = processes.filter(
    process =>
      descendantPids.has(process.pid) &&
      process.command.includes('--remote-debugging-pipe') &&
      !process.command.includes('--type=')
  )
  if (browserProcesses.length !== 1) {
    throw new Error(
      `Expected one headed Playwright browser process; found ${browserProcesses.length}`
    )
  }
  return browserProcesses[0].pid
}

function applyMacOsBrowserZoom(browserPid) {
  const automation = String.raw`
tell application "System Events"
  set browserProcess to first process whose unix id is ${browserPid}
  tell browserProcess
    set frontmost to true
    keystroke "0" using command down
    delay 0.2
    repeat 5 times
      key code 24 using command down
      delay 0.35
    end repeat
  end tell
end tell`
  const result = spawnSync('osascript', ['-e', automation], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`Unable to apply browser UI zoom: ${result.stderr.trim() || 'unknown error'}`)
  }
}

function waitForChildExit() {
  return new Promise(resolveExit => child.once('exit', code => resolveExit(code ?? 1)))
}

let exitCode = 1
try {
  await waitForBrowserReady()
  const browserPid = findPlaywrightBrowserPid()
  applyMacOsBrowserZoom(browserPid)
  process.stdout.write(
    `Story 174.3 browser UI zoom command applied to PID ${browserPid} with Node ${process.version} / npm ${EXPECTED_NPM}.\n`
  )
  exitCode = await waitForChildExit()
} finally {
  if (child.exitCode === null && !child.killed) child.kill('SIGTERM')
  rmSync(temporaryRoot, { recursive: true, force: true })
}

process.exitCode = exitCode
