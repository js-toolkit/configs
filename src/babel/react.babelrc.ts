const config = {
  extends: './env.babelrc.js',
  presets: ['@babel/preset-react'],
};

export default config;

if (typeof module !== 'undefined' && module.exports != null) {
  module.exports = config;
}
