import paths, { moduleExtensions } from '../paths';

const config: import('eslint').Linter.Config = {
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
        // Add again for consistency with extensions in webpack configs
        extensions: moduleExtensions.filter((ext) => !ext.includes('ts')),

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
    'import/extensions': [
      'error',
      'ignorePackages',
      // never allow to use of the module extensions.
      moduleExtensions.reduce(
        (acc, ext) => ({ ...acc, [ext.substr(1)]: 'never' }),
        { '': 'never' } // Fix error on import user type declaration folder such as `client/types`
      ),
    ],
  },
};

module.exports = config;
