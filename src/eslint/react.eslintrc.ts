import commonConfig = require('./common.eslintrc');

module.exports = {
  extends: ['airbnb', './common.eslintrc.js'],

  env: {
    browser: true,
    node: false,
  },

  settings: {
    'import/resolver': {
      ...(commonConfig as any).settings['import/resolver'],
      node: {
        ...(commonConfig as any).settings['import/resolver'].node,
        extensions: ['.js', '.jsx'],
      },
    },
  },

  rules: {
    'react/sort-comp': 'off',
    'react/destructuring-assignment': ['on', 'always', { ignoreClassFields: true }],
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx'] }],
    'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
    'jsx-a11y/label-has-for': [2, { allowChildren: true }],
  },
};
