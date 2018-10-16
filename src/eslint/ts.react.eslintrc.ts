module.exports = {
  extends: [
    require.resolve('./react.eslintrc.js'),
    require.resolve('./ts.common.eslintrc.js'),
    require.resolve('./ts.react.rules.json'),
  ],

  settings: {
    'import/parsers': {
      'typescript-eslint-parser': ['.ts', '.tsx'],
    },

    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.tsx'],
      },
    },
  },
};
