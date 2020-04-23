import apprc from '../apprc';

const config: import('eslint').Linter.Config = {
  extends: [require.resolve('./common.eslintrc.js')],

  env: {
    node: true,
    browser: false,
  },

  settings: {
    'import/resolver': {
      ...(apprc.server.webpackConfig
        ? { webpack: { config: apprc.server.webpackConfig } }
        : undefined),
    },
  },
};

module.exports = config;
