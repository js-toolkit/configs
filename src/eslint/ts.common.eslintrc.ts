import commonConfig = require('./common.eslintrc');

module.exports = {
  extends: ['./common.eslintrc.js', './ts.base.rules.eslintrc.json'],

  parser: 'typescript-eslint-parser',

  plugins: ['typescript'],

  settings: {
    'import/parsers': {
      'typescript-eslint-parser': ['.ts'],
    },

    'import/resolver': {
      ...(commonConfig as any).settings['import/resolver'],
      node: {
        ...(commonConfig as any).settings['import/resolver'].node,
        extensions: ['.ts'],
      },
    },
  },
};
