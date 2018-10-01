import appEnv from '../appEnv';
// import paths from '../paths';

interface Props {
  // importPath?: string[] | string;
  presetEnv?: Record<string, any>;
}

// const defaultImportPath = [paths.client.sources];

export default ({ /* importPath = defaultImportPath, */ presetEnv }: Props = {}) => ({
  sourceMap: appEnv.dev,
  plugins: {
    // !!! Handle imports by css-loader instead.
    // 'postcss-import': importPath ? { path: importPath } : false, // https://github.com/postcss/postcss-import/issues/224
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
    // cssnano: appEnv.ifDevMode<any>(false, {
    //   // Need install cssnano cssnano-preset-default
    //   preset: ['default', { discardComments: { removeAll: true } }],
    // }),
  },
});
