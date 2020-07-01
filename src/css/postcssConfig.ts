import appEnv from '../appEnv';
import paths from '../paths';

export interface Options {
  import?: { path: string[] | string } | false;
  presetEnv?: Record<string, any>;
  nested?: boolean;
  /** You need to install cssnano and cssnano-preset-default */
  minimizer?: boolean;
  autoprefixer?: boolean;
}

export default ({
  import: importConfig = { path: [paths.client.sources] },
  presetEnv,
  nested = true,
  minimizer = appEnv.prod,
  autoprefixer = appEnv.prod,
}: Options = {}): Record<string, any> => ({
  sourceMap: appEnv.dev,
  plugins: {
    // Primarily use to override imported styles: import css file before css-loader process it and then process merged css by css-loader.
    'postcss-import': importConfig, // https://github.com/postcss/postcss-import/issues/224
    ...(nested ? { 'postcss-nested': {} } : undefined),
    // https://preset-env.cssdb.org/
    'postcss-preset-env': {
      stage: 2,
      ...presetEnv,
      features: {
        'custom-media-queries': true,
        autoprefixer,
        ...(presetEnv ? presetEnv.features : undefined),
      },
    },
    // There are problems with css calc() function which uses icss values. ICSS values processed by css-loader later.
    cssnano: minimizer ? { preset: ['default', { discardComments: { removeAll: true } }] } : false,
  },
});
