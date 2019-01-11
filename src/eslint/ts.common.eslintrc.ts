import { moduleExtensions } from '../paths';

module.exports = {
  extends: [require.resolve('./common.eslintrc.js')],

  parser: 'typescript-eslint-parser',

  plugins: ['typescript'],

  settings: {
    'import/parsers': {
      'typescript-eslint-parser': moduleExtensions.filter(ext => ext.includes('ts')),
    },

    'import/resolver': {
      node: {
        extensions: moduleExtensions.filter(ext => ext.includes('js') || ext.includes('ts')),
      },
    },
  },

  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'no-restricted-globals': 'off',
    'no-redeclare': 'off',
    'no-inner-declarations': ['off', 'functions'],
    'no-useless-constructor': 'off',
    'no-empty-function': ['error', { allow: ['constructors'] }],
    'class-methods-use-this': 'off',
  },
};
