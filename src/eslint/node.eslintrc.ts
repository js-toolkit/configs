import apprc from '../apprc';

module.exports = {
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
