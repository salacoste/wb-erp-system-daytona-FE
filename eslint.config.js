// Frontend ESLint flat config — the enforcement path for CI.
//
// This is the ACTUAL config used by `npx eslint` in CI and `npm run lint`.
// The legacy `.eslintrc.json` is kept for IDE/editor integration only
// (Story 98.1-FE). When both configs exist in the same directory, ESLint 9+
// uses the flat config and ignores `.eslintrc.json`.
//
// Mirrors the rules from the monorepo root `eslint.config.js` so that
// standalone frontend CI (self-hosted runner) gets identical enforcement.

const typescriptParser = require('@typescript-eslint/parser')
const typescriptEslint = require('@typescript-eslint/eslint-plugin')
const jsxA11y = require('eslint-plugin-jsx-a11y')

module.exports = [
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'out/**'],
    // ESLint 9 changed the default for unused disable directives from 'off'
    // (ESLint 8) to 'warn'. This repo has ~34 intentionally-defensive
    // `// eslint-disable-next-line no-restricted-syntax` comments on
    // SEMANTIC-ZERO count sites (severity counts, qty, etc.) that the
    // Anti-Pattern #8 money/ratio selector legitimately does NOT cover.
    // Under ESLint 8 these were silently allowed; restore that behavior so
    // the 0-warning baseline is preserved without churning 20+ source files.
    // Genuine rule violations still error; only the unused-DIRECTIVE lint
    // signal is dialed back to the ESLint 8 default.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  // Source files — strict enforcement
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        // NOTE: 'project' intentionally omitted for CI on low-memory VPS.
        // With project: './tsconfig.json', ESLint loads the full TS program
        // into memory (~1.2 GB) and OOMs on a 2 GB RAM machine. The rules
        // in this config don't require type-aware linting, so it's safe to omit.
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        browser: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      // Accessibility: icon-only interactive elements must have accessible name
      'jsx-a11y/control-has-associated-label': 'error',
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      // Anti-Pattern #8: '?? 0' on money/ratio fields lies
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "LogicalExpression[operator='??'][right.value=0] > MemberExpression.left[property.name=/^(revenue|profit|cost|spend|roas|margin|price|payment|fee|tax|cpc|cpm|ctr|conversion)$/i]",
          message:
            "Anti-Pattern #8: '?? 0' on money/ratio field lies — use '?? null' and render as '—'.",
        },
        {
          selector:
            "LogicalExpression[operator='??'][right.value=0] > ChainExpression.left > MemberExpression[property.name=/^(revenue|profit|cost|spend|roas|margin|price|payment|fee|tax|cpc|cpm|ctr|conversion)$/i]",
          message:
            "Anti-Pattern #8: '?? 0' on money/ratio field lies — use '?? null' and render as '—'.",
        },
        {
          selector:
            "LogicalExpression[operator='??'][right.value=0] > MemberExpression.left[property.name=/(sales_gross|returns_gross|sales_net|margin_pct|revenue_net|gross_profit|net_profit|operating_profit|wb_sales_gross|acquiring_fee|loyalty_fee|wb_promotion|wb_jam|storage_cost|logistics_cost|paid_acceptance|total_commission|retail_price|_rub$|_usd$|_amount$|_price$|_cost$|_profit$|_revenue$|_spend$|_margin$|_fee$|_pct$|_rate$|_share$|_ratio$)/i]",
          message: "Anti-Pattern #8: '?? 0' on money/ratio suffix field lies — use '?? null'.",
        },
        {
          selector:
            "LogicalExpression[operator='??'][right.value=0] > ChainExpression.left > MemberExpression[property.name=/(sales_gross|returns_gross|sales_net|margin_pct|revenue_net|gross_profit|net_profit|operating_profit|wb_sales_gross|acquiring_fee|loyalty_fee|wb_promotion|wb_jam|storage_cost|logistics_cost|paid_acceptance|total_commission|retail_price|_rub$|_usd$|_amount$|_price$|_cost$|_profit$|_revenue$|_spend$|_margin$|_fee$|_pct$|_rate$|_share$|_ratio$)/i]",
          message: "Anti-Pattern #8: '?? 0' on money/ratio suffix field lies — use '?? null'.",
        },
      ],
    },
  },
  // Playwright E2E specs — parse TypeScript and enforce basic hygiene without
  // applying the 200-line source cap to the existing browser-test suite.
  {
    files: ['e2e/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
    },
  },
  // Historical E2E debt predating Story 174.3. Keep the exemptions exact so
  // every other browser spec and fixture is covered by the executable cap.
  // These files are unchanged by Story 174.3 and must be split in their owner
  // lifecycles rather than hidden inside this verification Story.
  {
    files: ['e2e/fixtures/playwright-network-guard.ts', 'e2e/onboarding.spec.ts'],
    rules: {
      'max-lines': 'off',
    },
  },
  // Test files — higher line cap (800 vs 200)
  {
    files: ['src/**/__tests__/**', 'src/**/*.test.*', 'src/test/**', 'src/mocks/**'],
    rules: {
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
    },
  },
  // shadcn/ui components — managed via CLI, exempt from max-lines
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'max-lines': 'off',
    },
  },
  // Anti-Pattern #8 — boundary normalizer/mapper coverage (task-48).
  //
  // Root-cause guard for the BD-2/10/16/29/32/34/38 money/ratio-null defect class,
  // which lived exclusively inside src/lib/api/**-normalizer.ts / **-mapper.ts (the
  // '**' glob below covers nested domain subdirs — ai/, shipment-cost/, expenses/,
  // daily-analytics/ — not just the top-level api dir). The
  // source-block AP#8 selectors above technically match src/** already, but produce
  // zero hits on normalizers because those files never write the bare-member form
  // (item.revenue ?? 0) — they funnel fields through the shared coercion helpers
  // (normalizer-helpers.ts): counts use toCount (0-safe), money/ratio use
  // toNullableNumber (null-safe). This block adds an explicit normalizer/mapper
  // override so a NEW bare-member money/ratio '?? 0' committed here can't slip in
  // silently, using the same money/ratio name/suffix regexes as the source block.
  //
  // NOTE: the toNullableNumber(...)/firstNumber(...) '?? 0' helper-defeat form
  // (the currently-present sites task-47 is migrating) is guarded separately by the
  // ratchet gate scripts/check-anti-pattern-8-normalizer.sh — a count-based ratchet
  // (like check:locale-percent) that lets task-47 land incrementally without a hard
  // ESLint failure, while the self-test scripts/test-anti-pattern-8-normalizer-rule.sh
  // proves both this ESLint selector and the helper-defeat detection fire/pass.
  //
  // Legitimate count sites already use toCount (no '?? 0'); documented
  // SEMANTIC-ZERO / AGGREGATION-REDUCE / DISPLAY-GUARD exceptions pass via the
  // allowlist convention: // eslint-disable-next-line no-restricted-syntax -- <PATTERN>: <rationale>
  {
    files: ['src/lib/api/**/*-normalizer.ts', 'src/lib/api/**/*-mapper.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Root money/ratio names — direct member access: raw.revenue ?? 0
          selector:
            "LogicalExpression[operator='??'][right.value=0] > MemberExpression.left[property.name=/^(revenue|profit|cost|spend|roas|margin|price|payment|fee|tax|cpc|cpm|ctr|conversion)$/i]",
          message:
            "Anti-Pattern #8 (task-48): '?? 0' on a money/ratio field inside a boundary normalizer/mapper lies — null means 'unknown', not 'zero'. Use toNullableNumber(...) and keep the field nullable; for a genuine count use toCount(...). SEMANTIC-ZERO/AGGREGATION-REDUCE/DISPLAY-GUARD: add // eslint-disable-next-line no-restricted-syntax -- <PATTERN>: <rationale>.",
        },
        {
          // Root money/ratio names — optional chaining: raw?.revenue ?? 0
          selector:
            "LogicalExpression[operator='??'][right.value=0] > ChainExpression.left > MemberExpression[property.name=/^(revenue|profit|cost|spend|roas|margin|price|payment|fee|tax|cpc|cpm|ctr|conversion)$/i]",
          message:
            "Anti-Pattern #8 (task-48): '?? 0' on a money/ratio field inside a boundary normalizer/mapper lies — null means 'unknown', not 'zero'. Use toNullableNumber(...) and keep the field nullable; for a genuine count use toCount(...). SEMANTIC-ZERO/AGGREGATION-REDUCE/DISPLAY-GUARD: add // eslint-disable-next-line no-restricted-syntax -- <PATTERN>: <rationale>.",
        },
        {
          // Money/ratio suffix fields — direct member access: raw.stock_value ?? 0
          selector:
            "LogicalExpression[operator='??'][right.value=0] > MemberExpression.left[property.name=/(sales_gross|returns_gross|sales_net|margin_pct|revenue_net|gross_profit|net_profit|operating_profit|wb_sales_gross|acquiring_fee|loyalty_fee|wb_promotion|wb_jam|storage_cost|logistics_cost|paid_acceptance|total_commission|retail_price|stock_value|frozen_capital|_rub$|_usd$|_amount$|_price$|_cost$|_profit$|_revenue$|_spend$|_margin$|_fee$|_pct$|_rate$|_share$|_ratio$|Rub$|Usd$)/i]",
          message:
            "Anti-Pattern #8 (task-48): '?? 0' on a money/ratio suffix field inside a boundary normalizer/mapper lies — use toNullableNumber(...) and keep the field nullable; for a genuine count use toCount(...).",
        },
        {
          // Money/ratio suffix fields — optional chaining: raw?.stock_value ?? 0
          selector:
            "LogicalExpression[operator='??'][right.value=0] > ChainExpression.left > MemberExpression[property.name=/(sales_gross|returns_gross|sales_net|margin_pct|revenue_net|gross_profit|net_profit|operating_profit|wb_sales_gross|acquiring_fee|loyalty_fee|wb_promotion|wb_jam|storage_cost|logistics_cost|paid_acceptance|total_commission|retail_price|stock_value|frozen_capital|_rub$|_usd$|_amount$|_price$|_cost$|_profit$|_revenue$|_spend$|_margin$|_fee$|_pct$|_rate$|_share$|_ratio$|Rub$|Usd$)/i]",
          message:
            "Anti-Pattern #8 (task-48): '?? 0' on a money/ratio suffix field inside a boundary normalizer/mapper lies — use toNullableNumber(...) and keep the field nullable; for a genuine count use toCount(...).",
        },
      ],
    },
  },
]
