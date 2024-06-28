const eslintJs = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');
const { fixupPluginRules } = require('@eslint/compat');
const tsEslint = require('typescript-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const compat = new FlatCompat({
  // baseDirectory: __dirname,
  // recommendedConfig: eslintJs.configs.recommended,
});

function legacyPlugin(name, alias = name) {
  const plugin = compat.plugins(name)[0]?.plugins?.[alias];

  if (!plugin) {
    throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
  }

  return fixupPluginRules(plugin);
}

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  eslintJs.configs.recommended,
  eslintPluginPrettierRecommended,
  ...tsEslint.configs.recommendedTypeChecked,
  ...compat.extends('plugin:import/typescript'),

  {
    languageOptions: {
      // parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
      },
      ecmaVersion: 'latest',
    },

    ignores: ['eslint.config.js'],

    plugins: {
      import: legacyPlugin('eslint-plugin-import', 'import'),
    },

    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx', '.js', '.jsx'],
      },

      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
        typescript: {
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-unused-expressions': ['error', { allowShortCircuit: true }],
      'no-use-before-define': 'off',
      'no-restricted-globals': 'off',
      'no-redeclare': 'off',
      'no-inner-declarations': ['off', 'functions'],
      'no-console': 'off',
      'class-methods-use-this': 'off',
      'global-require': 'off',

      'import/prefer-default-export': 'off',
      'import/named': 'off',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'import/no-unresolved': 'off',
      'import/no-dynamic-require': 'off',
      'import/no-import-module-exports': 'off',
      'import/extensions': ['error', 'ignorePackages', { js: 'never', ts: 'never' }],

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];
