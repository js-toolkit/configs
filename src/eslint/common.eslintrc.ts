import paths, { moduleFileExtensions } from '../paths';

module.exports = {
  // import and prettier plugins are already added by airbnb-base and plugin:prettier/recommended
  extends: ['airbnb-base', 'plugin:prettier/recommended'],

  parser: 'babel-eslint',

  env: {
    node: true,
    es6: true,
  },

  settings: {
    'import/resolver': {
      node: {
        extensions: moduleFileExtensions.filter(ext => ext.includes('js')),

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
    'no-console': 'off',
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
