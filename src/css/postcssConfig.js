import appEnv from '../appEnv';

export default ({ importPath }) => ({
  plugins: {
    'postcss-import': { path: importPath },
    'postcss-icss-values': {},
    'postcss-nested': {},
    cssnano: appEnv.ifDevMode(false, {
      // Need install cssnano-preset-default
      preset: ['default', { discardComments: { removeAll: true } }],
    }),
  },
});
