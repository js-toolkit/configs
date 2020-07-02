import fs from 'fs';
import { Linter } from 'eslint';
import { rules } from 'eslint-config-airbnb-base/rules/style';
import paths, { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

const config: Linter.Config = {
  extends: [
    // Adds import plugin, import/resolver.node.extensions, import/extensions
    'airbnb-base',
    // Adds prettier plugin
    'plugin:prettier/recommended',
  ],

  env: {
    es2020: true,
  },

  parser: 'babel-eslint',

  parserOptions: {
    ecmaVersion: 2020,
  },

  settings: {
    'import/resolver': {
      node: {
        // Add again for consistency with extensions in webpack configs
        extensions: moduleExtensions.filter((ext) => !ext.includes('ts')),

        moduleDirectory: [
          'node_modules',
          paths.client.sources,
          paths.server.sources,
          paths.shared.sources,
        ].filter((v) => !!v),
      },
    },
  },

  rules: {
    'no-console': 'off',
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/extensions': [
      'error',
      'ignorePackages',
      // never allow to use of the module extensions.
      moduleExtensions.reduce(
        (acc, ext) => ({ ...acc, [ext.substr(1)]: 'never' }),
        { '': 'never' } // Fix error on import user type declaration folder such as `client/types`
      ),
    ],
  },

  overrides: [
    {
      files: moduleExtensions.filter((ext) => ext.includes('ts')).map((ext) => `*${ext}`),

      extends: [
        // Adds @typescript-eslint/parse, import/extensions, import/resolver.node.extensions
        // https://github.com/benmosher/eslint-plugin-import/blob/master/config/typescript.js
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier/@typescript-eslint',
      ],

      parser: '@typescript-eslint/parser',

      parserOptions: {
        project: fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json',
      },

      plugins: ['@typescript-eslint'],

      // Add again for consistency with extensions in webpack configs
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
        // 'no-restricted-globals': 'off',
        'no-restricted-syntax': (Array.isArray(rules['no-restricted-syntax'])
          ? rules['no-restricted-syntax'].filter(
              (param) => typeof param !== 'object' || param.selector !== 'ForOfStatement'
            )
          : rules['no-restricted-syntax']) as Linter.RuleEntry,
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-useless-constructor.md#rule-changes
        'no-useless-constructor': 'off',
        'import/export': 'off', // No named exports found in module
        'import/named': 'off', // With named namespace export: {name} not found in {module}
        // https://github.com/typescript-eslint/typescript-eslint/blob/v3.0.0/packages/eslint-plugin/docs/rules/no-floating-promises.md#ignorevoid
        'no-void': ['error', { allowAsStatement: true }],
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/explicit-function-return-type': [
          'warn',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: true,
          },
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
    },
  ],
};

module.exports = config;
