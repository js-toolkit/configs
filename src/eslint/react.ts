import fs from 'fs';
import path from 'path';
import globals from 'globals';
import buildConfig from '../buildConfig';
import paths, {
  getFilesGlob,
  getJSXExtensions,
  getTSExtensions,
  getTSJSXExtensions,
} from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';
import { eslintTsProject } from './consts';
import { compat } from './utils';

const enabled = buildConfig.web && fs.existsSync(paths.web.root);

const hasReactPlugin = !!getInstalledPackage('eslint-plugin-react');
const hasA11yPlugin = !!getInstalledPackage('eslint-plugin-jsx-a11y');
const hasReactHooksPlugin = !!getInstalledPackage('eslint-plugin-react-hooks');
const hasMobxPlugin = !!getInstalledPackage('eslint-plugin-mobx');

delete (globals.browser as any)['AudioWorkletGlobalScope '];

const config: import('eslint').Linter.FlatConfig[] = [
  ...require('./common'),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  ...(hasReactPlugin ? [require('eslint-plugin-react/configs/recommended')] : []).map((conf) => ({
    ...conf,
    files: [...(conf.files ?? []), getFilesGlob(getJSXExtensions())],
    settings: {
      ...conf.settings,
      react: {
        ...conf.settings?.react,
        version: 'detect',
      },
    },
    rules: {
      ...conf.rules,
      'react/prop-types': 'off',
      'react/sort-comp': 'off',
      'react/display-name': 'off',
      'react/destructuring-assignment': ['error', 'always', { ignoreClassFields: true }],
      'react/jsx-filename-extension': ['error', { extensions: getJSXExtensions() }],
      'react/jsx-wrap-multilines': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/function-component-definition': [
        'error',
        { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
      ],
    },
  })),

  ...(hasA11yPlugin ? [require('eslint-plugin-jsx-a11y').flatConfigs.recommended] : []).map(
    (conf) => ({
      ...conf,
      files: [...(conf.files ?? []), getFilesGlob(getJSXExtensions())],
      rules: {
        ...conf.rules,
        'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
        'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
      },
    })
  ),

  ...(hasReactHooksPlugin ? compat.extends('plugin:react-hooks/recommended') : []).map((conf) => ({
    ...conf,
    rules: {
      ...conf.rules,
      'react-hooks/exhaustive-deps': 'error',
    },
  })),

  ...(hasMobxPlugin ? compat.extends('plugin:mobx/recommended') : []),

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
    files: [getFilesGlob(getTSJSXExtensions())],
    rules: {
      ...(hasReactPlugin && {
        'react/jsx-filename-extension': ['error', { extensions: getJSXExtensions() }],
      }),
    },
  },
];

module.exports = config;
