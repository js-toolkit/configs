import common from './src/eslint/common.ts';
import { getFilesGlob, getTSExtensions } from './src/extensions.ts';

export default [
  ...common,

  {
    files: [getFilesGlob(getTSExtensions())],

    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['scripts/*'],
        },
      },
    },

    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'off',
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
      'import-x/extensions': ['error', { ts: 'always' }],
      'import-x/no-import-module-exports': 'off',
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
];
