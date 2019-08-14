import paths, { moduleExtensions } from '../paths';

module.exports = {
  // import plugin is already added by airbnb-base
  // prettier plugin is already added by plugin:prettier/recommended
  extends: ['airbnb-base', 'plugin:prettier/recommended'],

  parser: 'babel-eslint',

  env: {
    node: true,
    es6: true,
  },

  settings: {
    'import/resolver': {
      node: {
        extensions: moduleExtensions.filter(ext => ext.includes('.js')),

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
