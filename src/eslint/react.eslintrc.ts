import appConfig from '../appConfig';

module.exports = {
  extends: [
    // Adds eslint-plugin-react, eslint-plugin-jsx-a11y
    'airbnb',
    require.resolve('./common.eslintrc.js'),
    'prettier/react',
  ],

  plugins: ['react-hooks'],

  env: {
    browser: true,
  },

  settings: {
    'import/resolver': {
      ...(appConfig.client.webpackConfig
        ? { webpack: { config: appConfig.client.webpackConfig } }
        : undefined),
    },
  },

  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/sort-comp': 'off',
    'react/destructuring-assignment': ['error', 'always', { ignoreClassFields: true }],
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
    'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
    'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
  },
};
