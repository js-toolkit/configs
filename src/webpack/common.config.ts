import webpack, { Options, Configuration } from 'webpack';
import path from 'path';
import appEnv from '../appEnv';
import appConfig from '../appConfig';
import paths, { moduleExtensions } from '../paths';
import loaders, { BaseTsOptions, TsLoaderType } from './loaders';
import nodeRequire from './nodeRequire';

export interface CommonConfigOptions extends Partial<BaseTsOptions>, Configuration {
  outputPath: string;
  outputPublicPath: string;
  outputJsDir: string;
  hash?: boolean;
  useTypeScript?: boolean;
  tsLoaderType?: TsLoaderType;
  useTsForkedChecks?: boolean;
}

export default ({
  outputPath,
  outputPublicPath,
  outputJsDir,
  hash,
  useTypeScript,
  tsLoaderType = TsLoaderType.Default,
  useTsForkedChecks = false,
  tsconfig,
  ...restOptions
}: CommonConfigOptions): Configuration => ({
  // The base directory (absolute path!) for resolving the `entry` option.
  context: paths.root,

  mode: appEnv.raw.NODE_ENV,

  // Stop compilation early in production
  bail: appEnv.prod,

  // http://cheng.logdown.com/posts/2016/03/25/679045
  devtool: appEnv.ifDevMode<Options.Devtool>('cheap-module-eval-source-map', false),

  ...restOptions,

  output: {
    path: outputPath,
    publicPath: outputPublicPath,
    pathinfo: appEnv.ifDevMode(true, false),
    filename: path.join(outputJsDir, `[name]${appEnv.prod && hash ? '.[contenthash:8]' : ''}.js`),
    chunkFilename: path.join(
      outputJsDir,
      `[name]${appEnv.prod && hash ? '.[contenthash:8]' : ''}.chunk.js`
    ),
    ...restOptions.output,
  },

  optimization: {
    ...appEnv.ifProdMode(
      {
        minimizer: [
          new (nodeRequire('terser-webpack-plugin'))({
            terserOptions: {
              output: {
                comments: false,
              },
            },
          }),
        ],
      },
      undefined
    ),
    ...restOptions.optimization,
  },

  plugins: [
    // In order for the specified environment variables to be available in the JS code.
    // EnvironmentPlugin not working on client side with ssr because environment variables not passed to webpackDevMiddleware?
    new webpack.DefinePlugin({
      // Replace process.env... and appEnv.raw... to static values in the bundle.
      ...appEnv.envStringify(),
      // Replace appConfig... to static values in the bundle.
      ...appConfig.envStringify(),
    }),

    // Enable HMR in development.
    ...appEnv.ifDevMode([new webpack.HotModuleReplacementPlugin()], []),

    // Forked check for TS
    ...(useTypeScript && useTsForkedChecks && tsconfig
      ? [loaders.getTsCheckerPlugin({ loaderType: tsLoaderType, tsconfig })]
      : []),

    // Ignore all locale files of moment.js
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ...(restOptions.plugins || []),
  ],

  resolve: {
    ...restOptions.resolve,
    extensions: [
      ...moduleExtensions.filter(ext => useTypeScript || !ext.includes('ts')),
      ...((restOptions.resolve && restOptions.resolve.extensions) || []),
    ],
    modules: [
      paths.nodeModules.root,
      paths.root,
      ...((restOptions.resolve && restOptions.resolve.modules) || []),
    ],
    plugins: [
      ...(useTypeScript
        ? [
            (() => {
              const getName = (): string => 'tsconfig-paths-webpack-plugin';
              const TSConfigPathsWebpackPlugin = nodeRequire(getName());
              return new TSConfigPathsWebpackPlugin({ configFile: tsconfig });
            })(),
          ]
        : []),
      ...((restOptions.resolve && restOptions.resolve.plugins) || []),
    ],
  },

  stats:
    restOptions.stats == null || typeof restOptions.stats === 'object'
      ? {
          ...(useTypeScript
            ? // https://github.com/TypeStrong/ts-loader#transpileonly-boolean-defaultfalse
              { warningsFilter: /export .* was not found in/ }
            : undefined),
          ...restOptions.stats,
        }
      : restOptions.stats,

  module: {
    // Suppress warnings of dynamic requiring in configs:
    // To suppress warning with 'Critical dependency: require function is used in a way in which dependencies cannot be statically extracted'
    exprContextCritical: false,
    // To suppress warning with 'Critical dependency: the request of a dependency is an expression'
    unknownContextCritical: false,
    ...restOptions.module,
    rules: (restOptions.module && restOptions.module.rules) || [],
  },
});
