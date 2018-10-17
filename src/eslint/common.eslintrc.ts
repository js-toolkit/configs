import paths from '../paths';

module.exports = {
  // import and prettier plugins are already added by airbnb-base and plugin:prettier/recommended
  extends: ['airbnb-base', 'plugin:prettier/recommended', require.resolve('./base.rules.json')],

  parser: 'babel-eslint',

  env: {
    node: true,
    es6: true,
  },

  settings: {
    'import/resolver': {
      // webpack: {
      //   config: 'webpack.config.babel.js',
      // },

      node: {
        extensions: ['.js'],

        moduleDirectory: [
          'node_modules',
          paths.client.sources,
          paths.server.sources,
          paths.shared.sources,
        ],
      },
    },
  },

  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
