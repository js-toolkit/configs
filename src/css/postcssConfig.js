import appEnv from '../appEnv';

export default ({ importPath } = {}) => ({
  plugins: {
    'postcss-import': importPath ? { path: importPath } : false,
    'postcss-icss-values': {},
    'postcss-nested': {},
    cssnano: appEnv.ifDevMode(false, {
      // Need install cssnano-preset-default
      preset: ['default', { discardComments: { removeAll: true } }],
    }),
  },
});
