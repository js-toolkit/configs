/* eslint-disable @typescript-eslint/no-require-imports */
import fs from 'fs';
import path from 'path';
import globals from 'globals';
import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import eslintJs from '@eslint/js';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import type { AnyObject } from '../types';
import paths, { getFilesGlob, getJSExtensions, getTSExtensions, moduleExtensions } from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';
import { eslintTsProject } from './consts';
import { compat } from './utils';

const hasBabelParser = !!getInstalledPackage('@babel/eslint-parser');
const hasPromisePlugin = !!getInstalledPackage('eslint-plugin-promise');
const hasImportXPlugin = !!getInstalledPackage('eslint-plugin-import-x');
const hasImportPlugin = !!getInstalledPackage('eslint-plugin-import');
const hasConfigStandard = !!getInstalledPackage('eslint-config-standard');
const hasConfigAirbnbBase = !!getInstalledPackage('eslint-config-airbnb-base');
const hasJsDocPlugin = !!getInstalledPackage('eslint-plugin-jsdoc');
const hasTsDocPlugin = !!getInstalledPackage('eslint-plugin-tsdoc');
const hasPrettierEslintPlugin = !!getInstalledPackage('eslint-plugin-prettier/recommended');
const hasTypescriptEslintPlugin = !!getInstalledPackage('typescript-eslint');
const hasImportResolverTypescript = !!getInstalledPackage('eslint-import-resolver-typescript');

const withFilteredStandardRules = (): { readonly rules: Readonly<Linter.RulesRecord> } => {
  const hasNodePlugin = !!getInstalledPackage('eslint-plugin-n');

  const rules = Object.entries((require('eslint-config-standard') as Linter.Config).rules!).reduce(
    (acc, [name, value]) => {
      if (name.startsWith('import/')) {
        if (hasImportPlugin && !hasImportXPlugin) acc[name] = value;
        else if (hasImportXPlugin) acc[name.replace('import/', 'import-x/')] = value;
      } else if (name.startsWith('n/')) {
        if (hasNodePlugin) acc[name] = value;
      } else if (name.startsWith('promise/')) {
        if (hasPromisePlugin) acc[name] = value;
      } else {
        acc[name] = value;
      }
      return acc;
    },
    {} as AnyObject
  );

  return { rules };
};

const filterAirbnbRules = (): FixupConfigArray => {
  const list: FixupConfigArray = require('eslint-config-airbnb-base').extends.map((url: string) => {
    return {
      rules: url.endsWith('imports.js')
        ? (hasImportXPlugin &&
            Object.entries(require(url).rules as Linter.RulesRecord).reduce(
              (acc, [name, value]) => {
                acc[name.replace('import/', 'import-x/')] = value;
                return acc;
              },
              {} as AnyObject
            )) ||
          (hasImportPlugin && require(url).rules) ||
          {}
        : require(url).rules,
    };
  });
  return fixupConfigRules(list);
};

// Disable all rules in favor of airbnb and standard configs.
// const withFilteredImportXRules = (): Linter.Config => {
//   const config: Linter.Config = require('eslint-plugin-import-x').flatConfigs.recommended;
//   return { ...config, rules: {} };
// };

export function createTypeScriptImportResolver(options?: AnyObject): AnyObject {
  return require('eslint-import-resolver-typescript').createTypeScriptImportResolver({
    // project: path.dirname(tsconfig),
    // project: [tsconfig],
    // project: [eslintTsProject, 'tsconfig.json'],
    extensions: moduleExtensions,
    ...options,
  });
}

export function create(cwd: string): Linter.Config[] {
  const eslintTsConfig = hasTypescriptEslintPlugin && path.resolve(cwd, eslintTsProject);
  const tsconfig =
    eslintTsConfig && fs.existsSync(eslintTsConfig)
      ? eslintTsConfig
      : path.resolve(cwd, 'tsconfig.json');

  return [
    eslintJs.configs.recommended,

    ...(hasPromisePlugin ? [require('eslint-plugin-promise').configs['flat/recommended']] : []),

    ...(hasImportPlugin && !hasImportXPlugin
      ? fixupConfigRules(compat.extends('plugin:import/recommended'))
      : []),

    ...(hasImportXPlugin ? [require('eslint-plugin-import-x').flatConfigs.recommended] : []),

    ...(hasConfigStandard ? [withFilteredStandardRules()] : []),

    ...(hasJsDocPlugin
      ? [
          {
            ...require('eslint-plugin-jsdoc').configs['flat/recommended'],
            files: [getFilesGlob(getJSExtensions())],
          },
        ]
      : []),

    ...(hasConfigAirbnbBase ? filterAirbnbRules() : []),

    {
      languageOptions: {
        ecmaVersion: 'latest',
        parserOptions: {
          ecmaVersion: 'latest',
        },
        globals: {
          ...globals.node,
        },
        ...(hasBabelParser && {
          parser: require('@babel/eslint-parser'),
          parserOptions: {
            requireConfigFile: false,
          },
        }),
      },

      linterOptions: {
        reportUnusedDisableDirectives: true,
      },

      settings: {
        ...(hasImportPlugin &&
          !hasImportXPlugin && {
            'import/extensions': getJSExtensions(),
            'import-x/extensions': getJSExtensions(),
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

            ...(hasBabelParser && {
              'import/parsers': {
                '@babel/eslint-parser': getJSExtensions(),
              },
            }),
          }),

        ...(hasImportXPlugin && {
          'import-x/resolver-next': [
            require('eslint-plugin-import-x').createNodeResolver({
              extensions: getJSExtensions(),
              modules: [
                'node_modules',
                // paths.nodeModules.root,
                paths.web.sources,
                paths.node.sources,
                paths.shared.sources,
              ].filter((v) => !!v),
            }),
          ],
          ...(hasBabelParser && {
            'import-x/parsers': {
              '@babel/eslint-parser': getJSExtensions(),
            },
          }),
        }),
      },

      rules: {
        'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
        'func-names': ['warn', 'as-needed', { generators: 'as-needed' }],
        'no-console': 'off',
        'no-unused-expressions': ['error', { allowShortCircuit: true }],
        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
        'no-param-reassign': ['error', { props: false }],
        'no-promise-executor-return': ['error', { allowVoid: true }],

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

        'no-restricted-syntax': [
          'error',
          'ForInStatement',
          // 'ForOfStatement',
          'LabeledStatement',
          'WithStatement',
          // "BinaryExpression[operator='in']",
          "CallExpression[callee.name='setTimeout'][arguments.length!=2]",
          "CallExpression[arguments.length!=2] > MemberExpression[object.name='window'][property.name='setTimeout']",
        ],

        ...((hasImportPlugin || hasImportXPlugin) &&
          Object.entries({
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
              {
                groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
              },
            ],
            'import/prefer-default-export': 'off',
            // 'import/no-default-export': 'warn',
          }).reduce((acc, [name, value]) => {
            if (hasImportXPlugin) acc[name.replace('import/', 'import-x/')] = value;
            else acc[name] = value;
            return acc;
          }, {} as AnyObject)),

        ...(hasPromisePlugin && {
          'promise/always-return': 'off',
          'promise/catch-or-return': ['error', { allowFinally: true }],
        }),
      },
    },

    // overrides
    ...(hasTypescriptEslintPlugin
      ? (() => {
          const eslintTs = require('typescript-eslint');
          return defineConfig({
            extends: [
              ...eslintTs.configs.recommendedTypeChecked,
              ...eslintTs.configs.stylisticTypeChecked,
              ...(hasImportPlugin && !hasImportXPlugin
                ? fixupConfigRules(compat.extends('plugin:import/typescript'))
                : []),
              // Do not use due to declare all settings manually already.
              ...(hasImportXPlugin
                ? [require('eslint-plugin-import-x').flatConfigs.typescript]
                : []),
            ],

            files: [getFilesGlob(getTSExtensions())],

            plugins: {
              ...(hasTsDocPlugin && { tsdoc: require('eslint-plugin-tsdoc') }),
            },

            languageOptions: {
              parserOptions: {
                // Defaults to the dir of eslint config file.
                tsconfigRootDir: cwd,
                projectService: {
                  // Defaults to the nearest tsconfig file.
                  defaultProject: tsconfig,
                  allowDefaultProject: [
                    '*.config.ts',
                    '*.config.mts',
                    'packages/*/*.config.ts',
                    'packages/*/*.config.mts',
                  ],
                },
              },
            },

            // Add again for consistency with extensions in webpack configs
            settings: {
              ...(hasImportPlugin &&
                !hasImportXPlugin && {
                  'import/extensions': moduleExtensions,
                  'import/resolver': {
                    node: {
                      extensions: moduleExtensions,
                    },
                    typescript: {
                      project: tsconfig,
                    },
                  },
                  'import/parsers': {
                    '@typescript-eslint/parser': moduleExtensions,
                    // Disable babel parsing for ts files
                    ...(hasBabelParser && { '@babel/eslint-parser': [] }),
                  },
                  // 'import/external-module-folders': ['node_modules', 'node_modules/@types'],
                }),

              ...(hasImportXPlugin && {
                'import-x/extensions': moduleExtensions,
                'import-x/external-module-folders': ['node_modules', 'node_modules/@types'],
                'import-x/parsers': {
                  '@typescript-eslint/parser': moduleExtensions,
                  // Disable babel parsing for ts files
                  ...(hasBabelParser && { '@babel/eslint-parser': [] }),
                },
                'import-x/resolver-next': [
                  hasImportResolverTypescript
                    ? createTypeScriptImportResolver({ project: tsconfig })
                    : [],
                  require('eslint-plugin-import-x').createNodeResolver({
                    extensions: moduleExtensions,
                    tsconfig: { configFile: tsconfig },
                  }),
                ],
              }),
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
              'no-use-before-define': 'off',
              '@typescript-eslint/no-use-before-define': 'error',

              'no-shadow': 'off',
              '@typescript-eslint/no-shadow': ['error', { ignoreTypeValueShadow: true }],

              'no-empty-function': 'off',
              '@typescript-eslint/no-empty-function': [
                'error',
                { allow: ['private-constructors', 'protected-constructors', 'decoratedFunctions'] },
              ],

              '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],

              '@typescript-eslint/prefer-nullish-coalescing': [
                'error',
                {
                  ignorePrimitives: { string: true },
                  ignoreMixedLogicalExpressions: true,
                },
              ],

              ...(hasImportXPlugin && {
                'import-x/named': 'off',
              }),

              ...(hasTsDocPlugin && {
                'tsdoc/syntax': 'warn',
              }),
            },
          } as Linter.Config);
        })()
      : []),

    ...(hasPrettierEslintPlugin ? [require('eslint-plugin-prettier/recommended')] : []),

    // Special overrides for TS declaration files
    {
      files: [getFilesGlob(['.d.ts'])],
      rules: {
        'max-classes-per-file': 'off',
      },
    },

    {
      ignores: ['node_modules', 'dist', 'build', '.yarn'],
    },
  ];
}

const config = create(process.cwd());
module.exports = config;
module.exports.create = create;
module.exports.createTypeScriptImportResolver = createTypeScriptImportResolver;
export default config;
