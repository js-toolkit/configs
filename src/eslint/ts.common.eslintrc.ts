module.exports = {
  extends: [require.resolve('./common.eslintrc.js'), require.resolve('./ts.base.rules.json')],

  parser: 'typescript-eslint-parser',

  plugins: ['typescript'],

  settings: {
    'import/parsers': {
      'typescript-eslint-parser': ['.ts'],
    },

    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
