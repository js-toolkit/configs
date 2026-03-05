import globals from 'globals';
import type { Linter } from 'eslint';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import {
  getFilesGlob,
  getNonSXExtensions,
  getSXExtensions,
  getTSXExtensions,
} from '../extensions.ts';
import { getProjectDependencies } from '../getProjectDependencies.ts';
import { getInstalledPackage } from '../getInstalledPackage.ts';
import { defaultRequire } from '../defaultRequire.ts';
import type { CreateOptions } from './common.ts';

// delete (globals.browser as any)['AudioWorkletGlobalScope '];

const filterAirbnbRules = (config: 'react' | 'react-a11y'): FixupConfigArray => {
  return fixupConfigRules({
    rules: defaultRequire(
      defaultRequire('eslint-config-airbnb').extends.find((url: string) =>
        url.endsWith(`${config}.js`)
      )
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
            plugin.configs.flat.recommended,
            ...(hasConfigAirbnb ? filterAirbnbRules('react') : []),
            plugin.configs.flat['jsx-runtime'],
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
                  // Avoids auto-detection crash:
                  // https://github.com/vercel/next.js/issues/89764#issuecomment-3928272828
                  // version: '19',
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
            },
            // Redefine again to override react rules.
            // ...(hasPrettierPlugin ? [defaultRequire('eslint-plugin-prettier/recommended')] : []),
          ];
        })()
      : [
          {
            languageOptions: {
              globals: {
                ...globals.browser,
              },
            },
          },
        ]
    ).map((conf) => ({
      ...conf,
      files: [...(conf.files ?? []), getFilesGlob(getSXExtensions())],
    })),

    ...(hasReactA11yPlugin
      ? (() => {
          const plugin = defaultRequire('eslint-plugin-jsx-a11y');
          return [
            plugin.flatConfigs.recommended,
            ...(hasConfigAirbnb ? filterAirbnbRules('react-a11y') : []),
            {
              rules: {
                'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
                'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
              },
            },
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
              // ESLint v10.
              // TypeError: Error while loading rule 'react/jsx-filename-extension': context.getFilename is not a function
              // https://github.com/vercel/next.js/issues/89764#issuecomment-3928272828
              'react/jsx-filename-extension': [
                'error',
                { allow: 'as-needed', extensions: getSXExtensions() },
              ],
              'react/require-default-props': 'off',
            },
          } satisfies Linter.Config,
        ]
      : []),

    ...(hasReactHooksPlugin
      ? [
          defaultRequire('eslint-plugin-react-hooks').configs.flat['recommended-latest'],
          { rules: { 'react-hooks/exhaustive-deps': 'error' } },
        ]
      : []),

    ...[
      hasWCPlugin && defaultRequire('eslint-plugin-wc').configs['flat/best-practice'],
      hasWCPlugin && {
        settings: {
          wc: {
            elementBaseClasses: ['HTMLElement'],
          },
        },
      },
      hasLitPlugin && defaultRequire('eslint-plugin-lit').configs['flat/recommended'],
      hasLitPlugin && {
        settings: {
          lit: {
            elementBaseClasses: ['LitElement'],
          },
        },
      },
    ]
      .filter(Boolean)
      .map((conf) => ({
        ...conf,
        files: [...(conf.files ?? []), getFilesGlob(getNonSXExtensions())],
      })),

    // Redefine again to override react rules.
    ...(hasPrettierPlugin ? [defaultRequire('eslint-plugin-prettier/recommended')] : []),

    ...(hasMobxPlugin ? [defaultRequire('eslint-plugin-mobx').flatConfigs.recommended] : []),
  ];
}

const config: Linter.Config[] = create({ resolvePaths: process.cwd() });

export default config;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
  module.exports.create = create;
}
