---
okf_version: "0.1"
---

# Files

- [API Layer & Normalizers](api-and-normalizers.md) - API client singleton with auto-injected auth and cabinet headers, the Boundary Normalizer Pattern that transforms backend responses into frontend-canonical shapes, Anti-Pattern #8 null semantics, CSV export infrastructure, and the communications gated write-back with async 202 job polling.
- [Architecture](architecture.md) - Next.js App Router dashboard architecture — route groups, layout and provider hierarchy, client-side data fetching for interactive pages, authentication (proxy + Zustand store), and state management.
- [Conventions & Quality Gates](conventions-and-quality.md) - Coding standards and automated quality gates — file-size limits, TypeScript strictness, the Defensive Frontend Principle, ratchet baseline gates, and the two-pass review discipline.
- [Design System — Tailwind v4, shadcn primitives, product compositions](design-system.md) - The layered semantic design system: CSS-first Tailwind v4 token contract in src/styles/globals.css, hardened domain-agnostic shadcn/ui primitives in src/components/ui, six presentational product-composition families (page context, metrics, filters, tables, charts, states) in src/components/product, and the Epics 166-174 full UI migration program.
- [Domain Logic](domain-logic.md) - Financial and business-logic helpers as pure functions in src/lib/ — theoretical profit, margin/COGS temporal logic, unit economics, liquidity with trends, account finances + document download (NEW-7), seller communications with gated write-back (NEW-2), cost/tariff calculations, ISO-week/Moscow-timezone handling, and Russian-locale formatters.
- [WB ERP System — Frontend OpenWiki](quickstart.md) - Financial analytics dashboard for Wildberries (WB) marketplace sellers. Built with Next.js App Router, TypeScript, Tailwind, and a Russian-locale UI. Entry point for frontend OpenWiki documentation.
- [Testing & Operations](testing-and-ops.md) - Testing strategy (Vitest unit with MSW, Playwright E2E, local E2E preflight and handshake, outbound network guards, Playwright static boundary, privacy console and diagnostic-capture guards, frontend verification orchestrator), CI/CD workflows, local run modes, and environment variables.
