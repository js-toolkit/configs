module.exports = {
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
  ],

  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },

  plugins: ['@typescript-eslint'],

  env: {
    node: true,
    es6: true,
  },

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.js', '.jsx'],
    },

    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
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
    //
    'global-require': 'off',
    'import/named': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/no-unresolved': 'off',
    'import/no-dynamic-require': 'off',
    'import/extensions': ['error', 'ignorePackages', { js: 'never', ts: 'never' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
  },
};
