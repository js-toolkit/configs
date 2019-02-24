import appConfig from '../appConfig';

module.exports = {
  extends: [require.resolve('./common.eslintrc.js')],

  env: {
    node: true,
    browser: false,
  },

  settings: {
    'import/resolver': {
      ...(appConfig.server.webpackConfig
        ? { webpack: { config: appConfig.server.webpackConfig } }
        : undefined),
    },
  },
};
