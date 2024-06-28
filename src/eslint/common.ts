import fs from 'fs';
import globals from 'globals';
import type { Linter } from 'eslint';
import eslintJs from '@eslint/js';
import { fixupConfigRules } from '@eslint/compat';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import paths, { getFilesGlob, getJSExtensions, getTSExtensions, moduleExtensions } from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';
import { eslintTsProject } from './consts';
import { compat } from './utils';

const hasImportPlugin = !!getInstalledPackage('eslint-plugin-import');
const hasTsDocPlugin = !!getInstalledPackage('eslint-plugin-tsdoc');
const hasTypescriptEslintPlugin = !!getInstalledPackage('typescript-eslint');

const config: Linter.FlatConfig[] = [
  eslintJs.configs.recommended,

  eslintPluginPrettierRecommended,

  ...(hasImportPlugin ? fixupConfigRules(compat.extends('plugin:import/recommended')) : []),

  {
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      // parserOptions: {
      //   ecmaVersion: 2020,
      // },
      ecmaVersion: 'latest',

      globals: {
        ...globals.node,
      },
    },

    linterOptions: {
      reportUnusedDisableDirectives: true,
    },

    settings: {
      'import/extensions': getJSExtensions(),

      'import/resolver': {
        node: {
          // Add again for consistency with extensions in webpack configs
          extensions: getJSExtensions(),

          moduleDirectory: [
            'node_modules',
            // paths.nodeModules.root,
            paths.web.sources,
            paths.node.sources,
            paths.shared.sources,
          ].filter((v) => !!v),
        },

        // For `eslint-import-resolver-typescript` plugin.
        // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
        // It needs if uses `paths` in `tsconfig.json` but not used `eslint-import-resolver-webpack`.
        // typescript: {},
      },

      'import/parsers': {
        '@babel/eslint-parser': getJSExtensions(),
      },
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
  },

  // overrides
  ...(hasTypescriptEslintPlugin
    ? (() => {
        const eslintTs = require('typescript-eslint');
        return eslintTs.config({
          extends: [
            ...eslintTs.configs.recommendedTypeChecked,
            ...(hasImportPlugin
              ? fixupConfigRules(compat.extends('plugin:import/typescript'))
              : []),
          ],

          files: [getFilesGlob(getTSExtensions())],

          plugins: {
            ...(hasTsDocPlugin && { tsdoc: require('eslint-plugin-tsdoc') }),
          },

          languageOptions: {
            parserOptions: {
              project: fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json',
            },
          },

          // Add again for consistency with extensions in webpack configs
          settings: {
            'import/extensions': moduleExtensions,
            'import/resolver': {
              node: {
                extensions: moduleExtensions,
              },
              typescript: {
                project: fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json',
              },
            },
            'import/parsers': {
              '@typescript-eslint/parser': moduleExtensions,
              '@babel/eslint-parser': [], // Disable babel parsing for ts files
            },
            // 'import/external-module-folders': ['node_modules', 'node_modules/@types'],
          },

          rules: {
            // 'no-restricted-globals': 'off',
            // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-useless-constructor.md#rule-changes
            'no-useless-constructor': 'off',
            // https://github.com/typescript-eslint/typescript-eslint/blob/v3.0.0/packages/eslint-plugin/docs/rules/no-floating-promises.md#ignorevoid
            'no-void': ['error', { allowAsStatement: true }],

            // ...(hasImportPlugin && {
            //   'import/export': 'off', // No named exports found in module
            //   'import/named': 'off', // With named namespace export: {name} not found in {module}
            // }),

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
        });
      })()
    : []),

  // Special overrides for TS declaration files
  {
    files: ['**/*.d.ts'],
    rules: {
      'max-classes-per-file': 'off',
    },
  },
];

module.exports = config;
