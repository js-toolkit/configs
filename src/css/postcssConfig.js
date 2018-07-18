import appEnv from '../appEnv';
import paths from '../paths';

const defaultImportPath = [paths.client.sources];

export default ({ importPath = defaultImportPath } = {}) => ({
  sourceMap: appEnv.dev,
  plugins: {
    'postcss-import': importPath ? { path: importPath } : false,
    'postcss-icss-values': {},
    'postcss-nested': {},
    'postcss-preset-env': {
      stage: 2,
      features: {
        'custom-media-queries': true,
        autoprefixer: appEnv.prod,
      },
    },
    cssnano: appEnv.ifDevMode(false, {
      // Need install cssnano cssnano-preset-default
      preset: ['default', { discardComments: { removeAll: true } }],
    }),
  },
});
