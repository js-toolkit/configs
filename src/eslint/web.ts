/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
import globals from 'globals';
import type { Linter } from 'eslint';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import { getFilesGlob, getNonSXExtensions, getSXExtensions, getTSXExtensions } from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';
import { compat } from './utils';

const hasReactPlugin = !!getInstalledPackage('eslint-plugin-react');
const hasReactA11yPlugin = !!getInstalledPackage('eslint-plugin-jsx-a11y');
const hasReactHooksPlugin = !!getInstalledPackage('eslint-plugin-react-hooks');
const hasWCPlugin = !!getInstalledPackage('eslint-plugin-wc');
const hasLitPlugin = !!getInstalledPackage('eslint-plugin-lit');
const hasMobxPlugin = !!getInstalledPackage('eslint-plugin-mobx');
const hasConfigAirbnb = !!getInstalledPackage('eslint-config-airbnb');
const hasTypescriptEslintPlugin = !!getInstalledPackage('typescript-eslint');
const hasPrettierEslintPlugin = !!getInstalledPackage('eslint-plugin-prettier/recommended');

delete (globals.browser as any)['AudioWorkletGlobalScope '];

const filterAirbnbRules = (config: 'react' | 'react-a11y'): FixupConfigArray => {
  return fixupConfigRules({
    rules: require(
      require('eslint-config-airbnb').extends.find((url: string) => url.endsWith(`${config}.js`))
    ).rules,
  });
};

const config: Linter.Config[] = [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  ...[
    hasReactPlugin && require('eslint-plugin-react/configs/recommended'),
    ...(hasReactPlugin && hasConfigAirbnb ? filterAirbnbRules('react') : []),
    hasReactPlugin && require('eslint-plugin-react/configs/jsx-runtime'),
    hasReactPlugin && {
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
    },

    hasReactA11yPlugin && require('eslint-plugin-jsx-a11y').flatConfigs.recommended,
    ...(hasReactA11yPlugin && hasConfigAirbnb ? filterAirbnbRules('react-a11y') : []),
    hasReactA11yPlugin && {
      rules: {
        'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
        'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
      },
    },
  ]
    .filter(Boolean)
    .map((conf) => ({
      ...conf,
      files: [...(conf.files ?? []), getFilesGlob(getSXExtensions())],
    })),

  ...(hasReactPlugin && hasTypescriptEslintPlugin
    ? [
        {
          files: [getFilesGlob(getTSXExtensions())],
          rules: {
            'react/jsx-filename-extension': ['error', { extensions: getSXExtensions() }],
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

  ...(hasMobxPlugin
    ? [...compat.extends('plugin:mobx/recommended'), { rules: { 'mobx/missing-observer': 'off' } }]
    : []),
];

module.exports = config;
export default config;
