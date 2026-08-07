# WB Repricer Frontend

<!-- CURRENT-STATUS:START -->

This is a new product developed and tested locally. The frontend runs on
`http://localhost:3100`; `NEXT_PUBLIC_API_URL` selects the backend origin and
defaults to `http://localhost:3000`. There is currently no deployment or release
platform.
<!-- CURRENT-STATUS:END -->

## Current Delivery Status

- Epic 127 is done.
- Epic 162 is done.
- Epics 163 and 164 are done.
- Epic 165: stories 165.1-165.3 are done; 165.4 and 165.5 are deferred (backend-gated).

## Requirements

- Node.js `24.18.0`
- npm `11.11.0`
- Backend running locally on port `3000`

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3100`.

The default environment value is:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Do not append `/api` to this URL. Frontend API modules call backend routes under
`/v1/...` themselves.

## Local validation

```bash
npm run type-check
npm run lint
npm test -- --run
npm run test:privacy
npm run test:coverage
npm run check:privacy
npm run format:check
npm run build
```

`npm run build && npm run start` is available as a local build smoke and also
serves the frontend on port `3100`.

The Story 128.10 verifier under `scripts/story-128-10/` is a historical,
branch-bound artifact. Its manifest requires the former
`feat/epic-128-10-frontend-verification-foundation` branch, so it is not the
current project-wide validation entry point. The commands above and the
story-specific plan are authoritative for current work.

## Browser tests

Local browser tests require the backend-seeded Owner user, the backend on
`localhost:3000`, and the frontend on `localhost:3100`. The backend repository
owns its database seed; this frontend has no database-seeding script.

```bash
cp .env.e2e.example .env.e2e
npm run test:e2e:preflight # configuration and service diagnostics only
npm run test:e2e           # bounded read-only orders smoke on Chromium
npm run test:e2e:full      # full suite through the same preflight
```

The preflight rejects missing configuration, unhealthy services, redirects,
unsafe origins, raw-run marker spoofing, and `--no-deps` before Playwright
starts. It passes one validated effective environment through a fresh temporary
handshake and regenerates ignored auth state through the live setup project.
Handshake cleanup is attempted after Playwright exits, and any cleanup failure
is surfaced as a redacted non-zero result.
Tests that mutate backend or WB-cabinet data remain excluded by default. Follow
the complete setup, backend seed, optional
Manager, argument-forwarding, and recovery guidance in
[`e2e/README.md`](e2e/README.md).

## Project map

Next.js server page and layout wrappers coexist with client components.
Interactive data fetching is client-side; not every page uses the `use client`
directive.

- `src/app/` — Next.js routes and layouts
- `src/components/` — reusable and feature UI
- `src/hooks/` — frontend data/state hooks
- `src/lib/api/` — backend API clients and normalizers
- `src/types/` — TypeScript contracts
- `e2e/` — ordinary local Playwright tests
- `docs/EPICS-AND-STORIES-TRACKER.md` — feature tracking source of truth
- `docs/api-integration-guide.md` — API integration reference

## OpenWiki refresh

Generated pages under `openwiki/**` are refreshed daily at `47 8 * * *` UTC on
the `wb-ci-fe` self-hosted runner with Node.js 24. The user-authored
`openwiki/INSTRUCTIONS.md` control file is not a generated page. The pinned
generator command is `npx --yes openwiki@0.3.0 code --update --print`, using
provider `anthropic`, model `glm-5.2`, and
`https://api.z.ai/api/anthropic`.

Scheduled runs generate on `main`, push a unique
`automation/openwiki-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` branch, and open a
PR without merging it.
Manual dispatch from `main` is rejected; manual dispatch from a non-main
feature branch pushes the generated commit back to that same branch. The
workflow restores its own file, every `AGENTS.md`, `CLAUDE.md`, and
`openwiki/INSTRUCTIONS.md`; it stages generated `openwiki/**` output while
explicitly excluding the control file. Never edit generated OpenWiki pages
manually.
