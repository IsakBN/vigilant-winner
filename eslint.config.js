import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // No any types
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // No default exports
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use named exports instead of default exports.',
        },
      ],

      // Consistent returns
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],

      // No unused variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Prefer const
      'prefer-const': 'error',

      // No console in production
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Test file overrides - allow type assertions needed for TypeScript strict mode
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Test files need type assertions for res.json() and similar patterns
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // Allow non-null assertions in tests for cleaner test code
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Allow unbound methods in tests (vi.mocked handles binding correctly)
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/*.js'],
  }
);
