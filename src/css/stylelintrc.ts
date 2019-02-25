module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  plugins: ['stylelint-prettier'],
  defaultSeverity: 'error',
  ignoreFiles: ['node_modules/**', 'dist/**'],
  rules: {
    'prettier/prettier': true,
    'comment-empty-line-before': null,
    'no-descending-specificity': null,
    'declaration-colon-newline-after': null,
    indentation: null,
    'selector-descendant-combinator-no-non-space': null,
  },
};
