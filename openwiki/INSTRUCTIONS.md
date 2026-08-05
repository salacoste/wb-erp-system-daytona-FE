# OpenWiki Repository Instructions

> This file is user-authored control metadata for OpenWiki. It is not a generated documentation page and must not be replaced by generated content.

## Authority

- Treat source code, tests, workflows, `README.md`, `SETUP.md`, `AGENTS.md`, `CLAUDE.md`, the documentation sources, the project tracker, and the work summary as authoritative.
- Generated OpenWiki pages summarize those sources; they never override them.
- On every update, inspect and correct every affected canonical page. Remove stale, duplicated, or malformed fragments instead of preserving false prose to minimize the diff.
- Revalidate relative links and anchors. Remove obsolete broken-link stamps and comments when their targets resolve.

## Current Product and Runtime Truths

- The frontend uses Next.js 16 and runs locally on port `3100`.
- The backend runs locally on port `3000`.
- Development and validation are local-only. There is no deployment target or production platform.
- There is no mandatory CI merge gate. The repository's explicit local validation commands are documented in `README.md`.
- Story 128.10 verifier results are historical, branch-bound evidence; never present them as a general current validation entry point.
- Next.js server page/layout wrappers coexist with client components. Interactive data fetching is client-side; never claim that every page uses the `use client` directive.

## OpenWiki Workflow Contract

- Schedule: `47 8 * * *` UTC.
- Runner: self-hosted runner labeled `wb-ci-fe`.
- Runtime: Node.js 24.
- Generator: `npx --yes openwiki@0.3.0 code --update --print`.
- Provider: Anthropic protocol through `https://api.z.ai/api/anthropic`, using model `glm-5.2`.
- Scheduled runs create a unique automation branch, push normally, and open a normal pull request.
- Manual runs on a non-`main` ref push the generated commit back to that same branch.
- Manual runs on `main` must be rejected.
- Never push directly or force-push to `main`; never auto-merge generated documentation.
- Protect the workflow file and all `AGENTS.md` and `CLAUDE.md` control files. Stage only generated OpenWiki output.

## Delivery Status

- Epic 127: done.
- Epic 162: in progress.
- Epics 163 and 164: backlog.
- Epic 165: in progress.
- Story 165.3: active.
- Stories 165.4 and 165.5: deferred.

## Required Repairs on the Next Update

- `openwiki/quickstart.md` and/or `openwiki/index.md` MUST contain a visible **Current Delivery Status** section with bullets for these exact truths: Epic 127 is done; Epic 162 is in progress; Epics 163 and 164 are backlog; Epic 165 is in progress; Story 165.3 is active; Stories 165.4 and 165.5 are deferred.
- `openwiki/quickstart.md` and/or `openwiki/index.md` MUST state that development and validation are local-only and that there is no deployment target or production platform.
- Repair obsolete workflow and validator guidance in both `openwiki/testing-and-ops.md` and `openwiki/conventions-and-quality.md`. They MUST identify `scripts/story-128-10/` as immutable historical, branch-bound Story 128.10 evidence tied to the former `feat/epic-128-10-frontend-verification-foundation` branch, and MUST point to `README.md` Local validation plus the active story plan for current commands.
- Repair `openwiki/architecture.md` so it states that Next.js server page/layout wrappers coexist with client components and that interactive data fetching is client-side. It MUST NOT claim that every page uses `use client`.
- In the Configuration section of generated `openwiki/architecture.md`, write exactly one Markdown table. Remove the orphan `syntax` fragment associated with `AP#8 |`, remove duplicate Tailwind and `.env` rows, and inspect the final page to confirm that no duplicate configuration block remains.
- Remove orphaned or duplicated fragments from `openwiki/conventions-and-quality.md`.
- In `openwiki/api-and-normalizers.md`, the stable generated heading MUST be exactly `## Anti-Pattern 8: Preserve Null Money and Ratio Values`. In `openwiki/domain-logic.md`, both domain links MUST use exactly `api-and-normalizers.md#anti-pattern-8-preserve-null-money-and-ratio-values`. Remove all old broken-link comments associated with those links.
- Run the final OpenWiki cross-page relative-link and anchor validator after all generated repairs, and confirm that its accepted anchor agrees with the GitHub-style slug `anti-pattern-8-preserve-null-money-and-ratio-values`.
- Do not preserve inaccurate prose merely to minimize the generated diff.
