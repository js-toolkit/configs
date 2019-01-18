import appEnv from '../appEnv';
import paths from '../paths';

interface Props {
  importPath?: string[] | string;
  presetEnv?: Record<string, any>;
}

const defaultImportPath = [paths.client.sources];

export default ({ importPath = defaultImportPath, presetEnv }: Props = {}) => ({
  sourceMap: appEnv.dev,
  plugins: {
    // Primarily use to override imported styles: import css file before css-loader process it and then process merged css by css-loader.
    'postcss-import': importPath ? { path: importPath } : false, // https://github.com/postcss/postcss-import/issues/224
    'postcss-icss-values': {}, // import values with css-loader not postcss-import
    'postcss-nested': {},
    // https://preset-env.cssdb.org/
    'postcss-preset-env': {
      stage: 2,
      ...presetEnv,
      features: {
        'custom-media-queries': true,
        autoprefixer: appEnv.prod,
        ...(presetEnv ? presetEnv.features : undefined),
      },
    },
    // There are problems with css calc() function which uses icss values. ICSS values processed by css-loader later.
    // cssnano: appEnv.ifDevMode<any>(false, {
    //   // Need install cssnano cssnano-preset-default
    //   preset: ['default', { discardComments: { removeAll: true } }],
    // }),
  },
});
