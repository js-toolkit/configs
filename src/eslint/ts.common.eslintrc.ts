import { moduleExtensions } from '../paths';

module.exports = {
  extends: [
    require.resolve('./common.eslintrc.js'),
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
  ],

  parser: '@typescript-eslint/parser',

  plugins: ['@typescript-eslint'],

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': moduleExtensions /* .filter(ext => ext.includes('ts')) */,
    },

    'import/resolver': {
      node: {
        extensions: moduleExtensions.filter(ext => ext.includes('js') || ext.includes('ts')),
      },
    },
  },

  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'no-restricted-globals': 'off',
    'no-redeclare': 'off',
    'no-inner-declarations': ['off', 'functions'],
    // 'no-useless-constructor': 'off',
    // 'no-empty-function': ['error', { allow: ['constructors'] }],
    'class-methods-use-this': 'off',
    'import/named': 'off',
    'import/export': 'off', // No named exports found in module
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
  },
};
