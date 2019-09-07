import fs from 'fs';
import { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

module.exports = {
  extends: [
    require.resolve('./common.eslintrc.js'),
    // Adds @typescript-eslint/parse, import/extensions, import/resolver.node.extensions
    'plugin:import/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier/@typescript-eslint',
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json',
  },

  plugins: ['@typescript-eslint'],

  // Add again for consistency with webpack configs
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': moduleExtensions.filter(ext => ext.includes('ts')),
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
