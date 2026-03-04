const config = {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'es5',
  arrowParens: 'always',
  endOfLine: 'lf',
};

export default config;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
