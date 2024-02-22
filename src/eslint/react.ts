import fs from 'fs';
import path from 'path';
import airbnbConfig from 'eslint-config-airbnb';
import buildConfig from '../buildConfig';
import paths, { getReactExtensions, getTSExtensions } from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';
import { eslintTsProject } from './consts';

const enabled = buildConfig.web && fs.existsSync(paths.web.root);

const hasReactPlugin = !!getInstalledPackage('eslint-plugin-react');
const hasA11yPlugin = !!getInstalledPackage('eslint-plugin-jsx-a11y');
const hasReactHooksPlugin = !!getInstalledPackage('eslint-plugin-react-hooks');
const hasMobxPlugin = !!getInstalledPackage('eslint-plugin-mobx');

const airbnbExtends = airbnbConfig.extends.filter(
  (item) =>
    !item.includes('eslint-config-airbnb-base') &&
    (hasReactPlugin ? true : !item.includes('rules/react.js')) &&
    (hasA11yPlugin ? true : !item.includes('rules/react-a11y.js'))
);

const config: import('eslint').Linter.Config = {
  extends: [
    // Adds eslint-plugin-react, eslint-plugin-jsx-a11y, rules
    // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb/index.js
    ...airbnbExtends,
    require.resolve('./common'),
    ...(hasReactHooksPlugin ? ['plugin:react-hooks/recommended'] : []),
    ...(hasMobxPlugin ? ['plugin:mobx/recommended'] : []),
  ],

  env: {
    browser: true,
  },

  // settings: {
  //   'import/resolver': {
  //     node: {}, // Add priority
  //     ...(enabled && buildConfig.client?.webpackConfig
  //       ? { webpack: { config: buildConfig.client.webpackConfig } }
  //       : undefined),
  //   },
  // },

  rules: {
    ...(hasReactPlugin && {
      'react/prop-types': 'off',
      'react/sort-comp': 'off',
      'react/destructuring-assignment': ['error', 'always', { ignoreClassFields: true }],
      'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
      'react/jsx-wrap-multilines': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/function-component-definition': [
        'error',
        { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
      ],
    }),

    ...(hasA11yPlugin && {
      'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
      'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
    }),

    ...(hasReactHooksPlugin && {
      'react-hooks/exhaustive-deps': 'error',
    }),
  },

  overrides: [
    {
      files: getTSExtensions().map((ext) => `*${ext}`),

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

      rules: {
        ...(hasReactPlugin && {
          'react/jsx-filename-extension': ['error', { extensions: getReactExtensions() }],
        }),
      },
    },
  ],
};

module.exports = config;
