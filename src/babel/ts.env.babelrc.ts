const config = {
  extends: './env.babelrc.js',
  presets: ['@babel/preset-typescript'],
};

export default config;

if (typeof module !== 'undefined') {
  module.exports = config;
}
