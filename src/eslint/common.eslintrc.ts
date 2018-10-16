import paths from '../paths';

module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended', require.resolve('./base.rules.json')],

  parser: 'babel-eslint',

  plugins: ['import', 'prettier'],

  env: {
    node: true,
    es6: true,
  },

  settings: {
    'import/resolver': {
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
