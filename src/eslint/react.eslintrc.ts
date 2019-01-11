import appConfig from '../appConfig';
import { moduleExtensions } from '../paths';

module.exports = {
  extends: ['airbnb', require.resolve('./common.eslintrc.js')],

  env: {
    browser: true,
  },

  settings: {
    'import/resolver': {
      webpack: appConfig.client.webpackConfig
        ? { config: appConfig.client.webpackConfig }
        : undefined,
    },
  },

  rules: {
    'react/sort-comp': 'off',
    'react/destructuring-assignment': ['on', 'always', { ignoreClassFields: true }],
    'react/jsx-filename-extension': [
      'error',
      { extensions: moduleExtensions.filter(ext => ext.includes('js')) },
    ],
    'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
    'jsx-a11y/label-has-for': [2, { allowChildren: true }],
  },
};
