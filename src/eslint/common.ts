import path from 'path';
import globals from 'globals';
import type { Linter } from 'eslint';
// eslint-disable-next-line import-x/extensions
import { defineConfig } from 'eslint/config';
import eslintJs from '@eslint/js';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import type { AnyObject } from '../types';
import paths from '../paths.ts';
import { getFilesGlob, getJSExtensions, getTSExtensions, moduleExtensions } from '../extensions.ts';
import { getInstalledPackage } from '../getInstalledPackage.ts';
import { getProjectDependencies } from '../getProjectDependencies.ts';
import { defaultRequire } from '../defaultRequire.ts';
import { findPath } from '../findPath.ts';
import { eslintTsProject } from './consts.ts';

// Disable all rules in favor of airbnb and standard configs.
// const withFilteredImportXRules = (): Linter.Config => {
//   const config: Linter.Config = defaultRequire('eslint-plugin-import-x').flatConfigs.recommended;
//   return { ...config, rules: {} };
// };

function replaceExtension(name: string): string {
  const origin = path.extname(name);
  const current = path.extname(import.meta.filename);
  if (origin !== current) return name.replace(origin, current);
  return name;
}

export function createTypeScriptImportResolver(options?: AnyObject): AnyObject {
  return defaultRequire('eslint-import-resolver-typescript').createTypeScriptImportResolver({
    // project: path.dirname(tsconfig),
    // project: [tsconfig],
    // project: [eslintTsProject, 'tsconfig.json'],
    extensions: moduleExtensions,
    ...options,
  });
}

export interface CreateOptions {
  resolvePaths: string | string[];
  depsOnly?: boolean;
}

export function create({ resolvePaths: resolvePaths0, depsOnly }: CreateOptions): Linter.Config[] {
  const resolvePaths = typeof resolvePaths0 === 'string' ? [resolvePaths0] : resolvePaths0;
  const deps = depsOnly && getProjectDependencies(resolvePaths);

  const hasDep = (name: string): boolean => {
    if (deps && !deps.has(name)) return false;
    return !!getInstalledPackage(name, { resolvePaths });
  };

  const hasBabelParser = hasDep('@babel/eslint-parser');
  const hasPromisePlugin = hasDep('eslint-plugin-promise');
  const hasImportXPlugin = hasDep('eslint-plugin-import-x');
  const hasImportPlugin = hasDep('eslint-plugin-import');
  const hasConfigStandard = hasDep('eslint-config-standard');
  const hasConfigAirbnbBase = hasDep('eslint-config-airbnb-base');
  const hasJsDocPlugin = hasDep('eslint-plugin-jsdoc');
  const hasTsDocPlugin = hasDep('eslint-plugin-tsdoc');
  const hasPrettierPlugin = hasDep('eslint-plugin-prettier');
  const hasTypescriptPlugin = hasDep('typescript-eslint');
  const hasImportResolverTypescript = hasDep('eslint-import-resolver-typescript');

  const withFilteredStandardRules = (): { readonly rules: Readonly<Linter.RulesRecord> } => {
    const hasNodePlugin = hasDep('eslint-plugin-n');

    const rules = Object.entries(
      (defaultRequire('eslint-config-standard') as Linter.Config).rules ?? {}
    ).reduce<AnyObject>((acc, [name, value]) => {
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
    }, {});

    return { rules };
  };

  const filterAirbnbRules = (): FixupConfigArray => {
    const list: FixupConfigArray = defaultRequire('eslint-config-airbnb-base').extends.map(
      (url: string) => {
        return {
          rules: url.endsWith('imports.js')
            ? (hasImportXPlugin &&
                Object.entries(
                  defaultRequire(url).rules as Linter.RulesRecord
                ).reduce<Linter.RulesRecord>((acc, [name, value]) => {
                  acc[name.replace('import/', 'import-x/')] = value;
                  return acc;
                }, {})) ||
              (hasImportPlugin && (defaultRequire(url).rules as Linter.RulesRecord)) ||
              {}
            : (defaultRequire(url).rules as Linter.RulesRecord),
        };
      }
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

    ...(hasImportPlugin && !hasImportXPlugin
      ? defaultRequire('eslint-plugin-import').flatConfigs.recommended
      : []),

    ...(hasImportXPlugin ? [defaultRequire('eslint-plugin-import-x').flatConfigs.recommended] : []),

    ...(hasConfigStandard ? [withFilteredStandardRules()] : []),

    ...(hasJsDocPlugin
      ? [
          {
            ...defaultRequire('eslint-plugin-jsdoc').configs['flat/recommended'],
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
                  ...paths.web.sources,
                  ...paths.node.sources,
                  ...paths.shared.sources,
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
            defaultRequire('eslint-plugin-import-x').createNodeResolver({
              extensions: getJSExtensions(),
              modules: [
                'node_modules',
                // paths.nodeModules.root,
                ...paths.web.sources,
                ...paths.node.sources,
                ...paths.shared.sources,
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
          // 'FunctionExpression',
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
          }).reduce<AnyObject>((acc, [name, value]) => {
            if (hasImportXPlugin) acc[name.replace('import/', 'import-x/')] = value;
            else acc[name] = value;
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
              ...(hasImportPlugin && !hasImportXPlugin
                ? defaultRequire('eslint-plugin-import').flatConfigs.recommended
                : []),
              // Do not use due to declare all settings manually already.
              ...(hasImportXPlugin
                ? [defaultRequire('eslint-plugin-import-x').flatConfigs.typescript]
                : []),
            ],

            files: [getFilesGlob(getTSExtensions())],

            plugins: {
              ...(hasTsDocPlugin && { tsdoc: defaultRequire('eslint-plugin-tsdoc') }),
              local: defaultRequire(
                path.resolve(
                  import.meta.dirname,
                  replaceExtension('./rules/no-namespace-except-class-merge.ts')
                )
              ).plugin,
            },

            languageOptions: {
              parserOptions: {
                // Defaults to the dir of eslint config file.
                tsconfigRootDir: resolvePaths[0],
                projectService: {
                  // Defaults to the nearest tsconfig file.
                  defaultProject: tsconfig,
                  allowDefaultProject: [],
                  // allowDefaultProject: [
                  //   '*.config.ts',
                  //   '*.config.mts',
                  //   'packages/*/*.config.ts',
                  //   'packages/*/*.config.mts',
                  // ],
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
                  defaultRequire('eslint-plugin-import-x').createNodeResolver({
                    extensions: moduleExtensions,
                    tsconfig: { configFile: tsconfig },
                  }),
                ],
              }),
            },

            rules: {
              // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-useless-constructor.md#rule-changes
              'no-useless-constructor': 'off',
              // https://github.com/typescript-eslint/typescript-eslint/blob/v3.0.0/packages/eslint-plugin/docs/rules/no-floating-promises.md#ignorevoid
              'no-void': ['error', { allowAsStatement: true }],

              // Exclude `ForInStatement` in favor of `@typescript-eslint/no-for-in-array`
              'no-restricted-syntax': [
                'error',
                // 'FunctionExpression',
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

              // '@typescript-eslint/no-explicit-any': [
              //   'error',
              //   { fixToUnknown: false, ignoreRestArgs: true },
              // ],

              '@typescript-eslint/prefer-nullish-coalescing': [
                'error',
                {
                  ignorePrimitives: { string: true, number: true },
                  ignoreMixedLogicalExpressions: true,
                },
              ],

              '@typescript-eslint/strict-boolean-expressions': [
                'error',
                {
                  allowAny: false,
                  allowNullableEnum: false,
                  allowNullableNumber: false,
                  allowNullableBoolean: true,
                  allowNullableObject: true,
                  allowNullableString: true,
                  allowNumber: false,
                  allowString: true,
                },
              ],

              // Doesn't work correctly with chain conditions: `(a === 'w' && 'q') || `(a === 'e' && 'r') || 'default'`.
              // So disable it for now, but it is better to enable in the future with correct configuration.
              '@typescript-eslint/no-unnecessary-condition': 'off',
              // '@typescript-eslint/no-unnecessary-condition': [
              //   'error',
              //   {
              //     checkTypePredicates: false,
              //     allowConstantLoopConditions: 'only-allowed-literals',
              //   },
              // ],

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

              '@typescript-eslint/no-namespace': 'off',
              'local/no-namespace-except-class-merge': 'error',

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

const config: Linter.Config[] = create({ resolvePaths: process.cwd() });

export default config;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
  module.exports.create = create;
  module.exports.createTypeScriptImportResolver = createTypeScriptImportResolver;
}
