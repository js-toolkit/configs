import fs from 'fs';
import { rules } from 'eslint-config-airbnb-base/rules/style';
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
    'no-restricted-syntax': Array.isArray(rules['no-restricted-syntax'])
      ? rules['no-restricted-syntax'].filter(
          param => typeof param !== 'object' || param.selector !== 'ForOfStatement'
        )
      : rules['no-restricted-syntax'],
    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-useless-constructor.md#rule-changes
    'no-useless-constructor': 'off',
    'import/named': 'off',
    'import/export': 'off', // No named exports found in module
    'import/extensions': [
      'error',
      'ignorePackages',
      // never allow the use of the module extensions.
      moduleExtensions.reduce(
        (acc, ext) => ({ ...acc, [ext.substr(1)]: 'never' }),
        { '': 'never' } // Fix error on import user type declaration folder such as `client/types`
      ),
    ],
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
  },

  overrides: [
    // Special overrides for TS declaration files
    {
      files: ['*.d.ts'],
      rules: {
        'max-classes-per-file': 'off',
      },
    },
  ],
};
