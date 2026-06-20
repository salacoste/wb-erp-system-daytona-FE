# E2E safety policy

Default E2E runs must not mutate real WB cabinet data or real products.

Specs that create, sync, close, delete, seed, or otherwise change
backend/WB-cabinet state are tagged `@mutating`, filtered out by
`playwright.config.ts`, and guarded by `e2e/fixtures/mutation-guard.ts` unless
all explicit opt-ins are present.

```bash
E2E_ENABLE_MUTATIONS=true \
E2E_MUTATION_TARGET=sandbox \
E2E_MUTATION_ACK=I_UNDERSTAND_THIS_MUTATES_TEST_DATA \
npm run test:e2e -- e2e/supplies/supply-lifecycle.spec.ts
```

Only set these variables for isolated sandbox/test data where cleanup and WB
side effects are acceptable. Do not use them with a real cabinet containing real
products.
