import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { devices } from '@playwright/test'
import { describe, expect, it } from 'vitest'

import {
  RUNTIME_SOURCE_PATTERNS,
  staticBoundaryViolations,
  trackedRuntimeSourceFiles,
} from './playwright-static-boundary'

describe('Playwright static transport boundary', () => {
  it('rejects dynamic execution and VM capabilities before loader strings can run', () => {
    for (const source of [
      `eval("module.constructor.createRequire(__filename)('@playwright/test')")`,
      `Function("return process.getBuiltinModule('node:module').createRequire(__filename)('playwright-core')")()`,
      'const execute = eval; execute(source)',
      "const execute = globalThis['eval']; execute(source)",
      'const BuildFunction = Function; new BuildFunction(source)',
      'const AsyncFunction = async function () {}.constructor; new AsyncFunction(source)',
      "import vm from 'node:vm'; vm.runInThisContext(source)",
      "const vm = require('vm'); vm.runInNewContext(source)",
      "import { execFileSync } from 'node:child_process'; execFileSync('node', ['-e', \"require('@playwright/test').chromium.launch()\"])",
      "import dgram from 'node:dgram'; dgram.createSocket('udp4').send('x', 53, '203.0.113.10')",
      `import { Worker } from 'node:worker_threads'; new Worker("require('@playwright/test').chromium.launch()", { eval: true })`,
      "globalThis['ev' + 'al'](loaderSource)",
      "globalThis['Func' + 'tion'](loaderSource)()",
      "const root = global; root['ev' + 'al'](loaderSource)",
      "const Build = (() => {})['con' + 'structor']; Build(loaderSource)()",
      "const BuildAsync = (async () => {})['con' + 'structor']; BuildAsync(loaderSource)()",
      "const TemplateBuild = (() => {})[`con${'structor'}`]; TemplateBuild(loaderSource)()",
      "const get = Reflect.get; const ReflectedBuild = get(() => {}, 'constructor'); ReflectedBuild(loaderSource)()",
      "const DescriptorBuild = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(() => {}), 'constructor').value; DescriptorBuild(loaderSource)()",
      "const key = 'constructor'; const AliasedBuild = (() => {})[key]; AliasedBuild(loaderSource)()",
      "const key = 'constructor'; const { [key]: DestructuredBuild } = (() => {}); DestructuredBuild(loaderSource)()",
      "let key = 'constructor'; const MutableBuild = (() => {})[key]; MutableBuild(loaderSource)()",
      "const run = (key: string) => (() => {})[key](loaderSource)(); run('constructor')",
      "const [key] = ['constructor']; const ArrayBuild = (() => {})[key]; ArrayBuild(loaderSource)()",
      "const f = () => {}; let key = 'constructor'; const MutableAliasBuild = f[key]; MutableAliasBuild(loaderSource)()",
      "const runAlias = (key: string) => { const f = () => {}; const ParameterAliasBuild = f[key]; return ParameterAliasBuild(loaderSource)() }; runAlias('constructor')",
      "const [f] = [() => {}]; const [key] = ['constructor']; const ArrayAliasBuild = f[key]; ArrayAliasBuild(loaderSource)()",
      "const functions = [() => {}]; const fn = functions[0]; let build; const key = ['con', 'structor'].join(''); build = fn[key]; build(loaderSource)()",
      "const fn = () => {}; let build; const keyParts = ['con', 'structor']; const key = keyParts.join(''); ({ [key]: build } = fn); build(loaderSource)()",
      'function exploit(fn, key) { let a, b; a = b = fn[key]; a(loaderSource)() }',
      'function exploit(fn, key) { let build; build ??= fn[key]; build(loaderSource)() }',
      'function exploit(fn, key) { let build; build ||= fn[key]; build(loaderSource)() }',
      'function exploit(fn, key) { let build; build &&= fn[key]; build(loaderSource)() }',
      'let fn; ({ [key]: fn = fallback } = source); fn()',
      'let fn; [fn = fallback] = source[key]; fn()',
      'const callable = page[first]; const holder = {}; holder.fn = callable[second]; holder.fn(loaderSource)()',
      'const callable = page[key]; callable.call(page, loaderSource)',
      'const callable = page[key]; const bound = callable.bind(page); bound(loaderSource)',
      'const callable = page[key]; callable`loaderSource`',
      'const callable = (fallback, page[key]); callable(loaderSource)',
      "const ObjectAlias = Object; const ObjectBuild = ObjectAlias.getOwnPropertyDescriptor(ObjectAlias.getPrototypeOf(() => {}), 'constructor').value; ObjectBuild(loaderSource)()",
      "const key = ['con', 'structor'].join(''); const ObjectConstructor = ({})[key]; const getPrototype = ObjectConstructor.getPrototypeOf; const functionPrototype = getPrototype(test); const Build = functionPrototype[key]; Build(loaderSource)()",
      `const key = 'constructor'; process.env.PATH[key][key]('return process.getBuiltinModule("node:module").createRequire(import.meta.url)("@playwright/test")')()`,
      "const local = { evaluate(callback) { callback() } }; local.evaluate(() => { const LocalBuild = Reflect.get(() => {}, 'constructor'); LocalBuild(loaderSource)() })",
      "import { Session } from 'node:inspector'; const session = new Session(); session.connect(); session.post('Runtime.evaluate', { expression: loaderSource })",
    ]) {
      expect(staticBoundaryViolations('e2e/dynamic-loader.spec.ts', source), source).not.toEqual([])
    }

    expect(
      staticBoundaryViolations(
        'e2e/import-equals.spec.ts',
        [
          "import raw = require('@playwright/test')",
          'const make = raw.request.newContext.bind(raw.request)',
          'void make()',
        ].join('\n')
      )
    ).not.toEqual([])

    for (const [helperSource, consumerSource] of [
      [
        "export { runInThisContext as execute } from 'node:vm'",
        "import { execute } from './helper'; execute(source)",
      ],
      [
        "export { createRequire as buildLoader } from 'node:module'",
        "import { buildLoader } from './helper'; buildLoader(import.meta.url)('@playwright/test')",
      ],
    ]) {
      expect(staticBoundaryViolations('e2e/helper.ts', helperSource)).not.toEqual([])
      expect(() => staticBoundaryViolations('e2e/consumer.spec.ts', consumerSource)).not.toThrow()
    }
  })

  it('rejects createRequire aliases and direct or extracted member loaders', () => {
    expect(
      staticBoundaryViolations(
        'e2e/create-require.spec.ts',
        [
          "import { createRequire as buildLoader } from 'node:module'",
          'const loadRuntime = buildLoader(import.meta.url)',
          "void loadRuntime('playwright/test')",
        ].join('\n')
      )
    ).toEqual(['e2e/create-require.spec.ts: runtime module loader capability'])
    expect(
      staticBoundaryViolations(
        'e2e/member-require.spec.ts',
        [
          "void module.require('playwright/test')",
          "const runtimeName = 'playwright/test'",
          "void module['require'](runtimeName)",
          'const extractedLoader = module.require',
          'void extractedLoader(runtimeName)',
          'const { require: destructuredLoader } = module',
          'void destructuredLoader(runtimeName)',
        ].join('\n')
      )
    ).toEqual([
      'e2e/member-require.spec.ts: runtime Playwright import',
      'e2e/member-require.spec.ts: CommonJS module capability',
      'e2e/member-require.spec.ts: unresolved runtime module loader',
      'e2e/member-require.spec.ts: CommonJS module capability',
      'e2e/member-require.spec.ts: runtime module loader capability',
      'e2e/member-require.spec.ts: CommonJS module capability',
      'e2e/member-require.spec.ts: runtime module loader capability',
      'e2e/member-require.spec.ts: CommonJS module capability',
    ])
    expect(
      staticBoundaryViolations(
        'e2e/commonjs-create-require.spec.ts',
        "const { createRequire: buildLoader } = require('node:module')"
      )
    ).toEqual(['e2e/commonjs-create-require.spec.ts: runtime module loader capability'])
    for (const source of [
      "module.constructor.createRequire(__filename)('@playwright/test')",
      "process.getBuiltinModule('node:module').createRequire(import.meta.url)('playwright-core')",
      "Reflect.get(module, 'require')('playwright')",
      "const load = require; const raw = load('@playwright/test'); const browserType = raw['chromium']; const start = browserType['launch']; void start()",
      "const load = require.bind(null); void load('@playwright/test')",
    ]) {
      expect(staticBoundaryViolations('e2e/indirect-loader.spec.ts', source)).not.toEqual([])
    }
    for (const source of [
      "import raw from '../node_modules/@playwright/test/index.js'; void raw",
      "export { chromium } from '../node_modules/playwright/index.js'",
      "void import('../node_modules/playwright-core/index.js')",
      "import raw from '@playwright/test/index.js'; void raw",
      "void import('/workspace/node_modules/playwright-core/index.js')",
    ]) {
      expect(staticBoundaryViolations('e2e/relative-loader.spec.ts', source)).not.toEqual([])
    }
    for (const [relativePath, source] of [
      [
        'src/test/http2.test.ts',
        "import { connect } from 'node:http2'; connect('https://example.invalid')",
      ],
      [
        'src/test/worker.test.ts',
        "import { Worker } from 'node:worker_threads'; new Worker('unguarded-test.js')",
      ],
      [
        'src/test/raw-node-binding.test.ts',
        "const TCP = process.binding('tcp_wrap').TCP; const raw = new TCP(0); raw.connect()",
      ],
    ]) {
      expect(staticBoundaryViolations(relativePath, source), relativePath).not.toEqual([])
    }
    expect(
      staticBoundaryViolations(
        'e2e/process-env.spec.ts',
        "const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100'"
      )
    ).toEqual([])
    expect(
      staticBoundaryViolations(
        'test-utils/runtime-loader.ts',
        "const load = require; void load('@playwright/test')"
      )
    ).not.toEqual([])
    expect(RUNTIME_SOURCE_PATTERNS).toEqual(expect.arrayContaining(['*.mts', '*.cts']))
    for (const extension of ['mts', 'cts']) {
      expect(
        staticBoundaryViolations(
          `e2e/runtime-loader.spec.${extension}`,
          "import { chromium } from '@playwright/test'; void chromium"
        )
      ).not.toEqual([])
    }
  })

  it('rejects direct construction, route, event, and wrapper Page escape APIs', async () => {
    const unsafeSource = [
      "import { chromium } from '@playwright/test'",
      "import { request as rawRequest } from 'playwright/test'",
      "export { firefox } from 'playwright'",
      "void import('playwright-core')",
      "const runtimeModule = 'playwright/test'; void import(runtimeModule)",
      'void chromium.launch()',
      "void playwright.webkit.connect('ws://localhost:9222')",
      "void playwright.firefox.launchPersistentContext('/tmp/profile')",
      "void playwright.chromium.connectOverCDP('http://localhost:9222')",
      'void playwright.chromium.launchServer()',
      'void route.continue()',
      "page.route('**/*', r => r.fetch({ url: 'https://example.invalid' }))",
      "page.route('**/*', source => { const alias = source; return alias.fetch() })",
      "page.route('**/*', ({ fetch: send }) => send())",
      'const namedHandler = handlerRoute => handlerRoute.fetch()',
      "page.route('**/*', namedHandler)",
      "void context.unroute('**/*')",
      "void page.waitForEvent('popup')",
      "void context.waitForEvent('page')",
      "page.on('popup', popup => popup.context().request.get('https://example.invalid'))",
      "page.once('popup', popup => popup.context().request.get('https://example.invalid'))",
      "page.addListener('popup', handler)",
      "page.prependListener('popup', handler)",
      "context.prependOnceListener('page', handler)",
      "context.on('page', handler)",
      "context.once('page', handler)",
      'void page.opener()',
      "void frame.page().context().request.get('https://example.invalid')",
      "void dialog['page']().context().request.get('https://example.invalid')",
      'const getDownloadPage = download.page',
      'const { page: getFileChooserPage } = fileChooser',
      'let getConsolePage = consoleMessage.page',
      'let getWebErrorPage; ({ page: getWebErrorPage } = webError)',
      'let page; ({ page } = dialog)',
      "const { ['page']: getComputedPage } = download",
      "let getAssignedComputedPage; ({ ['page']: getAssignedComputedPage } = fileChooser)",
      "page.exposeBinding('x', ({ page: raw }) => raw.request.get('https://example.invalid'))",
      "const unwrap = ({ ['page']: get }) => get(); unwrap(dialog)",
      'void playwright._initializer.chromium.connectOverCDP()',
      "void playwright['_electron'].launch()",
      'void test.extend({ unsafe: true })',
      'void test.test.extend({ unsafe: true })',
      'void test.chromium.launch()',
      "void test['request']['newContext']()",
      "void Object.getOwnPropertyDescriptor(test, 'expect')",
    ].join('\n')
    expect(staticBoundaryViolations('e2e/example.spec.ts', unsafeSource)).toEqual([
      'e2e/example.spec.ts: runtime Playwright import',
      'e2e/example.spec.ts: runtime Playwright import',
      'e2e/example.spec.ts: runtime Playwright export',
      'e2e/example.spec.ts: runtime Playwright import',
      'e2e/example.spec.ts: unresolved runtime module loader',
      'e2e/example.spec.ts: direct BrowserType.launch',
      'e2e/example.spec.ts: direct BrowserType.connect',
      'e2e/example.spec.ts: direct BrowserType.launchPersistentContext',
      'e2e/example.spec.ts: direct BrowserType.connectOverCDP',
      'e2e/example.spec.ts: direct BrowserType.launchServer',
      'e2e/example.spec.ts: direct Route.continue',
      'e2e/example.spec.ts: direct Route.fetch',
      'e2e/example.spec.ts: direct Route.fetch',
      'e2e/example.spec.ts: direct Route.fetch',
      'e2e/example.spec.ts: direct Route.fetch',
      'e2e/example.spec.ts: route guard removal via unroute',
      'e2e/example.spec.ts: raw Page escape via waitForEvent(popup)',
      'e2e/example.spec.ts: raw Page escape via waitForEvent(page)',
      'e2e/example.spec.ts: raw Page escape via on(popup)',
      'e2e/example.spec.ts: raw Page escape via once(popup)',
      'e2e/example.spec.ts: raw Page escape via addListener(popup)',
      'e2e/example.spec.ts: raw Page escape via prependListener(popup)',
      'e2e/example.spec.ts: raw Page escape via prependOnceListener(page)',
      'e2e/example.spec.ts: raw Page escape via on(page)',
      'e2e/example.spec.ts: raw Page escape via once(page)',
      'e2e/example.spec.ts: raw Page escape via opener',
      ...Array<string>(11).fill('e2e/example.spec.ts: raw Page escape via wrapper.page'),
      'e2e/example.spec.ts: direct BrowserType.connectOverCDP',
      'e2e/example.spec.ts: private Playwright runtime access',
      'e2e/example.spec.ts: private Playwright runtime access',
      'e2e/example.spec.ts: guarded test fixture extension',
      'e2e/example.spec.ts: guarded test fixture extension',
      'e2e/example.spec.ts: direct BrowserType.launch',
      'e2e/example.spec.ts: forbidden guarded test runtime surface',
      'e2e/example.spec.ts: forbidden guarded test runtime surface',
      'e2e/example.spec.ts: reflective guarded test runtime surface',
      'e2e/example.spec.ts: reflective runtime capability',
    ])

    expect(
      staticBoundaryViolations(
        'tests/e2e/example.spec.ts',
        "void dialog['page']().context().request.get('https://example.invalid')"
      )
    ).toEqual(['tests/e2e/example.spec.ts: raw Page escape via wrapper.page'])
    expect(
      staticBoundaryViolations(
        'e2e/example.spec.ts',
        "test('guarded fixture', async ({ page }) => page.goto('/'))"
      )
    ).toEqual([])
    expect(
      staticBoundaryViolations(
        'e2e/example.setup.ts',
        [
          "import { test as setup } from './fixtures/network-test'",
          "setup('guarded fixture', async ({ page }) => page.goto('/'))",
        ].join('\n')
      )
    ).toEqual([])
    for (const source of [
      [
        "test('shadowed page', async ({ page }) => {",
        '  { const page = { evaluate(callback: () => void) { callback() } }',
        "    page.evaluate(() => Reflect.get(() => {}, 'constructor')) }",
        '})',
      ].join('\n'),
      [
        "test('parameter shadow', async ({ page }) => {",
        '  const invoke = (page: { evaluate(callback: () => void): void }) =>',
        "    page.evaluate(() => Reflect.get(() => {}, 'constructor'))",
        '  invoke(page)',
        '})',
      ].join('\n'),
    ]) {
      expect(staticBoundaryViolations('e2e/shadowed-page.spec.ts', source)).not.toEqual([])
    }

    const root = process.cwd()
    const files = trackedRuntimeSourceFiles(root)
    const violations = (
      await Promise.all(
        files.map(async relativePath =>
          staticBoundaryViolations(
            relativePath.split(path.sep).join('/'),
            await readFile(path.join(root, relativePath), 'utf8')
          )
        )
      )
    ).flat()
    expect(violations).toEqual([])
  }, 30_000)

  it('mobile-critical-routes IPHONE_14_VIEWPORT matches the installed devices descriptor', () => {
    // e2e/mobile-critical-routes.spec.ts hardcodes {390,664} instead of importing
    // `devices` (the static boundary forbids runtime Playwright imports in e2e
    // specs). This turns descriptor drift — a future @playwright/test bump
    // changing devices['iPhone 14'].viewport — into a named failure here rather
    // than a mysterious mobile-E2E red. If this fails, update IPHONE_14_VIEWPORT
    // in e2e/mobile-critical-routes.spec.ts AND the mobile project in
    // playwright.config.ts (which spreads ...devices['iPhone 14']).
    expect({ width: 390, height: 664 }).toEqual(devices['iPhone 14'].viewport)
  })
})
