import paths, { moduleExtensions } from '../paths';

module.exports = {
  extends: [
    // Adds import plugin, import/resolver.node.extensions, import/extensions
    'airbnb-base',
    // Adds prettier plugin
    'plugin:prettier/recommended',
  ],

  parser: 'babel-eslint',

  env: {
    node: true,
    es6: true,
  },

  settings: {
    'import/resolver': {
      node: {
        // Add again for consistency with webpack configs
        extensions: moduleExtensions.filter(ext => ext.includes('js')),

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
