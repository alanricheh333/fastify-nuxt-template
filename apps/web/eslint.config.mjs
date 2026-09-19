import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['.nuxt/**', '.output/**', 'dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'eqeqeq': ['error', 'always'],
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['app/**/*.ts', 'app/**/*.vue'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['~/slices/*/*/*', '@/slices/*/*/*'],
            message: 'Do not deep-import another feature slice. Use its public surface instead.',
          },
          {
            group: ['~/shared/**/slices/**', '@/shared/**/slices/**'],
            message: 'Shared code must never depend on feature slices.',
          },
        ],
      }],
    },
  },
  {
    files: ['app/shared/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['~/slices/**', '@/slices/**'],
            message: 'Shared code must remain independent from feature slices.',
          },
        ],
      }],
    },
  },
  {
    files: ['app/pages/**/*.vue', 'app/layouts/**/*.vue'],
    rules: {
      'no-restricted-globals': ['error', 'fetch'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="$fetch"]',
          message: 'Pages/layouts should compose features, not perform raw API calls.',
        },
      ],
    },
  },
  {
    files: ['app/slices/**/*.vue'],
    rules: {
      'no-restricted-globals': ['error', 'fetch'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="$fetch"]',
          message: 'Feature components should use slice API/query/mutation/composable abstractions instead of raw $fetch.',
        },
      ],
    },
  },
  {
    files: ['app/**/*.{ts,vue}'],
    ignores: ['app/**/*.config.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use named exports in TypeScript modules. Vue SFCs and Nuxt config files are exceptions.',
        },
      ],
    },
  },
  {
    files: ['app/**/*.vue'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.comp.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
)
