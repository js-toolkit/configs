import { getInstalledPlugin } from './getInstalledPlugin';

module.exports = {
  presets: [['@babel/preset-env', { loose: true }]],
  plugins: [
    getInstalledPlugin('@babel/plugin-transform-runtime'),
    getInstalledPlugin('@babel/plugin-proposal-decorators', { version: '2023-05' }),
    // Other plugins already included in preset.
  ].filter((p) => !!p),
};
