const config = {
  extends: './react.babelrc.js',
  presets: ['@babel/preset-typescript'],
};

export default config;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
