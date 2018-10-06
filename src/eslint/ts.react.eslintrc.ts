import commonConfig = require('./ts.common.eslintrc');
import reactJsConfig = require('./react.eslintrc');

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
      ...(reactJsConfig as any).settings['import/resolver'],
      node: {
        ...(reactJsConfig as any).settings['import/resolver'].node,
        extensions: [
          ...(reactJsConfig as any).settings['import/resolver'].node.extensions,
          ...(commonConfig as any).settings['import/resolver'].node.extensions,
          '.tsx',
        ],
      },
    },
  },
};
