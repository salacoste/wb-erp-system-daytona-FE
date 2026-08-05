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

- Repair obsolete workflow and validator guidance in `testing-and-ops.md`.
- Remove orphaned or duplicated fragments from `conventions-and-quality.md`.
- Remove false broken-link comments from `domain-logic.md` where the targets resolve.
- Do not preserve inaccurate prose merely to minimize the generated diff.
