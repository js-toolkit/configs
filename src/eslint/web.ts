/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
import globals from 'globals';
import type { Linter } from 'eslint';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import { getFilesGlob, getNonSXExtensions, getSXExtensions, getTSXExtensions } from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';

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
    rules: require(
      require('eslint-config-airbnb').extends.find((url: string) => url.endsWith(`${config}.js`))
    ).rules,
  });
};

const config: Linter.Config[] = [
  ...(hasReactPlugin
    ? (() => {
        const plugin = require('eslint-plugin-react');
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
        const plugin = require('eslint-plugin-jsx-a11y');
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
            // TypeError: Error while loading rule 'react/jsx-filename-extension': context.getFilename is not a function
            // https://github.com/vercel/next.js/issues/89764#issuecomment-3928272828
            // 'react/jsx-filename-extension': [
            //   'error',
            //   { allow: 'as-needed', extensions: getSXExtensions() },
            // ],
            'react/require-default-props': 'off',
          },
        } satisfies Linter.Config,
      ]
    : []),

  ...(hasReactHooksPlugin
    ? [
        require('eslint-plugin-react-hooks').configs.flat['recommended-latest'],
        { rules: { 'react-hooks/exhaustive-deps': 'error' } },
      ]
    : []),

  ...[
    hasWCPlugin && require('eslint-plugin-wc').configs['flat/best-practice'],
    hasWCPlugin && {
      settings: {
        wc: {
          elementBaseClasses: ['HTMLElement'],
        },
      },
    },
    hasLitPlugin && require('eslint-plugin-lit').configs['flat/recommended'],
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
  ...(hasPrettierEslintPlugin ? [require('eslint-plugin-prettier/recommended')] : []),

  ...(hasMobxPlugin ? [require('eslint-plugin-mobx').flatConfigs.recommended] : []),
];

module.exports = config;
export default config;
