import appEnv from '../appEnv';
import paths from '../paths';

interface Args {
  importPath?: string[] | string;
  presetEnv?: any;
}

const defaultImportPath = [paths.client.sources];

export default ({ importPath = defaultImportPath, presetEnv }: Args = {}) => ({
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
    cssnano: appEnv.ifDevMode<any>(false, {
      // Need install cssnano cssnano-preset-default
      preset: ['default', { discardComments: { removeAll: true } }],
    }),
  },
});
