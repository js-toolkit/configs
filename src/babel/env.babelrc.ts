import getInstalledPlugin from './getInstalledPlugin';

module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [
    getInstalledPlugin('@babel/plugin-transform-runtime'),
    getInstalledPlugin('@babel/plugin-proposal-export-namespace-from'),
    getInstalledPlugin('@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }),
    getInstalledPlugin('@babel/plugin-proposal-class-properties', { loose: true }),
    getInstalledPlugin('@babel/plugin-proposal-optional-chaining', { loose: true }),
    getInstalledPlugin('@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }),
  ].filter((p) => !!p),
};
