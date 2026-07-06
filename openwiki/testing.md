# Testing

## Unit Tests — Vitest

**Config**: `vitest.config.ts`

| Setting | Value |
|---------|-------|
| Environment | `jsdom` |
| Setup files | `src/test/localStorage-polyfill.ts`, `src/test/setup.ts` |
| Test timeout | 10 seconds |
| Hook timeout | 10 seconds |
| Fake timers | Configured with `shouldAdvanceTime: true` (MSW v2 + React concurrent compatibility) |
| Globals | `true` (global `describe`, `it`, `expect`) |
| Path alias | `@` → `./src` |
| Coverage | V8 provider, text/json/html reporters |

**Accepted baseline**: ≥16,745 passing tests, 0 failed.

### Mocking — MSW v2

`src/mocks/` contains Mock Service Worker handlers for API mocking in unit tests. MSW v2 requires the localStorage polyfill in `src/test/localStorage-polyfill.ts`.

**Commands**:
```bash
npm test                 # watch mode
npm run test:coverage    # coverage report
```

## E2E Tests — Playwright

**Config**: `playwright.config.ts`

| Setting | Value |
|---------|-------|
| Test dir | `./e2e` |
| Parallel | Fully parallel |
| Retries | 2 on CI, 0 locally |
| Workers | 1 on CI, default locally |
| Base URL | `http://localhost:3100` (or `E2E_BASE_URL`) |
| Trace | `on-first-retry` |
| Screenshot | `only-on-failure` |
| Video | `retain-on-failure` |
| Reporter | HTML + list |

### Mutation Safety Policy

**Default E2E runs must not mutate real Wildberries cabinet data.** Specs that create/sync/close/delete are:

1. Tagged `@mutating`
2. Filtered out by default via `grepInvert: /@mutating/` in `playwright.config.ts`
3. Guarded by `e2e/fixtures/mutation-guard.ts`, which requires three env vars to enable:
   - `E2E_ENABLE_MUTATIONS=true`
   - `E2E_MUTATION_TARGET=sandbox`
   - `E2E_MUTATION_ACK=I_UNDERSTAND_THIS_MUTATES_TEST_DATA`

A `read-only-network-guard.ts` (12 KB) provides additional network-level protection.

### Auth Setup Project

Playwright uses a two-project setup:
1. **`setup`** — Runs `*.setup.ts` files that log in via the form and save storage state to `e2e/.auth/user.json`
2. **`chromium`** — Desktop Chrome, depends on `setup`, uses saved auth state

### E2E Structure (~65 spec files)

- Root specs: dashboard, orders, pricing, COGS, unit economics, liquidity, supply planning, funnel, monitor, settings
- `e2e/analytics/` — AI models, analytics hub, FBS orders, forecast, product/search analytics
- `e2e/shipments/` — List, detail, lifecycle, a11y specs
- `e2e/supplies/` — List, detail, lifecycle, a11y specs
- `e2e/settings/` — Backfill a11y + admin specs
- `e2e/fixtures/` — Test data, mutation guard, read-only network guard
- `tests/e2e/telegram-notifications.spec.ts` — Separate notification spec

**Commands**:
```bash
npm run test:e2e         # run all (non-mutating)
npm run test:e2e:ui      # interactive UI mode
```

## CI Pipeline — GitHub Actions

### `frontend-quality.yml` — Quality Gates

| Property | Value |
|----------|-------|
| Triggers | PR to `main`/`develop`, push to `main`/`develop` |
| Runner | `self-hosted` (VPS: 2 vCPU / 2 GB RAM + 2 GB swap) |
| Concurrency | Cancel in-progress for same ref |
| Timeout | 90 minutes |

Runs sequentially (single job) to avoid memory exhaustion from parallel `npm ci`:

1. **Checkout** → `actions/checkout@v4`
2. **Install** → `npm ci`
3. **ESLint** → `npm run lint`
4. **TypeScript** → `node --max-old-space-size=1536 ./node_modules/.bin/tsc --noEmit`
5. **Vitest** → `npm test -- --run --reporter=default`
6. **Privacy Guard** → Scans 6 PII-related files for `console.*` calls; fails CI if found

### `openwiki-update.yml` — Auto-Documentation

Daily cron at 09:00 UTC (10:00 MSK) + manual dispatch. Runs `openwiki --update --print` using z.ai GLM 5.2, then commits changes to `openwiki/` and `CLAUDE.md`.

## QA Gates

`docs/qa/gates/` contains ~80 YAML quality gate files — automated pass/fail criteria per user story. These define acceptance conditions for individual story implementations.

## Test File Size

Test files are allowed up to **800 lines** (vs 200 for source files). See [development.md](development.md) for file-size enforcement details.
