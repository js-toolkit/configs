import fs from 'fs';
import type { Linter } from 'eslint';
import airbnbBaseConfig from 'eslint-config-airbnb-base';
import airbnbBaseStyleConfig from 'eslint-config-airbnb-base/rules/style';
import paths, { moduleExtensions } from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';
import { eslintTsProject } from './consts';

const hasImportPlugin = !!getInstalledPackage('eslint-plugin-import');
const hasTsDocPlugin = !!getInstalledPackage('eslint-plugin-tsdoc');

const airbnbExtends = hasImportPlugin
  ? airbnbBaseConfig.extends
  : airbnbBaseConfig.extends.filter((item) => !item.includes('rules/imports.js'));

const config: Linter.Config = {
  extends: [
    // Adds import plugin (if installed) and rules
    // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/index.js
    ...airbnbExtends,
    // Adds prettier plugin
    'plugin:prettier/recommended',
  ],

  env: {
    es2020: true,
  },

  parser: '@babel/eslint-parser',

  parserOptions: {
    ecmaVersion: 2020,
  },

  reportUnusedDisableDirectives: true,

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

      // For `eslint-import-resolver-typescript` plugin.
      // It needs if uses `paths` in `tsconfig.json` but not used `eslint-import-resolver-webpack`.
      typescript: {},
    },

    'import/extensions': moduleExtensions.filter((ext) => !ext.includes('ts')),
  },

  rules: {
    'no-console': 'off',
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'func-names': ['warn', 'as-needed', { generators: 'as-needed' }],

    'no-restricted-exports': [
      'error',
      {
        restrictedNamedExports: ['then'],
        restrictDefaultExports: {
          named: true,
          namedFrom: true,
          namespaceFrom: true,
          defaultFrom: false,
        },
      },
    ],

    ...(hasImportPlugin && {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'import/extensions': [
        'error',
        'ignorePackages',
        // never allow to use of the module extensions.
        moduleExtensions.reduce(
          (acc, ext) => ({ ...acc, [ext.substring(1)]: 'never' }),
          { '': 'never' } // Fix error on import user type declaration folder such as `client/types`
        ),
      ],
      'import/order': [
        'error',
        { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'] },
      ],
      'import/prefer-default-export': 'off',
      // 'import/no-default-export': 'warn',
    }),
  },

  overrides: [
    {
      files: moduleExtensions.filter((ext) => ext.includes('ts')).map((ext) => `*${ext}`),

      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],

      parser: '@typescript-eslint/parser',

      parserOptions: {
        project: fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json',
      },

      plugins: ['@typescript-eslint', ...(hasTsDocPlugin ? ['eslint-plugin-tsdoc'] : [])],

      // Add again for consistency with extensions in webpack configs
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': moduleExtensions,
        },
        'import/resolver': {
          node: {
            extensions: moduleExtensions,
          },
          typescript: {
            project: fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json',
          },
        },
        'import/extensions': moduleExtensions,
        'import/external-module-folders': ['node_modules', 'node_modules/@types'],
      },

      rules: {
        // 'no-restricted-globals': 'off',
        // Disable error for `for of` statements
        'no-restricted-syntax': (Array.isArray(airbnbBaseStyleConfig.rules['no-restricted-syntax'])
          ? airbnbBaseStyleConfig.rules['no-restricted-syntax'].filter(
              (param) => typeof param !== 'object' || param.selector !== 'ForOfStatement'
            )
          : airbnbBaseStyleConfig.rules['no-restricted-syntax']) as Linter.RuleEntry,
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-useless-constructor.md#rule-changes
        'no-useless-constructor': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/v3.0.0/packages/eslint-plugin/docs/rules/no-floating-promises.md#ignorevoid
        'no-void': ['error', { allowAsStatement: true }],

        ...(hasImportPlugin && {
          'import/export': 'off', // No named exports found in module
          'import/named': 'off', // With named namespace export: {name} not found in {module}
        }),

        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/explicit-function-return-type': [
          'warn',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
            allowDirectConstAssertionInArrowFunctions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: true,
          },
        ],

        ...(hasTsDocPlugin && {
          'tsdoc/syntax': 'warn',
        }),
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
