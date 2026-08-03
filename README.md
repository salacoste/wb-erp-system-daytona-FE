# WB Repricer Frontend

<!-- CURRENT-STATUS:START -->

This is a new product developed and tested locally. The frontend runs on
`http://localhost:3100`; `NEXT_PUBLIC_API_URL` selects the backend origin and
defaults to `http://localhost:3000`. There is currently no deployment or release
platform.
<!-- CURRENT-STATUS:END -->

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

## Browser tests

```bash
cp .env.e2e.example .env.e2e
npm run test:e2e
```

Playwright expects the local frontend and backend to be running and requires
ordinary test credentials from `.env.e2e`.

Tests that mutate backend or WB-cabinet data are excluded by default. See
[`e2e/README.md`](e2e/README.md) before intentionally running any mutating spec
against isolated test data.

## Project map

- `src/app/` — Next.js routes and layouts
- `src/components/` — reusable and feature UI
- `src/hooks/` — frontend data/state hooks
- `src/lib/api/` — backend API clients and normalizers
- `src/types/` — TypeScript contracts
- `e2e/` — ordinary local Playwright tests
- `docs/EPICS-AND-STORIES-TRACKER.md` — feature tracking source of truth
- `docs/api-integration-guide.md` — API integration reference

Generated `openwiki/**` pages are refreshed by the OpenWiki workflow and should
not be edited manually.
