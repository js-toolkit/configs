/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import globals from 'globals';
import type { Linter } from 'eslint';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import { getFilesGlob, getNonSXExtensions, getSXExtensions, getTSXExtensions } from '../extensions.ts';
import { getInstalledPackage } from '../getInstalledPackage.ts';
import { defaultRequire } from '../defaultRequire.ts';

const hasReactPlugin = !!getInstalledPackage('eslint-plugin-react', { resolveFromCwd: true });
const hasReactA11yPlugin = !!getInstalledPackage('eslint-plugin-jsx-a11y', {
  resolveFromCwd: true,
});
const hasReactHooksPlugin = !!getInstalledPackage('eslint-plugin-react-hooks', {
  resolveFromCwd: true,
});
const hasWCPlugin = !!getInstalledPackage('eslint-plugin-wc', { resolveFromCwd: true });
const hasLitPlugin = !!getInstalledPackage('eslint-plugin-lit', { resolveFromCwd: true });
const hasMobxPlugin = !!getInstalledPackage('eslint-plugin-mobx', { resolveFromCwd: true });
const hasConfigAirbnb = !!getInstalledPackage('eslint-config-airbnb', { resolveFromCwd: true });
const hasTypescriptEslintPlugin = !!getInstalledPackage('typescript-eslint', {
  resolveFromCwd: true,
});
const hasPrettierEslintPlugin = !!getInstalledPackage('eslint-plugin-prettier/recommended', {
  resolveFromCwd: true,
});

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

const config: Linter.Config[] = [
  ...(hasReactPlugin
    ? (() => {
        const plugin = defaultRequire('eslint-plugin-react');
        return [
          plugin.configs.flat.recommended,
          plugin.configs.flat['jsx-runtime'],
          {
            languageOptions: {
              ...plugin.configs.flat.recommended.languageOptions,
              globals: {
                ...globals.browser,
              },
            },
          },
          ...(hasConfigAirbnb ? filterAirbnbRules('react') : []),
          {
            settings: {
              react: {
                // version: 'detect',
                // Avoids auto-detection crash:
                // https://github.com/vercel/next.js/issues/89764#issuecomment-3928272828
                version: '19',
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

export default config;

if (typeof module !== 'undefined') {
  module.exports = config;
}
