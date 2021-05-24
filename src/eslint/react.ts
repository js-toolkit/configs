import fs from 'fs';
import path from 'path';
import buildConfig from '../buildConfig';
import paths, { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

const enabled =
  buildConfig.client && buildConfig.client.root && fs.existsSync(buildConfig.client.root);

const config: import('eslint').Linter.Config = {
  extends: [
    // Adds eslint-plugin-react, eslint-plugin-jsx-a11y
    'airbnb',
    require.resolve('./common'),
    'plugin:react-hooks/recommended',
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
    'react-hooks/exhaustive-deps': 'error',
    'react/sort-comp': 'off',
    'react/destructuring-assignment': ['error', 'always', { ignoreClassFields: true }],
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
    'react/jsx-wrap-multilines': 'off',
    'react/jsx-props-no-spreading': 'off',
    'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
    'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
  },

  overrides: [
    {
      files: moduleExtensions.filter((ext) => ext.includes('ts')).map((ext) => `*${ext}`),

      parserOptions: {
        project: (() => {
          if (enabled) {
            const config = path.join(paths.client.root, eslintTsProject);
            if (fs.existsSync(config)) return config;
            if (fs.existsSync(paths.client.tsconfig)) return paths.client.tsconfig;
          }
          return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
        })(),
      },

      rules: {
        'react/jsx-filename-extension': [
          'error',
          { extensions: moduleExtensions.filter((ext) => ext.includes('sx')) },
        ],
      },
    },
  ],
};

module.exports = config;
