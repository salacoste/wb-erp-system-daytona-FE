# Development

## npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev -p 3100` | Dev server on port 3100 |
| `build` | `next build` | Production build |
| `start` | `next start -p 3100` | Production server on port 3100 |
| `lint` | `npx eslint 'src/**/*.{ts,tsx}' --max-warnings 112` | ESLint check |
| `lint:fix` | `npx eslint ... --fix` | ESLint autofix |
| `type-check` | `tsc --noEmit` | TypeScript compilation check |
| `test` | `vitest` | Unit tests (watch mode) |
| `test:coverage` | `vitest --coverage` | Coverage report |
| `test:e2e` | `playwright test` | E2E tests |
| `test:e2e:ui` | `playwright test --ui` | E2E with UI |
| `format` | `prettier --write "src/**/*.{ts,tsx,json,css}"` | Format code |
| `format:check` | `prettier --check ...` | Check formatting |
| `clean` | `rm -rf .next node_modules/.cache` | Clear build cache |
| `clean:full` | Full clean + reinstall | `rm -rf .next node_modules/.cache node_modules && npm install` |

### Validation Scripts

| Script | Purpose |
|--------|---------|
| `check:docs` | Validate doc citations (`scripts/check-doc-citations.sh`) |
| `check:eslint-rules` | Validate ESLint rule names |
| `check:next-params` | Validate Next.js 15 async params pattern |
| `check:max-lines` | Enforce 200-line file limit |
| `check:locale-percent` | Russian-locale percent format ratchet |

## Quality Gates

Before committing, run:

```bash
npm run lint && npm run type-check && npm run format:check
npm test                 # Vitest
npm run test:e2e         # Playwright (optional, slower)
```

**Accepted baselines** (from CLAUDE.md):
- TypeScript: 0 errors
- ESLint: 0 errors, max 112 warnings
- Vitest: ≥16,745 passing, 0 failed
- Doc citations: baseline-gated (drift detection)

CI enforces these via `.github/workflows/frontend-quality.yml` — see [testing.md](testing.md).

## File Size Enforcement

All source files must be **≤200 lines** (enforced by ESLint `max-lines` and `scripts/check-max-lines.sh`). Test files are allowed up to 800 lines. The proactive extraction target is ~150 lines.

This is a hard constraint — the codebase is intentionally kept granular with many small, focused files rather than few large ones.

## Path Alias

TypeScript path alias: `@/*` → `./src/*`

Import from source root:
```typescript
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
```

## Environment Setup

### Prerequisites
- Node.js 20+
- npm
- PM2 (global, for production only)

### Configuration

Copy `.env.example` to `.env.local`:

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3000` | Backend REST API (no `/api` suffix; endpoints start with `/v1/`) |
| `NEXT_PUBLIC_APP_NAME` | No | `WB Repricer System` | App display name |
| `NEXT_PUBLIC_APP_VERSION` | No | `1.0.0` | App version |
| `NEXT_PUBLIC_ENABLE_DEV_TOOLS` | No | unset | Enables React Query DevTools |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | No | unset | Mixpanel analytics flag |
| `NEXT_PUBLIC_ENABLE_WEBSOCKET` | No | unset | WebSocket feature flag |

### Path Alias for Feature Flags

Feature flags are in `src/config/features.ts`.

## Git Hooks (Husky)

Pre-commit hooks via Husky + lint-staged run ESLint and Prettier on staged files automatically.

## Next.js Configuration Notes

- **ESLint during build**: Ignored (`ignoreDuringBuilds: true`) — linting is a separate quality gate
- **Webpack cache**: Disabled in dev to avoid ENOENT race conditions
- **React Strict Mode**: Temporarily disabled (investigating infinite reload)
- **Security headers**: Applied to all routes (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`)

## Development Workflow Notes

- **shadcn/ui components** (`src/components/ui/`): Do not edit directly. Use the shadcn CLI to add or update components. These are copy-paste primitives built on Radix UI.
- **Doc-link validation**: Run `npm run check:docs` before committing doc updates — catches broken source citations of the form `` `src/path.ts:N` ``
- **BMad Framework**: The project uses the BMad Method agent framework (`.bmad-core/`) with agent personas. See `AGENTS.md` and `BMAD-QUICK-START.md` for details.
