import globals from 'globals';
import type { Linter } from 'eslint';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import {
  getFilesGlob,
  getNonSXExtensions,
  getSXExtensions,
  getTSXExtensions,
} from '@js-toolkit/config-utils/extensions';
import { getProjectDependencies } from '@js-toolkit/config-utils/getProjectDependencies';
import { getInstalledPackage } from '@js-toolkit/config-utils/getInstalledPackage';
import { defaultRequire } from '@js-toolkit/config-utils/defaultRequire';
import type { CreateOptions } from './common.ts';

const filterAirbnbRules = (config: 'react' | 'react-a11y'): FixupConfigArray => {
  return fixupConfigRules({
    rules: defaultRequire(
      defaultRequire('eslint-config-airbnb').extends.find((url: string) =>
        url.endsWith(`${config}.js`),
      ),
    ).rules,
  });
};

export function create({ resolvePaths: resolvePaths0, depsOnly }: CreateOptions): Linter.Config[] {
  const resolvePaths = typeof resolvePaths0 === 'string' ? [resolvePaths0] : resolvePaths0;
  const deps = depsOnly && getProjectDependencies(resolvePaths);

  const hasDep = (name: string): boolean => {
    if (deps && !deps.has(name)) return false;
    return !!getInstalledPackage(name, { resolvePaths });
  };

  const hasReactPlugin = hasDep('eslint-plugin-react');
  const hasReactA11yPlugin = hasDep('eslint-plugin-jsx-a11y');
  const hasReactHooksPlugin = hasDep('eslint-plugin-react-hooks');
  const hasWCPlugin = hasDep('eslint-plugin-wc');
  const hasLitPlugin = hasDep('eslint-plugin-lit');
  const hasMobxPlugin = hasDep('eslint-plugin-mobx');
  const hasConfigAirbnb = hasDep('eslint-config-airbnb');
  const hasTypescriptPlugin = hasDep('typescript-eslint');
  const hasPrettierPlugin = hasDep('eslint-plugin-prettier');

  return [
    ...(hasReactPlugin
      ? (() => {
          const plugin = defaultRequire('eslint-plugin-react');
          return [
            plugin.configs.flat.recommended as Linter.Config,
            ...(hasConfigAirbnb ? filterAirbnbRules('react') : []),
            plugin.configs.flat['jsx-runtime'] as Linter.Config,
            {
              languageOptions: {
                ...plugin.configs.flat.recommended.languageOptions,
                globals: {
                  ...globals.browser,
                },
              },
              settings: {
                react: {
                  version: 'detect',
                },
              },
              rules: {
                'react/jsx-props-no-spreading': 'off',
                'react/function-component-definition': [
                  'error',
                  {
                    namedComponents: 'function-declaration',
                    unnamedComponents: ['arrow-function', 'function-expression'],
                  },
                ],
              },
            } satisfies Linter.Config as Linter.Config,
          ];
        })()
      : [
          {
            languageOptions: {
              globals: {
                ...globals.browser,
              },
            },
          } satisfies Linter.Config as Linter.Config,
        ]
    ).map((conf) => ({
      ...conf,
      files: [...(conf.files ?? []), getFilesGlob(getSXExtensions())],
    })),

    ...(hasReactA11yPlugin
      ? (() => {
          const plugin = defaultRequire('eslint-plugin-jsx-a11y');
          return [
            plugin.flatConfigs.recommended as Linter.Config,
            ...(hasConfigAirbnb ? filterAirbnbRules('react-a11y') : []),
            {
              rules: {
                'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
                'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
              },
            } satisfies Linter.Config as Linter.Config,
          ];
        })()
      : []
    ).map((conf) => ({
      ...conf,
      files: [...(conf.files ?? []), getFilesGlob(getSXExtensions())],
    })),

    ...(hasReactPlugin && hasTypescriptPlugin
      ? [
          {
            files: [getFilesGlob(getTSXExtensions())],
            rules: {
              'react/jsx-filename-extension': [
                'error',
                { allow: 'as-needed', extensions: getSXExtensions() },
              ],
              'react/require-default-props': 'off',
            },
          } satisfies Linter.Config as Linter.Config,
        ]
      : []),

    ...(hasReactHooksPlugin
      ? [
          defaultRequire('eslint-plugin-react-hooks').configs.flat[
            'recommended-latest'
          ] as Linter.Config,
          {
            rules: { 'react-hooks/exhaustive-deps': 'error' },
          } satisfies Linter.Config as Linter.Config,
        ]
      : []),

    ...[
      hasWCPlugin &&
        (defaultRequire('eslint-plugin-wc').configs['flat/best-practice'] as Linter.Config),
      hasWCPlugin &&
        ({
          settings: {
            wc: {
              elementBaseClasses: ['HTMLElement'],
            },
          },
        } satisfies Linter.Config as Linter.Config),
      hasLitPlugin &&
        (defaultRequire('eslint-plugin-lit').configs['flat/recommended'] as Linter.Config),
      hasLitPlugin &&
        ({
          settings: {
            lit: {
              elementBaseClasses: ['LitElement'],
            },
          },
        } satisfies Linter.Config as Linter.Config),
    ]
      .filter((conf): conf is Linter.Config => !!conf)
      .map((conf) => ({
        ...conf,
        files: [...(conf.files ?? []), getFilesGlob(getNonSXExtensions())],
      })),

    ...(hasPrettierPlugin ? [defaultRequire('eslint-plugin-prettier/recommended')] : []),

    ...(hasMobxPlugin ? [defaultRequire('eslint-plugin-mobx').flatConfigs.recommended] : []),
  ];
}

const config: Linter.Config[] = create({ resolvePaths: process.cwd() });

export default config;
