# Tier-0 production-runtime certification harness

This surface is intentionally separate from the generic Playwright suite. It never builds or
installs dependencies, never reuses a process on port 3100, and never authorizes production or WB
cabinet writes.

## Safety contract

1. An integration owner publishes an immutable RCSM-bound runnable artifact. The runtime operator
   extracts those exact bytes; `.next/BUILD_ID` must already exist.
2. The operator creates an environment descriptor from `environment-descriptor.example.json`.
   Origins are exact positive allowlists; the backend must identify itself as `non-production`. The operator descriptor must have a detached Ed25519 signature, while the runner receives the trusted issuer and public-key fingerprint independently through `TIER0_TRUSTED_DESCRIPTOR_ISSUER` and `TIER0_TRUSTED_DESCRIPTOR_PUBLIC_KEY_SHA256`. The runtime operator also supplies a private `TIER0_IMMUTABLE_FETCH_RECEIPT` based on `immutable-fetch-receipt.example.json`; it must prove read-only verification before extraction and no reconstruction fallback.
3. `TIER0_RCSM_SHA256`, `TIER0_BOUND_PUBLIC_API_ORIGIN`, descriptor artifact hashes, and the current
   registry hash must agree. Next rewrites/redirects/proxies are rejected unless a future registry
   version supplies a positively verified routing contract.
4. `node scripts/tier0/run-certification.mjs --descriptor <external-json> --evidence-root <new-dir>`
   performs preflight before Playwright/auth. The output directory must not already exist.
5. Direct Playwright execution is fail-closed. Static discovery is the only bypass:
   `TIER0_STATIC_LIST=1 playwright test --config=playwright.tier0.config.ts --list`.
6. Credentialed traces, screenshots, videos, raw HTML, request bodies, cookies, and authorization
   values are not persisted. The raw Playwright JSON is quarantined only long enough to derive the
   sanitized status-only report, then deleted.
7. The mutating row remains disabled unless the existing triple guard, test-owned record, and
   cleanup capability are all present. `RT-E14` uses only the descriptor's exact allowlisted API,
   requires the create response to return the exact owned identifier and owner marker in bound
   response headers before parsing the body, and fails unless cleanup of that identifier succeeds.

## Current scope and verdict ceiling

The harness implements global destination/artifact/environment preflight, capability-scoped
prerequisites, an owned port-3100 production server, fixed registry/evidence closure, live
`RT-E01..RT-E14` runtime contracts, and live `OI-E01..OI-E10` Orders Integrity contracts. Public
rendering, mutation denial, and anonymous denial run without credentials; authority-dependent rows
are explicitly `BLOCKED` when their declared capability is absent. The harness does not turn a
missing sandbox, identity, fixture, credential, immutable artifact, or cleanup control into PASS,
so the product remains `UNDETERMINED` until an authorized live certification is completed.
