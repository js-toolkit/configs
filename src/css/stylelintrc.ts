module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules',
    // 'stylelint-prettier/recommended',
  ],
  plugins: ['stylelint-prettier'],
  defaultSeverity: 'error',
  rules: {
    'prettier/prettier': true,
    'comment-empty-line-before': null,
    'no-descending-specificity': null,
  },
  ignoreFiles: ['node_modules/**', 'dist/**'],
};
