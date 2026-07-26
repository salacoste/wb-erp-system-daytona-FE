# G006 Frontend Readiness Evidence Summary — 2026-07-26

## Decision

| Boundary                                                    | Recorded status             |
| ----------------------------------------------------------- | --------------------------- |
| Safe local verification                                     | `PASS_AS_EXPECTED`          |
| Canonical coverage selection in the actual repository index | `NOT_TRACKED`               |
| Runtime                                                     | `UNDETERMINED`              |
| CERT-F01                                                    | `NOT_ELIGIBLE_FOR_CERT_F01` |
| Repository certificate                                      | `NOT_ISSUED`                |
| Release                                                     | **NO-GO**                   |

This summary preserves a sanitized, durable account of the local G006 verification result. It is not a certificate, release authorization, commit record, staging record, or assertion that evidence was published to external durable storage.

## Evidence boundary

The source evidence was captured under the local path `.omx/tmp/g006-final-integrated-20260726T002604Z`. That root is transient and non-durable; repository readers must not treat its continued local availability as guaranteed. The integrated run made no live, production, credentialed, or mutating external calls.

The evidence base contains **49/49 expected gate outcomes** through final report capture. This is the pre-documentation-reconciliation base only. It does not predict or claim a later post-documentation or reseal gate total.

## Verified local results

- Toolchain: Node.js 24.18.0 and npm 11.11.0.
- Vitest 4.1.10: **1,047/1,047 files** and **17,296/17,296 tests** passed.
- Coverage measurement: **74.46% lines**, **73.32% statements**, **69.85% functions**, and **70.04% branches**.
- Coverage governance: **27/27 tests** passed.
- Static quality: TypeScript, ESLint, Prettier format check, and AP8 gates passed.
- Builds: two Next.js 16.2.10 production builds each generated **67/67 pages**. Strict source, local-candidate, runtime-input, and actual-index inputs stayed invariant during capture.
- Generated-input incident 034: the first build normalized generated `next-env.d.ts`; the file then remained stable. The capture separates this event from strict source/candidate/runtime inputs. Build IDs and output digests differed, so the evidence does not claim bit-for-bit reproducibility.
- Tier-0 helper tests: **8/8** passed.
- Tier-0 safety tests: **72/72** passed.
- Tier-0 static discovery: **24 tests in 2 files**.
- Missing descriptor: helper and orchestrator exited **3** as expected; the matrix recorded **38/38 `BLOCKED`**, 0 `PASS`, and 0 `FAIL`.
- Malformed descriptor: the controlled negative exited **1** as expected and failed closed.

## Coverage-selection limitation

The measured candidate coverage passed only through an **isolated candidate index**. In the actual repository index, the canonical coverage selection is `NOT_TRACKED` and the selector exits 1 as designed. The isolated index was local-only, did not stage files, did not modify the actual index, and has **no staging or release effect**. The actual index remained unchanged during the integrated capture.

Therefore, the coverage percentages are valid local measurements of the isolated candidate, but they do not establish an active tracked repository policy and do not authorize release.

## Key identities and digests

| Artifact or identity       | SHA-256 / value                                                    |
| -------------------------- | ------------------------------------------------------------------ |
| Evidence manifest          | `e3dd85025cac37c2fa6ec84f9023b77330f450fa6aab8b0695ba2d3e939c6fa3` |
| Evidence-manifest entries  | `7000`                                                             |
| Base gate records          | `49`                                                               |
| Integrated JSON report     | `17e622f549903cdc605bf88c3a1b4684ff26b00c0e2a3cbb54ad1893c319a652` |
| Integrated Markdown report | `7d40c385d6e3b26f3f07f22530c8254b633ea1e200d3dff7fb608eaa57a1201a` |
| Vitest JSON                | `85008c291748706eba3d74cd6d2b671a7f360fb9db272810361c78735e2a26d0` |
| Coverage policy            | `335abc936d93953327ef0aa85be5bc47d745cc94130ebc2047b58b71a0cc9810` |
| Coverage selection         | `12eaed67cf8c3fdeb4af8b42db52a79137f940e43582df0d2c04ab0991af1c63` |
| Tracked source identity    | `82100b57c7af268b71695b87c148cd55d98305552723c079c8daf5772151e340` |
| Local candidate identity   | `4d5e70e21b73c076149731792e2e377091f245897d5bdb444097979ccf5d7083` |
| Runtime-input identity     | `ea8272ff4fd1e981e7a8eb7dfade5cbd988d7305d11e303416add8f46726d5b1` |
| Actual repository index    | `b2ffc5f7c805863c3cc8953f4b9269d966a8339f4cb0f42d6dba1a88f39cfaf5` |
| Package lock               | `2af0fb2d4c15a1b65c81ed5b11fad3e9401d76dca2ff896684a705a15ac41030` |

These identities describe the captured local evidence base. They do not imply that the worktree was committed, that the candidate was fetched independently, or that any artifact was stored externally.

## Unresolved requirements

The worktree was a dirty, uncommitted local candidate. The run did not receive a signed Tier-0 environment descriptor, immutable runtime artifact, execution or cleanup authority, credentials, receipts, a live sandbox result, CERT-F01 evaluation, or external attestation. As a result:

- runtime remains `UNDETERMINED`;
- CERT-F01 remains `NOT_ELIGIBLE_FOR_CERT_F01`;
- the repository certificate remains `NOT_ISSUED`; and
- release remains **NO-GO**.
