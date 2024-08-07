import fs from 'fs';
import path from 'path';
import globals from 'globals';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import buildConfig from '../buildConfig';
import paths, { getFilesGlob, getSXExtensions, getTSExtensions, getTSXExtensions } from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';
import { eslintTsProject } from './consts';
import { compat } from './utils';

const enabled = buildConfig.web && fs.existsSync(paths.web.root);

const hasReactPlugin = !!getInstalledPackage('eslint-plugin-react');
const hasReactA11yPlugin = !!getInstalledPackage('eslint-plugin-jsx-a11y');
const hasReactHooksPlugin = !!getInstalledPackage('eslint-plugin-react-hooks');
const hasMobxPlugin = !!getInstalledPackage('eslint-plugin-mobx');
const hasConfigAirbnb = !!getInstalledPackage('eslint-config-airbnb');

delete (globals.browser as any)['AudioWorkletGlobalScope '];

const filterAirbnbRules = (config: 'react' | 'react-a11y'): FixupConfigArray => {
  return fixupConfigRules({
    rules: require(
      require('eslint-config-airbnb').extends.find((url: string) => url.endsWith(`${config}.js`))
    ).rules,
  });
};

const config: import('eslint').Linter.Config[] = [
  ...require('./common'),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  ...[
    ...(hasReactPlugin ? [require('eslint-plugin-react/configs/recommended')] : []),
    ...(hasReactPlugin && hasConfigAirbnb ? filterAirbnbRules('react') : []),
  ].map((conf) => ({
    ...conf,
    files: [...(conf.files ?? []), getFilesGlob(getSXExtensions())],
    settings: {
      ...conf.settings,
      react: {
        ...conf.settings?.react,
        version: 'detect',
      },
    },
    rules: {
      ...conf.rules,
      // 'react/prop-types': 'off',
      // 'react/sort-comp': 'off',
      // 'react/display-name': 'off',
      // 'react/destructuring-assignment': ['error', 'always', { ignoreClassFields: true }],
      // 'react/jsx-filename-extension': ['error', { extensions: getSXExtensions() }],
      // 'react/jsx-wrap-multilines': 'off',
      'react/jsx-props-no-spreading': 'off',
      // 'react/jsx-indent': 'off',
      // 'react/function-component-definition': [
      //   'error',
      //   { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
      // ],
    },
  })),

  ...[
    ...(hasReactA11yPlugin ? [require('eslint-plugin-jsx-a11y').flatConfigs.recommended] : []),
    ...(hasReactPlugin && hasConfigAirbnb ? filterAirbnbRules('react-a11y') : []),
  ].map((conf) => ({
    ...conf,
    files: [...(conf.files ?? []), getFilesGlob(getSXExtensions())],
    rules: {
      ...conf.rules,
      'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
      'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
    },
  })),

  ...(hasReactHooksPlugin ? compat.extends('plugin:react-hooks/recommended') : []).map((conf) => ({
    ...conf,
    rules: {
      ...conf.rules,
      'react-hooks/exhaustive-deps': 'error',
    },
  })),

  // Redefine again to override react rules.
  eslintPluginPrettierRecommended,

  ...(hasMobxPlugin
    ? [...compat.extends('plugin:mobx/recommended'), { rules: { 'mobx/missing-observer': 'off' } }]
    : []),

  {
    files: [getFilesGlob(getTSExtensions())],

    languageOptions: {
      parserOptions: {
        project: (() => {
          if (enabled) {
            const tsconfig = path.join(paths.web.root, eslintTsProject);
            if (fs.existsSync(tsconfig)) return tsconfig;
            if (fs.existsSync(paths.web.tsconfig)) return paths.web.tsconfig;
          }
          return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
        })(),
      },
    },
  },

  {
    files: [getFilesGlob(getTSXExtensions())],
    rules: {
      ...(hasReactPlugin && {
        'react/jsx-filename-extension': ['error', { extensions: getSXExtensions() }],
        'react/require-default-props': 'off',
      }),
    },
  },
];

module.exports = config;
