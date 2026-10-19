import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'bin/**',
      'bench/results/**',
      '*.config.ts',
      '*.config.js',
      'scripts/**'
    ]
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'import': importPlugin
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  // Boundary Rule 1: @excalidraw is ONLY allowed inside src/canvas/excalidraw/
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/canvas/excalidraw/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@excalidraw/*', '@excalidraw/excalidraw'],
              message: '@excalidraw is only allowed inside src/canvas/excalidraw/'
            }
          ]
        }
      ]
    }
  },
  // Boundary Rule 2: components may not import src/canvas/excalidraw/* directly — only src/canvas/port
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/canvas/excalidraw/**',
                '../canvas/excalidraw/**',
                '../../canvas/excalidraw/**',
                './canvas/excalidraw/**'
              ],
              message: 'components may not import src/canvas/excalidraw/* directly — only src/canvas/port'
            }
          ]
        }
      ]
    }
  },
  // Boundary Rule 3: src/core non-test files import nothing app-level (components, hooks, App shell, @excalidraw)
  {
    files: ['src/core/**/*.ts'],
    ignores: ['src/core/**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/components/**',
                '../components/**',
                '../../components/**',
                '**/hooks/**',
                '../hooks/**',
                '../../hooks/**',
                '**/App*',
                '../App*',
                '@excalidraw/*',
                '@excalidraw/excalidraw'
              ],
              message: 'src/core imports nothing app-level (components, hooks, App shell)'
            }
          ]
        }
      ]
    }
  }
];
