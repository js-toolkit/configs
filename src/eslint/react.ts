import fs from 'fs';
import path from 'path';
import airbnbConfig from 'eslint-config-airbnb';
import buildConfig from '../buildConfig';
import paths, { moduleExtensions } from '../paths';
import getInstalledPlugin from '../babel/getInstalledPlugin';
import { eslintTsProject } from './consts';

const enabled = buildConfig.client && fs.existsSync(paths.client.root);

const hasReactPlugin = !!getInstalledPlugin('eslint-plugin-react');
const hasA11yPlugin = !!getInstalledPlugin('eslint-plugin-jsx-a11y');
const hasReactHooksPlugin = !!getInstalledPlugin('eslint-plugin-react-hooks');

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
  ],

  env: {
    browser: true,
  },

  settings: {
    'import/resolver': {
      node: {}, // Add priority
      ...(enabled && buildConfig.client && buildConfig.client.webpackConfig
        ? { webpack: { config: buildConfig.client.webpackConfig } }
        : undefined),
    },
  },

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
      files: moduleExtensions.filter((ext) => ext.includes('ts')).map((ext) => `*${ext}`),

      parserOptions: {
        project: (() => {
          if (enabled) {
            const tsconfig = path.join(paths.client.root, eslintTsProject);
            if (fs.existsSync(tsconfig)) return tsconfig;
            if (fs.existsSync(paths.client.tsconfig)) return paths.client.tsconfig;
          }
          return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
        })(),
      },

      rules: {
        ...(hasReactPlugin && {
          'react/jsx-filename-extension': [
            'error',
            { extensions: moduleExtensions.filter((ext) => ext.includes('sx')) },
          ],
        }),
      },
    },
  ],
};

module.exports = config;
