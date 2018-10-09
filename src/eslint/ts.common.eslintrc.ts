import commonJsConfig = require('./common.eslintrc');
import commonJson = require('./ts.common.eslintrc.json');

module.exports = {
  extends: ['./ts.common.eslintrc.json', './ts.base.rules.json'],

  settings: {
    ...(commonJsConfig as any).settings,

    'import/parsers': commonJson.settings['import/parsers'],

    'import/resolver': {
      ...(commonJsConfig as any).settings['import/resolver'],
      node: {
        ...(commonJsConfig as any).settings['import/resolver'].node,
        extensions: [
          ...(commonJsConfig as any).settings['import/resolver'].node.extensions,
          ...commonJson.settings['import/resolver'].node.extensions,
        ],
      },
    },
  },
};
