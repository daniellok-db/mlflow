/**
 * ESLint configuration for web-shared folder.
 *
 * This config is designed to match the eslint rules from the Universe
 * js/packages/web-shared package to minimize diffs during copybara sync.
 *
 * Key differences from parent MLflow config:
 * - import/order is explicitly disabled (matching Universe FEINF-4628)
 * - import/no-duplicates is disabled (matching Universe FEINF-4628)
 * - Stricter TypeScript rules for OSS-prefixed variables
 */
module.exports = {
  rules: {
    // [FEINF-4628] Disable import/order to match Universe web-shared config.
    // This is required to prevent copybara sync from reordering imports,
    // which can expose cycle runtime errors.
    'import/order': 'off',

    // [FEINF-4628] Disable import/no-duplicates rule to match Universe.
    // This has a bug with fixes and type imports.
    'import/no-duplicates': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // Match Universe's @typescript-eslint/no-unused-vars config for OSS variables.
        // OSS-only variables are prefixed with `oss_`. This prefix is stripped by Copybara.
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^oss_',
            args: 'none',
            ignoreRestSiblings: true,
            caughtErrors: 'none',
          },
        ],
        // Copybara transformations can make some code unreachable from Universe's perspective.
        // EDGE blocks define code that should not be exported.
        'no-unreachable': 'off',
      },
    },
  ],
};
