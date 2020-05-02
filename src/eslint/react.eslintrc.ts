import apprc from '../apprc';

const config: import('eslint').Linter.Config = {
  extends: [
    // Adds eslint-plugin-react, eslint-plugin-jsx-a11y
    'airbnb',
    require.resolve('./common.eslintrc.js'),
    'plugin:react-hooks/recommended',
    'prettier/react',
  ],

  env: {
    browser: true,
  },

  settings: {
    'import/resolver': {
      ...(apprc.client.webpackConfig
        ? { webpack: { config: apprc.client.webpackConfig } }
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
};

module.exports = config;
