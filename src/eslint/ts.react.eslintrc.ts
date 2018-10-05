import commonConfig = require('./ts.common.eslintrc');
import reactConfig = require('./react.eslintrc');

module.exports = {
  extends: ['./react.eslintrc.js', './ts.common.eslintrc.js', './ts.react.rules.json'],

  settings: {
    'import/parsers': {
      ...(commonConfig as any).settings['import/parsers'],
      'typescript-eslint-parser': [
        ...(commonConfig as any).settings['import/parsers']['typescript-eslint-parser'],
        '.tsx',
      ],
    },

    'import/resolver': {
      ...(reactConfig as any).settings['import/resolver'],
      node: {
        ...(reactConfig as any).settings['import/resolver'].node,
        extensions: ['.ts', '.tsx'],
      },
    },
  },
};
