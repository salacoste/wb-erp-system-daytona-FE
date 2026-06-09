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
]
