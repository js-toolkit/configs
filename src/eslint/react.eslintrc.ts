import commonConfig = require('./common.eslintrc');

module.exports = {
  extends: ['airbnb', './common.eslintrc.js', './react.rules.json'],

  env: {
    browser: true,
  },

  settings: {
    'import/resolver': {
      ...(commonConfig as any).settings['import/resolver'],
      node: {
        ...(commonConfig as any).settings['import/resolver'].node,
        extensions: [...(commonConfig as any).settings['import/resolver'].node.extensions, '.jsx'],
      },
    },
  },
};
