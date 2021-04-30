import getInstalledPlugin from './getInstalledPlugin';

module.exports = {
  presets: [['@babel/preset-env', { loose: true }]],
  plugins: [
    getInstalledPlugin('@babel/plugin-transform-runtime'),
    getInstalledPlugin('@babel/plugin-proposal-decorators', { legacy: true }),
    getInstalledPlugin('@babel/plugin-proposal-class-properties'),
    getInstalledPlugin('@babel/plugin-proposal-private-methods'),
    getInstalledPlugin('@babel/plugin-proposal-private-property-in-object'),
    getInstalledPlugin('@babel/plugin-proposal-export-namespace-from'),
  ].filter((p) => !!p),
};
