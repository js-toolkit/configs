import appEnv from '../appEnv';
import paths from '../paths';

const defaultImportPath = [paths.client.sources];

export default ({ importPath = defaultImportPath, presetEnv } = {}) => ({
  sourceMap: appEnv.dev,
  plugins: {
    'postcss-import': importPath ? { path: importPath } : false,
    'postcss-icss-values': {},
    'postcss-nested': {},
    'postcss-preset-env': {
      stage: 2,
      ...presetEnv,
      features: {
        'custom-media-queries': true,
        autoprefixer: appEnv.prod,
        ...(presetEnv ? presetEnv.features : undefined),
      },
    },
    cssnano: appEnv.ifDevMode(false, {
      // Need install cssnano cssnano-preset-default
      preset: ['default', { discardComments: { removeAll: true } }],
    }),
  },
});
