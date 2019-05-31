module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  plugins: ['stylelint-prettier'],
  defaultSeverity: 'error',
  ignoreFiles: ['node_modules/**', 'dist/**'],
  rules: {
    'prettier/prettier': true,
    'comment-empty-line-before': null,
    'no-descending-specificity': null,
    // fix prettier
    indentation: null,
    'max-line-length': null,
    'value-list-comma-newline-after': null,
    'declaration-colon-newline-after': null,
    'selector-descendant-combinator-no-non-space': null,
  },
};
