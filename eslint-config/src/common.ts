import path from 'path';
import globals from 'globals';
import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import eslintJs from '@eslint/js';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import {
  getFilesGlob,
  getJSExtensions,
  getTSExtensions,
  moduleExtensions,
} from '@js-toolkit/config-utils/extensions';
import { getInstalledPackage } from '@js-toolkit/config-utils/getInstalledPackage';
import { getProjectDependencies } from '@js-toolkit/config-utils/getProjectDependencies';
import { defaultRequire } from '@js-toolkit/config-utils/defaultRequire';
import { findPath } from '@js-toolkit/config-utils/findPath';
import { eslintTsProject } from './consts.ts';
import { addFilesGlob } from './utils.ts';

type AnyObject = Record<string, any>;

function replaceExtension(name: string): string {
  const origin = path.extname(name);
  const current = path.extname(import.meta.filename);
  if (origin !== current) return name.replace(origin, current);
  return name;
}

export function createTypeScriptImportResolver(options?: AnyObject): AnyObject {
  return defaultRequire('eslint-import-resolver-typescript').createTypeScriptImportResolver({
    extensions: moduleExtensions,
    ...options,
  });
}

export interface CreateOptions {
  resolvePaths: string | string[];
  depsOnly?: boolean;
  replaceImportPlugin?: boolean;
}

export function create({
  resolvePaths: resolvePaths0,
  depsOnly,
  replaceImportPlugin,
}: CreateOptions): Linter.Config[] {
  const resolvePaths = typeof resolvePaths0 === 'string' ? [resolvePaths0] : resolvePaths0;
  const deps = depsOnly && getProjectDependencies(resolvePaths);

  const hasDep = (name: string): boolean => {
    if (deps && !deps.has(name)) return false;
    return !!getInstalledPackage(name, { resolvePaths });
  };

  const hasBabelParser = hasDep('@babel/eslint-parser');
  const hasPromisePlugin = hasDep('eslint-plugin-promise');
  const hasImportXPlugin = hasDep('eslint-plugin-import-x');
  const hasImportPlugin =
    hasDep('eslint-plugin-import') && (!hasImportXPlugin || !replaceImportPlugin);
  const hasNPlugin = hasDep('eslint-plugin-n');
  const hasConfigAirbnbBase = hasDep('eslint-config-airbnb-base');
  const hasJsDocPlugin = hasDep('eslint-plugin-jsdoc');
  const hasTsDocPlugin = hasDep('eslint-plugin-tsdoc');
  const hasPrettierPlugin = hasDep('eslint-plugin-prettier');
  const hasTypescriptPlugin = hasDep('typescript-eslint');
  const hasImportResolverTypescript = hasDep('eslint-import-resolver-typescript');

  const filterAirbnbRules = (): FixupConfigArray => {
    const list: FixupConfigArray = defaultRequire('eslint-config-airbnb-base').extends.map(
      (url: string) => {
        if (url.endsWith('imports.js')) {
          if (hasImportXPlugin) {
            return {
              rules: Object.entries(
                defaultRequire(url).rules as Linter.RulesRecord,
              ).reduce<Linter.RulesRecord>((acc, [name, value]) => {
                acc[name.replace('import/', 'import-x/')] = value;
                if (hasImportPlugin) {
                  acc[name] = value;
                }
                return acc;
              }, {}),
            };
          }
          if (hasImportPlugin) {
            return { rules: defaultRequire(url).rules as Linter.RulesRecord };
          }
          return {};
        }
        return { rules: defaultRequire(url).rules as Linter.RulesRecord };
      },
    );
    return fixupConfigRules(list);
  };

  const eslintTsConfig = hasTypescriptPlugin ? findPath(eslintTsProject, resolvePaths) : undefined;
  const tsconfig = eslintTsConfig || findPath('tsconfig.json', resolvePaths) || 'tsconfig.json';

  return [
    eslintJs.configs.recommended,

    ...(hasPromisePlugin
      ? [defaultRequire('eslint-plugin-promise').configs['flat/recommended']]
      : []),

    ...(hasImportXPlugin ? [defaultRequire('eslint-plugin-import-x').flatConfigs.recommended] : []),

    ...(hasImportPlugin ? [defaultRequire('eslint-plugin-import').flatConfigs.recommended] : []),

    ...(hasNPlugin ? [defaultRequire('eslint-plugin-n').configs['flat/recommended']] : []),

    ...(hasJsDocPlugin
      ? [
          addFilesGlob(
            defaultRequire('eslint-plugin-jsdoc').configs['flat/recommended'],
            getFilesGlob(getJSExtensions()),
          ),
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
          parser: defaultRequire('@babel/eslint-parser'),
          parserOptions: {
            requireConfigFile: false,
          },
        }),
      },

      linterOptions: {
        reportUnusedDisableDirectives: true,
      },

      settings: {
        ...(hasImportPlugin && {
          'import/extensions': getJSExtensions(),
          'import-x/extensions': getJSExtensions(),
          'import/resolver': {
            node: {
              extensions: getJSExtensions(),
            },
          },

          ...(hasBabelParser && {
            'import/parsers': {
              '@babel/eslint-parser': getJSExtensions(),
            },
          }),
        }),

        ...(hasImportXPlugin && {
          'import-x/resolver-next': [
            defaultRequire('eslint-plugin-import-x').createNodeResolver({
              extensions: getJSExtensions(),
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
          'LabeledStatement',
          'WithStatement',
          "CallExpression[callee.name='setTimeout'][arguments.length!=2]",
          "CallExpression[arguments.length!=2] > MemberExpression[object.name='window'][property.name='setTimeout']",
        ],

        ...((hasImportPlugin || hasImportXPlugin) &&
          Object.entries({
            'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
            'import/extensions': [
              'error',
              'ignorePackages',
              moduleExtensions.reduce((acc, ext) => ({ ...acc, [ext.substring(1)]: 'never' }), {
                '': 'never',
              }),
            ],
            'import/order': [
              'error',
              {
                groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
              },
            ],
            'import/prefer-default-export': 'off',
          }).reduce<AnyObject>((acc, [name, value]) => {
            if (hasImportXPlugin) {
              acc[name.replace('import/', 'import-x/')] = value;
            }
            if (hasImportPlugin) {
              acc[name] = value;
            }
            return acc;
          }, {})),

        ...(hasPromisePlugin && {
          'promise/always-return': 'off',
          'promise/catch-or-return': ['error', { allowFinally: true, allowThenStrict: true }],
        }),
      },
    },

    // overrides
    ...(hasTypescriptPlugin
      ? (() => {
          const eslintTs = defaultRequire('typescript-eslint');
          return defineConfig({
            extends: [
              ...eslintTs.configs.strictTypeChecked,
              ...eslintTs.configs.stylisticTypeChecked,
              ...(hasImportPlugin
                ? [defaultRequire('eslint-plugin-import').flatConfigs.recommended]
                : []),
              ...(hasImportXPlugin
                ? [defaultRequire('eslint-plugin-import-x').flatConfigs.typescript]
                : []),
            ],

            files: [getFilesGlob(getTSExtensions())],

            plugins: {
              ...(hasTsDocPlugin && { tsdoc: defaultRequire('eslint-plugin-tsdoc') }),
              '@js-toolkit': defaultRequire(
                path.resolve(import.meta.dirname, replaceExtension('./rules/plugin.ts')),
              ).plugin,
            },

            languageOptions: {
              parserOptions: {
                tsconfigRootDir: resolvePaths[0],
                projectService: {
                  defaultProject: tsconfig,
                  allowDefaultProject: [],
                },
              },
            },

            settings: {
              ...(hasImportPlugin && {
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
                  ...(hasBabelParser && { '@babel/eslint-parser': [] }),
                },
              }),

              ...(hasImportXPlugin && {
                'import-x/extensions': moduleExtensions,
                'import-x/external-module-folders': ['node_modules', 'node_modules/@types'],
                'import-x/parsers': {
                  '@typescript-eslint/parser': moduleExtensions,
                  ...(hasBabelParser && { '@babel/eslint-parser': [] }),
                },
                'import-x/resolver-next': [
                  hasImportResolverTypescript
                    ? createTypeScriptImportResolver({ project: tsconfig })
                    : [],
                  defaultRequire('eslint-plugin-import-x').createNodeResolver({
                    extensions: moduleExtensions,
                    tsconfig: { configFile: tsconfig },
                  }),
                ],
              }),
            },

            rules: {
              'no-useless-constructor': 'off',
              'no-void': ['error', { allowAsStatement: true }],

              'no-restricted-syntax': [
                'error',
                'LabeledStatement',
                'WithStatement',
                "CallExpression[callee.name='setTimeout'][arguments.length!=2]",
                "CallExpression[arguments.length!=2] > MemberExpression[object.name='window'][property.name='setTimeout']",
              ],

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
                  ignorePrimitives: { string: true, boolean: true, number: false, bigint: false },
                  ignoreMixedLogicalExpressions: true,
                },
              ],

              '@typescript-eslint/no-confusing-void-expression': [
                'error',
                { ignoreArrowShorthand: true, ignoreVoidReturningFunctions: true },
              ],

              '@typescript-eslint/restrict-template-expressions': [
                'error',
                { allowNumber: true, allowBoolean: true },
              ],

              '@typescript-eslint/prefer-promise-reject-errors': [
                'error',
                { allowThrowingAny: true, allowThrowingUnknown: true },
              ],

              '@typescript-eslint/unified-signatures': [
                'error',
                { ignoreDifferentlyNamedParameters: true, ignoreOverloadsWithDifferentJSDoc: true },
              ],

              '@typescript-eslint/no-unnecessary-condition': 'off',
              '@js-toolkit/no-unnecessary-optional-chain': 'error',

              '@typescript-eslint/no-namespace': 'off',
              '@js-toolkit/no-namespace-except-declaration-merge': 'error',

              '@typescript-eslint/strict-boolean-expressions': 'off',
              '@js-toolkit/strict-boolean-expressions': [
                'error',
                {
                  allowNullableEnum: false,
                  allowNullableNumber: false,
                  allowNullableBoolean: true,
                  allowNullableObject: true,
                  allowNullableString: true,
                  allowString: true,
                  allowNumber: false,
                  allowAny: false,
                  allowUnknown: false,
                  allowNever: false,
                  allowNonBooleanExpressions: true,
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

    ...(hasPrettierPlugin ? [defaultRequire('eslint-plugin-prettier/recommended')] : []),

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

const config: Linter.Config[] = create({ resolvePaths: process.cwd(), replaceImportPlugin: true });

export default config;
