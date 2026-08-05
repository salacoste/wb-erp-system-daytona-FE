# Local E2E preflight

Use the preflight-gated commands in this frontend repository. They validate
configuration and both localhost services before Playwright collection or
browser launch, remove only the two ignored auth-state files, and regenerate
authentication through the live setup-project login flow.

## Prerequisites

- Node.js `24.18.0`, npm `11.11.0`, and frontend dependencies installed.
- The frontend running at `http://localhost:3100` (`npm run dev`).
- The backend repository running at `http://localhost:3000`; its public health
  check must return success at `http://localhost:3000/v1/health`.
- An Owner test user provisioned by the backend repository's database seed.
  The values in `.env.e2e` must match that seeded user's email and password.

The backend owns database seeding. From the backend repository root
(`wb-repricer-system-new`, not this frontend repository), use its current seed
process. The current backend seed requires Owner and Manager seed passwords:

```bash
TEST_EMAIL='<owner email>' \
TEST_PASSWORD='<owner password>' \
E2E_MANAGER_PASSWORD='<local manager seed password>' \
npx prisma db seed
```

Do not try to seed from this frontend repository; it has no database-seeding
script.

## Configure the frontend

```bash
cp .env.e2e.example .env.e2e
```

Set all four required values in `.env.e2e`:

- `E2E_BASE_URL=http://localhost:3100`
- `E2E_API_URL=http://localhost:3000`
- `E2E_TEST_EMAIL` matching the backend-seeded Owner
- `E2E_TEST_PASSWORD` matching that Owner's backend seed password

The file itself must contain all four nonblank values even when matching shell
variables are exported. Shell values override the file for a run, and the
preflight validates, probes, and passes that single effective environment to
Playwright so collection cannot execute with different URLs or credentials.

`E2E_MANAGER_EMAIL` and `E2E_MANAGER_PASSWORD` are an optional pair. When both
are present, Manager-role coverage uses `e2e/.auth/manager.json`. When neither
is present, that coverage reports a visible skip. An incomplete pair produces a
non-secret warning and does not block the Owner smoke.

## Run safe browser tests

The documented default is a bounded, read-only Chromium smoke. It runs
`e2e/orders.spec.ts`, keeps the authenticated `setup` dependency, and excludes
`@mutating` tests:

```bash
npm run test:e2e
```

The full local suite remains available behind the same preflight:

```bash
npm run test:e2e:full
```

Playwright arguments are forwarded after `--`:

```bash
npm run test:e2e -- --list
npm run test:e2e:full -- --project=chromium --grep 'orders' --list
npm run test:e2e:ui
```

Run deterministic diagnostics without launching Playwright:

```bash
npm run test:e2e:preflight
npm run test:e2e:preflight:help
```

Local raw `playwright test` invocations are rejected so they cannot silently
reuse stale ignored auth state. The preflight creates a fresh random temporary
handshake for its Playwright child and attempts to remove it when that child
exits; cleanup failure is surfaced without exposing its path, token, or raw
error. A caller-provided marker is not accepted. `--no-deps` is rejected by both the
preflight and Playwright configuration because Chromium relies on the setup
project to write a fresh `e2e/.auth/user.json` through the live login flow.

## Mutation safety

The default result is explicitly `READ-ONLY`. Specs tagged `@mutating` stay
excluded unless the existing shared policy receives all three opt-ins:

```bash
E2E_ENABLE_MUTATIONS=true \
E2E_MUTATION_TARGET=sandbox \
E2E_MUTATION_ACK=I_UNDERSTAND_THIS_MUTATES_TEST_DATA \
npm run test:e2e:full
```

The enable flag accepts `1`, `true`, `yes`, or `on` case-insensitively. The
target and acknowledgement values are exact. Only enable them for isolated
sandbox data where backend and WB side effects are acceptable.

## Failure recovery

- Missing or blank variables: compare `.env.e2e` with `.env.e2e.example` and
  rerun `npm run test:e2e:preflight`.
- Frontend unavailable: start this repository with `npm run dev` and verify
  `http://localhost:3100/login` is reachable without a redirect.
- Backend unavailable: start the backend repository and verify
  `http://localhost:3000/v1/health` returns a success response without a
  redirect.
- Login failure: rerun the backend-owned seed with matching Owner values, then
  rerun the bounded smoke. The preflight never prints credential values,
  response bodies, headers, cookies, tokens, or storage state.
- Manager skip: either leave both optional Manager variables blank or provision
  the backend Manager user and set both variables.

If a prerequisite check fails, Playwright does not start and existing ignored
auth files are left untouched. Cleanup happens only after both service probes
pass and removes only `e2e/.auth/user.json` and `e2e/.auth/manager.json`.
