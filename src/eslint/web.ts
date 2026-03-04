/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import globals from 'globals';
import type { Linter } from 'eslint';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import {
  getFilesGlob,
  getNonSXExtensions,
  getSXExtensions,
  getTSXExtensions,
} from '../extensions.ts';
import { getInstalledPackage } from '../getInstalledPackage.ts';
import { defaultRequire } from '../defaultRequire.ts';

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

export function create(cwd: string): Linter.Config[] {
  const resolvePaths = [cwd];

  const hasReactPlugin = !!getInstalledPackage('eslint-plugin-react', { resolvePaths });
  const hasReactA11yPlugin = !!getInstalledPackage('eslint-plugin-jsx-a11y', { resolvePaths });
  const hasReactHooksPlugin = !!getInstalledPackage('eslint-plugin-react-hooks', { resolvePaths });
  const hasWCPlugin = !!getInstalledPackage('eslint-plugin-wc', { resolvePaths });
  const hasLitPlugin = !!getInstalledPackage('eslint-plugin-lit', { resolvePaths });
  const hasMobxPlugin = !!getInstalledPackage('eslint-plugin-mobx', { resolvePaths });
  const hasConfigAirbnb = !!getInstalledPackage('eslint-config-airbnb', { resolvePaths });
  const hasTypescriptEslintPlugin = !!getInstalledPackage('typescript-eslint', { resolvePaths });
  const hasPrettierEslintPlugin = !!getInstalledPackage('eslint-plugin-prettier/recommended', {
    resolvePaths,
  });

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

    ...(hasReactPlugin && hasTypescriptEslintPlugin
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
    ...(hasPrettierEslintPlugin ? [defaultRequire('eslint-plugin-prettier/recommended')] : []),

    ...(hasMobxPlugin ? [defaultRequire('eslint-plugin-mobx').flatConfigs.recommended] : []),
  ];
}

const config: Linter.Config[] = create(process.cwd());

export default config;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
  module.exports.create = create;
}
