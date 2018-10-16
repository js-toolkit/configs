module.exports = {
  extends: [
    'airbnb',
    require.resolve('./common.eslintrc.js'),
    require.resolve('./react.rules.json'),
  ],

  env: {
    browser: true,
  },

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx'],
      },
    },
  },
};
