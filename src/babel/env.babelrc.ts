import getInstalledPlugin from './getInstalledPlugin';

module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [
    getInstalledPlugin('@babel/plugin-transform-runtime'),
    getInstalledPlugin('@babel/plugin-proposal-decorators', { legacy: true }),
    getInstalledPlugin('@babel/plugin-proposal-class-properties', { loose: true }),
    getInstalledPlugin('@babel/plugin-proposal-export-namespace-from'),
  ].filter((p) => !!p),
};
