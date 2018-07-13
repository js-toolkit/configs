import appEnv from '../appEnv';

export default ({ importPath } = {}) => ({
  sourceMap: appEnv.dev,
  plugins: {
    autoprefixer: appEnv.ifDevMode(false, {}),
    'postcss-import': importPath ? { path: importPath } : false,
    'postcss-icss-values': {},
    'postcss-nested': {},
    cssnano: appEnv.ifDevMode(false, {
      // Need install cssnano cssnano-preset-default
      preset: ['default', { discardComments: { removeAll: true } }],
    }),
  },
});
