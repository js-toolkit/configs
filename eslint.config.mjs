import path from 'path';
import { defineConfig, globalIgnores } from 'eslint/config';
import common from '@js-toolkit/eslint-config/common';
import { getFilesGlob, getTSExtensions } from '@js-toolkit/config-utils/extensions';

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig([
  ...common,

  {
    files: [getFilesGlob(getTSExtensions())],

    languageOptions: {
      parserOptions: {
        projectService: {
          defaultProject: path.resolve(import.meta.dirname, 'eslint.tsconfig.json'),
          allowDefaultProject: ['build-utils/scripts/*'],
        },
      },
    },

    rules: {
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    rules: {
      'import-x/no-import-module-exports': 'off',
      'import-x/extensions': ['error', 'ignorePackages', { ts: 'always' }],
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          packageDir: [
            './',
            './config-utils',
            './eslint-config',
            './prettier-config',
            './build-utils',
          ],
        },
      ],
      //     'no-undef': 'off',
      //     'no-unused-vars': 'off',
      //     'no-unused-expressions': ['error', { allowShortCircuit: true }],
      //     'no-use-before-define': 'off',
      //     'no-restricted-globals': 'off',
      //     'no-redeclare': 'off',
      //     'no-inner-declarations': ['off', 'functions'],
      //     'no-console': 'off',
      //     'class-methods-use-this': 'off',
      //     'global-require': 'off',
    },
  },

  globalIgnores(['**/node_modules/**', '**/dist/**']),
]);
