import js from '@eslint/js'
import tseslint from 'typescript-eslint'

const restrictedApiPatterns = {
  http: [
    '**/*.service.*',
    '**/*.rule.*',
    '**/*.repository.*',
    '**/db/**',
    '**/*.table.*',
  ],
  rule: [
    'fastify',
    '@fastify/*',
    'drizzle-orm',
    'drizzle-orm/*',
    'node:fs',
    'node:http',
    'node:https',
    '**/*.service.*',
    '**/*.repository.*',
    '**/*.query.*',
    '**/*.facade.*',
    '**/*.http.*',
    '**/*.event.*',
    '**/db/**',
    '**/*.table.*',
  ],
  query: [
    '**/*.service.*',
    '**/*.rule.*',
    '**/*.facade.*',
    '**/*.http.*',
    '**/*.event.*',
  ],
  repository: [
    '**/*.service.*',
    '**/*.rule.*',
    '**/*.facade.*',
    '**/*.http.*',
    '**/*.event.*',
  ],
}

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
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
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'eqeqeq': ['error', 'always'],
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Default exports are not allowed. Use named exports.',
        },
      ],
    },
  },
  {
    files: ['src/server.ts', 'src/app.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['test/**/*.ts', 'vitest.e2e.config.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.e2e.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['vitest.e2e.config.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/**/*.service.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Default exports are not allowed. Use named exports.',
        },
        {
          selector: 'IfStatement',
          message: 'Services orchestrate only. Move business decisions into pure rules.',
        },
        {
          selector: 'SwitchStatement',
          message: 'Services orchestrate only. Move business decisions into pure rules.',
        },
        {
          selector: 'ConditionalExpression',
          message: 'Services orchestrate only. Move business decisions into pure rules.',
        },
      ],
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['fastify', '@fastify/*', 'drizzle-orm', 'drizzle-orm/*', '**/*.http.*', '**/*.dto.*', '**/*.table.*'],
            message: 'Services must remain framework/transport independent and must not access tables directly.',
          },
        ],
      }],
    },
  },
  {
    files: ['src/**/*.rule.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: restrictedApiPatterns.rule.map(group => ({
          group: [group],
          message: 'Rules must remain pure and framework/infrastructure independent.',
        })),
      }],
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'env', message: 'Pass configuration into rules explicitly.' },
        { object: 'Date', property: 'now', message: 'Pass the current time into rules explicitly.' },
        { object: 'Math', property: 'random', message: 'Pass random/generated values into rules explicitly.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Default exports are not allowed. Use named exports.',
        },
        {
          selector: 'NewExpression[callee.name="Date"]',
          message: 'Rules must not read the system clock. Pass time in explicitly.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.http.ts', 'src/**/*.event.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: restrictedApiPatterns.http.map(group => ({
          group: [group],
          message: 'Transport code must call the slice facade and must not bypass it.',
        })),
      }],
    },
  },
  {
    files: ['src/**/*.query.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: restrictedApiPatterns.query.map(group => ({
          group: [group],
          message: 'Queries are read-only infrastructure and must not depend on application/transport layers.',
        })),
      }],
    },
  },
  {
    files: ['src/**/*.repository.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: restrictedApiPatterns.repository.map(group => ({
          group: [group],
          message: 'Repositories are infrastructure operations and must not depend on application/transport layers.',
        })),
      }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
)
