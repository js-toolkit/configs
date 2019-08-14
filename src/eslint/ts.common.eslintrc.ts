import { moduleExtensions } from '../paths';

module.exports = {
  extends: [
    require.resolve('./common.eslintrc.js'),
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier/@typescript-eslint',
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: 'tsconfig.json',
  },

  plugins: ['@typescript-eslint'],

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': moduleExtensions,
    },

    'import/resolver': {
      node: {
        extensions: moduleExtensions,
      },
    },
  },

  rules: {
    'no-restricted-globals': 'off',
    // 'class-methods-use-this': 'off',
    'import/named': 'off',
    'import/export': 'off', // No named exports found in module
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
  },
};
