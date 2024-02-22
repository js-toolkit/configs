import appEnv from '../appEnv';
import paths from '../paths';

export interface Options {
  import?: { path: string[] | string } | false | undefined;
  presetEnv?: Record<string, any> | undefined;
  nested?: boolean | undefined;
  /** You need to install cssnano and cssnano-preset-default */
  minimizer?: boolean | undefined;
  autoprefixer?: boolean | undefined;
}

export default ({
  import: importConfig = paths.web.sources ? { path: [paths.web.sources] } : false,
  presetEnv,
  nested = true,
  minimizer = appEnv.prod,
  autoprefixer = appEnv.prod,
}: Options = {}): Record<string, any> => ({
  sourceMap: appEnv.dev,
  plugins: [
    // Primarily use to override imported styles: import css file before css-loader process it and then process merged css by css-loader.
    importConfig && ['postcss-import', importConfig], // https://github.com/postcss/postcss-import/issues/224
    nested && 'postcss-nested',
    // https://preset-env.cssdb.org/
    [
      'postcss-preset-env',
      {
        stage: 2,
        ...presetEnv,
        features: {
          'custom-media-queries': true,
          autoprefixer,
          ...(presetEnv ? presetEnv.features : undefined),
        },
      },
    ],
    // There are problems with css calc() function which uses icss values. ICSS values processed by css-loader later.
    minimizer && ['cssnano', { preset: ['default', { discardComments: { removeAll: true } }] }],
  ].filter(Boolean),
});
