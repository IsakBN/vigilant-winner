import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

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
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      // No any types
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // No default exports (except for Next.js pages/layouts - see overrides below)
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

      // React rules
      'react/jsx-uses-react': 'off', // Not needed with React 17+
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Promise handling - less strict for event handlers
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false, // Allow async onClick handlers
          },
        },
      ],

      // Allow void expressions in arrow functions (common React pattern)
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {
          ignoreArrowShorthand: true,
        },
      ],

      // Allow type aliases (more flexible than interfaces for unions, etc.)
      '@typescript-eslint/consistent-type-definitions': 'off',

      // Allow || for nullish coalescing (sometimes we DO want falsy check)
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      // Allow numbers and other types in template expressions
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],

      // Disable unnecessary condition check (too many false positives)
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  // Next.js pages/layouts require default exports
  {
    files: ['**/app/**/page.tsx', '**/app/**/layout.tsx', '**/app/**/error.tsx', '**/app/**/not-found.tsx', '**/app/**/loading.tsx', '**/app/**/route.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      // API routes often don't use await
      '@typescript-eslint/require-await': 'off',
    },
  },
  // Component files - allow return type inference
  {
    files: ['**/components/**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // UI components use shadcn patterns that include deprecated ElementRef
  {
    files: ['**/components/ui/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
  // Provider files - allow return type inference
  {
    files: ['**/providers/**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // Hooks - allow return type inference
  {
    files: ['**/hooks/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // Middleware - allow return type inference
  {
    files: ['**/middleware.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/.next/**', '*.config.js', '*.config.ts', '*.config.mjs'],
  }
);
