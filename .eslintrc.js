module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended'],

  parser: 'typescript-eslint-parser',

  plugins: ['typescript'],

  env: {
    node: true,
    es6: true,
  },

  settings: {
    'import/parsers': {
      'typescript-eslint-parser': ['.ts', '.tsx', '.js', '.jsx'],
    },

    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    },
  },

  rules: {
    'no-console': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    'no-use-before-define': 'off',
    'no-restricted-globals': 'off',
    'no-redeclare': 'off',
    'no-inner-declarations': ['off', 'functions'],
    'no-useless-constructor': 'off',
    'no-empty-function': ['error', { allow: ['constructors'] }],
    'class-methods-use-this': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
