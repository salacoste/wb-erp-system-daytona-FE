---
okf_version: "0.1"
---

# Files

- [API Layer & Normalizers](api-and-normalizers.md) - API client singleton with auto-injected auth and cabinet headers, the Boundary Normalizer Pattern that transforms backend responses into frontend-canonical shapes, Anti-Pattern #8 null semantics, and CSV export infrastructure.
- [Architecture](architecture.md) - Next.js App Router single-page dashboard architecture — route groups, layout and provider hierarchy, 100% client-side data fetching, authentication (proxy + Zustand store), and state management.
- [Conventions & Quality Gates](conventions-and-quality.md) - Coding standards and automated quality gates — file-size limits, TypeScript strictness, the Defensive Frontend Principle, ratchet baseline gates, and the two-pass review discipline.
- [Domain Logic](domain-logic.md) - Financial and business-logic helpers as pure functions in src/lib/ — theoretical profit, margin/COGS temporal logic, unit economics, liquidity, cost/tariff calculations, ISO-week/Moscow-timezone handling, and Russian-locale formatters.
- [WB ERP System — Frontend OpenWiki](quickstart.md) - Financial analytics dashboard for Wildberries (WB) marketplace sellers. Built with Next.js App Router, TypeScript, Tailwind, and a Russian-locale UI. Entry point for frontend OpenWiki documentation.
- [Testing & Operations](testing-and-ops.md) - Testing strategy (Vitest unit with MSW, Playwright E2E), test organization and fixtures, CI/CD workflows, PM2 deployment, and environment variables.
