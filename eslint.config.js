/* global require module */
const path = require('path');
const eslintJs = require('@eslint/js');
// const { FlatCompat } = require('@eslint/eslintrc');
// const { fixupConfigRules } = require('@eslint/compat');
const tsEslint = require('typescript-eslint');
const eslintPluginImport = require('eslint-plugin-import-x');
const { createTypeScriptImportResolver } = require('eslint-import-resolver-typescript');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

// const compat = new FlatCompat({
//   // baseDirectory: __dirname,
//   // recommendedConfig: eslintJs.configs.recommended,
// });

const filterStandardRules = () => {
  const rules = Object.entries(require('eslint-config-standard').rules).reduce(
    (acc, [name, value]) => {
      if (name.startsWith('import/')) {
        // acc[name] = value;
        acc[name.replace('import/', 'import-x/')] = value;
      } else if (name.startsWith('n/')) {
        // if (hasNodePlugin) acc[name] = value;
      } else if (name.startsWith('promise/')) {
        acc[name] = value;
      } else {
        acc[name] = value;
      }
      return acc;
    },
    {}
  );

  return { rules };
};

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  eslintJs.configs.recommended,
  require('eslint-plugin-promise').configs['flat/recommended'],
  // ...fixupConfigRules(compat.extends('plugin:import/recommended')),
  filterStandardRules(),
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,

  {
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      ecmaVersion: 'latest',
    },

    ignores: ['eslint.config.js'],

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

      // 'import/prefer-default-export': 'off',
      // 'import/named': 'off',
      // 'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      // 'import/no-unresolved': 'off',
      // 'import/no-dynamic-require': 'off',
      // 'import/no-import-module-exports': 'off',
      // 'import/extensions': ['error', 'ignorePackages', { js: 'never', ts: 'never' }],
    },
  },

  // TS

  ...tsEslint.configs.recommendedTypeChecked.map((conf) => ({ ...conf, files: ['**/*.{ts,tsx}'] })),

  // ...fixupConfigRules(compat.extends('plugin:import/typescript')).map((conf) => ({
  //   ...conf,
  //   files: ['**/*.{ts,tsx}'],
  // })),

  eslintPluginPrettierRecommended,

  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      // parser: '@typescript-eslint/parser',
      parserOptions: {
        projectService: {
          defaultProject: path.resolve('./tsconfig.json'),
        },
      },
    },

    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx', '.js', '.jsx'],
      },

      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: path.resolve('./tsconfig.json') }),
        eslintPluginImport.createNodeResolver({
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        }),
      ],
    },

    rules: {
      '@typescript-eslint/no-var-requires': 'off',
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
