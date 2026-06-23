#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const SESSION_CONTEXTS = new Set(['anonymous', 'onboarding', 'authenticated', 'blocked'])
const AUTH_STATES = new Set(['clean', 'storage-state', 'fresh-login', 'redirected', 'blocked'])
const STATUSES = new Set(['passed', 'warning', 'failed', 'blocked', 'skipped'])
const STORAGE_STATE_STRATEGIES = new Set(['preserve', 'client-storage-role-override'])

function usage() {
  console.log(
    'Usage: node scripts/validate-route-audit-manifest.mjs <manifest.json> [route-inventory.json] [--allow-failures] [--allow-warnings] [--allow-blocked-network]'
  )
  console.log(
    'Warnings are intentional advisory findings (for example visible mutating controls, console errors, or protected read 5xx). The validator fails warnings unless --allow-warnings is passed.'
  )
  console.log('Validates the read-only frontend route audit manifest structure and route coverage.')
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read JSON ${filePath}: ${error.message}`)
  }
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message)
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function routeTemplateToRegExp(templatePath) {
  const pattern = templatePath
    .split('/')
    .map(segment => {
      if (!segment) return ''
      if (/^\[[^\]/]+\]$/.test(segment)) return '[^/]+'
      return escapeRegExp(segment)
    })
    .join('/')

  return new RegExp(`^${pattern}$`)
}

function fixturePathMatchesTemplate(templatePath, fixturePath) {
  return routeTemplateToRegExp(templatePath).test(fixturePath)
}

function validateRecord(record, index, errors) {
  const prefix = `records[${index}]`
  assert(
    typeof record.path === 'string' && record.path.startsWith('/'),
    `${prefix}.path must be an absolute route`,
    errors
  )
  assert(
    typeof record.source === 'string' && record.source.length > 0,
    `${prefix}.source is required`,
    errors
  )
  assert(typeof record.dynamic === 'boolean', `${prefix}.dynamic must be boolean`, errors)
  assert(typeof record.group === 'string', `${prefix}.group is required`, errors)
  assert(
    SESSION_CONTEXTS.has(record.session_context),
    `${prefix}.session_context invalid: ${record.session_context}`,
    errors
  )
  assert(
    AUTH_STATES.has(record.auth_state),
    `${prefix}.auth_state invalid: ${record.auth_state}`,
    errors
  )
  assert(STATUSES.has(record.status), `${prefix}.status invalid: ${record.status}`, errors)
  assert(Array.isArray(record.console_errors), `${prefix}.console_errors must be an array`, errors)
  assert(Array.isArray(record.page_errors), `${prefix}.page_errors must be an array`, errors)
  assert(
    Array.isArray(record.failed_requests),
    `${prefix}.failed_requests must be an array`,
    errors
  )
  assert(
    Array.isArray(record.blocked_requests),
    `${prefix}.blocked_requests must be an array`,
    errors
  )
  assert(
    Array.isArray(record.denied_controls),
    `${prefix}.denied_controls must be an array`,
    errors
  )
  assert(Array.isArray(record.warnings), `${prefix}.warnings must be an array`, errors)
  assert(Array.isArray(record.issues), `${prefix}.issues must be an array`, errors)
  assert(Number.isFinite(record.duration_ms), `${prefix}.duration_ms must be a number`, errors)
  if (record.api_fixtures !== undefined) {
    assert(Array.isArray(record.api_fixtures), `${prefix}.api_fixtures must be an array`, errors)
    for (const [fixtureIndex, fixture] of record.api_fixtures.entries()) {
      const fixturePrefix = `${prefix}.api_fixtures[${fixtureIndex}]`
      assert(
        typeof fixture.route_path === 'string' && fixture.route_path === record.path,
        `${fixturePrefix}.route_path must equal the record path`,
        errors
      )
      assert(
        typeof fixture.url_pattern === 'string' && fixture.url_pattern.length > 0,
        `${fixturePrefix}.url_pattern is required`,
        errors
      )
      assert(Array.isArray(fixture.methods), `${fixturePrefix}.methods must be an array`, errors)
      assert(
        fixture.methods.every(method => method === 'GET' || method === 'HEAD'),
        `${fixturePrefix}.methods may only include GET/HEAD read methods`,
        errors
      )
      assert(
        typeof fixture.source === 'string' && fixture.source.length > 0,
        `${fixturePrefix}.source is required`,
        errors
      )
    }
  }

  const warnings = Array.isArray(record.warnings) ? record.warnings : []
  const deniedControls = Array.isArray(record.denied_controls) ? record.denied_controls : []

  if (record.status === 'passed') {
    assert(warnings.length === 0, `${prefix}.passed records must not include warnings`, errors)
    assert(
      deniedControls.length === 0,
      `${prefix}.passed records must not include visible mutating controls`,
      errors
    )
  }

  if (record.status === 'warning') {
    assert(warnings.length > 0, `${prefix}.warning records must include warning reasons`, errors)
  }

  if (deniedControls.length > 0) {
    assert(
      record.status === 'warning' || record.status === 'failed',
      `${prefix}.visible mutating controls must be warning or failed status`,
      errors
    )
    assert(
      warnings.some(warning => warning.startsWith('visible-mutating-controls-observed-only:')),
      `${prefix}.visible mutating controls must be represented in warnings`,
      errors
    )
  }

  if (record.dynamic && record.status === 'blocked') {
    assert(
      record.session_context === 'blocked',
      `${prefix}.blocked dynamic routes must use session_context=blocked`,
      errors
    )
    assert(
      record.auth_state === 'blocked',
      `${prefix}.blocked dynamic routes must use auth_state=blocked`,
      errors
    )
    assert(
      record.final_url == null,
      `${prefix}.blocked dynamic routes must not include final_url`,
      errors
    )
    assert(
      record.http_status == null,
      `${prefix}.blocked dynamic routes must not include http_status`,
      errors
    )
    assert(record.title == null, `${prefix}.blocked dynamic routes must not include title`, errors)
    assert(
      record.screenshot == null,
      `${prefix}.blocked dynamic routes must not include screenshot`,
      errors
    )
    assert(
      record.fixture_path == null,
      `${prefix}.blocked dynamic routes must not include fixture_path`,
      errors
    )
    assert(
      record.issues.includes('dynamic-route-blocked-until-safe-fixture-is-explicitly-provided'),
      `${prefix}.blocked dynamic routes must include safe-fixture blocked issue`,
      errors
    )
  } else if (record.dynamic) {
    assert(
      record.status !== 'blocked',
      `${prefix}.resolved dynamic routes must not be blocked`,
      errors
    )
    assert(
      record.session_context !== 'blocked',
      `${prefix}.resolved dynamic routes must not use session_context=blocked`,
      errors
    )
    assert(
      record.auth_state !== 'blocked',
      `${prefix}.resolved dynamic routes must not use auth_state=blocked`,
      errors
    )
    assert(
      typeof record.fixture_path === 'string' && record.fixture_path.startsWith('/'),
      `${prefix}.resolved dynamic routes must include fixture_path`,
      errors
    )
    assert(
      !/\[[^\]]+\]/.test(record.fixture_path ?? ''),
      `${prefix}.fixture_path must not contain unresolved route params`,
      errors
    )
    assert(record.template_path === record.path, `${prefix}.template_path must equal path`, errors)
    assert(
      fixturePathMatchesTemplate(record.path, record.fixture_path ?? ''),
      `${prefix}.fixture_path must match dynamic route template`,
      errors
    )
    assert(
      typeof record.fixture_source === 'string' && record.fixture_source.length > 0,
      `${prefix}.resolved dynamic routes must include fixture_source`,
      errors
    )
    assert(
      typeof record.final_url === 'string',
      `${prefix}.resolved dynamic routes need final_url`,
      errors
    )
    assert(
      !record.issues.includes('dynamic-route-blocked-until-safe-fixture-is-explicitly-provided'),
      `${prefix}.resolved dynamic routes must not include safe-fixture blocked issue`,
      errors
    )
  }

  for (const [requestIndex, request] of (record.blocked_requests ?? []).entries()) {
    const requestPrefix = `${prefix}.blocked_requests[${requestIndex}]`
    assert(
      typeof request.url === 'string' && request.url.startsWith('http'),
      `${requestPrefix}.url must be absolute`,
      errors
    )
    assert(
      typeof request.method === 'string' && request.method.length > 0,
      `${requestPrefix}.method is required`,
      errors
    )
    assert(
      request.method !== 'GET' && request.method !== 'HEAD',
      `${requestPrefix} should only record blocked non-read requests`,
      errors
    )
    assert(
      request.session_context === record.session_context,
      `${requestPrefix}.session_context must match route record`,
      errors
    )
  }
}

function validateManifest(manifest, inventory, options) {
  const errors = []

  assert(manifest.schema_version === 1, 'schema_version must be 1', errors)
  assert(
    typeof manifest.run_id === 'string' && manifest.run_id.length > 0,
    'run_id is required',
    errors
  )
  assert(
    typeof manifest.generated_at === 'string' && manifest.generated_at.length > 0,
    'generated_at is required',
    errors
  )
  assert(
    typeof manifest.base_url === 'string' && manifest.base_url.startsWith('http'),
    'base_url must be absolute URL',
    errors
  )
  assert(
    typeof manifest.inventory_path === 'string' && manifest.inventory_path.length > 0,
    'inventory_path is required',
    errors
  )
  assert(
    typeof manifest.auth_context?.requested_role === 'string' &&
      manifest.auth_context.requested_role.length > 0,
    'auth_context.requested_role is required',
    errors
  )
  assert(
    typeof manifest.auth_context?.auth_file === 'string' && manifest.auth_context.auth_file.length > 0,
    'auth_context.auth_file is required',
    errors
  )
  assert(
    STORAGE_STATE_STRATEGIES.has(manifest.auth_context?.storage_state_strategy),
    `auth_context.storage_state_strategy invalid: ${manifest.auth_context?.storage_state_strategy}`,
    errors
  )
  assert(
    manifest.auth_context?.client_storage_role === null ||
      typeof manifest.auth_context?.client_storage_role === 'string',
    'auth_context.client_storage_role must be a string or null',
    errors
  )
  assert(
    Array.isArray(manifest.auth_context?.token_roles),
    'auth_context.token_roles must be an array',
    errors
  )
  assert(
    manifest.auth_context?.token_role_matches_requested === null ||
      typeof manifest.auth_context?.token_role_matches_requested === 'boolean',
    'auth_context.token_role_matches_requested must be boolean or null',
    errors
  )
  if (manifest.auth_context?.storage_state_strategy === 'client-storage-role-override') {
    assert(
      manifest.auth_context.client_storage_role === manifest.auth_context.requested_role,
      'auth_context.client_storage_role must equal requested_role for client-storage-role-override',
      errors
    )
  }
  assert(manifest.safety_policy?.read_only === true, 'safety_policy.read_only must be true', errors)
  assert(
    manifest.safety_policy?.mutation_env_cleared === true,
    'safety_policy.mutation_env_cleared must be true',
    errors
  )
  assert(
    Array.isArray(manifest.safety_policy?.blocked_methods),
    'safety_policy.blocked_methods must be an array',
    errors
  )
  assert(Array.isArray(manifest.records), 'records must be an array', errors)
  assert(
    manifest.safety_policy?.visible_mutating_controls === 'warning',
    'safety_policy.visible_mutating_controls must be warning',
    errors
  )

  const records = manifest.records ?? []
  records.forEach((record, index) => validateRecord(record, index, errors))

  const summary = manifest.summary ?? {}
  const computedSummary = {
    total_routes: records.length,
    audited_routes: records.filter(record => !record.dynamic || record.status !== 'blocked').length,
    dynamic_blocked_routes: records.filter(record => record.dynamic && record.status === 'blocked')
      .length,
    failed_routes: records.filter(record => record.status === 'failed').length,
    warning_routes: records.filter(record => record.status === 'warning').length,
    blocked_network_requests: records.reduce(
      (sum, record) => sum + (record.blocked_requests?.length ?? 0),
      0
    ),
    visible_mutating_control_routes: records.filter(
      record => (record.denied_controls?.length ?? 0) > 0
    ).length,
    visible_mutating_controls_observed: records.reduce(
      (sum, record) => sum + (record.denied_controls?.length ?? 0),
      0
    ),
    api_fixture_routes: records.filter(record => (record.api_fixtures?.length ?? 0) > 0).length,
  }

  for (const [key, expectedValue] of Object.entries(computedSummary)) {
    assert(
      summary[key] === expectedValue,
      `summary.${key} mismatch: expected ${expectedValue}, observed ${summary[key]}`,
      errors
    )
  }

  if (!options.allowFailures) {
    assert(computedSummary.failed_routes === 0, 'summary.failed_routes must be 0', errors)
  }
  if (!options.allowWarnings) {
    assert(computedSummary.warning_routes === 0, 'summary.warning_routes must be 0', errors)
  }
  if (!options.allowBlockedNetwork) {
    assert(
      computedSummary.blocked_network_requests === 0,
      'summary.blocked_network_requests must be 0',
      errors
    )
  }

  if (inventory) {
    const expectedRoutes = new Set((inventory.routes ?? []).map(route => route.path))
    const observedRoutes = new Set(records.map(record => record.path))
    assert(
      summary.total_routes === expectedRoutes.size,
      `summary.total_routes must equal inventory route count ${expectedRoutes.size}`,
      errors
    )
    assert(
      expectedRoutes.size === observedRoutes.size,
      `route count mismatch: expected ${expectedRoutes.size}, observed ${observedRoutes.size}`,
      errors
    )

    for (const routePath of expectedRoutes) {
      assert(observedRoutes.has(routePath), `missing route record for ${routePath}`, errors)
    }
  }

  return errors
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  usage()
  process.exit(0)
}

const positionalArgs = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
const options = {
  allowFailures: process.argv.includes('--allow-failures'),
  allowWarnings: process.argv.includes('--allow-warnings'),
  allowBlockedNetwork: process.argv.includes('--allow-blocked-network'),
}
const [manifestPath, inventoryPath] = positionalArgs

if (!manifestPath) {
  usage()
  process.exit(2)
}

const manifest = readJSON(manifestPath)
const inventory = inventoryPath ? readJSON(inventoryPath) : null
const errors = validateManifest(manifest, inventory, options)

if (errors.length > 0) {
  console.error(`Route audit manifest validation failed for ${path.resolve(manifestPath)}:`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Route audit manifest valid: ${path.resolve(manifestPath)}`)
